import api, { getSseQueryToken } from "./api";

export const fetchUnread = () => api.get("/notifications/unread");   // BADGE
export const fetchList   = () => api.get("/notifications/list");     // PANNEAU
export const markRead    = (id) => api.put(`/notifications/${id}/read`);
export const markAllRead = () => api.put(`/notifications/read-all`); // Tout lu
export const clearAll = () => api.delete("/notifications/clear");

export const openSSE = () => {
  const t = getSseQueryToken(); // <- brut, sans "Bearer "
  return new EventSource(`${api.defaults.baseURL}/notifications/stream?token=${encodeURIComponent(t)}`);
};
