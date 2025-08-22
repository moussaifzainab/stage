// src/services/api.js
import axios from "axios";

/* ------------ Base URL ------------ */
const BASE_URL =
  (import.meta?.env?.VITE_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080/api");

/* ------------ Token helpers ------------ */
// On stocke TOUJOURS le token BRUT (sans "Bearer ")
export const setToken = (tokenRaw) => {
  if (!tokenRaw) {
    localStorage.removeItem("token");
    return;
  }
  const clean = String(tokenRaw).replace(/^Bearer\s+/i, "");
  localStorage.setItem("token", clean);
};

export const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("roles");
};

export const getTokenRaw = () => localStorage.getItem("token") || "";

export const getBearer = () => {
  const raw = getTokenRaw();
  return raw ? `Bearer ${raw}` : "";
};

// Pour SSE (on envoie le JWT brut en query string)
export const getSseQueryToken = () => getTokenRaw();

/* ------------ Axios instance ------------ */
const api = axios.create({ baseURL: BASE_URL });

/* Injecte Authorization sauf si config.skipAuth === true */
api.interceptors.request.use((config) => {
  if (config.skipAuth) return config;

  const bearer = getBearer();
  config.headers = config.headers || {};
  if (bearer) {
    config.headers.Authorization = bearer;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const url = String(err?.config?.url || "");
    const skip401 = !!err?.config?.skip401Redirect; // ⬅️ NOUVEAU

    const isNotifEndpoint =
      url.includes("/notifications/unread") ||
      url.includes("/notifications/list") ||
      url.includes("/notifications/read") ||
      url.includes("/notifications/clear") ||
      url.includes("/notifications/stream");

    const isOnLoginPage = window.location.pathname === "/login";
    const isNavigationRequest = !url;

    // Rediriger vers /login UNIQUEMENT si on n'a pas demandé de skip
    if (status === 401 && !skip401 && !isOnLoginPage && !isNotifEndpoint && !isNavigationRequest) {
      clearToken();
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 100);
    }
    return Promise.reject(err);
  }
);


export default api;