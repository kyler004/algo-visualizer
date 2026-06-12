import { create } from "zustand";
import type { AuthUser, AuthTokens } from "../types";

const TOKEN_KEY = "algo_auth_tokens";

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;

  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (tokens) => {
    if (tokens) {
      // Persist so the user stays logged in after a page refresh
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ tokens });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, tokens: null, isAuthenticated: false });
  },
}));

export { TOKEN_KEY };
export default useAuthStore;
