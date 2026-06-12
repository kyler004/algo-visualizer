import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class CollabConsumer (AsyncWebsocketConsumer):
    """
    Handles one websocket connection for one user in one room.
    Django channels creates a fresh instance of this for each connection.
    """

    # Connection 