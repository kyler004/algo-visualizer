# AlgoViz — Algorithm Visualizer

A full-stack, step-by-step algorithm visualizer with real-time collaborative editing. Write Python in a Monaco editor, execute it on a sandboxed Django backend, and watch variables, the call stack, and output evolve at each execution step — alone or with others in a shared room.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![Django](https://img.shields.io/badge/Django-6.x-green)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-8-646CFF)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8)

---

## Overview

AlgoViz combines a Python execution tracer with a live code editor and visual debugger. The backend captures every line, call, return, and exception using `sys.settrace`, then streams structured step snapshots to the frontend. The UI renders variables, the call stack, and accumulated output, with animated playback controls to scrub through execution.

Beyond solo use, AlgoViz supports **anonymous real-time collaboration**: share an 8-character room code, edit code together, see each other's cursors, and stay in sync during step-by-step playback.

### What you can do

| Area | Capabilities |
|------|-------------|
| **Editor** | Monaco-based Python editor with syntax highlighting, ligatures, and current-line execution highlight |
| **Execution** | Server-side sandboxed run; step snapshots with variables, call stack, and output |
| **Playback** | Prev / Play / Next controls, scrubber, and speed presets (0.5×–4×) |
| **Collaboration** | Create or join rooms, live code sync, remote cursors, presence avatars, synced playback step |
| **Accounts** | Register, sign in (JWT), and save named code snippets to a personal library |
| **Theming** | Multiple editor/UI themes with a settings panel |

---

## Real-Time Collaboration

Collaboration is room-based and does not require an account. Any user with the room code can join.

### How it works

1. **Create a room** — Click **New Session** in the navbar. The app calls `POST /api/sessions/` and receives an 8-character slug (e.g. `x7kp2m4q`).
2. **Share the code** — Other users enter the slug and click **Join**.
3. **Connect** — The frontend opens a WebSocket to `ws://…/ws/collab/<slug>/` and joins a Django Channels group backed by Redis.
4. **Collaborate** — Code edits, cursor positions, and playback steps are broadcast to everyone in the room.

When you **Leave**, the WebSocket closes, your avatar disappears for others, and the editor returns to solo mode.

### Collaboration features

- **Live code sync** — Edits broadcast instantly; the server persists the latest code to the database on every change so late joiners can hydrate via REST.
- **Code hydration on join** — Joining a room loads the saved code and language from `GET /api/sessions/<slug>/`. The room creator's starting code is seeded over WebSocket when they connect.
- **Presence avatars** — Each user gets a random name, color, and avatar in the navbar. A green/red dot shows WebSocket connection status.
- **Room roster (`room_state`)** — When you join, the server sends a snapshot of users already in the room (stored in a Redis hash). Late joiners see existing participants immediately.
- **Remote cursors** — Other users' cursor positions appear in the editor with colored labels. Outgoing cursor updates are throttled (~80 ms) to reduce WebSocket traffic.
- **Synced playback** — Scrubbing the step slider or using Play/Pause broadcasts the current step index to the room. Remote step updates are applied without echoing back (no ping-pong loops).
- **Auto-reconnect** — Dropped connections retry after 3 seconds; presence is cleared and rebuilt from a fresh `room_state` on reconnect.
- **Leave session** — Explicit **Leave** button in the navbar returns you to solo editing and notifies the room.

### Collaboration architecture

```
┌──────────────┐     REST (create/join)      ┌─────────────────────┐
│   Browser    │ ──────────────────────────► │  Django REST API    │
│  (React)     │                             │  CollabSession DB   │
└──────┬───────┘                             └─────────────────────┘
       │
       │  WebSocket  ws/collab/<slug>/
       ▼
┌──────────────┐   pub/sub    ┌───────────────┐   roster   ┌───────┐
│ CollabConsumer│ ◄──────────► │ Redis Channels │ ◄────────► │ Redis │
└──────────────┘               └───────────────┘            └───────┘
```

User identity is client-generated (`sessionStorage`) — no login required for collab rooms. Saved Sessions (personal code library) are a separate, authenticated feature.

---

## Architecture

```
┌─────────────────────────────┐
│        Frontend (Vite)      │
│   React 19 + TypeScript     │
│   Monaco Editor             │
│   Zustand (state)           │
│   Framer Motion (anim)      │
│   Tailwind CSS 4            │
└─────────┬───────────────────┘
          │  /api/*  → HTTP proxy
          │  /ws/*   → WebSocket proxy
          ▼
┌─────────────────────────────┐
│      Backend (Django)       │
│   Django REST Framework     │
│   Django Channels (ASGI)    │
│   Redis (channel layer)     │
│   Custom Python tracer      │
└─────────────────────────────┘
```

### Frontend → Backend proxy

During development the Vite dev server proxies requests to Django so both servers can run on different ports without CORS issues:

| Frontend path | Proxied to               | Protocol |
|---------------|--------------------------|----------|
| `/api/*`      | `http://localhost:8000`   | HTTP     |
| `/ws/*`       | `ws://localhost:8000`     | WebSocket|

This is configured in [`frontend/vite.config.ts`](frontend/vite.config.ts).

> **Important:** Collaboration requires an **ASGI server** (daphne). `python manage.py runserver` serves HTTP but does **not** handle WebSockets — you will get connection errors. Always use daphne when testing collab features.

---

## Tech Stack

### Frontend (`frontend/`)

| Library                | Purpose                                     |
|------------------------|---------------------------------------------|
| React 19               | UI framework                                |
| TypeScript 6           | Type safety                                 |
| Vite 8                 | Dev server & build tool                     |
| Tailwind CSS 4         | Utility-first styling (via `@tailwindcss/vite`) |
| Monaco Editor          | In-browser code editor (`@monaco-editor/react`) |
| Zustand                | Lightweight global state management         |
| Framer Motion          | Micro-animations for panels and variables   |
| Axios                  | HTTP client for API calls                   |
| nanoid                 | Short unique IDs for collab users           |

### Backend (`backend/`)

| Library                | Purpose                                     |
|------------------------|---------------------------------------------|
| Django 6               | Web framework                               |
| Django REST Framework  | RESTful API endpoints                       |
| Django Channels        | WebSocket support (ASGI)                    |
| channels-redis         | Redis-backed channel layer & room roster    |
| daphne                 | ASGI server for HTTP + WebSocket            |
| djangorestframework-simplejwt | JWT authentication                   |
| python-dotenv          | Environment variable management             |

---

## Project Structure

```
algo-visualizer/
├── backend/
│   ├── config/               # Django project settings & ASGI config
│   │   ├── settings/
│   │   │   ├── base.py       # Shared settings (DB, apps, middleware)
│   │   │   ├── development.py # Debug, CORS, allowed hosts
│   │   │   └── production.py
│   │   ├── asgi.py           # ASGI entrypoint (HTTP + WebSocket routing)
│   │   └── urls.py           # Top-level URL config
│   ├── executor/             # Code execution app
│   │   ├── tracer.py         # sys.settrace-based Python tracer
│   │   ├── runner.py         # Sandboxed code runner
│   │   ├── views.py          # POST /api/execute/
│   │   └── urls.py
│   ├── sessions_manager/     # Collaboration & saved sessions
│   │   ├── consumers.py      # WebSocket consumer + Redis room roster
│   │   ├── models.py         # CollabSession, SavedSession
│   │   ├── routing.py        # WebSocket URL patterns
│   │   ├── views.py          # Session REST endpoints
│   │   └── urls.py
│   ├── accounts/             # User registration & JWT auth
│   ├── .env                  # Environment variables (not committed in prod)
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Root layout, CollabLayer, navbar
│   │   ├── components/
│   │   │   ├── Editor/       # MonacoEditor + line highlighting
│   │   │   ├── Visualizer/   # Variables, call stack, output tabs
│   │   │   ├── Controls/     # StepControls (playback)
│   │   │   ├── Collaboration/# SessionControls, UserAvatars, CursorOverlay
│   │   │   ├── Auth/         # AuthModal
│   │   │   ├── Sessions/     # SessionHistory (saved snippets)
│   │   │   └── Theme/        # Theme picker & settings
│   │   ├── hooks/
│   │   │   ├── useExecution.ts
│   │   │   ├── usePlayback.ts
│   │   │   ├── useCollaboration.ts  # WebSocket lifecycle & sync
│   │   │   ├── useAuth.ts
│   │   │   └── useTheme.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── websocket.ts  # Auto-reconnect WebSocket client
│   │   ├── store/
│   │   │   ├── executionStore.ts
│   │   │   ├── collabStore.ts
│   │   │   ├── authStore.ts
│   │   │   └── themeStore.ts
│   │   └── types/
│   └── vite.config.ts
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 and **npm**
- **Python** ≥ 3.12 and **pip**
- **Redis** (required for collaboration — channel layer and room roster)
- **PostgreSQL** (or swap to SQLite for local dev — see below)

### 1. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers channels channels-redis daphne python-dotenv psycopg2-binary djangorestframework-simplejwt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials, or switch to SQLite (see below)

# Run migrations
python manage.py migrate

# Start the ASGI server (required for WebSocket / collaboration)
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

> **Tip — Use SQLite for quick local dev:**
> In `backend/config/settings/development.py`, override the database:
> ```python
> DATABASES = {
>     'default': {
>         'ENGINE': 'django.db.backends.sqlite3',
>         'NAME': BASE_DIR / 'db.sqlite3',
>     }
> }
> ```

### 2. Frontend setup

```bash
cd frontend

npm install

# Proxies /api and /ws to Django on port 8000
npm run dev
```

The app will be available at **http://localhost:5173**.

### 3. Redis (for collaboration)

```bash
# macOS
brew install redis && redis-server

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

> If you only need code execution and not collaboration, you can temporarily switch the channel layer to `InMemoryChannelLayer` in settings. Room presence and multi-process pub/sub will not work in that mode.

---

## API Endpoints

### Code execution

| Method | Endpoint          | Body                                         | Response                                |
|--------|-------------------|----------------------------------------------|-----------------------------------------|
| POST   | `/api/execute/`   | `{ "code": "...", "language": "python" }`    | `{ "success": bool, "total_steps": N, "steps": [...] }` |

### Collaboration sessions (anonymous)

| Method | Endpoint                  | Body | Response                         |
|--------|---------------------------|------|----------------------------------|
| POST   | `/api/sessions/`          | —    | `{ "slug": "x7kp2m4q" }`        |
| GET    | `/api/sessions/<slug>/`   | —    | `{ "slug", "code", "language" }` |

### Saved sessions (authenticated)

| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| GET    | `/api/sessions/saved/`         | List user's saved snippets |
| POST   | `/api/sessions/saved/`         | Save a new snippet       |
| GET    | `/api/sessions/saved/<id>/`    | Load full code           |
| PATCH  | `/api/sessions/saved/<id>/`    | Update title             |
| DELETE | `/api/sessions/saved/<id>/`    | Delete snippet           |

### Authentication

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/auth/register/` | Create account                 |
| POST   | `/api/auth/login/`    | Returns `{ access, refresh }`  |
| POST   | `/api/auth/refresh/`  | Refresh access token           |
| GET    | `/api/auth/profile/`  | Current user profile           |

### WebSocket

| Endpoint | Purpose |
|----------|---------|
| `ws://localhost:8000/ws/collab/<slug>/` | Real-time collaboration channel |

**Message types:**

| Type | Direction | Payload | Description |
|------|-----------|---------|-------------|
| `user_join` | Client → Server → Room | — | Announce presence; triggers roster update |
| `room_state` | Server → Joiner | `{ users: CollabUser[] }` | Snapshot of users already in the room |
| `user_leave` | Server → Room | `{ user_id }` | User disconnected |
| `code_change` | Client → Server → Room | `{ code }` | Full editor sync; persisted to DB |
| `cursor_change` | Client → Server → Room | `{ lineNumber, column }` | Remote cursor position |
| `step_change` | Client → Server → Room | `{ stepIndex }` | Playback scrubber sync |

Every client message includes a `user` object: `{ id, name, color }`.

---

## Development

```bash
# Frontend — type check
cd frontend && npx tsc --noEmit

# Frontend — lint
cd frontend && npm run lint

# Frontend — production build
cd frontend && npm run build

# Backend — run tests
cd backend && python manage.py test
```

### Testing collaboration locally

1. Start Redis, then **daphne** (not `runserver`).
2. Start the Vite dev server.
3. Open two browser tabs (or one normal + one incognito).
4. Tab A: **New Session** → note the room code.
5. Tab B: enter the code → **Join**.
6. Verify avatars, code sync, cursors, step scrubber sync, and **Leave**.

---

## License

This project is for educational and demonstration purposes.
