from django.contrib.auth.models import User
from rest_framework.views      import APIView
from rest_framework.response   import Response
from rest_framework            import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Body: { username, email, password }
    Returns: { user, tokens: { access, refresh } }
    """
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Generate tokens immediately — user is logged in after registering
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
            },
        }, status=status.HTTP_201_CREATED)


class ProfileView(APIView):
    """
    GET /api/auth/profile/
    Returns the current authenticated user's profile.
    Requires: Authorization: Bearer <access_token>
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)