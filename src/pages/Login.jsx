// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import api, { setToken } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("admin@example.com");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErreur("");

    // on supprime tout éventuel vieux token avant l'appel
    localStorage.removeItem("token");
    localStorage.removeItem("roles");

    try {
      // => IMPORTANT: skipAuth empêche l’interceptor d’ajouter Authorization
      const { data } = await api.post(
        "/auth/login",
        {
          email: email.trim(),
          motDePasse: motDePasse.trim(),
          // au cas où ton backend attend "password" :
          password: motDePasse.trim(),
        },
        { skipAuth: true }
      );

      const token = data?.token || data?.access_token || data?.jwt;
      if (!token) {
        setErreur("Réponse inattendue du serveur (pas de token).");
        return;
      }

setToken(token);

      // Rôles via /auth/me (maintenant l'interceptor ajoutera Authorization)
      try {
        const me = await api.get("/auth/me");
        const roles = Array.isArray(me?.data?.roles) ? me.data.roles : [];
        localStorage.setItem("roles", JSON.stringify(roles));
      } catch {
        localStorage.setItem("roles", JSON.stringify([]));
      }

      navigate("/dashboard");
    } catch (err) {
      const msg = err?.response?.data;
      setErreur(typeof msg === "string" ? msg : "Identifiants invalides.");
      console.error(err);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center relative"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-xl bg-white/15 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20">
        <h1 className="text-center text-4xl font-bold mb-8">
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            LOGIN
          </span>
        </h1>

        {erreur && <div className="mb-4 text-red-200 bg-red-800/50 p-3 rounded-lg">{erreur}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm text-white mb-2">Adresse e-mail</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@entreprise.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white mb-2">Mot de passe</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPwd ? "text" : "password"}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/80 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPwd ? <AiFillEye /> : <AiFillEyeInvisible />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg shadow-lg hover:shadow-blue-500/50 transition-transform hover:scale-[1.02]"
          >
            Se connecter
          </button>
        </form>

        <p className="text-center text-xs text-gray-200 mt-6">
          © {new Date().getFullYear()} — EMSI & OCP
        </p>
      </div>
    </div>
  );
}
