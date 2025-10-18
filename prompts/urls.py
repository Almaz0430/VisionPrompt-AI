"""URL configuration for the prompts app."""

from __future__ import annotations

from django.urls import path

from .views import GeneratePromptView

urlpatterns = [
    path('generate-prompt/', GeneratePromptView.as_view(), name='generate-prompt'),
]
