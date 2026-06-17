import useCollabStore from "../../store/collabStore";
import type { CollabUser } from "../../types";

function Avatar({
  user,
  isLocal = false,
}: {
  user: CollabUser;
  isLocal?: boolean;
}) {
  return (
    <div
      className="relative group"
      title={isLocal ? `${user.name} (you)` : user.name}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center
          text-xs font-semibold text-white select-none transition-transform
          hover:scale-110 cursor-default
          ${isLocal ? "ring-2 ring-white/30 ring-offset-1 ring-offset-bg-secondary" : ""}`}
        style={{ backgroundColor: user.color }}
      >
        {user.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Tooltip */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
        px-2 py-1 bg-bg-primary border border-border-subtle rounded text-[10px]
        text-text-primary whitespace-nowrap z-50"
      >
        {user.name}
        {isLocal ? " (you)" : ""}
      </div>
    </div>
  );
}

export default function UserAvatars() {
  const { localUser, remoteUsers, isConnected, slug, leaveSession } =
    useCollabStore();

  if (!slug) return null; // Not in a collab session

  return (
    <div className="flex items-center gap-2">
      {/* Connection indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-accent-green" : "bg-accent-red"}`}
        />
        <span className="text-xs text-text-secondary font-mono">{slug}</span>
      </div>

      <div className="w-px h-4 bg-border-subtle" />

      {/* Avatars — local user first, then remote */}
      <div className="flex items-center -space-x-1">
        {localUser && <Avatar user={localUser} isLocal />}
        {remoteUsers.map((user) => (
          <Avatar key={user.id} user={user} />
        ))}
      </div>

      {/* Total user count */}
      <span className="text-xs text-text-secondary">
        {1 + remoteUsers.length} online
      </span>

      <button
        onClick={leaveSession}
        className="px-2 py-1 text-[10px] font-medium text-text-secondary
          hover:text-accent-red border border-border-subtle rounded
          hover:border-accent-red/30 transition-colors"
      >
        Leave
      </button>
    </div>
  );
}
