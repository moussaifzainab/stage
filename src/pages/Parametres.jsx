// src/pages/Parametres.jsx
import React, { useEffect, useState } from "react";
import ModernSidebarLayout from "../layouts/ModernSidebarLayout";
import { toast } from "react-toastify";
import api from "../services/api";

const KEY = "app.settings";

export default function Parametres() {
  const [settings, setSettings] = useState({ 
    notifSound: true, 
    autoRefresh: true,
    refreshInterval: 30, // secondes
    emailNotifications: true,
    language: 'fr'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [refreshTimer, setRefreshTimer] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Chargement des paramètres depuis localStorage ET backend
  const loadSettings = async () => {
    try {
      // 1. Charger depuis localStorage
      const localSettings = localStorage.getItem(KEY);
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }

      // 2. Charger les préférences de notifications depuis le backend
      try {
        const response = await api.get("/auth/notification-preferences");
        if (response.data) {
          setSettings(prev => ({
            ...prev,
            emailNotifications: response.data.emailNotifications ?? prev.emailNotifications
          }));
        }
      } catch (error) {
        console.log('Pas de préférences notifications sauvegardées côté serveur');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  // Sauvegarde des paramètres
  const save = async (nextSettings) => {
    setIsLoading(true);
    try {
      // 1. Sauvegarder en local
      setSettings(nextSettings);
      localStorage.setItem(KEY, JSON.stringify(nextSettings));

      // 2. Sauvegarder les préférences de notifications côté serveur
      try {
        await api.put("/auth/notification-preferences", {
          emailNotifications: nextSettings.emailNotifications,
          pushNotifications: true, // Toujours activé pour les notifications en temps réel
          incidentCreation: true,
          statusChanges: true,
          closures: true,
          assignments: true
        });
      } catch (error) {
        console.error('Erreur sauvegarde préférences serveur:', error);
      }

      // 3. Appliquer immédiatement les paramètres
      applySettings(nextSettings);
      
      toast.success("Paramètres sauvegardés avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Appliquer les paramètres immédiatement
  const applySettings = (newSettings) => {
    // Gestion de l'auto-refresh
    if (refreshTimer) {
      clearInterval(refreshTimer);
      setRefreshTimer(null);
    }

    if (newSettings.autoRefresh) {
      const interval = setInterval(() => {
        // Actualiser les données si on est sur une page qui le supporte
        const event = new CustomEvent('autoRefresh', { 
          detail: { interval: newSettings.refreshInterval } 
        });
        window.dispatchEvent(event);
      }, newSettings.refreshInterval * 1000);
      
      setRefreshTimer(interval);
    }

    // Son de notification
    if (newSettings.notifSound) {
      // Écouter les nouvelles notifications pour jouer un son
      window.addEventListener('newNotification', playNotificationSound);
    } else {
      window.removeEventListener('newNotification', playNotificationSound);
    }
  };

  // Jouer le son de notification
  const playNotificationSound = () => {
    // Créer un son simple avec Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Son de notification non supporté');
    }
  };

  // Test du son de notification
  const testNotificationSound = () => {
    if (settings.notifSound) {
      playNotificationSound();
      toast.info("🔊 Son de notification testé !");
    } else {
      toast.info("Son de notification désactivé");
    }
  };

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = () => {
    const defaults = { 
      notifSound: true, 
      autoRefresh: true,
      refreshInterval: 30,
      emailNotifications: true,
      language: 'fr'
    };
    save(defaults);
  };

  // Nettoyage à la fermeture du composant
  useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
      window.removeEventListener('newNotification', playNotificationSound);
    };
  }, [refreshTimer]);

  // Appliquer les paramètres au chargement
  useEffect(() => {
    applySettings(settings);
  }, [settings.autoRefresh, settings.refreshInterval, settings.notifSound]);

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
            <p className="text-purple-100 mt-1">Configurez votre expérience utilisateur</p>
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

        {/* Section Interface et Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🔄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Actualisation automatique</h3>
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

        {/* Section Langue */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🌍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Préférences linguistiques</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <SelectField
              label="Langue de l'interface"
              value={settings.language}
              onChange={(v) => save({ ...settings, language: v })}
              options={[
                { value: 'fr', label: '🇫🇷 Français' },
                { value: 'en', label: '🇺🇸 English (bientôt)' },
                { value: 'ar', label: '🇲🇦 العربية (bientôt)' }
              ]}
            />
            
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-orange-500 text-lg mt-0.5">ℹ️</span>
                <div>
                  <p className="text-sm font-medium text-orange-800">Note</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Seul le français est actuellement disponible. D'autres langues seront ajoutées prochainement.
                  </p>
                </div>
              </div>
            </div>
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
                <span className="text-blue-500 text-lg mt-0.5">💾</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">Sauvegarde automatique</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Vos paramètres sont sauvegardés automatiquement à chaque modification.
                  </p>
                </div>
              </div>
            </div>

            {/* Statut de l'auto-refresh */}
            {settings.autoRefresh && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-lg mt-0.5">✅</span>
                  <div>
                    <p className="text-sm font-medium text-green-800">Auto-refresh actif</p>
                    <p className="text-xs text-green-600 mt-1">
                      Les données se rafraîchissent automatiquement toutes les {settings.refreshInterval} secondes.
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

function SliderField({ label, value, onChange, min, max, step, unit, description }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-blue-600">{value} {unit}</span>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
        }}
      />
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}