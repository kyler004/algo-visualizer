# sessions_manager/consumers.py
import json
import os
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from redis.asyncio import Redis

ROOM_TTL_SECONDS = 86400  # 24 hours

_redis_client: Redis | None = None


def _get_redis() -> Redis:
    global _redis_client
    if _redis_client is None:
        host = os.getenv('REDIS_HOST', 'localhost')
        _redis_client = Redis(host=host, port=6379, decode_responses=True)
    return _redis_client


def _room_users_key(slug: str) -> str:
    return f'collab:room:{slug}:users'


class CollabConsumer(AsyncWebsocketConsumer):
    """
    Handles one WebSocket connection for one user in one room.
    Django Channels creates a fresh instance of this class for each connection.
    """

    # ─────────────────────────────────────────────────────────
    # Connection lifecycle
    # ─────────────────────────────────────────────────────────

    async def connect(self):
        """Called when a client opens a WebSocket connection."""
        # The room slug comes from the URL: ws://localhost:8000/ws/collab/<slug>/
        self.slug       = self.scope['url_route']['kwargs']['slug']
        self.group_name = f'collab_{self.slug}'
        self.user_id    = None  # Set on first 'user_join' message

        # Verify the session exists before accepting the connection
        session_exists = await self._session_exists(self.slug)
        if not session_exists:
            await self.close()
            return

        # Join this user's connection to the room's channel group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code: int):
        """Called when a client closes the connection (tab closed, network drop, etc.)"""
        if self.user_id:
            await self._remove_room_user(self.slug, self.user_id)
            # Broadcast to everyone that this user left
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type':    'collab.user_leave',  # Maps to collab_user_leave() below
                    'user_id': self.user_id,
                }
            )

        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ─────────────────────────────────────────────────────────
    # Receiving messages from the client
    # ─────────────────────────────────────────────────────────

    async def receive(self, text_data: str):
        """Called when the client sends a message over the WebSocket."""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return  # Silently drop malformed messages

        msg_type = data.get('type')
        payload  = data.get('payload', {})
        user     = data.get('user', {})

        if not msg_type or not user:
            return

        # Store user_id so disconnect() can broadcast the leave event
        self.user_id = user.get('id')

        # Route to the right handler
        handlers = {
            'user_join':     self._handle_user_join,
            'code_change':   self._handle_code_change,
            'cursor_change': self._handle_cursor_change,
            'step_change':   self._handle_step_change,
        }
        handler = handlers.get(msg_type)
        if handler:
            await handler(payload, user)

    # ─────────────────────────────────────────────────────────
    # Message handlers (client → server → broadcast to group)
    # ─────────────────────────────────────────────────────────

    async def _handle_user_join(self, payload: dict, user: dict):
        existing_users = await self._add_room_user(self.slug, user)
        await self._send_to_client('room_state', {'users': existing_users}, {})
        await self.channel_layer.group_send(
            self.group_name,
            {'type': 'collab.user_join', 'user': user}
        )

    async def _handle_code_change(self, payload: dict, user: dict):
        # Persist code to DB so late joiners get the current state
        await self._save_code(self.slug, payload.get('code', ''))

        await self.channel_layer.group_send(
            self.group_name,
            {'type': 'collab.code_change', 'payload': payload, 'user': user}
        )

    async def _handle_cursor_change(self, payload: dict, user: dict):
        await self.channel_layer.group_send(
            self.group_name,
            {'type': 'collab.cursor_change', 'payload': payload, 'user': user}
        )

    async def _handle_step_change(self, payload: dict, user: dict):
        await self.channel_layer.group_send(
            self.group_name,
            {'type': 'collab.step_change', 'payload': payload, 'user': user}
        )

    # ─────────────────────────────────────────────────────────
    # Sending to individual clients (group_send → these methods)
    # ─────────────────────────────────────────────────────────
    # Django Channels maps 'collab.user_join' → collab_user_join()
    # (dots in type names become underscores in method names)

    async def collab_user_join(self, event: dict):
        await self._send_to_client('user_join', {}, event['user'])

    async def collab_user_leave(self, event: dict):
        await self._send_to_client('user_leave', {'user_id': event['user_id']}, {})

    async def collab_code_change(self, event: dict):
        await self._send_to_client('code_change', event['payload'], event['user'])

    async def collab_cursor_change(self, event: dict):
        await self._send_to_client('cursor_change', event['payload'], event['user'])

    async def collab_step_change(self, event: dict):
        await self._send_to_client('step_change', event['payload'], event['user'])

    # ─────────────────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────────────────

    async def _send_to_client(self, msg_type: str, payload: dict, user: dict):
        await self.send(text_data=json.dumps({
            'type':    msg_type,
            'payload': payload,
            'user':    user,
        }))

    @database_sync_to_async
    def _session_exists(self, slug: str) -> bool:
        from .models import CollabSession
        return CollabSession.objects.filter(slug=slug).exists()

    @database_sync_to_async
    def _save_code(self, slug: str, code: str):
        from .models import CollabSession
        CollabSession.objects.filter(slug=slug).update(code=code)

    async def _add_room_user(self, slug: str, user: dict) -> list[dict]:
        """Register user in Redis roster; return other users already in the room."""
        user_id = user.get('id')
        if not user_id:
            return []

        redis = _get_redis()
        key = _room_users_key(slug)
        await redis.hset(key, user_id, json.dumps(user))
        await redis.expire(key, ROOM_TTL_SECONDS)

        others: list[dict] = []
        for uid, raw in (await redis.hgetall(key)).items():
            if uid != user_id:
                others.append(json.loads(raw))
        return others

    async def _remove_room_user(self, slug: str, user_id: str):
        redis = _get_redis()
        await redis.hdel(_room_users_key(slug), user_id)