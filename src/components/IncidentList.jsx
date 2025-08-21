// src/components/IncidentList.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  HiLightBulb, HiX, HiClipboardCopy, HiSearch, HiRefresh, HiDownload,
  HiPrinter, HiAdjustments, HiClock, HiSparkles, HiPencil, HiTrash
} from "react-icons/hi";

import {
  listParRole,
  searchIncidents as searchIncidentsService,
  deleteIncident as deleteIncidentService,
  changeStatut,
  changePriorite,
  applyPriorisation,
  updateIncidentTexte,
} from "../services/incidents";
import api from "../services/api";
import { getUserFromToken } from "../services/authInfo";

/* ================= UI helpers ================= */
const STATUTS   = ["NOUVEAU","EN_COURS","EN_ATTENTE","RESOLU","NON_RESOLU","CLOTURE","ANNULE"];
const PRIORITES = ["FAIBLE","MOYENNE","HAUTE"];

const STATUS_SELECT_CLS = {
  NOUVEAU:    "bg-gray-100  text-gray-800  border-gray-300",
  EN_COURS:   "bg-blue-100  text-blue-800  border-blue-300",
  EN_ATTENTE: "bg-amber-100 text-amber-800 border-amber-300",
  RESOLU:     "bg-emerald-100 text-emerald-800 border-emerald-300",
  NON_RESOLU: "bg-rose-100  text-rose-800  border-rose-300",
  CLOTURE:    "bg-slate-100  text-slate-800 border-slate-300",
  ANNULE:     "bg-neutral-100 text-neutral-800 border-neutral-300",
};
const PRIORITY_SELECT_CLS = {
  FAIBLE:  "bg-gray-100   text-gray-800   border-gray-300",
  MOYENNE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  HAUTE:   "bg-red-100    text-red-800    border-red-300",
};
const clsx = (...xs) => xs.filter(Boolean).join(" ");

const ActionButton = ({ icon:Icon, label, onClick, color="blue", title }) => {
  const colors = {
    blue:   "bg-blue-600 hover:bg-blue-700 text-white",
    green:  "bg-emerald-600 hover:bg-emerald-700 text-white",
    indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
    red:    "bg-rose-600 hover:bg-rose-700 text-white",
  };
  return (
    <button onClick={onClick} title={title || label}
      className={clsx("inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors shadow-sm", colors[color])}>
      {Icon && <Icon size={16}/>} <span>{label}</span>
    </button>
  );
};

// Catégorisation & highlight (modale Suggestion)
function detectCategory(text = "") {
  const s = text.toLowerCase();
  const rules = [
    { kw: "vpn",           badge: "VPN",         cls: "bg-yellow-100 text-yellow-800" },
    { kw: "imprim",        badge: "Imprimante",  cls: "bg-indigo-100 text-indigo-800" },
    { kw: "réseau",        badge: "Réseau",      cls: "bg-blue-100 text-blue-800" },
    { kw: "reseau",        badge: "Réseau",      cls: "bg-blue-100 text-blue-800" },
    { kw: "email",         badge: "E-mail",      cls: "bg-emerald-100 text-emerald-800" },
    { kw: "mot de passe",  badge: "Mot de passe",cls: "bg-rose-100 text-rose-800" },
    { kw: "excel",         badge: "Excel",       cls: "bg-green-100 text-green-800" },
    { kw: "installation",  badge: "Installation",cls: "bg-orange-100 text-orange-800" },
    { kw: "écran",         badge: "Écran",       cls: "bg-violet-100 text-violet-800" },
    { kw: "ecran",         badge: "Écran",       cls: "bg-violet-100 text-violet-800" },
  ];
  for (const r of rules) if (s.includes(r.kw)) return { badge: r.badge, cls: r.cls, keyword: r.kw };
  return { badge: "Général", cls: "bg-gray-100 text-gray-800", keyword: "" };
}
function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function highlightKeyword(text = "", keyword = "") {
  if (!keyword) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, "ig");
  const parts = text.split(regex);
  return parts.map((p, i) =>
    regex.test(p)
      ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{p}</mark>
      : <span key={i}>{p}</span>
  );
}

/* ================= Component ================= */
const IncidentList = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(false);

  // Utilisateur courant
  const currentUser = getUserFromToken(); // { email, nom, roles }

  // Rôles (normalisation + fallback)
  const getRawRoles = () => {
    let r = currentUser?.roles;
    if (!r || (Array.isArray(r) && r.length === 0)) {
      try { r = JSON.parse(localStorage.getItem("roles") || "[]"); } catch { r = []; }
    }
    return Array.isArray(r) ? r : [];
  };
  const normalizeRoles = (arr) => arr
    .map(x => (typeof x === "string" ? x : (x?.nom || x?.name || x?.role || "")))
    .map(s => String(s).toUpperCase().replace(/^ROLE_/, "").trim())
    .filter(Boolean);

  const rolesNorm = normalizeRoles(getRawRoles());
  const hasRole   = (name) => rolesNorm.includes(String(name).toUpperCase());
  const isAdmin   = hasRole("ADMIN");
  const isTech    = hasRole("TECHNICIEN") || hasRole("TECH");
  const isUser    = hasRole("UTILISATEUR") || hasRole("USER");
  const isJustUser = isUser && !isAdmin && !isTech;

  // Historique
  const [historyOpen, setHistoryOpen]           = useState(false);
  const [historyRows, setHistoryRows]           = useState([]);
  const [historyIncidentId, setHistoryIncidentId] = useState(null);

  // Suggestion
  const [suggestionOpen, setSuggestionOpen]     = useState(false);
  const [suggestionText, setSuggestionText]     = useState("");
  const [suggestionIncidentId, setSuggestionIncidentId] = useState(null);
  const [suggestionCategory, setSuggestionCategory]     = useState({ badge: "Général", cls: "bg-gray-100 text-gray-800", keyword: "" });
  const [suggestionAnimIn, setSuggestionAnimIn] = useState(false);

  // Édition (titre/description)
  const [editOpen, setEditOpen] = useState(false);
  const [editIncidentId, setEditIncidentId] = useState(null);
  const [editForm, setEditForm] = useState({ titre: "", description: "" });

  // Recherche (conservée)
  const [searchCriteria, setSearchCriteria] = useState({
    titre: "", description: "", statut: "", priorite: "",
    technicienNom: "", dateDebut: "", dateFin: "",
  });

  // Droits d’affichage
  const canSeeEditBtn   = (inc) => inc?.statut !== "CLOTURE" && (isAdmin || isUser);
  const canSeeDeleteBtn = () => isAdmin;

  /* ============== API calls ============== */
  const fetchIncidents = async () => {
    try {
      setLoading(true);
      let data;
      try {
        data = await listParRole();
      } catch {
        const r = await api.get("/incidents");
        data = r.data;
      }
      setIncidents(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des incidents.");
    } finally {
      setLoading(false);
    }
  };

  const searchIncidents = async () => {
    try {
      setLoading(true);
      const data = await searchIncidentsService(searchCriteria);
      setIncidents(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setSearchCriteria({ titre: "", description: "", statut: "", priorite: "", technicienNom: "", dateDebut: "", dateFin: "" });
    await fetchIncidents();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet incident ?")) return;
    try {
      await deleteIncidentService(id);
      setIncidents(prev => prev.filter(i => i.id !== id));
      toast.success("Incident supprimé.");
    } catch (err) {
      console.error(err);
      const m = err?.response?.data || "Suppression impossible.";
      toast.error(typeof m === "string" ? m : "Suppression impossible.");
    }
  };

  const handleChangeStatut = async (incident, nouveauStatut) => {
    try {
      const updated = await changeStatut(incident.id, nouveauStatut);
      setIncidents(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      toast.info("Statut mis à jour.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour du statut.");
    }
  };

  const handleChangePriorite = async (incident, nouvellePriorite) => {
    try {
      const updated = await changePriorite(incident.id, nouvellePriorite);
      setIncidents(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      toast.info("Priorité mise à jour.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour de la priorité.");
    }
  };

  // Historique
  const openHistory = async (incidentId) => {
    setHistoryIncidentId(incidentId);
    setHistoryRows([]);
    setHistoryOpen(true);
    try {
      const { data } = await api.get(`/incidents/${incidentId}/historique`);
      setHistoryRows(data || []);
    } catch {
      setHistoryRows([]);
      toast.info("L'historique n'est pas encore disponible pour cet incident.");
    }
  };
  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryRows([]);
    setHistoryIncidentId(null);
  };

  // Suggestion
  const openSuggestion = async (incident) => {
    const { id, titre, description } = incident || {};
    const det = detectCategory(`${titre ?? ""} ${description ?? ""}`);
    setSuggestionIncidentId(id);
    setSuggestionCategory(det);
    setSuggestionText("");
    setSuggestionOpen(true);
    setTimeout(() => setSuggestionAnimIn(true), 10);
    try {
      const { data } = await api.get(`/incidents/${id}/recommendation`);
      setSuggestionText(data || "Aucune recommandation trouvée pour cet incident.");
    } catch (err) {
      console.error(err);
      setSuggestionText("Impossible de récupérer la suggestion.");
    }
  };
  const closeSuggestion = () => {
    setSuggestionAnimIn(false);
    setTimeout(() => {
      setSuggestionOpen(false);
      setSuggestionText("");
      setSuggestionIncidentId(null);
      setSuggestionCategory({ badge: "Général", cls: "bg-gray-100 text-gray-800", keyword: "" });
    }, 150);
  };

  // Édition texte
  const openEdit = (incident) => {
    if (!incident) return;
    setEditIncidentId(incident.id);
    setEditForm({ titre: incident.titre || "", description: incident.description || "" });
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setEditIncidentId(null);
    setEditForm({ titre: "", description: "" });
  };
  const saveEdit = async () => {
    try {
      const updated = await updateIncidentTexte(editIncidentId, {
        titre: editForm.titre,
        description: editForm.description,
      });
      setIncidents(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      toast.success("Texte mis à jour.");
      closeEdit();
    } catch (err) {
      const msg = err?.response?.data;
      toast.error(typeof msg === "string" ? msg : "Impossible de mettre à jour le texte.");
    }
  };

  // Exports / Impression
  const fileStamp = () => {
    const d = new Date(); const pad = (n) => `${n}`.padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  };
  const toExcelText = (s) => (s == null ? "" : String(s).replaceAll('"',"\"\""));

  const exportCSV = () => {
    if (!incidents.length) return toast.info("Aucune donnée à exporter.");
    const headers = ["ID","Titre","Description","Statut","Priorité","Technicien","Date création"];
    const rows = incidents.map((i) => {
      const dateStr   = i.dateCreation ? new Date(i.dateCreation).toISOString().slice(0,19).replace("T"," ") : "";
      const dateExcel = dateStr ? `="${dateStr}"` : "";
      return [i.id, toExcelText(i.titre), toExcelText(i.description), i.statut ?? "", i.priorite ?? "", toExcelText(i.technicien?.nom), dateExcel];
    });
    const csv   = [headers.join(";"), ...rows.map((r)=>r.map((v)=>`"${v}"`).join(";"))].join("\r\n");
    const blob  = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" });
    const url   = URL.createObjectURL(blob);
    const a     = Object.assign(document.createElement("a"), { href:url, download:`incidents_${fileStamp()}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast.success("CSV exporté.");
  };

  const exportPDF = async () => {
    try {
      const res = await api.get("/incidents/export/pdf", { responseType:"blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type:"application/pdf" }));
      const a   = Object.assign(document.createElement("a"), { href:url, download:`incidents_${fileStamp()}.pdf` });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast.success("PDF exporté.");
    } catch (err) {
      try { const text = await err?.response?.data?.text?.(); toast.error(text || "Erreur lors de l'export PDF."); }
      catch { toast.error("Erreur lors de l'export PDF."); }
    }
  };

  const buildPrintableHtml = (title) => {
    const headers  = ["ID","Titre","Description","Statut","Priorité","Technicien","Date création"];
    const rowsHtml = incidents.map((i)=>`
      <tr>
        <td>${i.id ?? ""}</td>
        <td>${i.titre ?? ""}</td>
        <td>${i.description ?? ""}</td>
        <td>${i.statut ?? ""}</td>
        <td>${i.priorite ?? ""}</td>
        <td>${i.technicien?.nom ?? ""}</td>
        <td>${i.dateCreation ? new Date(i.dateCreation).toLocaleString() : ""}</td>
      </tr>`).join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <title>${title}</title>
      <style>body{font-family:Arial,sans-serif;padding:16px}h1{font-size:18px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px}
      thead{background:#f3f4f6}.meta{margin-bottom:8px;color:#555;font-size:12px}
      @media print{.no-print{display:none}}</style></head><body>
      <h1>${title}</h1><div class="meta">Généré le ${new Date().toLocaleString()}</div>
      <table><thead><tr>${headers.map((h)=>`<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rowsHtml || `<tr><td colspan="7">Aucune donnée</td></tr>`}</tbody></table>
      <div class="no-print" style="margin-top:12px"><button onclick="window.print()">Imprimer / PDF</button></div>
      </body></html>`;
  };
  const openHtmlInNewTab = (htmlString) => {
    const url = URL.createObjectURL(new Blob([htmlString], { type:"text/html;charset=utf-8" }));
    const win = window.open(url, "_blank");
    setTimeout(()=>URL.revokeObjectURL(url), 10000);
    return win;
  };
  const printTable = () => {
    if (!incidents.length) return toast.info("Aucune donnée à imprimer.");
    const html = buildPrintableHtml("Incidents (impression)");
    const win  = openHtmlInNewTab(html);
    if (win) setTimeout(()=>win.print(), 400);
  };

  useEffect(() => { fetchIncidents(); }, []);
  const handleChange = (e) => setSearchCriteria((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="p-4 text-[15px] md:text-base">
      {/* Titre */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🗂️</span>
        <h2 className="text-2xl font-bold text-gray-700">
          Liste des incidents {loading ? "…" : `(${incidents.length})`}
        </h2>
      </div>

      {/* Filtres (recherche avancée) */}
      <div className="mb-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
            <input name="titre" placeholder="Titre"
              value={searchCriteria.titre} onChange={handleChange}
              className="px-3 py-2.5 border rounded-lg" />
            <input name="description" placeholder="Description"
              value={searchCriteria.description} onChange={handleChange}
              className="px-3 py-2.5 border rounded-lg" />
            <input name="technicienNom" placeholder="Nom du technicien"
              value={searchCriteria.technicienNom} onChange={handleChange}
              className="px-3 py-2.5 border rounded-lg" />
            <select name="statut" value={searchCriteria.statut} onChange={handleChange}
              className="px-3 py-2.5 border rounded-lg">
              <option value="">Statut</option>
              {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select name="priorite" value={searchCriteria.priorite} onChange={handleChange}
              className="px-3 py-2.5 border rounded-lg">
              <option value="">Priorité</option>
              {PRIORITES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="datetime-local" name="dateDebut"
              value={searchCriteria.dateDebut} onChange={handleChange}
              className="px-3 py-2.5 border rounded-lg" />
            <input type="datetime-local" name="dateFin"
              value={searchCriteria.dateFin} onChange={handleChange}
              className="px-3 py-2.5 border rounded-lg" />
            <div className="flex gap-2">
              <button onClick={searchIncidents}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700">
                <HiSearch /> Rechercher
              </button>
              <button onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700">
                <HiRefresh /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={exportCSV} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700">
          <HiDownload /> Export Excel (CSV)
        </button>
        <button onClick={exportPDF} className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2.5 rounded-lg hover:bg-pink-700">
          <HiDownload /> Export PDF
        </button>
        <button onClick={printTable} className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800">
          <HiPrinter /> Imprimer
        </button>
        <button
          onClick={async ()=>{
            if(!window.confirm("Appliquer la priorisation intelligente sur tous les incidents ?")) return;
            try {
              const data = await applyPriorisation();
              setIncidents(data || []);
              toast.success("Priorisation intelligente appliquée !");
            } catch {
              toast.error("Erreur lors de la priorisation.");
            }
          }}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700"
        >
          <HiAdjustments /> Priorisation intelligente
        </button>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="min-w-full text-[15px] md:text-base">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-gray-700">
              <th className="p-3 border-b">ID</th>
              <th className="p-3 border-b">Titre</th>
              <th className="p-3 border-b">Description</th>
              <th className="p-3 border-b">Statut</th>
              <th className="p-3 border-b">Priorité</th>
              <th className="p-3 border-b">Technicien</th>
              <th className="p-3 border-b">Date création</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-6 text-gray-500">Aucun incident trouvé.</td>
              </tr>
            ) : incidents.map((incident, idx) => (
              <tr key={incident.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="p-3">{incident.id}</td>
                <td className="p-3 font-medium text-gray-800">{incident.titre}</td>
                <td className="p-3 text-gray-700">{incident.description}</td>

                {/* Statut */}
                <td className="p-3">
                  <select
                    className={clsx(
                      "px-3 py-2 rounded-lg border text-sm font-medium transition-colors duration-150",
                      STATUS_SELECT_CLS[incident.statut] || "bg-gray-100 text-gray-800 border-gray-300"
                    )}
                    value={incident.statut}
                    onChange={(e) => handleChangeStatut(incident, e.target.value)}
                  >
                    {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>

                {/* Priorité */}
                <td className="p-3">
                  <select
                    className={clsx(
                      "px-3 py-2 rounded-lg border text-sm font-medium transition-colors duration-150",
                      PRIORITY_SELECT_CLS[incident.priorite] || "bg-gray-100 text-gray-800 border-gray-300"
                    )}
                    value={incident.priorite}
                    onChange={(e) => handleChangePriorite(incident, e.target.value)}
                  >
                    {PRIORITES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>

                <td className="p-3">{incident.technicien?.nom || "Non assigné"}</td>
                <td className="p-3">{incident.dateCreation ? new Date(incident.dateCreation).toLocaleString() : "-"}</td>

                {/* Actions */}
                <td className="p-3">
                  {/* USER uniquement : tout sur une seule ligne */}
                  {isJustUser ? (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <ActionButton icon={HiClock}    label="Historique" color="blue"
                        onClick={() => openHistory(incident.id)} />
                      <ActionButton icon={HiSparkles} label="Suggestion" color="green"
                        onClick={() => openSuggestion(incident)} />
                      {canSeeEditBtn(incident) && (
                        <ActionButton icon={HiPencil} label="Éditer" color="indigo"
                          onClick={() => openEdit(incident)} />
                      )}
                      {/* pas de suppression pour user */}
                    </div>
                  ) : (
                    // Admin / Tech : mise en page actuelle (2 colonnes empilées)
                    <div className="flex gap-2">
                      <div className="flex flex-col gap-2">
                        <ActionButton icon={HiClock}    label="Historique" color="blue"
                          onClick={() => openHistory(incident.id)} />
                        <ActionButton icon={HiSparkles} label="Suggestion" color="green"
                          onClick={() => openSuggestion(incident)} />
                      </div>
                      {(canSeeEditBtn(incident) || canSeeDeleteBtn()) && (
                        <div className="flex flex-col gap-2">
                          {canSeeEditBtn(incident) && (
                            <ActionButton icon={HiPencil} label="Éditer" color="indigo"
                              onClick={() => openEdit(incident)} />
                          )}
                          {canSeeDeleteBtn() && (
                            <ActionButton icon={HiTrash}  label="Supprimer" color="red"
                              onClick={() => handleDelete(incident.id)} />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modale Historique */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">Historique des statuts — Incident #{historyIncidentId}</h3>
              <button onClick={closeHistory} className="text-gray-500 hover:text-gray-700" aria-label="Fermer">
                <HiX size={20}/>
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {historyRows.length === 0 ? (
                <p className="text-base text-gray-500">Aucun historique disponible.</p>
              ) : (
                <table className="min-w-full border border-gray-200 text-sm md:text-base">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Ancien statut</th>
                      <th className="p-2 border">Nouveau statut</th>
                      <th className="p-2 border">Modifié le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((row, idx)=>(
                      <tr key={idx}>
                        <td className="p-2 border">{row.ancienStatut}</td>
                        <td className="p-2 border">{row.nouveauStatut}</td>
                        <td className="p-2 border">
                          {row.dateChangement ? new Date(row.dateChangement).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-5 py-4 border-t text-right">
              <button onClick={closeHistory} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Suggestion */}
      {suggestionOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className={`bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all duration-150 ease-out
              ${suggestionAnimIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-yellow-50">
                  <HiLightBulb className="text-yellow-500" size={24} />
                </span>
                <div>
                  <h3 className="text-2xl font-semibold leading-tight">Suggestion — Incident #{suggestionIncidentId}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${suggestionCategory.cls}`}>
                    {suggestionCategory.badge}
                  </span>
                </div>
              </div>
              <button onClick={closeSuggestion} className="text-gray-500 hover:text-gray-700" aria-label="Fermer"><HiX size={22}/></button>
            </div>

            <div className="px-6 py-5">
              <p className="text-lg text-gray-800 whitespace-pre-line leading-relaxed">
                {highlightKeyword(suggestionText, suggestionCategory.keyword)}
              </p>
            </div>

            <div className="px-6 py-5 border-t flex justify-end gap-3">
              <button
                onClick={() => { if (suggestionText) { navigator.clipboard.writeText(suggestionText); toast.success("Suggestion copiée."); } }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-base"
              >
                <HiClipboardCopy size={20} /> Copier
              </button>
              <button onClick={closeSuggestion} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Éditer */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <h3 className="text-2xl font-semibold leading-tight">Éditer l’incident #{editIncidentId}</h3>
              <button onClick={closeEdit} className="text-gray-500 hover:text-gray-700" aria-label="Fermer">
                <HiX size={22}/>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={editForm.titre}
                  onChange={(e)=>setEditForm(f=>({...f, titre: e.target.value}))}
                  maxLength={255}
                  className="w-full px-3 py-2.5 border rounded-lg"
                  placeholder="Corriger le titre…"
                />
                <div className="text-xs text-gray-500 mt-1">{editForm.titre.length}/255</div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e)=>setEditForm(f=>({...f, description: e.target.value}))}
                  maxLength={4000}
                  rows={6}
                  className="w-full px-3 py-2.5 border rounded-lg"
                  placeholder="Corriger la description…"
                />
                <div className="text-xs text-gray-500 mt-1">{editForm.description.length}/4000</div>
              </div>
            </div>

            <div className="px-6 py-5 border-t flex justify-end gap-3">
              <button onClick={closeEdit} className="px-5 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">
                Annuler
              </button>
              <button onClick={saveEdit} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentList;
