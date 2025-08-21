import * as React from "react";
import { Paper, Typography, List, ListItem, ListItemText, Divider } from "@mui/material";

export default function RecentIncidentsCard({ incidents = [], max = 6 }) {
  const recents = [...incidents]
    .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0))
    .slice(0, max);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: 420, display: "flex", flexDirection: "column" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        🕒 Incidents récents
      </Typography>

      {recents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Aucun incident.</Typography>
      ) : (
        <List dense sx={{ overflowY: "auto" }}>
          {recents.map((i, idx) => (
            <React.Fragment key={i.id ?? idx}>
              <ListItem disableGutters>
                <ListItemText
                  primary={i.titre || "—"}
                  secondary={`${i.statut || "—"} • ${i.dateCreation ? new Date(i.dateCreation).toLocaleString() : "—"}`}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              {idx < recents.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
}
