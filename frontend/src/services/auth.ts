import api from "./api";
import type { AuthUser, AuthTokens, SavedSession } from "../types";

// ── Auth ──────────────────────────────────────────────────────────────────────

interface LoginResponse {
  access: string;
  refresh: string;
}

interface RegisterResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export const login = async (
  username: string,
  password: string,
): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login/", {
    username,
    password,
  });
  return data;
};

export const register = async (
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> => {
  const { data } = await api.post<RegisterResponse>("/auth/register/", {
    username,
    email,
    password,
  });
  return data;
};

export const getProfile = async (): Promise<AuthUser> => {
  const { data } = await api.get<AuthUser>("/auth/profile/");
  return data;
};

// ── Saved sessions ────────────────────────────────────────────────────────────

export const getSavedSessions = async (): Promise<SavedSession[]> => {
  const { data } = await api.get<SavedSession[]>("/sessions/saved/");
  return data;
};

export const getSavedSession = async (id: string): Promise<SavedSession> => {
  const { data } = await api.get<SavedSession>(`/sessions/saved/${id}/`);
  return data;
};

export const saveCurrentSession = async (
  title: string,
  code: string,
  language: string,
): Promise<{ id: string; title: string }> => {
  const { data } = await api.post("/sessions/saved/", {
    title,
    code,
    language,
  });
  return data;
};

export const deleteSavedSession = async (id: string): Promise<void> => {
  await api.delete(`/sessions/saved/${id}/`);
};
