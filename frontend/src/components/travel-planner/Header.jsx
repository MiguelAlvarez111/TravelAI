/**
 * Header.jsx - Barra de navegación superior
 */

import React, { memo } from 'react';
import { Plane, LogOut } from 'lucide-react';

/**
 * Helper function para obtener iniciales del usuario
 * @param {Object} user - Objeto de usuario de Firebase
 * @returns {string} - Iniciales del usuario
 */
export const getUserInitials = (user) => {
  if (user?.displayName) {
    return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  if (user?.email) {
    return user.email[0].toUpperCase();
  }
  return 'U';
};

const Header = memo(({ user, handleLogout }) => (
  <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
    <div className="max-w-5xl mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[#111111] flex items-center gap-2">
          <Plane className="w-5 h-5 text-indigo-600" />
          ViajeIA
        </h1>
        <div className="flex items-center gap-3">
          {user && (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-semibold">
              {getUserInitials(user)}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-full transition-all duration-200"
            title="Cerrar Sesión"
          >
            <span className="text-sm">Salir</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </header>
));

Header.displayName = 'Header';

export default Header;

