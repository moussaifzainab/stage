// src/pages/dashboards/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import { Box, Grid, Paper, Typography } from "@mui/material";
import SidebarLayout from "../../layouts/SidebarLayout";
import InfoBox from "../../components/InfoBox";
import RecentIncidentsCard from "../../components/RecentIncidentsCard";
import TopIssuesCard from "../../components/TopIssuesCard";
import { listParRole, getKpis } from "../../services/incidents";
import { toast } from "react-toastify";

export default function UserDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [list, k] = await Promise.all([listParRole(), getKpis()]);
        setIncidents(list || []);
        setKpis(k || null);
      } catch (e) {
        console.error(e);
        toast.error("❌ Erreur de chargement des données");
      }
    })();
  }, []);

  const total = incidents.length;
  const resolusLocal = incidents.filter((i) => i.statut === "RESOLU").length;

  const byStatut = useMemo(
    () => incidents.reduce((a, i) => ((a[i.statut] = (a[i.statut] || 0) + 1), a), {}),
    [incidents]
  );

  const pieData = {
    labels: Object.keys(byStatut),
    datasets: [
      {
        data: Object.values(byStatut),
        backgroundColor: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8"],
      },
    ],
  };

  const issuesMap = useMemo(
    () => incidents.reduce((a, i) => ((a[i.titre] = (a[i.titre] || 0) + 1), a), {}),
    [incidents]
  );
  const topIssues = useMemo(
    () => Object.entries(issuesMap).sort((a, b) => b[1] - a[1]).slice(0, 6),
    [issuesMap]
  );

  return (
    <SidebarLayout>
      {/* KPIs (simples) */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoBox color="#0ea5e9" title="Mes incidents" value={kpis?.total ?? total} sub="" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoBox color="#22c55e" title="Résolus" value={kpis?.resolus ?? resolusLocal} sub="" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoBox color="#f59e0b" title="En cours / attente" value={(kpis?.nonResolus ?? total - resolusLocal)} sub="" />
        </Grid>
      </Grid>

      {/* donut + listes */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2, height: 360 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Répartition des statuts</Typography>
            <Box sx={{ height: 300 }}>
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <TopIssuesCard incidents={incidents} top={topIssues} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <RecentIncidentsCard incidents={incidents} />
        </Grid>
      </Grid>
    </SidebarLayout>
  );
}
