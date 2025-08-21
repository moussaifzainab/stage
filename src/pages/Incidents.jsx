// src/pages/Incidents.jsx
import React from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import IncidentList from "../components/IncidentList";
import { isAdmin, isTechnicien, isUtilisateur } from "../services/authInfo";

export default function Incidents() {
  // Permissions UI dérivées des rôles (aucune logique métier modifiée)
  const perms = {
    canCreate: isAdmin() || isUtilisateur(),     // bouton "Ajouter" si tu l'affiches ici un jour
    canExport: true,                             // tout le monde exporte (backend filtre déjà)
    canEdit: isAdmin(),                          // modifier/supprimer : admin
    canDelete: isAdmin(),
    canClose: isAdmin(),                         // clôture + solution : admin
    canChangeStatus: isAdmin() || isTechnicien(),// changer statut : admin/tech
    canChangePriority: isAdmin() || isTechnicien(), // priorité : admin/tech
  };

  return (
    <SidebarLayout title="Incidents">
      <IncidentList perms={perms} />
    </SidebarLayout>
  );
}
