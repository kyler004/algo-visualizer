import { create } from "zustand";
import type { CollabUser, RemoteCursor, UserColor } from "../types";

// Pool of distinct colours — one per user in the room
const USER_COLORS: UserColor[] = [
  "#4d9fff",
  "#f59e0b",
  "#22c55e",
  "#a78bfa",
  "#ef4444",
  "#ec4899",
];

// Assign colours round-robin based on how many users have joined
export function colorForIndex(index: number): UserColor {
  return USER_COLORS[index % USER_COLORS.length];
}

interface CollabState {
  // ── Room ──────────────────────────────────────────────────
  slug: string | null;
  isConnected: boolean;
  localUser: CollabUser | null;

  // ── Users ─────────────────────────────────────────────────
  remoteUsers: CollabUser[];
  remoteCursors: RemoteCursor[];

  // ── Actions ───────────────────────────────────────────────
  setSlug: (slug: string) => void;
  setConnected: (connected: boolean) => void;
  setLocalUser: (user: CollabUser) => void;
  addRemoteUser: (user: CollabUser) => void;
  removeRemoteUser: (userId: string) => void;
  updateCursor: (cursor: RemoteCursor) => void;
  removeCursor: (userId: string) => void;
  setRemoteUsers: (users: CollabUser[]) => void;
  joinSession: (slug: string) => void;
  leaveSession: () => void;
  reset: () => void;
}

const useCollabStore = create<CollabState>()((set) => ({
  slug: null,
  isConnected: false,
  localUser: null,
  remoteUsers: [],
  remoteCursors: [],

  setSlug: (slug) => set({ slug }),
  setConnected: (connected) => set({ isConnected: connected }),
  setLocalUser: (user) => set({ localUser: user }),

  addRemoteUser: (user) =>
    set((state) => ({
      // Prevent duplicate entries if the same user reconnects
      remoteUsers: [...state.remoteUsers.filter((u) => u.id !== user.id), user],
    })),

  removeRemoteUser: (userId) =>
    set((state) => ({
      remoteUsers: state.remoteUsers.filter((u) => u.id !== userId),
    })),

  updateCursor: (cursor) =>
    set((state) => ({
      remoteCursors: [
        ...state.remoteCursors.filter((c) => c.user.id !== cursor.user.id),
        cursor,
      ],
    })),

  removeCursor: (userId) =>
    set((state) => ({
      remoteCursors: state.remoteCursors.filter((c) => c.user.id !== userId),
    })),

  setRemoteUsers: (users) => set({ remoteUsers: users }),

  joinSession: (slug) =>
    set({ slug, remoteUsers: [], remoteCursors: [] }),

  leaveSession: () =>
    set({
      slug: null,
      isConnected: false,
      localUser: null,
      remoteUsers: [],
      remoteCursors: [],
    }),

  reset: () =>
    set({
      slug: null,
      isConnected: false,
      localUser: null,
      remoteUsers: [],
      remoteCursors: [],
    }),
}));

export default useCollabStore;
