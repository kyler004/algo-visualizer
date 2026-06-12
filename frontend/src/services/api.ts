import axios, { type AxiosError } from "axios";
import type { ExecutionResult, Language } from "../types";

const api = axios.create({
  baseURL: "/api",
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach access token to every request ─────────────────

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("algo_auth_tokens");
  if (raw) {
    const tokens = JSON.parse(raw) as { access: string };
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────

// We need this flag to avoid infinite retry loops
interface RetryConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (typeof error.config & RetryConfig)
      | undefined;
    const is401 = error.response?.status === 401;
    const notRetry = !original?._retry;

    if (is401 && notRetry && original) {
      original._retry = true;

      try {
        const raw = localStorage.getItem("algo_auth_tokens");
        if (!raw) throw new Error("No tokens");

        const { refresh } = JSON.parse(raw) as { refresh: string };
        const { data } = await api.post<{ access: string }>("/auth/refresh/", {
          refresh,
        });

        // Update stored tokens with the new access token
        const stored = JSON.parse(raw);
        const updated = { ...stored, access: data.access };
        localStorage.setItem("algo_auth_tokens", JSON.stringify(updated));

        // Retry the original request with the new token
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        // Refresh token is expired — force logout
        localStorage.removeItem("algo_auth_tokens");
        window.dispatchEvent(new Event("auth:logout"));
      }
    }

    return Promise.reject(error);
  },
);

// ── API calls ─────────────────────────────────────────────────────────────────

export const executeCode = async (
  code: string,
  language: Language = "python",
): Promise<ExecutionResult> => {
  const { data } = await api.post<ExecutionResult>("/execute/", {
    code,
    language,
  });
  return data;
};

export interface SessionResponse {
  slug: string;
  code?: string;
  language?: string;
}

export const createSession = async (): Promise<SessionResponse> => {
  const { data } = await api.post<SessionResponse>("/sessions/");
  return data;
};

export const getSession = async (slug: string): Promise<SessionResponse> => {
  const { data } = await api.get<SessionResponse>(`/sessions/${slug}/`);
  return data;
};

export default api;
