import React, { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { getUserFromToken, isAdmin, isUtilisateur } from "../services/authInfo";

// ————————————————————————————————————————————————
//  🧭 Configuration du menu (avec rôles)
// ————————————————————————————————————————————————
const baseItems = [
  { label: "Tableau de bord", icon: "📊", path: "/dashboard", roles: ["ADMIN", "TECHNICIEN", "UTILISATEUR"] },
  { label: "Incidents",       icon: "🛠️", path: "/incidents", roles: ["ADMIN", "TECHNICIEN", "UTILISATEUR"] },
];

const extraItems = [
  { label: "Ajouter incident", icon: "➕", path: "/ajouter", roles: ["ADMIN", "UTILISATEUR"] },
  { label: "Rapports",         icon: "📈", path: "/rapports", roles: ["ADMIN"] },
  { label: "Utilisateurs",     icon: "👥", path: "/utilisateurs", roles: ["ADMIN"] },
];

const profileItems = [
  { label: "Mon Profil",       icon: "👤", path: "/profil", roles: ["ADMIN", "TECHNICIEN", "UTILISATEUR"] },
  { label: "Paramètres",       icon: "⚙️", path: "/parametres", roles: ["ADMIN", "TECHNICIEN", "UTILISATEUR"] },
];

// ————————————————————————————————————————————————
//  🧩 Élément de navigation
// ————————————————————————————————————————————————
function NavItem({ item, activePath, onClick }) {
  const isActive = activePath === item.path || activePath.startsWith(item.path + "/");
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive: navIsActive }) => 
        `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ` +
        `${(isActive || navIsActive)
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
      }
    >
      <span className="text-xl" aria-hidden>{item.icon}</span>
      <span className="font-medium truncate">{item.label}</span>
      {(isActive) && <span className="ml-auto w-2 h-2 bg-white rounded-full" />}
    </NavLink>
  );
}

// ————————————————————————————————————————————————
//  👤 Profil utilisateur (menu déroulant)
// ————————————————————————————————————————————————
function UserProfile({ displayName, email, roleLabel, onLogout, compact }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  const initials = useMemo(() => {
    if (!displayName) return 'U';
    return displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }, [displayName]);

  const handleProfileClick = () => {
    setOpen(false);
    navigate('/profil');
  };

  const handleSettingsClick = () => {
    setOpen(false);
    navigate('/parametres');
  };

  if (compact) {
    return (
      <button className="w-full p-3 rounded-xl hover:bg-gray-100 transition-colors" onClick={() => setOpen(!open)}>
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mx-auto">
          {initials}
        </div>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
          {initials}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-medium text-gray-900 truncate">{displayName || 'Utilisateur'}</p>
          <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
        </div>
        <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="font-medium text-gray-900 truncate">{displayName}</p>
            {email && <p className="text-sm text-gray-500 truncate">{email}</p>}
          </div>
          <div className="p-1">
            <button 
              onClick={handleSettingsClick}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              ⚙️ Paramètres
            </button>
            <button 
              onClick={handleProfileClick}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              👤 Mon Profil
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ————————————————————————————————————————————————
//  🧱 Layout principal (version Tailwind, navigation réelle)
// ————————————————————————————————————————————————
export default function ModernSidebarLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();

  // Récupération de l'utilisateur depuis le token (comme votre version MUI)
  const user = getUserFromToken?.() || {};
  const displayName = user?.nom || 'Utilisateur';
  const email = user?.email || '';

  // Détermination des rôles
  const rolesFromToken = Array.isArray(user?.roles) ? user.roles : [];
  const hasAdmin = isAdmin?.() || rolesFromToken.includes('ADMIN');
  const hasUtilisateur = isUtilisateur?.() || rolesFromToken.includes('UTILISATEUR');
  const roleLabel = hasAdmin ? 'ADMIN' : (rolesFromToken[0] || 'UTILISATEUR');

  // Construction finale du menu selon rôles
  const menuItems = useMemo(() => {
    let items = [...baseItems];
    
    // Ajouter les fonctionnalités selon les rôles
    if (hasAdmin || hasUtilisateur) {
      items.push(extraItems[0]); // Ajouter incident
    }
    if (hasAdmin) {
      items.push(extraItems[1], extraItems[2]); // Rapports + Utilisateurs
    }
    
    return items;
  }, [hasAdmin, hasUtilisateur]);

  // État UI
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activePath = location.pathname;

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('roles');
    } catch (e) {}
    navigate('/login');
  };

  const getPageTitle = () => {
    const currentItem = [...menuItems, ...profileItems].find(
      (i) => activePath === i.path || activePath.startsWith(i.path + "/")
    );
    return currentItem?.label || 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ——— Sidebar ——— */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  IncidentPro
                </h1>
                <p className="text-sm text-gray-500">Gestion d'incidents</p>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                I
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={sidebarOpen ? 'Réduire le menu' : 'Déployer le menu'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarOpen ? (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Navigation</p>
              {menuItems.map((item) => (
                <NavItem key={item.path} item={item} activePath={activePath} onClick={() => {}} />
              ))}
              
              {/* Section Compte */}
              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Compte</p>
                {profileItems.map((item) => (
                  <NavItem key={item.path} item={item} activePath={activePath} onClick={() => {}} />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Navigation principale compacte */}
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={({ isActive }) =>
                    `w-full p-3 rounded-xl transition-all duration-200 flex items-center justify-center ` +
                    `${isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`
                  }
                >
                  <span className="text-xl" aria-hidden>{item.icon}</span>
                </NavLink>
              ))}
              
              {/* Séparateur */}
              <div className="h-px bg-gray-200 mx-2"></div>
              
              {/* Navigation compte compacte */}
              {profileItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={({ isActive }) =>
                    `w-full p-3 rounded-xl transition-all duration-200 flex items-center justify-center ` +
                    `${isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`
                  }
                >
                  <span className="text-xl" aria-hidden>{item.icon}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Profil utilisateur */}
        <div className="p-4 border-t border-gray-200">
          <UserProfile
            displayName={displayName}
            email={email}
            roleLabel={roleLabel}
            onLogout={handleLogout}
            compact={!sidebarOpen}
          />
        </div>
      </aside>

      {/* ——— Contenu principal ——— */}
      <section className="flex-1 flex flex-col overflow-hidden">
        {/* ✅ MODIFIÉ: Top Bar sans barre de recherche */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 truncate">
                {getPageTitle()}
              </h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* ✅ SUPPRIMÉ: Barre de recherche */}

              {/* Notifications */}
              <NotificationBell />

              {/* Actions rapides */}
              <button 
                onClick={() => navigate('/parametres')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors" 
                aria-label="Paramètres"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}