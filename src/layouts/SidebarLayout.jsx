import React from "react";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Typography, Avatar
} from "@mui/material";
import { SpaceDashboard, Assignment, AddCircleOutline, Logout } from "@mui/icons-material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getUserFromToken, isAdmin, isUtilisateur } from "../services/authInfo";

// ⬇️ on importe la cloche
import NotificationBell from "../components/NotificationBell";

const drawerWidth = 230;

export default function SidebarLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const user = getUserFromToken();

  const displayName = user?.nom || "Utilisateur";
  const initials = (displayName || "U").slice(0,1).toUpperCase();

  const menu = [
    { label: "Tableau de bord", icon: <SpaceDashboard/>, to: "/dashboard" },
    { label: "Incidents",       icon: <Assignment/>,     to: "/incidents" },
  ];
  if (isAdmin() || isUtilisateur()) {
    menu.push({ label: "Ajouter un incident", icon: <AddCircleOutline/>, to: "/ajouter" });
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f7fb" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#0f172a",
            color: "#cbd5e1",
            borderRight: 0,
          },
        }}
        open
      >
        {/* User */}
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "#2563eb", width: 36, height: 36 }}>{initials}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              {displayName}
            </Typography>
          </Box>
        </Box>

        {/* Menu */}
        <List sx={{ px: 1 }}>
          {menu.map((m) => {
            const selected = location.pathname === m.to || location.pathname.startsWith(m.to + "/");
            return (
              <ListItemButton
                key={m.label}
                component={NavLink}
                to={m.to}
                selected={selected}
                sx={{
                  my: .3, borderRadius: 1,
                  "&.Mui-selected": {
                    bgcolor: "#1d4ed8", color:"#fff",
                    "& .MuiListItemIcon-root":{ color:"#fff" }
                  },
                  "&:hover": { bgcolor: "#111827" }
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: "#93a3b8" }}>{m.icon}</ListItemIcon>
                <ListItemText
                  primary={m.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ borderColor: "#1f2937" }} />
        <List>
          <ListItemButton
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("roles");
              window.location.href = "/login";
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: "#93a3b8" }}><Logout/></ListItemIcon>
            <ListItemText primary="Se déconnecter" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}/>
          </ListItemButton>
        </List>
      </Drawer>

      {/* Main */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${drawerWidth}px`,
          width: `calc(100% - ${drawerWidth}px)`,
          p: 2,
          maxWidth: "100%",
        }}
      >
        {/* ⬇️ Petite barre top-right pour la cloche */}
        <Box sx={{
          display:"flex", alignItems:"center", justifyContent:"flex-end",
          position:"sticky", top:0, zIndex: 5, mb: 1.5
        }}>
          <NotificationBell />
        </Box>

        {children}
      </Box>
    </Box>
  );
}
