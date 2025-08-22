// src/pages/Profil.jsx
import React, { useEffect, useState } from "react";
import ModernSidebarLayout from "../layouts/ModernSidebarLayout";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Profil() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    departement: '',
    poste: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/auth/me");
      setMe(data);
      setFormData({
        nom: data.nom || '',
        email: data.email || '',
        telephone: data.telephone || '',
        departement: data.departement || '',
        poste: data.poste || ''
      });
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast.error("Erreur lors du chargement du profil");
      setMe(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await api.put("/auth/profile", formData);
      setMe({ ...me, ...formData });
      setEditing(false);
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: me.nom || '',
      email: me.email || '',
      telephone: me.telephone || '',
      departement: me.departement || '',
      poste: me.poste || ''
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <ModernSidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement du profil...</p>
          </div>
        </div>
      </ModernSidebarLayout>
    );
  }

  if (!me) {
    return (
      <ModernSidebarLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Profil indisponible</h3>
          <p className="text-red-600 mb-4">Impossible de charger les informations du profil.</p>
          <button
            onClick={loadProfile}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </ModernSidebarLayout>
    );
  }

  const initials = (me.nom || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const roleLabels = (me.roles || []).map(r => r.nom || r).join(', ');

  return (
    <ModernSidebarLayout>
      {/* En-tête avec gradient */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-lg px-8 py-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{me.nom || 'Utilisateur'}</h1>
            <p className="text-indigo-100 mt-1">{roleLabels || 'Utilisateur'}</p>
            <p className="text-indigo-200 text-sm mt-2">{me.email}</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors duration-200 flex items-center gap-2"
          >
            <span className="text-lg">{editing ? '✖️' : '✏️'}</span>
            {editing ? 'Annuler' : 'Modifier'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations personnelles */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Informations personnelles</h3>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfileField
                  label="Nom complet"
                  value={editing ? formData.nom : (me.nom || '-')}
                  editing={editing}
                  onChange={(value) => handleInputChange('nom', value)}
                  icon="👤"
                />
                
                <ProfileField
                  label="Adresse email"
                  value={editing ? formData.email : (me.email || '-')}
                  editing={editing}
                  onChange={(value) => handleInputChange('email', value)}
                  icon="📧"
                  type="email"
                />
                
                <ProfileField
                  label="Téléphone"
                  value={editing ? formData.telephone : (me.telephone || '-')}
                  editing={editing}
                  onChange={(value) => handleInputChange('telephone', value)}
                  icon="📞"
                  placeholder="Ex: +33 1 23 45 67 89"
                />
                
                <ProfileField
                  label="Département"
                  value={editing ? formData.departement : (me.departement || '-')}
                  editing={editing}
                  onChange={(value) => handleInputChange('departement', value)}
                  icon="🏢"
                  placeholder="Ex: IT, RH, Commercial..."
                />
                
                <ProfileField
                  label="Poste"
                  value={editing ? formData.poste : (me.poste || '-')}
                  editing={editing}
                  onChange={(value) => handleInputChange('poste', value)}
                  icon="💼"
                  placeholder="Ex: Développeur, Manager..."
                />
              </div>

              {editing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar avec informations supplémentaires */}
        <div className="space-y-6">
          {/* Rôles et permissions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🛡️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Rôles & Permissions</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {(me.roles || []).map((role, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-emerald-800">{role.nom || role}</span>
                  </div>
                ))}
                
                {(!me.roles || me.roles.length === 0) && (
                  <p className="text-gray-500 text-sm">Aucun rôle assigné</p>
                )}
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Activité</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <StatItem label="Incidents créés" value="12" icon="➕" />
              <StatItem label="Incidents résolus" value="8" icon="✅" />
              <StatItem label="Temps moyen" value="2.5j" icon="⏱️" />
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Actions rapides</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-3">
              <QuickAction
                label="Changer le mot de passe"
                icon="🔐"
                onClick={() => toast.info("Fonctionnalité à implémenter")}
              />
              <QuickAction
                label="Préférences notifications"
                icon="🔔"
                onClick={() => toast.info("Fonctionnalité à implémenter")}
              />
              <QuickAction
                label="Télécharger mes données"
                icon="📥"
                onClick={() => toast.info("Export en cours...")}
              />
            </div>
          </div>
        </div>
      </div>
    </ModernSidebarLayout>
  );
}

function ProfileField({ label, value, editing, onChange, icon, type = 'text', placeholder }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <span className="text-lg">{icon}</span>
        {label}
      </label>
      
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors duration-200"
        />
      ) : (
        <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 min-h-[48px] flex items-center">
          {value || <span className="text-gray-400">Non renseigné</span>}
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function QuickAction({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="ml-auto text-gray-400">→</span>
    </button>
  );
}