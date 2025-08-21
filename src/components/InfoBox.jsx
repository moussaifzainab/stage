import React from "react";
import { Paper, Box, Typography } from "@mui/material";

export default function InfoBox({ color="#3b82f6", title, value, sub }) {
  return (
    <Paper elevation={1} sx={{
      p: 2, borderRadius: 2, background: color, color:"#fff",
      display:"flex", flexDirection:"column", gap: .5, minHeight: 96
    }}>
      <Typography sx={{ fontWeight:700, fontSize:13, opacity:.95 }}>{title}</Typography>
      <Typography sx={{ fontSize:28, fontWeight:800, lineHeight:1 }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize:12, opacity:.85 }}>{sub}</Typography>}
    </Paper>
  );
}
