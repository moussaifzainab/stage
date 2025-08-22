// src/pages/Parametres.jsx
import React, { useEffect, useState } from "react";
import ModernSidebarLayout from "../layouts/ModernSidebarLayout";
import { toast } from "react-toastify";

const KEY = "app.settings";

export default function Parametres() {
  const [settings, setSettings] = useState({ 
    notifSound: true, 
    darkMode: false, 
    autoRefresh: true,
    emailNotifications: true,
    language: 'fr',
    timezone: 'Europe/Paris'
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings(JSON.parse(raw));
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  }, []);

  const save = async (nextSettings) => {
    setIsLoading(true);
    try {
      setSettings(nextSettings);
      localStorage.setItem(KEY, JSON.stringify(nextSettings));
      toast.success("Paramètres sauvegardés avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    const defaults = { 
      notifSound: true, 
      darkMode: false, 
      autoRefresh: true,
      emailNotifications: true,
      language: 'fr',
      timezone: 'Europe/Paris'
    };
    save(defaults);
  };

  return (
    <ModernSidebarLayout>
      {/* En-tête avec gradient */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg px-8 py-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Paramètres</h1>
            <p className="text-purple-100 mt-1">Personnalisez votre expérience utilisateur</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Notifications */}
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
            <Toggle 
              label="Son de notification" 
              description="Émettre un son lors des nouvelles notifications"
              checked={settings.notifSound} 
              onChange={(v) => save({ ...settings, notifSound: v })}
              icon="🔊"
            />
            <Toggle 
              label="Notifications par email" 
              description="Recevoir les alertes importantes par email"
              checked={settings.emailNotifications} 
              onChange={(v) => save({ ...settings, emailNotifications: v })}
              icon="📧"
            />
          </div>
        </div>

        {/* Section Interface */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Interface</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <Toggle 
              label="Mode sombre" 
              description="Activer le thème sombre (bientôt disponible)"
              checked={settings.darkMode} 
              onChange={(v) => save({ ...settings, darkMode: v })}
              icon="🌙"
              disabled={true}
            />
            <Toggle 
              label="Auto-refresh des tableaux" 
              description="Actualiser automatiquement les données"
              checked={settings.autoRefresh} 
              onChange={(v) => save({ ...settings, autoRefresh: v })}
              icon="🔄"
            />
          </div>
        </div>

        {/* Section Langue et Région */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🌍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Langue et Région</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <SelectField
              label="Langue"
              value={settings.language}
              onChange={(v) => save({ ...settings, language: v })}
              options={[
                { value: 'fr', label: '🇫🇷 Français' },
                { value: 'en', label: '🇺🇸 English' },
                { value: 'es', label: '🇪🇸 Español' }
              ]}
            />
            <SelectField
              label="Fuseau horaire"
              value={settings.timezone}
              onChange={(v) => save({ ...settings, timezone: v })}
              options={[
                { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' },
                { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
                { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' }
              ]}
            />
          </div>
        </div>

        {/* Section Actions */}
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
                {isLoading ? 'Réinitialisation...' : 'Réinitialiser aux valeurs par défaut'}
              </span>
            </button>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">Information</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Les paramètres sont sauvegardés localement dans votre navigateur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModernSidebarLayout>
  );
}

function Toggle({ label, description, checked, onChange, icon, disabled = false }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
      checked 
        ? 'border-blue-200 bg-blue-50' 
        : 'border-gray-200 bg-gray-50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}`}>
      <div className="flex items-start gap-3 flex-1">
        <span className="text-xl mt-0.5">{icon}</span>
        <div className="flex-1">
          <div className="font-medium text-gray-800">{label}</div>
          {description && (
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          )}
        </div>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={checked} 
          onChange={e => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={`w-11 h-6 rounded-full peer transition-colors duration-200 ${
          checked ? 'bg-blue-500' : 'bg-gray-300'
        } peer-focus:ring-4 peer-focus:ring-blue-300 peer-disabled:opacity-50`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          } absolute top-0.5 left-0.5`}></div>
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
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}