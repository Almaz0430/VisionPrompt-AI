"""Serialization logic for prompt generation requests and responses."""

from __future__ import annotations

from typing import Any

from rest_framework import serializers

from .constants import ALLOWED_GOALS, ALLOWED_MODELS, BANNED_KEYWORDS, PROMPT_NOTES, PROMPT_THEME


class GeneratePromptRequestSerializer(serializers.Serializer):
    """Validates incoming data from the frontend."""

    user_query = serializers.CharField(max_length=1000, allow_blank=False)
    goals = serializers.ListField(
        child=serializers.ChoiceField(choices=sorted(ALLOWED_GOALS)),
        allow_empty=False,
    )
    image = serializers.FileField(required=False, allow_null=True, allow_empty_file=False)

    def validate_user_query(self, value: str) -> str:
        lowered = value.lower()
        if any(keyword in lowered for keyword in BANNED_KEYWORDS):
            raise serializers.ValidationError('User query contains prohibited content.')
        return value.strip()

    def validate_goals(self, values: list[str]) -> list[str]:
        unique_goals = []
        for goal in values:
            if goal not in unique_goals:
                unique_goals.append(goal)
        return unique_goals

    def validate_image(self, uploaded_file: Any) -> Any:
        if uploaded_file is None:
            return None
        content_type = getattr(uploaded_file, 'content_type', '')
        if content_type and not content_type.startswith('image/'):
            raise serializers.ValidationError('Uploaded file must be an image.')
        if uploaded_file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Image size must be under 5 MB.')
        return uploaded_file


class PromptEntrySerializer(serializers.Serializer):
    """Represents a single goal-specific prompt."""

    goal = serializers.ChoiceField(choices=sorted(ALLOWED_GOALS))
    model = serializers.ChoiceField(choices=ALLOWED_MODELS)
    prompt = serializers.CharField()
    negative_prompt = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
    )
    settings = serializers.JSONField()
    storyboard = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )


class PromptOutputSerializer(serializers.Serializer):
    """Validates the JSON payload produced by the OpenAI model."""

    meta = serializers.DictField()
    prompts = serializers.DictField(child=PromptEntrySerializer())

    def validate_meta(self, value: dict[str, Any]) -> dict[str, Any]:
        expected_notes = set(PROMPT_NOTES)
        notes = set(value.get('notes', []))
        if value.get('theme') != PROMPT_THEME:
            raise serializers.ValidationError('Meta theme is incorrect.')
        if not expected_notes.issubset(notes):
            raise serializers.ValidationError('Meta notes must include required values.')
        return value

    def validate_prompts(self, value: dict[str, Any]) -> dict[str, Any]:
        missing_goals = ALLOWED_GOALS.difference(value.keys())
        if missing_goals:
            raise serializers.ValidationError(
                f'Response is missing prompts for: {", ".join(sorted(missing_goals))}.'
            )
        for entry in value.values():
            self._validate_settings(entry.get('settings', {}))
        return value

    def _validate_settings(self, settings: dict[str, Any]) -> None:
        enhance_value = settings.get('enhance')
        if isinstance(enhance_value, str):
            enhance_value = enhance_value.lower().strip() == 'true'
        if enhance_value:
            raise serializers.ValidationError('Enhance must always be false in settings.')
