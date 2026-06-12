import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../../hooks/useAuth";

type Tab = "login" | "register";

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, register, isLoading, error, clearError } = useAuth();

  const switchTab = (t: Tab) => {
    setTab(t);
    clearError();
    setEmail("");
  };

  const handleSubmit = async () => {
    const success =
      tab === "login"
        ? await login(username, password)
        : await register(username, email, password);
    if (success) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
      flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18 }}
        className="bg-bg-panel border border-border-subtle rounded-xl
          p-6 w-full max-w-sm shadow-2xl"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 bg-accent-blue rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
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
          <span className="font-semibold text-text-primary">AlgoViz</span>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-bg-hover rounded-lg p-1 mb-5">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors capitalize font-medium
                ${
                  tab === t
                    ? "bg-bg-panel text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
            >
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              className="w-full bg-bg-hover border border-border-subtle rounded-lg
                px-3 py-2 text-sm text-text-primary placeholder-text-secondary
                outline-none focus:border-accent-blue/60 transition-colors"
            />
          </div>

          <AnimatePresence>
            {tab === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <label className="text-xs text-text-secondary block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-hover border border-border-subtle rounded-lg
                    px-3 py-2 text-sm text-text-primary placeholder-text-secondary
                    outline-none focus:border-accent-blue/60 transition-colors"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-xs text-text-secondary block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-bg-hover border border-border-subtle rounded-lg
                px-3 py-2 text-sm text-text-primary placeholder-text-secondary
                outline-none focus:border-accent-blue/60 transition-colors"
            />
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-accent-red text-xs mt-3"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !username || !password}
          className="w-full mt-4 py-2.5 bg-accent-blue hover:bg-blue-400
            disabled:opacity-40 disabled:cursor-not-allowed
            text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading
            ? "Please wait…"
            : tab === "login"
              ? "Sign In"
              : "Create Account"}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 text-text-secondary text-sm
            hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
