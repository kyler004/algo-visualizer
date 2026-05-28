# config/settings/development.py
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Allow React dev server to talk to Django
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Vite default port
]

# In dev, also allow cookies across origins
CORS_ALLOW_CREDENTIALS = True