import axios from "axios";
import type { ExecutionResult, Language } from "../types";

const api = axios.create({
  baseURL: "/api",
  timeout: 30_000,
  headers: { "Content-Type": "application/json; charset=UTF-8" },
});

export const executeCode = async (
  code: string,
  language: Language,
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
