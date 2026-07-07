import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import MonacoEditor from "./components/Editor/MonacoEditor";
import VisualizerTabs from "./components/Visualizer/VisualizerTabs";
import StepControls from "./components/Controls/StepControls";
import SessionControls from "./components/Collaboration/SessionControls";
import AuthModal from "./components/Auth/AuthModal";
import SessionHistory from "./components/Sessions/SessionHistory";
import ThemeDropdown from "./components/Theme/ThemeDropdown";
import ThemeSettingsModal from "./components/Theme/ThemeSettingsModal";
import { StepAnimationProvider } from "./context/StepAnimationContext";
import usePlayback from "./hooks/usePlayback";
import useExecution from "./hooks/useExecution";
import useCollaboration from "./hooks/useCollaboration";
import useAuth from "./hooks/useAuth";
import useTheme from "./hooks/useTheme";
import useExecutionStore from "./store/executionStore";
import useCollabStore from "./store/collabStore";
import useAuthStore from "./store/authStore";

function CollabLayer({ slug }: { slug: string }) {
  const {
    broadcastCode,
    broadcastCursor,
    broadcastStepChange,
    suppressedRemoteStepRef,
  } = useCollaboration(slug);
  const currentStepIndex = useExecutionStore((s) => s.currentStepIndex);

  useEffect(() => {
    if (currentStepIndex < 0) return;
    // Step applied from a remote user — consume the marker instead of
    // echoing the same step back to the room.
    if (suppressedRemoteStepRef.current === currentStepIndex) {
      suppressedRemoteStepRef.current = null;
      return;
    }
    broadcastStepChange(currentStepIndex);
  }, [currentStepIndex, broadcastStepChange, suppressedRemoteStepRef]);

  return (
    <MonacoEditor
      onCodeChange={broadcastCode}
      onCursorChange={broadcastCursor}
    />
  );
}

interface NavbarProps {
  onToggleHistory: () => void;
  onToggleAuth: () => void;
  onOpenThemeSettings: () => void;
}

function Navbar({ onToggleHistory, onToggleAuth, onOpenThemeSettings }: NavbarProps) {
  const { runCode } = useExecution();
  const { isLoading, error } = useExecutionStore();
  const { user, logout } = useAuthStore();

  return (
    <nav
      className="h-14 flex items-center justify-between px-6
      bg-bg-secondary border-b border-border-subtle flex-shrink-0 gap-4"
    >
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-6 h-6 bg-accent-blue rounded flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="4" height="4" rx="1" fill="white" fillOpacity="0.9" />
            <rect x="7" y="1" width="4" height="4" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="1" y="7" width="4" height="4" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="7" y="7" width="4" height="4" rx="1" fill="white" fillOpacity="0.3" />
          </svg>
        </div>
        <span className="font-semibold text-text-primary tracking-tight">AlgoViz</span>
        <span
          className="text-xs text-text-secondary font-mono px-2 py-0.5
          bg-bg-panel rounded border border-border-subtle"
        >
          Python
        </span>
      </div>

      <div className="flex-1 flex justify-center">
        <SessionControls />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {error && (
          <span className="text-accent-red text-xs font-mono max-w-[180px] truncate">
            {error}
          </span>
        )}

        <ThemeDropdown onOpenSettings={onOpenThemeSettings} />

        {user && (
          <button
            onClick={onToggleHistory}
            title="Session History"
            className="p-2 rounded text-text-secondary hover:text-text-primary
              hover:bg-bg-hover transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7.5 2v5.5l3 3" />
              <circle cx="7.5" cy="7.5" r="5.5" />
            </svg>
          </button>
        )}

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

        <button
          onClick={runCode}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-1.5 bg-accent-blue
            hover:brightness-110 text-white text-sm font-medium rounded
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running…
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
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

export default function App() {
  usePlayback();
  useAuth();
  useTheme();

  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const { slug } = useCollabStore();
  const { steps, currentStepIndex } = useExecutionStore();
  const currentStep = steps[currentStepIndex];

  return (
    <div className="h-screen flex flex-col bg-bg-primary font-ui overflow-hidden">
      <Navbar
        onToggleHistory={() => setShowHistory((v) => !v)}
        onToggleAuth={() => setShowAuth((v) => !v)}
        onOpenThemeSettings={() => setShowThemeSettings(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[3] overflow-hidden border-r border-border-subtle">
          {slug ? <CollabLayer slug={slug} /> : <MonacoEditor />}
        </div>

        <div className="flex-[2] flex flex-col overflow-hidden">
          <StepAnimationProvider event={currentStep?.event}>
            <VisualizerTabs />
          </StepAnimationProvider>
        </div>
      </div>

      <div className="h-16 shrink-0">
        <StepControls />
      </div>

      <AnimatePresence>
        {showAuth && <AuthModal key="auth" onClose={() => setShowAuth(false)} />}
        {showThemeSettings && (
          <ThemeSettingsModal key="theme" onClose={() => setShowThemeSettings(false)} />
        )}
      </AnimatePresence>

      <SessionHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}
