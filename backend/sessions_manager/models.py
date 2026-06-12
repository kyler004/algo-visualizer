import uuid
from django.db import models
# Create your models here.

class CollabSession(models.Model):
    """
    A collaborative room, Each room has a unique slug (used in the URL).
    the current code and timestamps
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True, max_length=12)
    code = models.TextField(default='')
    language = models.CharField(default='python', max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f'Session {self.slug}'