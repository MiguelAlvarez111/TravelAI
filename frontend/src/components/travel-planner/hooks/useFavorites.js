/**
 * useFavorites.js - Hook personalizado para gestión de favoritos
 */

import { useState, useEffect } from 'react';

export const useFavorites = (travelData, formData) => {
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Cargar favoritos al iniciar
  useEffect(() => {
    const savedFavorites = localStorage.getItem('viajeia_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Verificar si el viaje actual está en favoritos
  useEffect(() => {
    if (travelData && formData.destination) {
      const currentTrip = {
        destination: formData.destination,
        date_start: formData.date_start,
        date_end: formData.date_end,
        budget: formData.budget,
        style: formData.style
      };
      const isSaved = favorites.some(fav => 
        fav.destination === currentTrip.destination &&
        fav.date_start === currentTrip.date_start &&
        fav.date_end === currentTrip.date_end
      );
      setIsFavorited(isSaved);
    }
  }, [travelData, formData.destination, formData.date_start, formData.date_end, favorites]);

  const handleToggleFavorite = () => {
    if (!travelData || !formData.destination) return;

    const currentTrip = {
      destination: formData.destination,
      date_start: formData.date_start,
      date_end: formData.date_end,
      budget: formData.budget,
      style: formData.style,
      summary: travelData.gemini_response.substring(0, 200) + '...',
      createdAt: new Date().toISOString()
    };

    if (isFavorited) {
      const updatedFavorites = favorites.filter(fav => 
        !(fav.destination === currentTrip.destination && 
          fav.date_start === currentTrip.date_start && 
          fav.date_end === currentTrip.date_end)
      );
      setFavorites(updatedFavorites);
      localStorage.setItem('viajeia_favorites', JSON.stringify(updatedFavorites));
      setIsFavorited(false);
    } else {
      const updatedFavorites = [...favorites, currentTrip];
      setFavorites(updatedFavorites);
      localStorage.setItem('viajeia_favorites', JSON.stringify(updatedFavorites));
      setIsFavorited(true);
    }
  };

  const handleLoadFavorite = (favorite) => {
    return {
      destination: favorite.destination,
      date_start: favorite.date_start || '',
      date_end: favorite.date_end || favorite.date || '',
      budget: favorite.budget || '',
      style: favorite.style || ''
    };
  };

  const handleDeleteFavorite = (index) => {
    const updatedFavorites = favorites.filter((_, i) => i !== index);
    setFavorites(updatedFavorites);
    localStorage.setItem('viajeia_favorites', JSON.stringify(updatedFavorites));
  };

  return {
    favorites,
    showFavorites,
    setShowFavorites,
    isFavorited,
    handleToggleFavorite,
    handleLoadFavorite,
    handleDeleteFavorite
  };
};

