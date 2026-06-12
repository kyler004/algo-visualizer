import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore, { TOKEN_KEY } from "../store/authStore";
import { login, register, getProfile } from "../services/auth";

export default function useAuth() {
  const { user, tokens, isAuthenticated, setUser, setTokens, logout } =
    useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Restore session on page refresh ──────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw || user) return;

    const stored = JSON.parse(raw) as { access: string; refresh: string };
    setTokens(stored);

    // Validate the stored token is still good by hitting /profile/
    getProfile()
      .then(setUser)
      .catch(() => {
        // Token is expired or invalid — clean up
        setTokens(null);
        setUser(null);
      });
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Listen for the logout event dispatched by the Axios interceptor ──
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [logout]);

  // ── Login ─────────────────────────────────────────────────────────
  const handleLogin = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await login(username, password);
      const newTokens = { access: data.access, refresh: data.refresh };
      setTokens(newTokens);
      const profile = await getProfile();
      setUser(profile);
      return true;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Login failed. Please try again.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────
  const handleRegister = async (
    username: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await register(username, email, password);
      setTokens(data.tokens);
      setUser(data.user);
      return true;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data as
          | Record<string, string[]>
          | undefined;
        const first = detail && Object.values(detail)[0]?.[0];
        setError(first ?? "Registration failed.");
      } else {
        setError("Registration failed. Please try again.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout,
    clearError: () => setError(null),
  };
}
