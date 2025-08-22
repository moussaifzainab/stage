// src/pages/Utilisateurs.jsx
import React, { useEffect, useState } from "react";
import ModernSidebarLayout from "../layouts/ModernSidebarLayout";
import { toast } from "react-toastify";
import api from "../services/api";

export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (resetFilters = false) => {
    try {
      setLoading(true);
      // Appel API réel pour récupérer les utilisateurs
      const response = await api.get("/utilisateurs");
      setUsers(response.data || []);
      
      // ✅ NOUVEAU: Réinitialiser les filtres si demandé
      if (resetFilters) {
        setSearchTerm('');
        setFilterRole('');
      }
      
      toast.success("Utilisateurs chargés");
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      
      // Gestion des erreurs spécifiques
      if (error.response?.status === 404) {
        toast.error("Endpoint utilisateurs non trouvé - Vérifiez votre backend");
      } else if (error.response?.status === 403) {
        toast.error("Accès refusé - Permissions insuffisantes");
      } else {
        toast.error("Erreur lors du chargement des utilisateurs");
      }
      
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU: Fonction pour réinitialiser complètement
  const handleResetAll = () => {
    setSearchTerm('');
    setFilterRole('');
    loadUsers();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Gestion flexible des rôles (string ou array)
    const userRoles = Array.isArray(user.roles) 
      ? user.roles 
      : typeof user.roles === 'string' 
        ? [user.roles] 
        : user.role 
          ? [user.role] 
          : [];
    
    const matchesRole = !filterRole || userRoles.some(role => 
      (typeof role === 'string' ? role : role.nom || role.name || '').includes(filterRole)
    );
    
    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    
    try {
      // Appel API pour changer le statut
      await api.put(`/utilisateurs/${userId}/statut`, { statut: newStatus });
      
      // Mise à jour locale
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, statut: newStatus }
          : u
      ));
      
      toast.success(`Utilisateur ${newStatus === 'ACTIF' ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast.error("Erreur lors du changement de statut");
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      // Appel API pour supprimer l'utilisateur
      await api.delete(`/utilisateurs/${userToDelete.id}`);
      
      // Mise à jour locale
      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      toast.success(`Utilisateur ${userToDelete.nom} supprimé`);
      
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // ✅ NOUVEAU: Gérer l'édition d'un utilisateur
  const handleEditUser = (user) => {
    setUserToEdit(user);
    setShowEditModal(true);
  };

  // ✅ NOUVEAU: Sauvegarder les modifications
  const handleSaveEdit = async (userId, formData) => {
    try {
      await api.put(`/utilisateurs/${userId}`, formData);
      
      // Mise à jour locale
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, ...formData }
          : u
      ));
      
      toast.success("Utilisateur modifié avec succès");
    } catch (error) {
      console.error('Erreur modification utilisateur:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur lors de la modification");
      }
      throw error;
    }
  };

  const handleAddUser = async (newUserData) => {
    try {
      // Appel API pour créer l'utilisateur
      const response = await api.post("/utilisateurs", newUserData);
      
      // Ajouter à la liste locale
      setUsers(prev => [...prev, response.data]);
      toast.success("Utilisateur créé avec succès");
      
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur lors de la création");
      }
      throw error; // Re-throw pour que le modal gère l'erreur
    }
  };

  // Calcul des statistiques avec gestion sécurisée
  const stats = {
    total: users.length,
    actifs: users.filter(u => u.statut === 'ACTIF').length,
    admins: users.filter(u => {
      const userRoles = Array.isArray(u.roles) ? u.roles : [u.roles || u.role].filter(Boolean);
      return userRoles.some(role => 
        (typeof role === 'string' ? role : role.nom || role.name || '').includes('ADMIN')
      );
    }).length,
    techniciens: users.filter(u => {
      const userRoles = Array.isArray(u.roles) ? u.roles : [u.roles || u.role].filter(Boolean);
      return userRoles.some(role => 
        (typeof role === 'string' ? role : role.nom || role.name || '').includes('TECHNICIEN')
      );
    }).length
  };

  if (loading) {
    return (
      <ModernSidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des utilisateurs...</p>
          </div>
        </div>
      </ModernSidebarLayout>
    );
  }

  return (
    <ModernSidebarLayout>
      {/* En-tête avec gradient */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg px-8 py-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
              <p className="text-cyan-100 mt-1">Administration des comptes et permissions</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors duration-200 flex items-center gap-2"
          >
            <span className="text-lg">➕</span>
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total utilisateurs" value={stats.total} icon="👤" color="blue" />
        <StatCard title="Utilisateurs actifs" value={stats.actifs} icon="✅" color="emerald" />
        <StatCard title="Administrateurs" value={stats.admins} icon="👑" color="purple" />
        <StatCard title="Techniciens" value={stats.techniciens} icon="🔧" color="orange" />
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par rôle</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Tous les rôles</option>
              <option value="ADMIN">Administrateur</option>
              <option value="TECHNICIEN">Technicien</option>
              <option value="UTILISATEUR">Utilisateur</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleResetAll}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span className="text-lg">🔄</span>
              Actualiser
            </button>
            
            {/* ✅ NOUVEAU: Bouton pour réinitialiser uniquement les filtres */}
            {(searchTerm || filterRole) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('');
                }}
                className="px-3 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                title="Réinitialiser les filtres"
              >
                <span className="text-lg">✕</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ CORRIGÉ: Liste des utilisateurs sans "Dernière connexion" */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Utilisateur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rôles</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Incidents créés</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onToggleStatus={() => handleToggleStatus(user.id)}
                  onDelete={() => handleDeleteUser(user)}
                  onEdit={() => handleEditUser(user)}
                />
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">👤</span>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-gray-500">
                {users.length === 0 
                  ? "Aucun utilisateur dans la base de données" 
                  : "Essayez de modifier vos critères de recherche"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddUser}
        />
      )}

      {/* ✅ NOUVEAU: Modal d'édition */}
      {showEditModal && (
        <EditUserModal
          user={userToEdit}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modal de confirmation suppression */}
      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          userName={userToDelete?.nom}
        />
      )}
    </ModernSidebarLayout>
  );
}

// ✅ CORRIGÉ: Modal d'édition utilisateur SANS poste
function EditUserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    departement: user?.departement || '',
    // ✅ SUPPRIMÉ: Plus de champ poste
    roles: Array.isArray(user?.roles) 
      ? user.roles.map(r => typeof r === 'string' ? r : r.nom || r.name)
      : [user?.roles || user?.role || 'UTILISATEUR'].filter(Boolean)
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(user.id, formData);
      onClose();
    } catch (error) {
      // L'erreur est gérée dans handleSaveEdit
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role, checked) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              ✏️ Modifier l'utilisateur - {user?.nom}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Jean Dupont"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="jean.dupont@company.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Département
              </label>
              <input
                type="text"
                value={formData.departement}
                onChange={(e) => setFormData(prev => ({ ...prev, departement: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="IT, RH, Commercial..."
              />
            </div>
            
            {/* ✅ SUPPRIMÉ: Plus de champ poste */}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rôles * - ⚠️ ATTENTION: Seuls ADMIN et UTILISATEUR peuvent créer des incidents
            </label>
            <div className="space-y-2">
              {['ADMIN', 'TECHNICIEN', 'UTILISATEUR'].map(role => (
                <label key={role} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => handleRoleChange(role, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">{role}</span>
                  <span className="text-xs text-gray-500">
                    {role === 'ADMIN' && '- Accès complet + création incidents'}
                    {role === 'TECHNICIEN' && '- Gestion incidents (PAS de création)'}
                    {role === 'UTILISATEUR' && '- Création incidents uniquement'}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.roles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {isSubmitting ? 'Modification...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
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
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function UserRow({ user, onToggleStatus, onDelete, onEdit }) {
  const initials = (user.nom || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  const getRoleColor = (role) => {
    const roleStr = typeof role === 'string' ? role : role?.nom || role?.name || '';
    if (roleStr.includes('ADMIN')) return 'bg-red-100 text-red-700 border-red-200';
    if (roleStr.includes('TECHNICIEN')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (roleStr.includes('UTILISATEUR')) return 'bg-gray-100 text-gray-700 border-gray-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Normalisation des rôles pour l'affichage
  const displayRoles = Array.isArray(user.roles) 
    ? user.roles 
    : [user.roles || user.role].filter(Boolean);

  // ✅ NOUVEAU: Déterminer le texte de la colonne incidents
  const getIncidentText = () => {
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles || user.role].filter(Boolean);
    const hasAdminRole = userRoles.some(role => 
      (typeof role === 'string' ? role : role.nom || role.name || '').includes('ADMIN')
    );
    const hasUserRole = userRoles.some(role => 
      (typeof role === 'string' ? role : role.nom || role.name || '').includes('UTILISATEUR')
    );
    const hasTechRole = userRoles.some(role => 
      (typeof role === 'string' ? role : role.nom || role.name || '').includes('TECHNICIEN')
    );

    // Si technicien uniquement (pas admin, pas utilisateur)
    if (hasTechRole && !hasAdminRole && !hasUserRole) {
      return { count: '-', note: '(pas de création)' };
    }
    
    // Pour les autres (admin, utilisateur, ou combinaisons)
    const count = user.incidents || user.nombreIncidents || 0;
    return { count: count, note: count === 0 ? '(aucun)' : '' };
  };

  const incidentInfo = getIncidentText();

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {initials}
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.nom || 'Nom non défini'}</div>
            <div className="text-sm text-gray-500">{user.email || 'Email non défini'}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {displayRoles.map((role, index) => {
            const roleDisplay = typeof role === 'string' ? role : role?.nom || role?.name || 'ROLE_UNKNOWN';
            return (
              <span
                key={index}
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(role)}`}
              >
                {roleDisplay}
              </span>
            );
          })}
          {displayRoles.length === 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              Aucun rôle
            </span>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            user.statut === 'ACTIF' ? 'bg-emerald-500' : 'bg-red-500'
          }`}></div>
          <span className={`text-sm font-medium ${
            user.statut === 'ACTIF' ? 'text-emerald-700' : 'text-red-700'
          }`}>
            {user.statut || 'INCONNUE'}
          </span>
        </div>
      </td>
      
      {/* ✅ CORRIGÉ: Colonne incidents au lieu de "Dernière connexion" */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛠️</span>
          <span className="font-medium text-gray-700">
            {incidentInfo.count}
          </span>
          {incidentInfo.note && (
            <span className="text-xs text-gray-400 ml-1">{incidentInfo.note}</span>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={onToggleStatus}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              user.statut === 'ACTIF' 
                ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
            title={user.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
          >
            {user.statut === 'ACTIF' ? '🚫' : '✅'}
          </button>
          
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200"
            title="Modifier"
          >
            ✏️
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200"
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}

function DeleteConfirmModal({ onConfirm, onCancel, userName }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🗑️</span>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Confirmer la suppression
          </h3>
          
          <p className="text-gray-600 mb-6">
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userName}</strong> ?
            Cette action est irréversible.
          </p>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ CORRIGÉ: Modal d'ajout utilisateur SANS poste
function AddUserModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    departement: '',
    // ✅ SUPPRIMÉ: Plus de champ poste
    roles: ['UTILISATEUR'],
    motDePasse: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // L'erreur est gérée dans handleAddUser
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role, checked) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Nouvel utilisateur</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Jean Dupont"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="jean.dupont@company.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Département
              </label>
              <input
                type="text"
                value={formData.departement}
                onChange={(e) => setFormData(prev => ({ ...prev, departement: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="IT, RH, Commercial..."
              />
            </div>
            
            {/* ✅ SUPPRIMÉ: Plus de champ poste */}
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe temporaire *
              </label>
              <input
                type="password"
                required
                value={formData.motDePasse}
                onChange={(e) => setFormData(prev => ({ ...prev, motDePasse: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Minimum 6 caractères"
                minLength={6}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rôles * - ⚠️ ATTENTION: Seuls ADMIN et UTILISATEUR peuvent créer des incidents
            </label>
            <div className="space-y-2">
              {['ADMIN', 'TECHNICIEN', 'UTILISATEUR'].map(role => (
                <label key={role} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => handleRoleChange(role, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">{role}</span>
                  <span className="text-xs text-gray-500">
                    {role === 'ADMIN' && '- Accès complet + création incidents'}
                    {role === 'TECHNICIEN' && '- Gestion incidents (PAS de création)'}
                    {role === 'UTILISATEUR' && '- Création incidents uniquement'}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.roles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}