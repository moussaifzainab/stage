// src/pages/AjoutIncident.jsx
import React from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import IncidentForm from "./IncidentForm";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function AjoutIncident() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    toast.success("Incident ajouté avec succès !");
    setTimeout(() => navigate("/incidents"), 1200);
  };

  return (
    <SidebarLayout title="Ajouter un incident">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6">
        <IncidentForm onSuccess={handleSuccess} />
      </div>
    </SidebarLayout>
  );
}
