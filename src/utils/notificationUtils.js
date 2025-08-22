// src/utils/notificationUtils.js

/**
 * Déclenche une notification sonore si activée dans les paramètres
 */
export const triggerNotificationSound = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('app.settings') || '{}');
    if (settings.notifSound) {
      // Déclencher l'événement pour que les paramètres jouent le son
      const event = new CustomEvent('newNotification', { 
        detail: { timestamp: Date.now() } 
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Erreur lors du déclenchement du son de notification:', error);
  }
};

/**
 * Vérifie si les notifications par email sont activées
 */
export const isEmailNotificationEnabled = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('app.settings') || '{}');
    return settings.emailNotifications !== false; // true par défaut
  } catch (error) {
    return true; // Par défaut, les notifications email sont activées
  }
};

/**
 * Vérifie si l'auto-refresh est activé
 */
export const isAutoRefreshEnabled = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('app.settings') || '{}');
    return settings.autoRefresh !== false; // true par défaut
  } catch (error) {
    return true; // Par défaut, l'auto-refresh est activé
  }
};

/**
 * Récupère l'intervalle d'auto-refresh en secondes
 */
export const getAutoRefreshInterval = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('app.settings') || '{}');
    return settings.refreshInterval || 30; // 30 secondes par défaut
  } catch (error) {
    return 30;
  }
};

export default {
  triggerNotificationSound,
  isEmailNotificationEnabled,
  isAutoRefreshEnabled,
  getAutoRefreshInterval
};