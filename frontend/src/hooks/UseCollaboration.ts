import { useEffect, useRef, useCallback } from "react";
import { CollabWebSocket } from "../services/websocket";
import useCollabStore, { colorForIndex } from "../store/collabStore";
import useExecutionStore from "../store/executionStore";
import type { WsMessage, CollabUser } from "../types";
import { nanoid } from "nanoid";

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

  const {
    setSlug,
    setConnected,
    setLocalUser,
    addRemoteUser,
    removeRemoteUser,
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

      switch (type) {
        case "user_join":
          // Don't add ourselves to the remote users list
          if (user.id !== useCollabStore.getState().localUser?.id) {
            addRemoteUser(user);
          }
          break;

        case "user_leave":
          removeRemoteUser(payload.user_id as string);
          removeCursor(payload.user_id as string);
          break;

        case "code_change":
          // Only apply remote code changes — not our own echoed back
          if (user.id !== useCollabStore.getState().localUser?.id) {
            setCode(payload.code as string);
          }
          break;

        case "cursor_change":
          if (user.id !== useCollabStore.getState().localUser?.id) {
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
          if (user.id !== useCollabStore.getState().localUser?.id) {
            goToStep(payload.stepIndex as number);
          }
          break;
      }
    },
    [
      addRemoteUser,
      removeRemoteUser,
      removeCursor,
      setCode,
      updateCursor,
      goToStep,
    ],
  );

  // ── Connect on mount, disconnect on unmount ───────────────────
  useEffect(() => {
    const localUser = getOrCreateLocalUser(remoteUsers.length);

    setSlug(slug);
    setLocalUser(localUser);

    wsRef.current = new CollabWebSocket({
      slug,
      user: localUser,
      onMessage: handleMessage,
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
    });

    wsRef.current.connect();

    return () => {
      wsRef.current?.disconnect();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]); // Only re-run if the room slug changes

  // ── Public API: functions components call to broadcast events ──
  const broadcastCode = useCallback((code: string) => {
    wsRef.current?.send("code_change", { code });
  }, []);

  const broadcastCursor = useCallback((lineNumber: number, column: number) => {
    wsRef.current?.send("cursor_change", { lineNumber, column });
  }, []);

  const broadcastStepChange = useCallback((stepIndex: number) => {
    wsRef.current?.send("step_change", { stepIndex });
  }, []);

  return { broadcastCode, broadcastCursor, broadcastStepChange };
}
