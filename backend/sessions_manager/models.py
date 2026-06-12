# sessions_manager/models.py
import uuid
from django.db import models


class CollabSession(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug       = models.SlugField(unique=True, max_length=12)
    code       = models.TextField(default='')
    language   = models.CharField(max_length=20, default='python')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f'Session {self.slug}'


class SavedSession(models.Model):
    """
    A named code snippet saved by a logged-in user.
    Independent from collab sessions — this is the user's personal library.
    """
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner    = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='saved_sessions',
    )
    title    = models.CharField(max_length=120, default='Untitled')
    code     = models.TextField()
    language = models.CharField(max_length=20, default='python')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']  # Most recently edited first

    def __str__(self) -> str:
        return f'{self.owner.username} — {self.title}'