// src/services/incidents.js
import api from "./api";

/** Retire les champs vides avant d'envoyer la recherche */
function sanitizeSearchPayload(payload = {}) {
  const out = { ...payload };
  Object.keys(out).forEach((k) => {
    if (out[k] === "" || out[k] == null) delete out[k];
  });
  return out;
}

/* ============= LISTES & KPI ============= */

export async function listParRole() {
  const { data } = await api.get("/incidents");
  return data;
}

export async function getKpis() {
  const { data } = await api.get("/incidents/kpis");
  return data;
}

/* ============= RECHERCHE AVANCÉE ============= */

export async function searchIncidents(criteria) {
  const payload = sanitizeSearchPayload(criteria);
  const { data } = await api.post("/incidents/search", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

/* ============= CRUD & ACTIONS ============= */

export async function createIncident(incident) {
  const { data } = await api.post("/incidents", incident, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

export async function deleteIncident(id) {
  const { data } = await api.delete(`/incidents/${id}`);
  return data;
}

export async function updateIncident(id, payload) {
  const { data } = await api.put(`/incidents/${id}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

/** on envoie la valeur brute en JSON string, comme attendu par le backend */
export async function changeStatut(id, statut) {
  const { data } = await api.put(
    `/incidents/${id}/statut`,
    JSON.stringify(statut),
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

export async function changePriorite(id, priorite) {
  const { data } = await api.put(
    `/incidents/${id}/priorite`,
    JSON.stringify(priorite),
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

export async function cloturerIncident(id, solution) {
  const { data } = await api.put(
    `/incidents/${id}/cloture`,
    { solution },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

export async function getHistorique(id) {
  const { data } = await api.get(`/incidents/${id}/historique`);
  return data;
}

export async function applyPriorisation() {
  const { data } = await api.put("/incidents/priorisation");
  return data;
}

export async function getRecommendation(id) {
  const { data } = await api.get(`/incidents/${id}/recommendation`);
  return data;
}

/** correction texte (titre/description) — ADMIN & UTILISATEUR */
export async function updateTexte(id, { titre, description }) {
  const { data } = await api.patch(
    `/incidents/${id}/texte`,
    { titre, description },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

/* ---- alias pour compatibilité avec tes imports existants ---- */
export { updateTexte as updateIncidentTexte };
