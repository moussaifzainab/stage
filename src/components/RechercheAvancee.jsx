import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const RechercheAvancee = ({ onResult }) => {
  const [form, setForm] = useState({
    titre: '',
    description: '',
    statut: '',
    priorite: '',
    technicienNom: '',
    dateDebut: '',
    dateFin: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8080/api/incidents/search',
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      onResult(response.data);
      toast.success(`🔍 ${response.data.length} résultat(s) trouvé(s).`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la recherche.");
    }
  };

  const handleReset = () => {
    setForm({
      titre: '',
      description: '',
      statut: '',
      priorite: '',
      technicienNom: '',
      dateDebut: '',
      dateFin: ''
    });
    onResult([]); // ou on peut relancer fetchIncidents()
  };

  return (
    <form className="bg-white p-4 shadow rounded mb-6 grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleSearch}>
      <input type="text" name="titre" value={form.titre} onChange={handleChange} placeholder="Titre" className="border px-3 py-2 rounded" />
      <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border px-3 py-2 rounded" />
      <input type="text" name="technicienNom" value={form.technicienNom} onChange={handleChange} placeholder="Nom du technicien" className="border px-3 py-2 rounded" />
      <select name="statut" value={form.statut} onChange={handleChange} className="border px-3 py-2 rounded">
        <option value="">Statut</option>
        <option value="NOUVEAU">Nouveau</option>
        <option value="EN_COURS">En cours</option>
        <option value="EN_ATTENTE">En attente</option>
        <option value="RESOLU">Résolu</option>
        <option value="NON_RESOLU">Non résolu</option>
        <option value="CLOTURE">Clôturé</option>
        <option value="ANNULE">Annulé</option>
      </select>
      <select name="priorite" value={form.priorite} onChange={handleChange} className="border px-3 py-2 rounded">
        <option value="">Priorité</option>
        <option value="HAUTE">Haute</option>
        <option value="MOYENNE">Moyenne</option>
        <option value="FAIBLE">Faible</option>
      </select>
      <input type="datetime-local" name="dateDebut" value={form.dateDebut} onChange={handleChange} className="border px-3 py-2 rounded" />
      <input type="datetime-local" name="dateFin" value={form.dateFin} onChange={handleChange} className="border px-3 py-2 rounded" />

      <div className="md:col-span-3 flex gap-4 justify-end">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">🔍 Rechercher</button>
        <button type="button" onClick={handleReset} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">♻️ Réinitialiser</button>
      </div>
    </form>
  );
};

export default RechercheAvancee;
