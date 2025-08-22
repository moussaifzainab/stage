// src/pages/Parametres.jsx
import React, { useEffect, useRef, useState } from "react";
import ModernSidebarLayout from "../layouts/ModernSidebarLayout";
import { toast } from "react-toastify";
import api from "../services/api";

const KEY = "app.settings";
const PREFS_ENDPOINT = "/auth/notification-preferences";

export default function Parametres() {
  const [settings, setSettings] = useState({
    notifSound: true,
    autoRefresh: true,
    refreshInterval: 30, // secondes
    emailNotifications: true,
    language: "fr",
  });

  const [isLoading, setIsLoading] = useState(false);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    loadSettings();
    // cleanup à la sortie
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      window.removeEventListener("newNotification", playNotificationSound);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger paramètres (localStorage + backend)
  const loadSettings = async () => {
    try {
      // 1) localStorage
      const local = localStorage.getItem(KEY);
      if (local) {
        const parsed = JSON.parse(local);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }

      // 2) backend (ne JAMAIS rediriger si 401)
      try {
        const { data } = await api.get(PREFS_ENDPOINT, {
          skip401Redirect: true,
        });
        if (data && typeof data === "object") {
          setSettings((prev) => ({
            ...prev,
            emailNotifications:
              data.emailNotifications ?? prev.emailNotifications,
          }));
        }
      } catch {
        // Pas grave si pas connecté ou endpoint indisponible
        // On reste sur les valeurs locales.
      }
    } catch (e) {
      console.error("Erreur loadSettings:", e);
    }
  };

  // Sauvegarde (local + backend, sans redirection 401)
  const save = async (next) => {
    setIsLoading(true);
    try {
      // 1) local
      setSettings(next);
      localStorage.setItem(KEY, JSON.stringify(next));

      // 2) backend (ne JAMAIS rediriger si 401)
      try {
        await api.put(
          PREFS_ENDPOINT,
          {
            emailNotifications: next.emailNotifications,
            pushNotifications: true, // notifications temps réel (SSE)
            incidentCreation: true,
            statusChanges: true,
            closures: true,
            assignments: true,
          },
          {
            skip401Redirect: true,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (e) {
        // On log sans perturber l’UX
        console.warn("Prefs serveur non sauvegardées (non connecté ?)", e);
      }

      // 3) appliquer instantanément
      applySettings(next);
      toast.success("Paramètres sauvegardés avec succès !");
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  // Appliquer immédiatement (son + auto-refresh)
  const applySettings = (cfg) => {
    // Auto-refresh
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (cfg.autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        const ev = new CustomEvent("autoRefresh", {
          detail: { interval: cfg.refreshInterval },
        });
        window.dispatchEvent(ev);
      }, cfg.refreshInterval * 1000);
    }

    // Son de notif
    if (cfg.notifSound) {
      window.addEventListener("newNotification", playNotificationSound);
    } else {
      window.removeEventListener("newNotification", playNotificationSound);
    }
  };

  // Son simple (Web Audio API)
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // silencieux si non supporté
    }
  };

  const testNotificationSound = () => {
    if (settings.notifSound) {
      playNotificationSound();
      toast.info("🔊 Son de notification testé !");
    } else {
      toast.info("Son de notification désactivé");
    }
  };

  const resetToDefaults = () => {
    const defaults = {
      notifSound: true,
      autoRefresh: true,
      refreshInterval: 30,
      emailNotifications: true,
      language: "fr",
    };
    save(defaults);
  };

  // Re-appliquer si certains paramètres changent depuis l’UI
  useEffect(() => {
    applySettings(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoRefresh, settings.refreshInterval, settings.notifSound]);

  return (
    <ModernSidebarLayout>
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg px-8 py-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">⚙️</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold mt-2">Paramètres</h1>
        <p className="text-purple-100 mt-1">
          Configurez votre expérience utilisateur
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🔔</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Toggle
                label="Son de notification"
                description="Émettre un son lors des nouvelles notifications"
                checked={settings.notifSound}
                onChange={(v) => save({ ...settings, notifSound: v })}
                icon="🔊"
              />
              <button
                onClick={testNotificationSound}
                className="ml-3 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Tester
              </button>
            </div>

            <Toggle
              label="Notifications par email"
              description="Recevoir les alertes importantes par email"
              checked={settings.emailNotifications}
              onChange={(v) => save({ ...settings, emailNotifications: v })}
              icon="📧"
            />
          </div>
        </div>

        {/* Auto-refresh */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🔄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Actualisation automatique
              </h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <Toggle
              label="Auto-refresh des données"
              description="Actualiser automatiquement les tableaux d'incidents"
              checked={settings.autoRefresh}
              onChange={(v) => save({ ...settings, autoRefresh: v })}
              icon="🔄"
            />

            {settings.autoRefresh && (
              <div className="ml-8 pl-4 border-l-2 border-emerald-200">
                <SliderField
                  label="Intervalle de rafraîchissement"
                  value={settings.refreshInterval}
                  onChange={(v) => save({ ...settings, refreshInterval: v })}
                  min={10}
                  max={300}
                  step={10}
                  unit="secondes"
                  description={`Actualisation toutes les ${settings.refreshInterval} secondes`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Langue */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🌍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Préférences linguistiques
              </h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <SelectField
              label="Langue de l'interface"
              value={settings.language}
              onChange={(v) => save({ ...settings, language: v })}
              options={[
                { value: "fr", label: "🇫🇷 Français" },
                { value: "en", label: "🇺🇸 English (bientôt)" },
                { value: "ar", label: "🇲🇦 العربية (bientôt)" },
              ]}
            />

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-orange-500 text-lg mt-0.5">ℹ️</span>
                <div>
                  <p className="text-sm font-medium text-orange-800">Note</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Seul le français est actuellement disponible. D'autres
                    langues seront ajoutées prochainement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🔧</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Actions</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={resetToDefaults}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">🔄</span>
              <span className="font-medium text-gray-700">
                {isLoading ? "Réinitialisation..." : "Réinitialiser aux valeurs par défaut"}
              </span>
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-lg mt-0.5">💾</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Sauvegarde automatique
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Vos paramètres sont sauvegardés automatiquement à chaque
                    modification.
                  </p>
                </div>
              </div>
            </div>

            {settings.autoRefresh && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-lg mt-0.5">✅</span>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Auto-refresh actif
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Les données se rafraîchissent automatiquement toutes les{" "}
                      {settings.refreshInterval} secondes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModernSidebarLayout>
  );
}

/* ---------- UI helpers ---------- */

function Toggle({ label, description, checked, onChange, icon, disabled = false }) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
        checked ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-blue-300"}`}
    >
      <div className="flex items-start gap-3 flex-1">
        <span className="text-xl mt-0.5">{icon}</span>
        <div className="flex-1">
          <div className="font-medium text-gray-800">{label}</div>
          {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
        </div>
      </div>

      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`w-11 h-6 rounded-full peer transition-colors duration-200 ${
            checked ? "bg-blue-500" : "bg-gray-300"
          } peer-focus:ring-4 peer-focus:ring-blue-300 peer-disabled:opacity-50`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
              checked ? "translate-x-5" : "translate-x-0"
            } absolute top-0.5 left-0.5`}
          ></div>
        </div>
      </label>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors duration-200 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, unit, description }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-blue-600">
          {value} {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
        }}
      />

      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>

      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
}
