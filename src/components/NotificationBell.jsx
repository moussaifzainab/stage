import React, { useEffect, useState, useRef } from "react";
import { fetchUnread, fetchList, markRead, markAllRead, clearAll, openSSE } from "../services/notifications";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const esRef = useRef(null);

  const refreshUnread = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const { data } = await fetchUnread();
      setCount(Array.isArray(data) ? data.length : 0);
    } catch {}
  };

  const refreshList = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const { data } = await fetchList();
      setItems(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) await refreshList();
  };

  const handleMarkAll = async () => {
    await markAllRead();
    await refreshUnread(); // badge -> 0
    await refreshList();   // la liste reste (juste grisée)
  };

  const handleClear = async () => {
  await clearAll();     // appelle l’API DELETE /notifications/clear
  setItems([]);         // vide la liste affichée
  setCount(0);          // remet le badge à 0
};


  const handleMarkOne = async (id) => {
    await markRead(id);
    await refreshUnread();
    setItems(prev => prev.map(n => n.id === id ? { ...n, readFlag: true } : n));
  };

  useEffect(() => {
    refreshUnread();
    const token = localStorage.getItem("token");
    if (token) {
      esRef.current = openSSE(token);
      esRef.current.onmessage = () => {
        refreshUnread();
        if (open) refreshList();
      };
      esRef.current.onerror = () => { esRef.current?.close(); esRef.current = null; };
    }
    return () => esRef.current?.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <button className="relative" onClick={handleToggle} title="notifications">
        🔔
        {count > 0 && (
          <span className="absolute -top-1 -right-1 text-xs bg-red-600 text-white rounded-full px-1">{count}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 rounded-md bg-white shadow">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <strong>Notifications</strong>
            <div className="space-x-3 text-sm">
              <button onClick={handleMarkAll} className="text-blue-600 hover:underline">Tout lu</button>
              <button onClick={handleClear}   className="text-red-600 hover:underline">Vider</button>
            </div>
          </div>

          <div className="max-h-96 overflow-auto divide-y">
            {items.length === 0 ? (
              <div className="p-4 text-gray-500">Aucune notification.</div>
            ) : items.map(n => (
              <div key={n.id} className="p-3 flex items-start gap-3">
                <div className={`w-2 h-2 mt-2 rounded-full ${n.readFlag ? "bg-gray-300" : "bg-green-500"}`} />
                <div className="flex-1">
                  <div className="text-sm">{n.message}</div>
                  <div className="text-xs text-gray-500">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </div>
                </div>
                {!n.readFlag && (
                  <button onClick={() => handleMarkOne(n.id)} className="text-xs text-blue-600 hover:underline">
                    Marquer lu
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
