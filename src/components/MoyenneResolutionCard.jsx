import React, { useEffect, useState } from "react";
import axios from "axios";
import { Paper, Stack, Typography, CircularProgress } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function MoyenneResolutionCard() {
  const [moyenne, setMoyenne] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoyenne = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          "http://localhost:8080/api/incidents/moyenne-resolution",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMoyenne(data);
      } catch (e) {
        console.error("Erreur lors de la récupération de la moyenne :", e);
        setMoyenne(0);
      } finally {
        setLoading(false);
      }
    };
    fetchMoyenne();
  }, []);

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <AccessTimeIcon color="action" />
        <Stack>
          <Typography variant="body2" color="text.secondary">⏱ Moy. de résolution</Typography>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
              {moyenne} j
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
