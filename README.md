# AlgoViz — Algorithm Visualizer

A real-time, step-by-step algorithm visualizer with collaborative editing.
Write Python code in a Monaco editor, execute it on a sandboxed Django backend, and watch variables, the call stack, and output evolve at each execution step.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![Django](https://img.shields.io/badge/Django-5.x-green)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-8-646CFF)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8)

---

## Overview

AlgoViz is a full-stack web application that lets you:

- **Write & edit** Python code in a browser-based Monaco editor (syntax highlighting, theming, ligatures)
- **Execute** the code server-side with a custom `sys.settrace`-based tracer that captures every line, call, return, and exception event
- **Step through** execution snapshots — see variables, the call stack, and console output at each point in time
- **Play back** execution automatically at configurable speeds (0.5×, 1×, 2×, 4×)
- **Collaborate** in real-time — share a room code and see each other's cursors and code changes live via WebSockets

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

### Frontend → Backend Proxy

During development the Vite dev server proxies requests to Django so both servers can run on different ports without CORS issues:

| Frontend path | Proxied to               | Protocol |
|---------------|--------------------------|----------|
| `/api/*`      | `http://localhost:8000`   | HTTP     |
| `/ws/*`       | `ws://localhost:8000`     | WebSocket|

This is configured in [`frontend/vite.config.ts`](frontend/vite.config.ts).

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
| Django 5               | Web framework                               |
| Django REST Framework  | RESTful API endpoints                       |
| Django Channels        | WebSocket support (ASGI)                    |
| channels-redis         | Redis-backed channel layer for pub/sub      |
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
│   ├── sessions_manager/     # Collaboration app
│   │   ├── consumers.py      # WebSocket consumer (Django Channels)
│   │   ├── models.py         # CollabSession model
│   │   ├── routing.py        # WebSocket URL patterns
│   │   ├── views.py          # POST /api/sessions/, GET /api/sessions/<slug>/
│   │   └── urls.py
│   ├── .env                  # Environment variables (not committed in prod)
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Root component — layout, navbar, panels
│   │   ├── main.tsx          # React entrypoint
│   │   ├── index.css         # Tailwind + custom theme tokens + global styles
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   └── MonacoEditor.tsx        # Monaco wrapper with line highlighting
│   │   │   ├── Visualizer/
│   │   │   │   ├── VariablesPanel.tsx      # Current scope variables
│   │   │   │   ├── CallStackPanel.tsx      # Call stack frames
│   │   │   │   ├── OutputPanel.tsx         # Console output accumulation
│   │   │   │   └── renderers/             # Smart value renderers (arrays, objects, primitives)
│   │   │   ├── Controls/
│   │   │   │   └── StepControls.tsx        # Prev/Play/Next, scrubber, speed selector
│   │   │   └── Collaboration/
│   │   │       ├── SessionControls.tsx     # Create/join collab sessions
│   │   │       ├── CursorOverlay.tsx       # Remote cursor decorations in Monaco
│   │   │       └── UserAvatars.tsx         # User presence indicators
│   │   ├── hooks/
│   │   │   ├── useExecution.ts   # Runs code via API, handles errors
│   │   │   ├── usePlayback.ts    # Auto-step timer for playback mode
│   │   │   └── useCollaboration.ts  # WebSocket lifecycle & message handling
│   │   ├── services/
│   │   │   ├── api.ts            # Axios instance + API functions
│   │   │   └── websocket.ts      # WebSocket wrapper with auto-reconnect
│   │   ├── store/
│   │   │   ├── executionStore.ts  # Editor state, steps, playback (Zustand)
│   │   │   └── collabStore.ts     # Collab users, cursors, room state (Zustand)
│   │   └── types/
│   │       └── index.ts          # Shared TypeScript interfaces
│   ├── vite.config.ts            # Vite config with proxy & Tailwind plugin
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                     # ← You are here
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 and **npm**
- **Python** ≥ 3.12 and **pip**
- **Redis** (for WebSocket channel layer)
- **PostgreSQL** (or swap to SQLite for local dev — see below)

### 1. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers channels channels-redis python-dotenv

# Configure environment
cp .env.example .env
# Edit .env with your database credentials, or switch to SQLite (see below)

# Run migrations
python manage.py migrate

# Start the ASGI server (needed for WebSocket support)
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

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (proxies /api and /ws to Django on port 8000)
npm run dev
```

The app will be available at **http://localhost:5173**.

### 3. Redis (for Collaboration)

```bash
# macOS
brew install redis && redis-server

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

> If you only need code execution and don't need collaboration, you can
> temporarily switch the channel layer to `InMemoryChannelLayer` in settings.

---

## API Endpoints

### Code Execution

| Method | Endpoint          | Body                                         | Response                                |
|--------|-------------------|----------------------------------------------|-----------------------------------------|
| POST   | `/api/execute/`   | `{ "code": "...", "language": "python" }`    | `{ "success": bool, "total_steps": N, "steps": [...] }` |

### Collaboration Sessions

| Method | Endpoint                  | Body | Response                         |
|--------|---------------------------|------|----------------------------------|
| POST   | `/api/sessions/`          | —    | `{ "slug": "x7kp2m4q" }`        |
| GET    | `/api/sessions/<slug>/`   | —    | `{ "slug", "code", "language" }` |

### WebSocket

| Endpoint                          | Purpose                               |
|-----------------------------------|---------------------------------------|
| `ws://localhost:8000/ws/collab/<slug>/` | Real-time code & cursor sync     |

**Message types:** `user_join`, `user_leave`, `code_change`, `cursor_change`, `step_change`

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

---

## License

This project is for educational and demonstration purposes.
