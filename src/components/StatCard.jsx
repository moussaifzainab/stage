import React from "react";
import { Paper, Box, Typography } from "@mui/material";

export default function StatCard({ color="#0ea5e9", title, value, action="More info" }) {
  return (
    <Paper sx={{ p:2, borderRadius:2, color:"#fff", bgcolor: color }}>
      <Typography sx={{ fontWeight:700, fontSize:14, opacity:.95 }}>{title}</Typography>
      <Box sx={{ fontSize:28, fontWeight:900, mt: .5 }}>{value}</Box>
      <Box sx={{
        mt:1, fontSize:12, fontWeight:700, display:"inline-block",
        px:1, py:.5, borderRadius:999, bgcolor:"rgba(255,255,255,.2)"
      }}>{action} →</Box>
    </Paper>
  );
}
