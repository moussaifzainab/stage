// src/App.jsx (Version test temporaire)
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import AjoutIncident from "./pages/AjoutIncident";
import Rapports from "./pages/Rapports";
import Utilisateurs from "./pages/Utilisateurs";
import Profil from "./pages/Profil";
import Parametres from "./pages/Parametres";

import PrivateRoute from "./components/PrivateRoute";
import { NotificationsProvider } from "./context/NotificationsContext";

export default function App() {
  return (
    <BrowserRouter>
      <NotificationsProvider>
        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <Routes>
          {/* Pages publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "TECHNICIEN", "UTILISATEUR"]}>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Incidents */}
          <Route
            path="/incidents"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "TECHNICIEN", "UTILISATEUR"]}>
                <Incidents />
              </PrivateRoute>
            }
          />

          {/* ✅ TEST: Paramètres SANS PrivateRoute */}
          <Route path="/parametres" element={<Parametres />} />

          {/* Profil */}
          <Route
            path="/profil"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "TECHNICIEN", "UTILISATEUR"]}>
                <Profil />
              </PrivateRoute>
            }
          />

          {/* Autres routes... */}
          <Route
            path="/ajouter"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "UTILISATEUR"]}>
                <AjoutIncident />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/rapports"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <Rapports />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/utilisateurs"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <Utilisateurs />
              </PrivateRoute>
            }
          />

          {/* Route par défaut */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </NotificationsProvider>
    </BrowserRouter>
  );
}