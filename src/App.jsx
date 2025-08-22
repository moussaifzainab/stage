// src/App.jsx
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
// import Api from "./pages/Api"; // Commenté car le fichier n'existe pas encore

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

          {/* Dashboard - Accessible à tous les utilisateurs authentifiés */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "TECHNICIEN", "UTILISATEUR"]}>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Incidents - Accessible à tous les utilisateurs authentifiés */}
          <Route
            path="/incidents"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "TECHNICIEN", "UTILISATEUR"]}>
                <Incidents />
              </PrivateRoute>
            }
          />

          {/* Ajouter incident - Accessible aux ADMIN et UTILISATEUR */}
          <Route
            path="/ajouter"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "UTILISATEUR"]}>
                <AjoutIncident />
              </PrivateRoute>
            }
          />

          {/* Rapports - Accessible uniquement aux ADMIN */}
          <Route
            path="/rapports"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <Rapports />
              </PrivateRoute>
            }
          />

          {/* Gestion des utilisateurs - Accessible uniquement aux ADMIN */}
          <Route
            path="/utilisateurs"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <Utilisateurs />
              </PrivateRoute>
            }
          />

          {/* API Documentation - Accessible uniquement aux ADMIN */}
          {/* 
          <Route
            path="/api"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <Api />
              </PrivateRoute>
            }
          />
          */}

          {/* Profil - Accessible à tous les utilisateurs authentifiés */}
          <Route
            path="/profil"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "TECHNICIEN", "UTILISATEUR"]}>
                <Profil />
              </PrivateRoute>
            }
          />

          {/* Paramètres - Accessible à tous les utilisateurs authentifiés */}
          <Route
            path="/parametres"
            element={
              <PrivateRoute allowedRoles={["ADMIN", "TECHNICIEN", "UTILISATEUR"]}>
                <Parametres />
              </PrivateRoute>
            }
          />

          {/* Route par défaut - Redirection vers dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </NotificationsProvider>
    </BrowserRouter>
  );
}