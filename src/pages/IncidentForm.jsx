import React from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function IncidentForm({ onSuccess }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const titre = e.target.titre.value.trim();
    const description = e.target.description.value.trim();
    const priorite = e.target.priorite.value;        // HAUTE | MOYENNE | FAIBLE
    const specialite = e.target.specialite.value;    // Réseau | Logiciel | Matériel

    if (!titre || !description) {
      toast.error("Titre et description sont requis.");
      return;
    }

    const payload = {
      titre,
      description,
      priorite,
      statut: "NOUVEAU",     // 🔒 fixé à la création (UI garde ton select mais désactivé)
      specialite,
    };

    try {
      await axios.post("http://localhost:8080/api/incidents", payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      toast.success("✅ Incident ajouté avec succès");
      e.target.reset();
      onSuccess && onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || "Erreur lors de la création.";
      toast.error(`❌ ${msg}`);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-[60vh]">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">🛠️ Nouveau Incident</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Titre</label>
            <input name="titre" className="w-full border border-gray-300 px-3 py-2 rounded" required />
          </div>

          <div>
            <label className="block mb-1 font-medium">Description</label>
            <textarea name="description" className="w-full border border-gray-300 px-3 py-2 rounded" required />
          </div>

          <div>
            <label className="block mb-1 font-medium">Priorité</label>
            <select name="priorite" className="w-full border border-gray-300 px-3 py-2 rounded" required>
              <option value="HAUTE">Haute</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="FAIBLE">Faible</option>
            </select>
          </div>

          

          <div>
            <label className="block mb-1 font-medium">Spécialité</label>
            <select name="specialite" className="w-full border border-gray-300 px-3 py-2 rounded" required>
              <option value="Réseau">Réseau</option>
              <option value="Logiciel">Logiciel</option>
              <option value="Matériel">Matériel</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}
