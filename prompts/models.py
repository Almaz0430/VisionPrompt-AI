from django.db import models

class PromptJob(models.Model):
    """Stores metadata about generated prompts for audit and analytics."""

    STATUS_PENDING = 'pending'
    STATUS_SUCCEEDED = 'succeeded'
    STATUS_FAILED = 'failed'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_SUCCEEDED, 'Succeeded'),
        (STATUS_FAILED, 'Failed'),
    ]

    user_query = models.TextField()
    goals = models.JSONField(default=list)
    image = models.FileField(upload_to='prompt_jobs/', null=True, blank=True)
    system_prompt = models.TextField()
    openai_model = models.CharField(max_length=100)
    request_payload = models.JSONField(default=dict)
    response_payload = models.JSONField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self) -> str:
        return f'PromptJob #{self.pk} ({self.status})'
