import { useState } from "react";
import { createSession, getSession } from "../../services/api";
import useCollabStore from "../../store/collabStore";
import UserAvatars from "./UserAvatars";

export default function SessionControls() {
  const { slug, joinSession } = useCollabStore();
  const [joinInput, setJoinInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);
    try {
      const session = await createSession();
      joinSession(session.slug);
    } catch {
      setError("Failed to create session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    const trimmed = joinInput.trim().toLowerCase();
    if (!trimmed) return;

    setError(null);
    setIsJoining(true);
    try {
      await getSession(trimmed);
      joinSession(trimmed);
      setJoinInput("");
    } catch {
      setError("Session not found");
    } finally {
      setIsJoining(false);
    }
  };

  // If already in a session, show avatars + room info
  if (slug) {
    return <UserAvatars />;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Create session */}
      <button
        onClick={handleCreate}
        disabled={isCreating}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
          bg-accent-purple/10 text-accent-purple border border-accent-purple/20
          rounded hover:bg-accent-purple/20 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? (
          <>
            <span
              className="w-2.5 h-2.5 border-2 border-accent-purple/30
              border-t-accent-purple rounded-full animate-spin"
            />
            Creating…
          </>
        ) : (
          <>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            New Session
          </>
        )}
      </button>

      {/* Join session */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={joinInput}
          onChange={(e) => {
            setJoinInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          placeholder="Enter room code…"
          className="w-28 px-2 py-1.5 text-xs font-mono bg-bg-panel
            border border-border-subtle rounded text-text-primary
            placeholder:text-text-secondary/50 focus:outline-none
            focus:border-accent-blue/40 transition-colors"
        />
        <button
          onClick={handleJoin}
          disabled={isJoining || !joinInput.trim()}
          className="px-2.5 py-1.5 text-xs font-medium text-text-secondary
            hover:text-text-primary bg-bg-hover rounded transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isJoining ? "…" : "Join"}
        </button>
      </div>

      {/* Error indicator */}
      {error && (
        <span className="text-accent-red text-[10px] font-mono">{error}</span>
      )}
    </div>
  );
}
