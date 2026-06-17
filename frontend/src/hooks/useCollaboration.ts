import { useEffect, useRef, useCallback } from "react";
import { CollabWebSocket } from "../services/websocket";
import useCollabStore, { colorForIndex } from "../store/collabStore";
import useExecutionStore from "../store/executionStore";
import type { WsMessage, CollabUser } from "../types";
import { nanoid } from "nanoid";

const CURSOR_THROTTLE_MS = 80;

// Generate a persistent local user identity for this browser session
function getOrCreateLocalUser(roomUserCount: number): CollabUser {
  const stored = sessionStorage.getItem("collab_user");
  if (stored) return JSON.parse(stored) as CollabUser;

  const user: CollabUser = {
    id: nanoid(8),
    name: `User ${Math.floor(Math.random() * 900) + 100}`,
    color: colorForIndex(roomUserCount),
  };
  sessionStorage.setItem("collab_user", JSON.stringify(user));
  return user;
}

export default function useCollaboration(slug: string) {
  const wsRef = useRef<CollabWebSocket | null>(null);
  const suppressStepBroadcastRef = useRef(false);
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCursorRef = useRef<{ lineNumber: number; column: number } | null>(
    null,
  );

  const {
    setSlug,
    setConnected,
    setLocalUser,
    addRemoteUser,
    removeRemoteUser,
    setRemoteUsers,
    updateCursor,
    removeCursor,
    remoteUsers,
    reset,
  } = useCollabStore();

  const { setCode, goToStep } = useExecutionStore();

  // ── Handle incoming messages from the server ──────────────────
  const handleMessage = useCallback(
    (message: WsMessage) => {
      const { type, payload, user } = message;
      const localId = useCollabStore.getState().localUser?.id;

      switch (type) {
        case "room_state": {
          const users = (payload.users as CollabUser[]) ?? [];
          setRemoteUsers(
            localId ? users.filter((u) => u.id !== localId) : users,
          );
          break;
        }

        case "user_join":
          if (user.id !== localId) {
            addRemoteUser(user);
          }
          break;

        case "user_leave":
          removeRemoteUser(payload.user_id as string);
          removeCursor(payload.user_id as string);
          break;

        case "code_change":
          if (user.id !== localId) {
            setCode(payload.code as string);
          }
          break;

        case "cursor_change":
          if (user.id !== localId) {
            updateCursor({
              user,
              position: {
                lineNumber: payload.lineNumber as number,
                column: payload.column as number,
              },
            });
          }
          break;

        case "step_change":
          if (user.id !== localId) {
            suppressStepBroadcastRef.current = true;
            goToStep(payload.stepIndex as number);
            queueMicrotask(() => {
              suppressStepBroadcastRef.current = false;
            });
          }
          break;
      }
    },
    [
      addRemoteUser,
      removeRemoteUser,
      removeCursor,
      setRemoteUsers,
      setCode,
      updateCursor,
      goToStep,
    ],
  );

  const flushCursor = useCallback(() => {
    if (!pendingCursorRef.current) return;
    const { lineNumber, column } = pendingCursorRef.current;
    pendingCursorRef.current = null;
    wsRef.current?.send("cursor_change", { lineNumber, column });
  }, []);

  // ── Connect on mount, disconnect on unmount ───────────────────
  useEffect(() => {
    const localUser = getOrCreateLocalUser(remoteUsers.length);

    setSlug(slug);
    setLocalUser(localUser);

    wsRef.current = new CollabWebSocket({
      slug,
      user: localUser,
      onMessage: handleMessage,
      onOpen: () => {
        useCollabStore.setState({ remoteUsers: [], remoteCursors: [] });
        setConnected(true);
        const code = useExecutionStore.getState().code;
        wsRef.current?.send("code_change", { code });
      },
      onClose: () => {
        setConnected(false);
        useCollabStore.setState({ remoteCursors: [] });
      },
    });

    wsRef.current.connect();

    return () => {
      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
        cursorThrottleRef.current = null;
      }
      flushCursor();
      wsRef.current?.disconnect();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const broadcastCode = useCallback((code: string) => {
    wsRef.current?.send("code_change", { code });
  }, []);

  const broadcastCursor = useCallback(
    (lineNumber: number, column: number) => {
      pendingCursorRef.current = { lineNumber, column };

      if (cursorThrottleRef.current) return;

      flushCursor();
      cursorThrottleRef.current = setTimeout(() => {
        cursorThrottleRef.current = null;
        flushCursor();
      }, CURSOR_THROTTLE_MS);
    },
    [flushCursor],
  );

  const broadcastStepChange = useCallback((stepIndex: number) => {
    wsRef.current?.send("step_change", { stepIndex });
  }, []);

  return {
    broadcastCode,
    broadcastCursor,
    broadcastStepChange,
    suppressStepBroadcastRef,
  };
}
