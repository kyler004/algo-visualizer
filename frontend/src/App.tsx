import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import MonacoEditor from "./components/Editor/MonacoEditor";
import VariablesPanel from "./components/Visualizer/VariablesPanel";
import CallStackPanel from "./components/Visualizer/CallStackPanel";
import OutputPanel from "./components/Visualizer/OutputPanel";
import StepControls from "./components/Controls/StepControls";
import SessionControls from "./components/Collaboration/SessionControls";
import AuthModal from "./components/Auth/AuthModal";
import SessionHistory from "./components/Sessions/SessionHistory";
import usePlayback from "./hooks/usePlayback";
import useExecution from "./hooks/useExecution";
import useCollaboration from "./hooks/useCollaboration";
import useAuth from "./hooks/useAuth";
import useExecutionStore from "./store/executionStore";
import useCollabStore from "./store/collabStore";
import useAuthStore from "./store/authStore";

// ── Collab-aware editor (only mounted when slug exists) ───────────────────────
function CollabEditor({ slug }: { slug: string }) {
  const { broadcastCode, broadcastCursor } = useCollaboration(slug);
  return (
    <MonacoEditor
      onCodeChange={broadcastCode}
      onCursorChange={broadcastCursor}
    />
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
interface NavbarProps {
  onJoinSession: (slug: string) => void;
  onToggleHistory: () => void;
  onToggleAuth: () => void;
}

function Navbar({ onJoinSession, onToggleHistory, onToggleAuth }: NavbarProps) {
  const { runCode } = useExecution();
  const { isLoading, error } = useExecutionStore();
  const { slug } = useCollabStore();
  const { user, logout } = useAuthStore();

  return (
    <nav
      className="h-14 flex items-center justify-between px-6
      bg-bg-secondary border-b border-border-subtle flex-shrink-0 gap-4"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-6 h-6 bg-accent-blue rounded flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect
              x="1"
              y="1"
              width="4"
              height="4"
              rx="1"
              fill="white"
              fillOpacity="0.9"
            />
            <rect
              x="7"
              y="1"
              width="4"
              height="4"
              rx="1"
              fill="white"
              fillOpacity="0.6"
            />
            <rect
              x="1"
              y="7"
              width="4"
              height="4"
              rx="1"
              fill="white"
              fillOpacity="0.6"
            />
            <rect
              x="7"
              y="7"
              width="4"
              height="4"
              rx="1"
              fill="white"
              fillOpacity="0.3"
            />
          </svg>
        </div>
        <span className="font-semibold text-text-primary tracking-tight">
          AlgoViz
        </span>
        <span
          className="text-xs text-text-secondary font-mono px-2 py-0.5
          bg-bg-panel rounded border border-border-subtle"
        >
          Python
        </span>
      </div>

      {/* Centre — collab controls */}
      <div className="flex-1 flex justify-center">
        <SessionControls onJoin={onJoinSession} />
      </div>

      {/* Right — user + history + run */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {error && (
          <span className="text-accent-red text-xs font-mono max-w-[180px] truncate">
            {error}
          </span>
        )}

        {/* Session history — only for logged-in users */}
        {user && (
          <button
            onClick={onToggleHistory}
            title="Session History"
            className="p-2 rounded text-text-secondary hover:text-text-primary
              hover:bg-bg-hover transition-colors"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M7.5 2v5.5l3 3" />
              <circle cx="7.5" cy="7.5" r="5.5" />
            </svg>
          </button>
        )}

        {/* Auth button */}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">{user.username}</span>
            <button
              onClick={logout}
              className="text-xs text-text-secondary hover:text-text-primary
                px-2 py-1 rounded hover:bg-bg-hover transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleAuth}
            className="text-xs text-text-secondary hover:text-text-primary
              px-3 py-1.5 rounded border border-border-subtle
              hover:bg-bg-hover transition-colors"
          >
            Sign in
          </button>
        )}

        {/* Run button */}
        <button
          onClick={runCode}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-1.5 bg-accent-blue
            hover:bg-blue-400 text-white text-sm font-medium rounded
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span
                className="w-3 h-3 border-2 border-white/30 border-t-white
                rounded-full animate-spin"
              />
              Running…
            </>
          ) : (
            <>
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="currentColor"
              >
                <path d="M2 1.5l8 4-8 4v-8z" />
              </svg>
              Run
            </>
          )}
        </button>
      </div>
    </nav>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  usePlayback();

  // Restore auth session on mount
  useAuth();

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-bg-primary font-ui overflow-hidden">
      <Navbar
        onJoinSession={setActiveSlug}
        onToggleHistory={() => setShowHistory((v) => !v)}
        onToggleAuth={() => setShowAuth((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[3] overflow-hidden border-r border-border-subtle">
          {activeSlug ? <CollabEditor slug={activeSlug} /> : <MonacoEditor />}
        </div>

        <div className="flex-[2] flex flex-col overflow-y-auto divide-y divide-border-subtle">
          <VariablesPanel />
          <CallStackPanel />
          <OutputPanel />
        </div>
      </div>

      <div className="h-16 flex-shrink-0">
        <StepControls />
      </div>

      {/* Modals / drawers */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal key="auth" onClose={() => setShowAuth(false)} />
        )}
      </AnimatePresence>

      <SessionHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
