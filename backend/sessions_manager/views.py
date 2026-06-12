import random
import string
from rest_framework.views    import APIView
from rest_framework.response import Response
from rest_framework          import status, permissions
from .models import CollabSession, SavedSession


# ── Collab session views (unchanged) ─────────────────────────────────────────

def _generate_slug(length: int = 8) -> str:
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=length))


class CreateSessionView(APIView):
    def post(self, request):
        slug = _generate_slug()
        while CollabSession.objects.filter(slug=slug).exists():
            slug = _generate_slug()
        session = CollabSession.objects.create(slug=slug)
        return Response({'slug': session.slug}, status=status.HTTP_201_CREATED)


class SessionDetailView(APIView):
    def get(self, request, slug: str):
        try:
            session = CollabSession.objects.get(slug=slug)
        except CollabSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'slug': session.slug, 'code': session.code, 'language': session.language})


# ── Saved session views (new) ─────────────────────────────────────────────────

class SavedSessionListView(APIView):
    """
    GET  /api/sessions/saved/  → list user's saved sessions
    POST /api/sessions/saved/  → save a new session
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = SavedSession.objects.filter(owner=request.user)
        return Response([
            {
                'id':           str(s.id),
                'title':        s.title,
                'language':     s.language,
                'code_preview': s.code[:120],   # Just a teaser, not the full code
                'created_at':   s.created_at.isoformat(),
                'updated_at':   s.updated_at.isoformat(),
            }
            for s in sessions
        ])

    def post(self, request):
        session = SavedSession.objects.create(
            owner    = request.user,
            title    = request.data.get('title', 'Untitled'),
            code     = request.data.get('code', ''),
            language = request.data.get('language', 'python'),
        )
        return Response({'id': str(session.id), 'title': session.title},
                        status=status.HTTP_201_CREATED)


class SavedSessionDetailView(APIView):
    """
    GET    /api/sessions/saved/<id>/  → load full code
    PATCH  /api/sessions/saved/<id>/  → update title
    DELETE /api/sessions/saved/<id>/  → delete
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_session(self, pk: str, user):
        try:
            return SavedSession.objects.get(pk=pk, owner=user)
        except SavedSession.DoesNotExist:
            return None

    def get(self, request, pk: str):
        session = self._get_session(pk, request.user)
        if not session:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'id':         str(session.id),
            'title':      session.title,
            'code':       session.code,
            'language':   session.language,
            'created_at': session.created_at.isoformat(),
        })

    def patch(self, request, pk: str):
        session = self._get_session(pk, request.user)
        if not session:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if 'title' in request.data:
            session.title = request.data['title']
            session.save()
        return Response({'id': str(session.id), 'title': session.title})

    def delete(self, request, pk: str):
        session = self._get_session(pk, request.user)
        if not session:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)