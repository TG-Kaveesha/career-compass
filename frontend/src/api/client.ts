import axios from "axios";

const TOKEN_KEY = "cc_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};
export const setToken = (token: string, remember: boolean) => {
  clearToken();
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
};

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && getToken() && window.location.pathname !== "/auth") {
      clearToken();
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

export interface ApiErrorInfo {
  message: string;
  fields: Record<string, string>;
}
export function parseError(err: unknown): ApiErrorInfo {
  if (axios.isAxiosError(err)) {
    if (!err.response) return { message: "Cannot reach the server. Check your connection.", fields: {} };
    return {
      message: err.response.data?.message ?? "Something went wrong",
      fields: err.response.data?.errors ?? {},
    };
  }
  return { message: "Something went wrong", fields: {} };
}