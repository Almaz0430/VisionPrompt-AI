"""Service layer that communicates with the OpenAI API."""

from __future__ import annotations

import base64
import json
import logging
from typing import Any, Dict, List

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from openai import (
    APIConnectionError,
    APIError,
    APITimeoutError,
    AuthenticationError,
    OpenAI,
)

from .constants import ALLOWED_GOALS, SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class PromptGenerationError(RuntimeError):
    """Raised when the prompt generation pipeline fails."""


class PromptGenerationService:
    """Encapsulates the OpenAI interaction and response parsing."""

    def __init__(self) -> None:
        api_key = getattr(settings, 'OPENAI_API_KEY', None)
        if not api_key:
            raise ImproperlyConfigured('OPENAI_API_KEY is not configured.')

        self._client = OpenAI(api_key=api_key, timeout=settings.OPENAI_TIMEOUT_SECONDS)
        self._model = settings.OPENAI_MODEL

    def generate(
        self,
        *,
        user_query: str,
        goals: List[str],
        image_file,
    ) -> Dict[str, Any]:
        """Calls the OpenAI API and returns the parsed JSON payload."""
        messages = self._build_messages(user_query=user_query, goals=goals, image_file=image_file)
        try:
            response = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                response_format={'type': 'json_object'},
            )
        except (AuthenticationError, APIConnectionError, APITimeoutError, APIError) as exc:
            logger.exception('OpenAI request failed: %s', exc)
            raise PromptGenerationError(str(exc)) from exc

        content = response.choices[0].message.content
        logger.debug('Raw OpenAI response: %s', content)
        return self._parse_json(content)

    def _build_messages(
        self,
        *,
        user_query: str,
        goals: List[str],
        image_file,
    ) -> List[Dict[str, Any]]:
        goals_list = [goal for goal in goals if goal in ALLOWED_GOALS]
        user_text = (
            "User request:\n"
            f"{user_query.strip()}\n\n"
            "Requested goals (subset of image_generation, image_editing, video_generation):\n"
            f"{', '.join(goals_list)}\n\n"
            "Deliver three complete JSON prompt entries that adhere to the hackathon rules."
        )

        user_content: List[Dict[str, Any]] = [{'type': 'text', 'text': user_text}]

        if image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
            image_file.seek(0)
            user_content.append(
                {
                    'type': 'input_image',
                    'image_base64': encoded_image,
                }
            )

        return [
            {'role': 'system', 'content': [{'type': 'text', 'text': SYSTEM_PROMPT}]},
            {'role': 'user', 'content': user_content},
        ]

    def _parse_json(self, payload: str) -> Dict[str, Any]:
        """Attempts to parse the JSON payload and raise a clear error otherwise."""
        try:
            return json.loads(payload)
        except json.JSONDecodeError as exc:
            logger.error('Failed to parse JSON from OpenAI response: %s', payload)
            raise PromptGenerationError('OpenAI returned malformed JSON.') from exc
