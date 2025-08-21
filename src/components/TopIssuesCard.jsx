import * as React from "react";
import { Paper, Typography, List, ListItem, ListItemText, Chip, Box } from "@mui/material";

export default function TopIssuesCard({ incidents = [], max = 6 }) {
  const counts = incidents.reduce((acc, it) => {
    const key = it.titre || "Sans titre";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: 420, display: "flex", flexDirection: "column" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        📌 Top pannes
      </Typography>

      {top.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Pas de données.</Typography>
      ) : (
        <List dense sx={{ mt: 1 }}>
          {top.map(([titre, n], idx) => (
            <ListItem key={titre} disableGutters
              secondaryAction={<Chip label={`${n} cas`} size="small" />}
            >
              <ListItemText
                primary={titre}
                secondary={
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    Rang #{idx + 1}
                  </Box>
                }
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
