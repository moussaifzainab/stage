import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import AjoutIncident from "./pages/AjoutIncident";
import PrivateRoute from "./components/PrivateRoute";

// ✅ Provider des notifications (SSE)
import { NotificationsProvider } from "./context/NotificationsContext";

export default function App() {
  return (
    <BrowserRouter>
      {/* Tout l'app écoute le flux SSE via ce provider */}
      <NotificationsProvider>
        <ToastContainer position="top-right" autoClose={3000} />

        <Routes>
          {/* Login */}
          <Route path="/login" element={<Login />} />
          {/* "/" -> /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Dashboard : tous rôles authentifiés */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "TECHNICIEN", "UTILISATEUR"]}>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Incidents : tous rôles authentifiés */}
          <Route
            path="/incidents"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "TECHNICIEN", "UTILISATEUR"]}>
                <Incidents />
              </PrivateRoute>
            }
          />

          {/* Ajout : ADMIN + UTILISATEUR */}
          <Route
            path="/ajouter"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "UTILISATEUR"]}>
                <AjoutIncident />
              </PrivateRoute>
            }
          />

          {/* 404 -> dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </NotificationsProvider>
    </BrowserRouter>
  );
}
