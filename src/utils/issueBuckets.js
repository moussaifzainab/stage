// src/utils/issueBuckets.js
// Normalisation et catégorisation des pannes fréquentes

function normalize(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "") // retire les accents
    .replace(/\s+/g, " ")
    .trim();
}

// Catégories + mots-clés (facile à faire évoluer)
const CATEGORIES = [
  { key: "Réseau",        patterns: [/reseau/, /réseau/, /connexion/, /latence/, /serveur indisponible/] },
  { key: "VPN",           patterns: [/vpn/] },
  { key: "Imprimante",    patterns: [/imprimante/, /imprimer/, /impression/] },
  { key: "Email",         patterns: [/email/, /\bmail\b/, /boite mail/, /boîte mail/, /outlook/] },
  { key: "Mot de passe",  patterns: [/mot de passe/, /\bmdp\b/, /password/] },
  { key: "Excel",         patterns: [/excel/, /\bxls\b/, /\bxlsx\b/, /tableur/] },
  { key: "Installation",  patterns: [/installation/, /installer/, /setup/, /\bmaj\b/, /update/, /mise a jour/, /mise à jour/] },
  { key: "Écran",         patterns: [/ecran/, /écran/, /affichage/, /no signal/, /ecran noir|écran noir/, /ecran bleu|écran bleu/] },
  { key: "Logiciel",      patterns: [/logiciel/, /application/, /app plante/, /plante|plantage|crash|freeze|bloque?/] },
];

export function categorizeIncident(incident = {}) {
  const hay = normalize(`${incident.titre || ""} ${incident.description || ""}`);
  for (const cat of CATEGORIES) {
    if (cat.patterns.some((re) => re.test(hay))) return cat.key;
  }
  return "Général";
}

// Renvoie tableau [{ key, count, lastDate }] trié: count DESC puis lastDate DESC
export function groupByCategory(incidents = []) {
  const map = new Map();
  for (const it of incidents) {
    const key = categorizeIncident(it);
    const d   = it?.dateCreation ? new Date(it.dateCreation) : null;

    const prev = map.get(key) || { count: 0, lastDate: null };
    const lastDate = d && (!prev.lastDate || d > prev.lastDate) ? d : prev.lastDate;

    map.set(key, { count: prev.count + 1, lastDate });
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => (b.count - a.count) || ((b.lastDate?.getTime() || 0) - (a.lastDate?.getTime() || 0)));
}
