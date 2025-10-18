"""REST API views for prompt generation."""

from __future__ import annotations

import logging
from typing import Any, Dict

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .constants import PROMPT_NOTES, PROMPT_THEME, SYSTEM_PROMPT
from .models import PromptJob
from .serializers import GeneratePromptRequestSerializer, PromptOutputSerializer
from .services import PromptGenerationError, PromptGenerationService

logger = logging.getLogger('prompts')


class GeneratePromptView(APIView):
    """POST endpoint that proxies prompt generation requests to OpenAI."""

    def post(self, request, *args, **kwargs) -> Response:  # noqa: D401
        serializer = GeneratePromptRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data
        image_file = validated.get('image')

        job = PromptJob.objects.create(
            user_query=validated['user_query'],
            goals=validated['goals'],
            image=image_file,
            system_prompt=SYSTEM_PROMPT,
            openai_model=settings.OPENAI_MODEL,
            request_payload={
                'user_query': validated['user_query'],
                'goals': validated['goals'],
                'image_attached': bool(image_file),
            },
        )

        logger.info('PromptJob %s created for goals=%s', job.pk, job.goals)

        try:
            service = PromptGenerationService()
            if image_file and hasattr(image_file, 'seek'):
                image_file.seek(0)
            openai_payload = service.generate(
                user_query=validated['user_query'],
                goals=validated['goals'],
                image_file=image_file,
            )
        except ImproperlyConfigured as exc:
            job.status = PromptJob.STATUS_FAILED
            job.error_message = str(exc)
            job.save(update_fields=['status', 'error_message', 'updated_at'])
            return Response(
                {'detail': 'OpenAI API is not configured on the server.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except PromptGenerationError as exc:
            job.status = PromptJob.STATUS_FAILED
            job.error_message = str(exc)
            job.save(update_fields=['status', 'error_message', 'updated_at'])
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            output_serializer = PromptOutputSerializer(data=openai_payload)
            output_serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            job.status = PromptJob.STATUS_FAILED
            detail = exc.detail if hasattr(exc, 'detail') else str(exc)
            job.error_message = f'Invalid JSON shape from OpenAI: {detail}'
            job.save(update_fields=['status', 'error_message', 'updated_at'])
            raise exc  # Let DRF render validation error to client.

        payload: Dict[str, Any] = output_serializer.validated_data
        payload.setdefault('meta', {})
        payload['meta'].setdefault('theme', PROMPT_THEME)
        payload['meta'].setdefault('notes', PROMPT_NOTES)

        job.status = PromptJob.STATUS_SUCCEEDED
        job.response_payload = payload
        job.save(update_fields=['status', 'response_payload', 'updated_at'])

        logger.info('PromptJob %s completed successfully.', job.pk)

        return Response(payload, status=status.HTTP_200_OK)
