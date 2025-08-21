// Flux SSE (Server-Sent Events) pour les notifications
import api from "./api";

let es = null;
let lastCb = null;

const BASE =
  (api?.defaults?.baseURL ? api.defaults.baseURL.replace(/\/+$/, "") : null) ||
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, "") : null) ||
  "http://localhost:8080";

export function startNotificationStream(onEvent) {
  // évite doublons
  if (es) {
    lastCb = onEvent;
    return es;
  }
  lastCb = onEvent;

  const token = localStorage.getItem("token") || "";
  const url = `${BASE}/api/notifications/stream?token=${encodeURIComponent(token)}`;

  es = new EventSource(url, { withCredentials: false });

  es.onmessage = (evt) => {
    try {
      const payload = JSON.parse(evt.data);
      if (typeof lastCb === "function") lastCb(payload);
    } catch {
      // payload texte simple fallback
      if (typeof lastCb === "function") lastCb({ type: "INFO", message: String(evt.data || "") });
    }
  };

  es.onerror = () => {
    // auto-retry simple
    stopNotificationStream();
    setTimeout(() => startNotificationStream(lastCb), 3000);
  };

  return es;
}

export function stopNotificationStream() {
  try { es?.close?.(); } catch {}
  es = null;
}
