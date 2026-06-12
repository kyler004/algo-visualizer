# sessions_manager/urls.py
from django.urls import path
from .views import CreateSessionView, SessionDetailView

urlpatterns = [
    path('',          CreateSessionView.as_view(),  name='create-session'),
    path('<slug:slug>/', SessionDetailView.as_view(), name='session-detail'),
]