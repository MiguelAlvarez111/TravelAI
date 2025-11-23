/**
 * ImageGallery.jsx - Horizontal Snap Carousel para galería de imágenes
 * Estilo Netflix con scroll horizontal y snap points
 */

import React, { memo } from 'react';

const ImageGallery = memo(({ images, destination, onImageClick }) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-slate-100/50">
      <h3 className="text-xl font-semibold tracking-tight text-[#111111] mb-6">
        📸 Galería del Destino
      </h3>
      
      <div 
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4
                   [&::-webkit-scrollbar]:hidden
                   [-ms-overflow-style:none]"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {images.map((imageUrl, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-72 h-64 snap-center rounded-2xl overflow-hidden
                       shadow-md hover:shadow-lg transition-all duration-300
                       hover:scale-105 cursor-pointer"
            onClick={() => onImageClick?.(imageUrl)}
          >
            <img
              src={imageUrl}
              alt={`${destination} ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
});

ImageGallery.displayName = 'ImageGallery';

export default ImageGallery;

