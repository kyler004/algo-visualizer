# sessions_manager/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Matches ws://localhost:8000/ws/collab/abc123/
    re_path(r'^ws/collab/(?P<slug>[a-z0-9]+)/$', consumers.CollabConsumer.as_asgi()),
]