// src/hooks/useAutoRefresh.js
import { useEffect, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer l'auto-refresh des données
 * @param {Function} refreshFunction - Fonction à appeler pour rafraîchir les données
 * @param {Array} dependencies - Dépendances pour le hook (optionnel)
 */
export const useAutoRefresh = (refreshFunction, dependencies = []) => {
  const handleAutoRefresh = useCallback((event) => {
    // Vérifier si l'auto-refresh est activé dans les paramètres
    try {
      const settings = JSON.parse(localStorage.getItem('app.settings') || '{}');
      if (settings.autoRefresh && typeof refreshFunction === 'function') {
        console.log(`🔄 Auto-refresh déclenché (interval: ${event.detail?.interval || 'unknown'}s)`);
        refreshFunction();
      }
    } catch (error) {
      console.error('Erreur lors de l\'auto-refresh:', error);
    }
  }, [refreshFunction, ...dependencies]);

  useEffect(() => {
    // Écouter l'événement d'auto-refresh
    window.addEventListener('autoRefresh', handleAutoRefresh);
    
    return () => {
      window.removeEventListener('autoRefresh', handleAutoRefresh);
    };
  }, [handleAutoRefresh]);
};

export default useAutoRefresh;