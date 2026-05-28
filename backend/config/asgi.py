# config/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),      # Regular HTTP requests
    'websocket': AuthMiddlewareStack(    # WebSocket requests (collab - Phase 3)
        URLRouter([])                    # Empty for now, we'll add routes later
    ),
})