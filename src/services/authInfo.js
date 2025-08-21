// src/services/authInfo.js

function decodeBase64Url(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 2 ? "==" : base64.length % 4 === 3 ? "=" : "";
  return atob(base64 + pad);
}

function titleCase(s = "") {
  return s
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
// src/services/authInfo.js
export function setRoles(roles = []) {
  localStorage.setItem("roles", JSON.stringify(roles));
}
export function getRoles() {
  try { return JSON.parse(localStorage.getItem("roles") || "[]"); }
  catch { return []; }
}
export const isAdmin = () => getRoles().includes("ADMIN");
export const isTechnicien = () => getRoles().includes("TECHNICIEN");
export const isUtilisateur = () => getRoles().includes("UTILISATEUR");

export function getUserFromToken() {
  let t = localStorage.getItem("token");
  if (!t) return null;

  // 🔧 IMPORTANT: enlever un éventuel préfixe Bearer
  if (t.startsWith("Bearer ")) t = t.slice(7);

  try {
    const parts = t.split(".");
    if (parts.length < 2) return null;

    const payloadJson = decodeBase64Url(parts[1]);
    const p = JSON.parse(payloadJson);

    // Tous les emplacements possibles pour l'email / username
    const email =
      p.email ||
      p.preferred_username ||
      p.upn ||
      p.username ||
      (typeof p.sub === "string" && p.sub.includes("@") ? p.sub : "") ||
      "";

    // Tous les emplacements possibles pour le nom complet
    let nom =
      p.nom ||
      p.name ||
      [p.first_name, p.last_name].filter(Boolean).join(" ") ||
      [p.given_name, p.family_name].filter(Boolean).join(" ") ||
      p.displayName ||
      p.fullname ||
      p.user?.nom ||
      p.user?.name ||
      p.sub || // dernier secours : sub
      "";

    // Si on n’a toujours rien, dériver depuis l’email (avant @)
    if (!nom && email) {
      const local = email.split("@")[0] || "";
      nom = titleCase(local.replace(/\d+/g, "")); // ex: "ali.reseau" -> "Ali Reseau"
    }

    // Rôles : normaliser (string → array)
    let roles = p.roles || p.authorities || p.scope || [];
    if (typeof roles === "string") {
      // ex: "ROLE_ADMIN ROLE_USER"
      roles = roles.split(/[,\s]+/).filter(Boolean);
    } else if (!Array.isArray(roles)) {
      roles = [roles].filter(Boolean);
    }
    roles = roles.map(r => (typeof r === "string" ? r : r?.nom || r?.name || "")).filter(Boolean);

    return { nom: nom || "Utilisateur", email, roles };
  } catch {
    return null;
  }
}
