// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getRoles } from "../services/authInfo";

// true si l'utilisateur possède au moins un des rôles autorisés
function hasAccess(allowedRoles) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true;
  const roles = getRoles();
  return roles.some((r) => allowedRoles.includes(r));
}

export default function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // pas de token -> redirection login
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // token présent mais rôle non autorisé -> retour dashboard
  if (!hasAccess(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
