import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSavedSessions,
  getSavedSession,
  saveCurrentSession,
  deleteSavedSession,
} from "../../services/auth";
import useExecutionStore from "../../store/executionStore";
import type { SavedSession } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionHistory({ isOpen, onClose }: Props) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { code, language, setCode } = useExecutionStore();

  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      setSessions(await getSavedSessions());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) return;
    setIsSaving(true);
    try {
      await saveCurrentSession(saveTitle.trim(), code, language);
      setSaveTitle("");
      setFeedback("Saved!");
      await fetchSessions();
      setTimeout(() => setFeedback(null), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (id: string) => {
    const session = await getSavedSession(id);
    if (session.code) {
      setCode(session.code);
      onClose();
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSavedSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative w-80 h-full bg-bg-panel border-l border-border-subtle
              flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3.5
              border-b border-border-subtle flex-shrink-0"
            >
              <h2 className="font-semibold text-text-primary text-sm">
                Session History
              </h2>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors p-1"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M2 2l10 10M12 2L2 12" />
                </svg>
              </button>
            </div>

            {/* Save current snippet */}
            <div className="px-4 py-3.5 border-b border-border-subtle flex-shrink-0">
              <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-2">
                Save Current Code
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Give it a title…"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="flex-1 bg-bg-hover border border-border-subtle rounded-lg
                    px-3 py-1.5 text-xs text-text-primary placeholder-text-secondary
                    outline-none focus:border-accent-blue/50 transition-colors"
                />
                <button
                  onClick={handleSave}
                  disabled={!saveTitle.trim() || isSaving}
                  className="px-3 py-1.5 bg-accent-blue/15 text-accent-blue text-xs rounded-lg
                    hover:bg-accent-blue/25 disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  {isSaving ? "…" : (feedback ?? "Save")}
                </button>
              </div>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {isLoading ? (
                <p className="text-text-secondary text-sm text-center py-8">
                  Loading…
                </p>
              ) : sessions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-text-secondary text-sm">
                    No saved sessions yet.
                  </p>
                  <p className="text-text-secondary text-xs mt-1 opacity-60">
                    Save your first snippet above.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.15 }}
                      className="bg-bg-hover rounded-lg p-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-primary font-medium truncate">
                            {session.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[10px] text-text-secondary font-mono
                              bg-bg-primary/60 px-1.5 py-0.5 rounded"
                            >
                              {session.language}
                            </span>
                            <span className="text-[10px] text-text-secondary">
                              {formatDate(session.updated_at)}
                            </span>
                          </div>
                          {session.code_preview && (
                            <p
                              className="text-[10px] font-mono text-text-secondary
                              mt-1.5 line-clamp-2 opacity-50 leading-relaxed"
                            >
                              {session.code_preview}
                            </p>
                          )}
                        </div>

                        {/* Actions — visible on hover */}
                        <div
                          className="flex items-center gap-1 flex-shrink-0
                          opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <button
                            onClick={() => handleLoad(session.id)}
                            title="Load into editor"
                            className="p-1.5 rounded text-accent-blue hover:bg-accent-blue/10
                              transition-colors"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            >
                              <path d="M2 6h8M7 2l3 4-3 4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            title="Delete"
                            className="p-1.5 rounded text-accent-red hover:bg-accent-red/10
                              transition-colors"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="currentColor"
                            >
                              <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3l.5-7H4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
