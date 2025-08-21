import React, { createContext, useEffect, useRef, useState } from "react";
import { fetchUnread, openSSE } from "../services/notifications";

export const NotificationsContext = createContext({ count: 0, refreshUnread: () => {} });

export function NotificationsProvider({ children }) {
  const [count, setCount] = useState(0);
  const esRef = useRef(null);

  const refreshUnread = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const { data } = await fetchUnread();
      setCount(Array.isArray(data) ? data.length : 0);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    refreshUnread();

    esRef.current = openSSE(token);
    esRef.current.onmessage = () => refreshUnread();
    esRef.current.onerror   = () => { esRef.current?.close(); esRef.current = null; };

    return () => esRef.current?.close();
  }, []);

  return (
    <NotificationsContext.Provider value={{ count, refreshUnread }}>
      {children}
    </NotificationsContext.Provider>
  );
}
