from __future__ import annotations

from unittest import mock

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .constants import PROMPT_NOTES, PROMPT_THEME
from .models import PromptJob


def build_sample_payload() -> dict[str, object]:
    """Constructs a valid payload that mimics OpenAI output."""
    base_prompt = {
        'goal': 'image_generation',
        'model': 'Higgsfield Soul',
        'prompt': 'Create a serene sci-fi landscape with glowing flora.',
        'negative_prompt': ['violence', 'gore', 'nudity'],
        'settings': {
            'enhance': False,
            'guidance': 6.5,
            'steps': 30,
        },
        'storyboard': [
            'Wide establishing shot with floating islands',
            'Close-up of bioluminescent plants',
        ],
    }
    return {
        'meta': {
            'theme': PROMPT_THEME,
            'notes': PROMPT_NOTES,
            'source': 'Higgsfield Prompt Builder',
        },
        'prompts': {
            'image_generation': base_prompt,
            'image_editing': {
                **base_prompt,
                'goal': 'image_editing',
                'prompt': 'Refine the uploaded image with neon accents and volumetric light.',
            },
            'video_generation': {
                **base_prompt,
                'goal': 'video_generation',
                'prompt': 'Storyboard a 12-second pan across the futuristic valley.',
            },
        },
    }


class GeneratePromptAPITests(APITestCase):
    """Smoke tests for the generate prompt endpoint."""

    url = '/api/generate-prompt/'

    @override_settings(OPENAI_API_KEY='test-key')
    @mock.patch('prompts.views.PromptGenerationService.generate', return_value=build_sample_payload())
    @mock.patch('prompts.views.PromptGenerationService.__init__', return_value=None)
    def test_generate_prompt_success(self, mock_init, mock_generate) -> None:
        payload = {
            'user_query': 'Design a futuristic rainforest sanctuary.',
            'goals': ['image_generation', 'video_generation'],
        }

        response = self.client.post(self.url, data=payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('prompts', response.data)
        self.assertEqual(PromptJob.objects.count(), 1)

        job = PromptJob.objects.get()
        self.assertEqual(job.status, PromptJob.STATUS_SUCCEEDED)
        self.assertEqual(job.response_payload['meta']['theme'], PROMPT_THEME)

        mock_init.assert_called_once()
        mock_generate.assert_called_once()

    def test_rejects_banned_keywords(self) -> None:
        payload = {
            'user_query': 'Generate a violent battle scene with blood.',
            'goals': ['image_generation'],
        }

        response = self.client.post(self.url, data=payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(PromptJob.objects.count(), 0)

    @override_settings(OPENAI_API_KEY='')
    def test_missing_api_key_returns_error(self) -> None:
        payload = {
            'user_query': 'Design a cozy cyberpunk cafe interior.',
            'goals': ['image_generation', 'image_editing', 'video_generation'],
        }

        response = self.client.post(self.url, data=payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(PromptJob.objects.count(), 1)

        job = PromptJob.objects.get()
        self.assertEqual(job.status, PromptJob.STATUS_FAILED)
        self.assertTrue(job.error_message)
