// src/services/reports.js
import api from "./api";

export const getKpis = () => api.get("/incidents/kpis");

// Téléchargement PDF des incidents (scope par rôle)
export const downloadIncidentsPdf = async () => {
  const res = await api.get("/incidents/export/pdf", { responseType: "blob" });
  // Crée un lien de téléchargement
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "incidents.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
