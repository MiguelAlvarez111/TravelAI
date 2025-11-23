/**
 * LightboxModal.jsx - Modal para mostrar imágenes en tamaño completo
 */

import React, { memo } from 'react';
import { X } from 'lucide-react';

const LightboxModal = memo(({ lightboxImage, setLightboxImage }) => {
  if (!lightboxImage) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setLightboxImage(null)}
    >
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
        <button
          type="button"
          onClick={() => setLightboxImage(null)}
          className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
        >
          <X className="w-6 h-6 text-slate-900" />
        </button>
        <img 
          src={lightboxImage} 
          alt="Vista ampliada"
          className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
});

LightboxModal.displayName = 'LightboxModal';

export default LightboxModal;

