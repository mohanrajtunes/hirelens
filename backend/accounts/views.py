from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_scope = 'register'


class LoginView(TokenObtainPairView):
    # 5 tries a minute per IP address, then 429 Too Many Requests.
    throttle_scope = 'login'


class LogoutView(APIView):
    # Holding the refresh token is the proof, so no access token is needed.
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            RefreshToken(request.data.get('refresh')).blacklist()
        except (TokenError, TypeError, AttributeError):
            return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response({'id': u.id, 'username': u.username, 'email': u.email})
