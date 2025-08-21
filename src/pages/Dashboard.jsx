// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";
import SidebarLayout from "../layouts/SidebarLayout";
import { listParRole, getKpis } from "../services/incidents";
import { exportToExcel, exportToPDF } from "../services/exportUtils";
import { toast } from "react-toastify";
import { groupByCategory } from "../utils/issueBuckets";

/** Tuile KPI compacte */
function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-800">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [statut, setStatut] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const shown = useRef(false);

  // Chargement initial
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [list, k] = await Promise.all([listParRole(), getKpis()]);
      setIncidents(list || []);
      setKpis(k || null);
      if (!shown.current) {
        toast.success("Données mises à jour");
        shown.current = true;
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement des données");
    }
  }

  // Filtrage local
  useEffect(() => {
    let r = [...incidents];
    if (statut) r = r.filter((i) => i.statut === statut);
    if (dateFilter) r = r.filter((i) => i.dateCreation?.startsWith(dateFilter));
    setFiltered(r);
  }, [incidents, statut, dateFilter]);

  // ====== Dérivées ======
  const total = filtered.length;
  const resolusLocal   = filtered.filter((i) => i.statut === "RESOLU").length;
  const cloturesLocal  = filtered.filter((i) => i.statut === "CLOTURE").length;
  const nonResolusCalc = Math.max(0, total - resolusLocal - cloturesLocal);

  const tauxResolution = (() => {
    const t = kpis?.total ?? total;
    const r = kpis?.resolus ?? resolusLocal;
    return t ? Math.round((r / t) * 100) : 0;
  })();

  const delaiMoyen = `${Math.round(kpis?.delaiMoyenResolutionJours ?? 0)} j`;

  // 🔎 Pannes fréquentes (catégorisation robuste)
  const frequentCategories = useMemo(() => groupByCategory(filtered), [filtered]);
  const panneFreq = frequentCategories[0]?.key || "—";
  const top3 = frequentCategories.slice(0, 3);

  // 🥧 Répartition des statuts (tous les statuts)
  const pieData = useMemo(() => {
    const counts = {
      NOUVEAU: 0, EN_COURS: 0, EN_ATTENTE: 0,
      RESOLU: 0, NON_RESOLU: 0, CLOTURE: 0, ANNULE: 0,
    };
    filtered.forEach(i => { if (counts[i.statut] != null) counts[i.statut]++; });

    return {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ["#60A5FA","#F97316","#FACC15","#10B981","#EF4444","#6B7280","#A78BFA"],
      }],
    };
  }, [filtered]);

  // 📈 Évolution quotidienne (par statut simplifié)
  const barByStatus = useMemo(() => {
    const groups = { RESOLU: 0, NON_RESOLU: 0, CLOTURE: 0 };
    filtered.forEach((i) => {
      if (i.statut === "RESOLU") groups.RESOLU++;
      else if (i.statut === "CLOTURE") groups.CLOTURE++;
      else groups.NON_RESOLU++;
    });
    return {
      labels: ["Résolu", "Non Résolu", "Clôturé"],
      datasets: [{
        label: "Incidents par Statut",
        data: [groups.RESOLU, groups.NON_RESOLU, groups.CLOTURE],
        backgroundColor: ["#22c55e", "#ef4444", "#6b7280"],
      }],
    };
  }, [filtered]);

  // 📅 Évolution des incidents par jour
  const byDay = useMemo(() => {
    const m = {};
    filtered.forEach((i) => {
      const d = i.dateCreation?.split("T")[0];
      if (d) m[d] = (m[d] || 0) + 1;
    });
    const labels = Object.keys(m).sort();
    return { labels, data: labels.map((d) => m[d]) };
  }, [filtered]);

  // 👷 Répartition par technicien
  const byTech = useMemo(() => {
    const m = {};
    filtered.forEach((i) => {
      const name = i.technicien?.nom || "Non assigné";
      m[name] = (m[name] || 0) + 1;
    });
    const labels = Object.keys(m);
    return { labels, data: labels.map((k) => m[k]) };
  }, [filtered]);

  // ====== UI ======
  return (
    <SidebarLayout>
      {/* En-tête bleue */}
      <div className="bg-[#1e3aef] text-white rounded-xl shadow-sm px-5 py-3 mb-4 flex items-center justify-center">
        <div className="text-xl md:text-2xl font-bold">
          🚀 Tableau de Bord - Gestion des Incidents
        </div>
      </div>

      {/* Filtres + Export + Réinitialiser (pas de bouton Rafraîchir) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Statut</label>
            <select
              className="px-3 py-2 border rounded-md bg-white"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
            >
              <option value="">Tous</option>
              {["NOUVEAU","EN_COURS","EN_ATTENTE","RESOLU","NON_RESOLU","CLOTURE","ANNULE"].map(s =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Date</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="px-3 py-2 border rounded-md bg-white"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {(dateFilter || statut) && (
                <button
                  onClick={() => { setDateFilter(""); setStatut(""); }}
                  className="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => exportToExcel(filtered)}
              className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
            >
              Exporter Excel
            </button>
            <button
              onClick={() => exportToPDF(filtered)}
              className="px-3 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm"
            >
              Exporter PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <StatCard title="Taux de Résolution" value={`${tauxResolution}%`} />
        <StatCard title="Panne fréquente" value={panneFreq} />
        <StatCard title="Total Incidents" value={String(kpis?.total ?? total)} />
        <StatCard title="Moy. de résolution" value={delaiMoyen} />
      </div>

      {/* 🏆 Top 3 pannes fréquentes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <div className="text-sm font-semibold text-slate-700 mb-2">🏆 Top 3 pannes fréquentes</div>
        {top3.length === 0 ? (
          <div className="text-slate-500 text-sm">Aucune donnée.</div>
        ) : (
          <ul className="space-y-2">
            {top3.map(({ key, count }, idx) => (
              <li key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">#{idx + 1}</span>
                  <span className="font-medium text-slate-800">{key}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{count} cas</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ligne 1 : Répartition des statuts + Évolution quotidienne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-sm font-semibold text-slate-700 mb-2">🧭 Répartition des Statuts</div>
          <div className="h-[320px]">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-sm font-semibold text-slate-700 mb-2">📈 Évolution quotidienne (par statut)</div>
          <div className="h-[320px]">
            <Bar
              data={barByStatus}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Ligne 2 : Par jour + Par technicien (côte à côte) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-sm font-semibold text-slate-700 mb-2">📅 Évolution des incidents par jour</div>
          <div className="h-[340px]">
            <Bar
              data={{ labels: byDay.labels, datasets: [{ label: "Incidents", data: byDay.data, backgroundColor: "#3b82f6" }] }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-sm font-semibold text-slate-700 mb-2">👷 Répartition par technicien</div>
          <div className="h-[340px]">
            <Bar
              data={{ labels: byTech.labels, datasets: [{ label: "Incidents", data: byTech.data, backgroundColor: "#6366F1" }] }}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
