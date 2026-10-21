import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "../api/client";
import type { User } from "../types";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  targetRole: string;
  academicYear: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<User>("/auth/me");
    setUser(data);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    refreshUser()
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login: AuthState["login"] = async (email, password, remember) => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/login", { email, password, remember });
    setToken(data.token, remember);
    setUser(data.user);
  };

  const register: AuthState["register"] = async (input) => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/register", input);
    setToken(data.token, false);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
        }
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}