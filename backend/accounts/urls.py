# accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ProfileView

urlpatterns = [
    # simplejwt handles login — returns { access, refresh }
    path('login/',    TokenObtainPairView.as_view(), name='login'),
    path('refresh/',  TokenRefreshView.as_view(),    name='token-refresh'),
    path('register/', RegisterView.as_view(),         name='register'),
    path('profile/',  ProfileView.as_view(),          name='profile'),
]