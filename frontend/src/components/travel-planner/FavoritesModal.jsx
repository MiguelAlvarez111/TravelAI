/**
 * FavoritesModal.jsx - Modal para mostrar y gestionar favoritos
 */

import React, { memo } from 'react';
import { BookOpen, X } from 'lucide-react';

const FavoritesModal = memo(({ 
  showFavorites, 
  setShowFavorites, 
  favorites, 
  handleLoadFavorite, 
  handleDeleteFavorite 
}) => {
  if (!showFavorites) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-slate-400" />
            Mis Viajes Guardados
          </h2>
          <button
            type="button"
            onClick={() => setShowFavorites(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {favorites.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No tienes viajes guardados aún</p>
              <p className="text-sm mt-2 text-slate-400">Planifica un viaje y guárdalo para accederlo después</p>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((fav, index) => (
                <div
                  key={index}
                  className="border border-slate-200/50 rounded-2xl p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-900 mb-1">
                        {fav.destination}
                      </h3>
                      <div className="text-sm text-slate-500 space-y-1">
                        {fav.date && <p>📅 {fav.date}</p>}
                        {fav.budget && <p>💰 {fav.budget}</p>}
                        {fav.style && <p>🎯 {fav.style}</p>}
                      </div>
                      {fav.summary && (
                        <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                          {fav.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => handleLoadFavorite(fav)}
                        className="px-4 py-2 bg-[#007AFF] text-white rounded-full hover:bg-[#0051D5] transition-colors text-sm font-medium"
                      >
                        Cargar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFavorite(index)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

FavoritesModal.displayName = 'FavoritesModal';

export default FavoritesModal;

