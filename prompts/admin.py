from __future__ import annotations

from django.contrib import admin

from .models import PromptJob


@admin.register(PromptJob)
class PromptJobAdmin(admin.ModelAdmin):
    """Admin configuration for PromptJob objects."""

    list_display = ('id', 'status', 'truncated_query', 'openai_model', 'created_at')
    list_filter = ('status', 'openai_model', 'created_at')
    readonly_fields = (
        'user_query',
        'goals',
        'image',
        'system_prompt',
        'openai_model',
        'request_payload',
        'response_payload',
        'error_message',
        'created_at',
        'updated_at',
    )
    search_fields = ('user_query', 'response_payload')
    ordering = ('-created_at',)

    def truncated_query(self, obj: PromptJob) -> str:
        return (obj.user_query[:60] + '...') if len(obj.user_query) > 60 else obj.user_query

    truncated_query.short_description = 'User Query'
