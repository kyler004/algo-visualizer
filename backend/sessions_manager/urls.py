# sessions_manager/urls.py
from django.urls import path
from .views import (
    CreateSessionView, SessionDetailView,
    SavedSessionListView, SavedSessionDetailView,
)

urlpatterns = [
    path('',                  CreateSessionView.as_view(),      name='create-session'),
    path('saved/',             SavedSessionListView.as_view(),   name='saved-sessions'),
    path('saved/<uuid:pk>/',   SavedSessionDetailView.as_view(), name='saved-session-detail'),
    path('<slug:slug>/',       SessionDetailView.as_view(),      name='session-detail'),
]