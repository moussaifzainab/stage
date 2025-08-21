// src/pages/dashboards/AdminDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";
import { Box, Grid, Paper, Typography, Stack, Button, TextField, MenuItem } from "@mui/material";
import SidebarLayout from "../../layouts/SidebarLayout";
import InfoBox from "../../components/InfoBox";
import StatutBarChart from "../../components/StatutBarChart";
import RecentIncidentsCard from "../../components/RecentIncidentsCard";
import TopIssuesCard from "../../components/TopIssuesCard";
import { exportToExcel, exportToPDF } from "../../services/exportUtils";
import { toast } from "react-toastify";
import { getKpis, listParRole } from "../../services/incidents";

export default function AdminDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [statut, setStatut] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const shown = useRef(false);

  async function refresh({ showToast = true, resetFilters = false } = {}) {
    try {
      setRefreshing(true);
      const [list, k] = await Promise.all([listParRole(), getKpis()]);
      setIncidents(list || []);
      setKpis(k || null);
      if (resetFilters) {
        setStatut("");
        setDateFilter("");
        setFiltered(list || []);
      }
      if (showToast) {
        toast.success("🔄 Données mises à jour", { autoClose: 900, hideProgressBar: true });
      } else if (!shown.current) {
        toast.success(`✅ ${list?.length || 0} incident(s) chargés`, { autoClose: 900, hideProgressBar: true });
        shown.current = true;
      }
    } catch (e) {
      console.error(e);
      toast.error("❌ Erreur de chargement des données");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    refresh({ showToast: false, resetFilters: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let r = [...incidents];
    if (statut) r = r.filter((i) => i.statut === statut);
    if (dateFilter) r = r.filter((i) => i.dateCreation?.startsWith(dateFilter));
    setFiltered(r);
  }, [incidents, statut, dateFilter]);

  // Stats
  const total = filtered.length;
  const resolusLocal = filtered.filter((i) => i.statut === "RESOLU").length;

  // Groupements
  const byStatut = useMemo(() => filtered.reduce((a,i)=>((a[i.statut]=(a[i.statut]||0)+1),a),{}), [filtered]);
  const byTech   = useMemo(() => filtered.reduce((a,i)=>{const n=i.technicien?.nom||"Non assigné"; a[n]=(a[n]||0)+1; return a;},{}), [filtered]);
  const byDay    = useMemo(() => filtered.reduce((a,i)=>{const d=i.dateCreation?.split("T")[0]; if(d) a[d]=(a[d]||0)+1; return a;},{}), [filtered]);

  const dayLabels = Object.keys(byDay).sort();
  const dayData   = dayLabels.map(d=>byDay[d]);

  const pieData = {
    labels: Object.keys(byStatut),
    datasets: [{ data: Object.values(byStatut), backgroundColor: ["#3b82f6","#22c55e","#f59e0b","#ef4444","#94a3b8","#06b6d4","#8b5cf6"] }]
  };

  const issuesMap = useMemo(() => filtered.reduce((a,i)=>((a[i.titre]=(a[i.titre]||0)+1),a),{}), [filtered]);
  const topIssues = useMemo(()=>Object.entries(issuesMap).sort((a,b)=>b[1]-a[1]).slice(0,6),[issuesMap]);

  return (
    <SidebarLayout>
      {/* Filtres + Export */}
      <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs:"column", sm:"row" }} spacing={1.5} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} sx={{ flexWrap:"wrap" }}>
            <TextField select size="small" label="Statut" value={statut} onChange={e=>setStatut(e.target.value)} sx={{ minWidth:180 }}>
              <MenuItem value="">Tous</MenuItem>
              {["NOUVEAU","EN_ATTENTE","EN_COURS","RESOLU","NON_RESOLU","CLOTURE","ANNULE"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Date" type="date" value={dateFilter}
              onChange={e=>setDateFilter(e.target.value)} sx={{ minWidth:180 }}
              InputLabelProps={{ shrink:true }} />
            <Button size="small" variant="outlined" onClick={()=>refresh({ showToast:true, resetFilters:true })} disabled={refreshing}>
              {refreshing ? "Chargement..." : "Rafraîchir"}
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" color="success" onClick={()=>exportToExcel(filtered)}>EXCEL</Button>
            <Button size="small" variant="contained" color="error" onClick={()=>exportToPDF(filtered)}>PDF</Button>
          </Stack>
        </Stack>
      </Paper>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}><InfoBox color="#0ea5e9" title="Total incidents" value={kpis?.total ?? total} sub="Depuis le mois dernier" /></Grid>
        <Grid item xs={12} sm={6} md={3}><InfoBox color="#22c55e" title="Résolus" value={kpis?.resolus ?? resolusLocal} sub="Taux de résolution" /></Grid>
        <Grid item xs={12} sm={6} md={3}><InfoBox color="#f59e0b" title="Non résolus" value={kpis?.nonResolus ?? (total - resolusLocal)} sub="À suivre" /></Grid>
        <Grid item xs={12} sm={6} md={3}><InfoBox color="#ef4444" title="Moy. de résolution" value={`${kpis?.delaiMoyenResolutionJours ?? 0} j`} sub="Délai moyen" /></Grid>
      </Grid>

      {/* Graphs */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2, height: 360 }}>
            <Typography sx={{ fontWeight:700, mb: 1 }}>Donut Chart</Typography>
            <Box sx={{ height: 300 }}>
              <Pie data={pieData} options={{ responsive:true, maintainAspectRatio:false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2, height: 360 }}>
            <Typography sx={{ fontWeight:700, mb: 1 }}>Bar Chart</Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={{ labels: dayLabels, datasets: [{ label:"Incidents", data: dayData, backgroundColor:"#3b82f6" }] }}
                options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }}, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 }}} }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Listes */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={7}><RecentIncidentsCard incidents={filtered} /></Grid>
        <Grid item xs={12} md={5}><TopIssuesCard incidents={filtered} top={topIssues} /></Grid>
      </Grid>
    </SidebarLayout>
  );
}
