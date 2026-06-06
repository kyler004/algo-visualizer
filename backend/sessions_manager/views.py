# sessions_manager/views.py
import random
import string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CollabSession


def _generate_slug(length: int = 8) -> str:
    """Generate a random alphanumeric room code like 'x7kp2m4q'."""
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=length))


class CreateSessionView(APIView):
    """
    POST /api/sessions/
    Creates a new collab room and returns its slug.
    """
    def post(self, request):
        slug = _generate_slug()
        # Extremely unlikely, but guard against slug collisions
        while CollabSession.objects.filter(slug=slug).exists():
            slug = _generate_slug()

        session = CollabSession.objects.create(slug=slug)
        return Response({'slug': session.slug}, status=status.HTTP_201_CREATED)


class SessionDetailView(APIView):
    """
    GET /api/sessions/<slug>/
    Returns current code/language for a room (used when a user joins a room
    mid-session and needs to catch up).
    """
    def get(self, request, slug: str):
        try:
            session = CollabSession.objects.get(slug=slug)
        except CollabSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'slug':     session.slug,
            'code':     session.code,
            'language': session.language,
        })