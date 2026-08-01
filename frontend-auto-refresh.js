/**
 * Auto-refresh helper for the EazySync frontend (axios-based).
 *
 * Drop this file into your frontend and wire it to your axios instance:
 *
 *   import axios from "axios";
 *   import { setupAutoRefresh } from "./frontend-auto-refresh.js";
 *
 *   const api = axios.create({ baseURL: "http://localhost:5000/api/v1" });
 *
 *   setupAutoRefresh(api, {
 *     refreshUrl: "/auth/refresh",
 *     onLogout: () => (window.location.href = "/login"),
 *   });
 *
 * Behavior:
 *  - Attaches `Authorization: Bearer <accessToken>` to every request.
 *  - On a 401 TOKEN_EXPIRED, calls POST /auth/refresh once (concurrent
 *    401s share the same refresh call), stores the rotated tokens, and
 *    retries the original request.
 *  - If refresh fails, clears tokens and calls onLogout().
 *
 * All storage/URL options are configurable so it works regardless of how
 * the frontend keeps tokens (localStorage, cookies, in-memory, etc.).
 */
export function setupAutoRefresh(api, config = {}) {
  const {
    refreshUrl = "/auth/refresh",
    getAccessToken = () => localStorage.getItem("accessToken"),
    getRefreshToken = () => localStorage.getItem("refreshToken"),
    setTokens = (accessToken, refreshToken) => {
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    },
    clearTokens = () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    onLogout = () => {
      window.location.href = "/login";
    },
  } = config;

  let refreshing = null;

  const refreshTokens = () => {
    if (!refreshing) {
      refreshing = (async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token available");
        const res = await api.post(refreshUrl, { refreshToken });
        setTokens(res.data.accessToken, res.data.refreshToken);
        return res.data.accessToken;
      })().finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  };

  api.interceptors.request.use((reqConfig) => {
    const token = getAccessToken();
    if (token) reqConfig.headers.Authorization = `Bearer ${token}`;
    return reqConfig;
  });

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      const url = original?.url ?? "";
      const isAuthEndpoint = url.includes("/auth/login") || url === refreshUrl;

      if (error.response?.status === 401 && !isAuthEndpoint && !original?._retried) {
        try {
          original._retried = true;
          await refreshTokens();
          original.headers.Authorization = `Bearer ${getAccessToken()}`;
          return api(original);
        } catch (refreshError) {
          clearTokens();
          onLogout();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return { refresh: refreshTokens };
}
