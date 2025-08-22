import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// ————————————————————————————————————————————————
//  🧩 Champs réutilisables (Input / Select / TextArea)
// ————————————————————————————————————————————————
function InputField({ label, error, children, required = false }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, error, required = false, disabled = false }) {
  return (
    <InputField label={label} error={error} required={required}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </InputField>
  );
}

function TextAreaField({ label, value, onChange, placeholder, error, required = false, rows = 6, maxLength = 500 }) {
  return (
    <InputField label={label} error={error} required={required}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent resize-none ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
        }`}
      />
      <div className="text-xs text-gray-500 text-right">
        {value.length}/{maxLength} caractères
      </div>
    </InputField>
  );
}

// ————————————————————————————————————————————————
//  ✅ Modal de succès
// ————————————————————————————————————————————————
function SuccessMessage({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Incident créé avec succès !</h3>
        <p className="text-gray-600 mb-6">Votre incident a été enregistré et sera traité dans les plus brefs délais.</p>
        <button
          onClick={onClose}
          className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————
//  🛠️ Formulaire principal (version Tailwind + API réelle)
// ————————————————————————————————————————————————
export default function ModernIncidentForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    priorite: "",
    specialite: "",
    statut: "NOUVEAU", // 🔒 fixé à la création
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const prioriteOptions = [
    { value: "HAUTE", label: "🔴 Haute - Critique" },
    { value: "MOYENNE", label: "🟡 Moyenne - Important" },
    { value: "FAIBLE", label: "🟢 Faible - Normal" },
  ];

  const specialiteOptions = [
    { value: "Réseau", label: "🌐 Réseau" },
    { value: "Logiciel", label: "💻 Logiciel" },
    { value: "Matériel", label: "🖥️ Matériel" },
  ];

  // ——— Validation locale ———
  const validateForm = () => {
    const newErrors = {};

    if (!formData.titre.trim()) newErrors.titre = "Le titre est obligatoire";
    else if (formData.titre.length < 5) newErrors.titre = "Le titre doit contenir au moins 5 caractères";

    if (!formData.description.trim()) newErrors.description = "La description est obligatoire";
    else if (formData.description.length < 10) newErrors.description = "La description doit contenir au moins 10 caractères";

    if (!formData.priorite) newErrors.priorite = "Veuillez sélectionner une priorité";
    if (!formData.specialite) newErrors.specialite = "Veuillez sélectionner une spécialité";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  // ——— Soumission (API réelle avec axios) ———
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        priorite: formData.priorite,
        specialite: formData.specialite,
        statut: "NOUVEAU", // sécurité côté client
      };

      await axios.post("http://localhost:8080/api/incidents", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("✅ Incident ajouté avec succès");
      setShowSuccess(true);

      // Reset
      setFormData({ titre: "", description: "", priorite: "", specialite: "", statut: "NOUVEAU" });
      setErrors({});
    } catch (err) {
      const msg = err?.response?.data?.message || "Erreur lors de la création.";
      toast.error(`❌ ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSuccess && onSuccess();
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🛠️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau Incident</h1>
            <p className="text-gray-600">Décrivez votre problème pour qu'il soit traité rapidement</p>
          </div>

          {/* Carte formulaire */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Progress bar (indicative) */}
            <div className="h-1 bg-gray-100">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{ width: '25%' }} />
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* 1) Informations générales */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <h2 className="text-xl font-semibold text-gray-900">Informations générales</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <InputField label="Titre de l'incident" error={errors.titre} required>
                      <input
                        type="text"
                        value={formData.titre}
                        onChange={(e) => handleInputChange('titre', e.target.value)}
                        placeholder="Ex: Problème de connexion VPN"
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent ${errors.titre ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                        maxLength={100}
                      />
                      <div className="text-xs text-gray-500 text-right mt-1">{formData.titre.length}/100 caractères</div>
                    </InputField>
                  </div>

                  <SelectField
                    label="Priorité"
                    value={formData.priorite}
                    onChange={(e) => handleInputChange('priorite', e.target.value)}
                    options={prioriteOptions}
                    placeholder="Sélectionnez la priorité"
                    error={errors.priorite}
                    required
                  />

                  <SelectField
                    label="Spécialité"
                    value={formData.specialite}
                    onChange={(e) => handleInputChange('specialite', e.target.value)}
                    options={specialiteOptions}
                    placeholder="Sélectionnez la spécialité"
                    error={errors.specialite}
                    required
                  />

                  {/* Statut affiché mais verrouillé */}
                  <SelectField
                    label="Statut"
                    value={formData.statut}
                    onChange={() => {}}
                    options={[{ value: 'NOUVEAU', label: '🆕 NOUVEAU' }]}
                    error={undefined}
                    required
                    disabled
                  />
                </div>
              </div>

              {/* 2) Description détaillée */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <h2 className="text-xl font-semibold text-gray-900">Description détaillée</h2>
                </div>

                <TextAreaField
                  label="Description du problème"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Décrivez en détail le problème, les étapes, messages d'erreur, impact..."
                  error={errors.description}
                  required
                  rows={6}
                  maxLength={500}
                />

                {/* Conseils */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Conseils pour une description efficace :</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Décrivez étape par étape ce qui s'est passé</li>
                    <li>• Mentionnez les messages d'erreur exacts</li>
                    <li>• Indiquez quand le problème a commencé</li>
                    <li>• Précisez si d'autres personnes sont affectées</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  onClick={() => {
                    setFormData({ titre: "", description: "", priorite: "", specialite: "", statut: "NOUVEAU" });
                    setErrors({});
                  }}
                >
                  🔄 Réinitialiser
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Création en cours...
                    </>
                  ) : (
                    <>✨ Créer l'incident</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Infos additionnelles */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-2">Traitement Rapide</h3>
              <p className="text-sm text-gray-600">Incidents traités en moyenne sous 2.5 jours</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">🔔</div>
              <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
              <p className="text-sm text-gray-600">Recevez des mises à jour automatiquement</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">👥</div>
              <h3 className="font-semibold text-gray-900 mb-2">Support Expert</h3>
              <p className="text-sm text-gray-600">Équipe technique spécialisée à votre service</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal succès */}
      {showSuccess && <SuccessMessage onClose={handleSuccessClose} />}
    </>
  );
}
