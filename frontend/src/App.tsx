import { useState, useCallback } from "react";
import MonacoEditor from "./components/Editor/MonacoEditor";
import VariablesPanel from "./components/Visualizer/VariablesPanel";
import CallStackPanel from "./components/Visualizer/CallStackPanel";
import OutputPanel from "./components/Visualizer/OutputPanel";
import StepControls from "./components/Controls/StepControls";
import SessionControls from "./components/Collaboration/SessionControls";
import usePlayback from "./hooks/usePlayback";
import useExecution from "./hooks/useExecution";
import useCollaboration from "./hooks/useCollaboration";
import useExecutionStore from "./store/executionStore";
import useCollabStore from "./store/collabStore";

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — only rendered when a collab session is active.
// This is a separate component so the useCollaboration hook (which needs
// a slug) is only called after a slug exists.
// ─────────────────────────────────────────────────────────────────────────────
function CollabEditor({ slug }: { slug: string }) {
  const { broadcastCode, broadcastCursor, broadcastStepChange } =
    useCollaboration(slug);

  const { goToStep } = useExecutionStore();

  // Wrap goToStep to also broadcast the change to collaborators
  const handleStepChange = useCallback(
    (index: number) => {
      goToStep(index);
      broadcastStepChange(index);
    },
    [goToStep, broadcastStepChange],
  );

  return (
    <MonacoEditor
      onCodeChange={broadcastCode}
      onCursorChange={broadcastCursor}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────────────────────────
interface NavbarProps {
  onJoinSession: (slug: string) => void;
}

function Navbar({ onJoinSession }: NavbarProps) {
  const { runCode } = useExecution();
  const { isLoading, error } = useExecutionStore();
  const { slug } = useCollabStore();

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

      {/* Centre — session controls */}
      <div className="flex-1 flex justify-center">
        <SessionControls onJoin={onJoinSession} />
      </div>

      {/* Right — run button */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {error && (
          <span className="text-accent-red text-xs font-mono max-w-[200px] truncate">
            {error}
          </span>
        )}
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

// ─────────────────────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  usePlayback();

  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col bg-bg-primary font-ui overflow-hidden">
      <Navbar onJoinSession={setActiveSlug} />

      <div className="flex flex-1 overflow-hidden">
        {/* Editor — swaps to collab-aware version when in a session */}
        <div className="flex-[3] overflow-hidden border-r border-border-subtle">
          {activeSlug ? <CollabEditor slug={activeSlug} /> : <MonacoEditor />}
        </div>

        {/* Visualisation panels */}
        <div className="flex-[2] flex flex-col overflow-y-auto divide-y divide-border-subtle">
          <VariablesPanel />
          <CallStackPanel />
          <OutputPanel />
        </div>
      </div>

      <div className="h-16 flex-shrink-0">
        <StepControls />
      </div>
    </div>
  );
}
