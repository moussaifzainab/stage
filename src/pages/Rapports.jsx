// src/pages/Rapports.jsx
import React, { useEffect, useState } from "react";
import ModernSidebarLayout from "../layouts/ModernSidebarLayout";
import { getKpis } from "../services/incidents";
import { exportToPDF, exportToExcel } from "../services/exportUtils";
import { toast } from "react-toastify";

export default function Rapports() {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKpis();
  }, []);

  const loadKpis = async () => {
    try {
      setLoading(true);
      const data = await getKpis();
      setKpi(data);
      toast.success("Données des rapports chargées");
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
      toast.error("Erreur lors du chargement des données");
      setKpi(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ModernSidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des rapports...</p>
          </div>
        </div>
      </ModernSidebarLayout>
    );
  }

  if (!kpi) {
    return (
      <ModernSidebarLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Données indisponibles</h3>
          <p className="text-red-600 mb-4">Impossible de charger les données des rapports.</p>
          <button
            onClick={loadKpis}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </ModernSidebarLayout>
    );
  }

  const tauxResolution = kpi.total > 0 ? Math.round((kpi.resolus / kpi.total) * 100) : 0;
  const tauxNonResolus = kpi.total > 0 ? Math.round((kpi.nonResolus / kpi.total) * 100) : 0;

  return (
    <ModernSidebarLayout>
      {/* En-tête avec gradient - SANS période */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-2xl shadow-lg px-8 py-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Rapports et Analytiques</h1>
            <p className="text-emerald-100 mt-1">Vue d'ensemble des performances et métriques</p>
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Incidents totaux"
          value={kpi.total ?? 0}
          icon="📈"
          color="blue"
          trend="+12%"
          description="vs période précédente"
        />
        <MetricCard
          title="Incidents résolus"
          value={kpi.resolus ?? 0}
          icon="✅"
          color="emerald"
          trend="+8%"
          description={`${tauxResolution}% du total`}
        />
        <MetricCard
          title="Non résolus"
          value={kpi.nonResolus ?? 0}
          icon="⏳"
          color="orange"
          trend="-5%"
          description={`${tauxNonResolus}% du total`}
        />
        <MetricCard
          title="Délai moyen"
          value={`${(kpi.delaiMoyenResolutionJours ?? 0).toFixed(1)} j`}
          icon="⏰"
          color="purple"
          trend="-15%"
          description="temps de résolution"
        />
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique de performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Performance de résolution</h3>
            <span className="text-2xl">📊</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taux de résolution</span>
              <span className="font-semibold text-emerald-600">{tauxResolution}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${tauxResolution}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Incidents en attente</span>
              <span className="font-semibold text-orange-600">{tauxNonResolus}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${tauxNonResolus}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Alertes et recommandations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Alertes et recommandations</h3>
            <span className="text-2xl">💡</span>
          </div>
          
          <div className="space-y-3">
            {tauxResolution < 70 && (
              <Alert
                type="warning"
                title="Taux de résolution faible"
                message="Le taux de résolution est inférieur à 70%. Considérez l'augmentation des ressources."
              />
            )}
            
            {kpi.delaiMoyenResolutionJours > 5 && (
              <Alert
                type="error"
                title="Délai de résolution élevé"
                message="Le délai moyen dépasse 5 jours. Optimisation du processus recommandée."
              />
            )}
            
            {tauxResolution >= 85 && (
              <Alert
                type="success"
                title="Excellente performance"
                message="Taux de résolution élevé ! Continuez sur cette lancée."
              />
            )}
          </div>
        </div>
      </div>

      {/* Résumé détaillé */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Résumé exécutif
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-2">Volume d'activité</h4>
            <p className="text-sm text-blue-600">
              {kpi.total} incidents traités au cours de la période sélectionnée.
            </p>
          </div>
          
          <div className="bg-emerald-50 rounded-xl p-4">
            <h4 className="font-medium text-emerald-800 mb-2">Efficacité</h4>
            <p className="text-sm text-emerald-600">
              {tauxResolution}% des incidents ont été résolus avec succès.
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4">
            <h4 className="font-medium text-purple-800 mb-2">Réactivité</h4>
            <p className="text-sm text-purple-600">
              Délai moyen de résolution de {(kpi.delaiMoyenResolutionJours ?? 0).toFixed(1)} jours.
            </p>
          </div>
        </div>
      </div>
    </ModernSidebarLayout>
  );
}

function MetricCard({ title, value, icon, color, trend, description }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}

function Alert({ type, title, message }) {
  const typeClasses = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '🚨'
  };

  return (
    <div className={`border rounded-lg p-3 ${typeClasses[type]}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{icons[type]}</span>
        <div>
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs mt-1 opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}