from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .runner import execute_python

class ExecuteCodeview(APIView):
    """
     POST /api/execute/
    Body: { "code": "...", "language": "python" }
    Returns: { "success": true, "total_steps": N, "steps": [...] }
    """
    def post(self, request):
        code = request.data.get('code', '')
        language = request.data.get('language', 'python')

        if language != 'python':
            return Response(
                {'error': 'Only Python language is supported now'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = execute_python(code)

        # Return 200 even if the user's code errored
        # That's a user error, not a server error
        return Response(result, status=status.HTTP_200_OK)
