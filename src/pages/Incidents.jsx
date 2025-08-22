// src/pages/Incidents.jsx
import React from "react";
import ModernSidebarLayout from "../layouts/ModernSidebarLayout";
import IncidentList from "../components/IncidentList";
import { isAdmin, isTechnicien, isUtilisateur } from "../services/authInfo";

export default function Incidents() {
  // ✅ CORRIGÉ: Permissions UI selon votre récapitulatif des droits
  const perms = {
    // Création : ADMIN + UTILISATEUR (PAS TECHNICIEN)
    canCreate: isAdmin() || isUtilisateur(),
    
    // Export : tous (backend filtre selon le scope)
    canExport: true,
    
    // ✅ CORRIGÉ: Édition selon votre logique
    // ADMIN: peut modifier tout (titre, description, statut, priorité, spécialité)
    // UTILISATEUR: peut modifier le texte (titre/description) de SES incidents tant que pas clôturé
    canEdit: isAdmin() || isUtilisateur(),
    
    // Suppression : ADMIN uniquement
    canDelete: isAdmin(),
    
    // ✅ CORRIGÉ: Clôture selon votre logique
    // ADMIN: peut clôturer n'importe quel incident
    // TECHNICIEN: peut clôturer SES incidents assignés
    // UTILISATEUR: peut clôturer SES incidents créés
    canClose: isAdmin() || isTechnicien() || isUtilisateur(),
    
    // Changement de statut : ADMIN + TECHNICIEN (assigné) + UTILISATEUR (propriétaire)
    canChangeStatus: isAdmin() || isTechnicien() || isUtilisateur(),
    
    // Changement de priorité : ADMIN + TECHNICIEN (assigné) + UTILISATEUR (propriétaire)
    canChangePriority: isAdmin() || isTechnicien() || isUtilisateur(),
    
    // ✅ NOUVEAU: Assignment de technicien (selon votre logique)
    // ADMIN: peut assigner/réassigner n'importe quel technicien
    canAssignTechnician: isAdmin(),
    
    // ✅ NOUVEAU: Modification forte (selon votre logique)
    // ADMIN: peut modifier statut, priorité, spécialité de n'importe quel incident
    canFullEdit: isAdmin(),
    
    // Historique et suggestions : tous
    canViewHistory: true,
    canViewSuggestions: true
  };

  return (
    <ModernSidebarLayout title="Incidents">
      <IncidentList perms={perms} />
    </ModernSidebarLayout>
  );
}