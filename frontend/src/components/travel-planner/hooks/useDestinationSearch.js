/**
 * useDestinationSearch.js - Hook personalizado para búsqueda de destinos
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export const useDestinationSearch = () => {
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const destinationSearchTimeoutRef = useRef(null);

  const searchCities = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Error al buscar ciudades');
      }

      const data = await response.json();
      
      if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
        return;
      }
      
      const formattedSuggestions = data.features
        .filter(feature => {
          if (!feature.properties || !feature.properties.name) return false;
          const osmKey = feature.properties.osm_key || '';
          const type = feature.properties.type || '';
          return (
            osmKey === 'place' ||
            osmKey === 'boundary' ||
            osmKey === 'tourism' ||
            type === 'city' ||
            type === 'town' ||
            type === 'village' ||
            type === 'district' ||
            feature.properties.name
          );
        })
        .map(feature => {
          const properties = feature.properties || {};
          const coordinates = feature.geometry?.coordinates || [];
          const lon = coordinates[0] || null;
          const lat = coordinates[1] || null;
          
          let displayName = '';
          if (properties.name && properties.country) {
            displayName = properties.name.includes(properties.country)
              ? properties.name
              : `${properties.name}, ${properties.country}`;
          } else if (properties.city && properties.country) {
            displayName = `${properties.city}, ${properties.country}`;
          } else if (properties.name) {
            displayName = properties.name;
          } else if (properties.country) {
            displayName = properties.country;
          }
          
          const fullNameParts = [];
          if (properties.name) fullNameParts.push(properties.name);
          if (properties.city && properties.city !== properties.name) fullNameParts.push(properties.city);
          if (properties.state) fullNameParts.push(properties.state);
          if (properties.country) fullNameParts.push(properties.country);
          const fullName = fullNameParts.length > 0 ? fullNameParts.join(', ') : displayName;
          
          return {
            display_name: displayName,
            full_name: fullName || displayName,
            lat: lat,
            lon: lon
          };
        })
        .filter(item => item.display_name && item.display_name.trim().length > 0)
        .slice(0, 5);

      setDestinationSuggestions(formattedSuggestions);
      setShowDestinationSuggestions(formattedSuggestions.length > 0);
    } catch (error) {
      console.error('Error al buscar ciudades:', error);
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (destinationSearchTimeoutRef.current) {
        clearTimeout(destinationSearchTimeoutRef.current);
      }
    };
  }, []);

  const triggerSearch = useCallback((value) => {
    if (destinationSearchTimeoutRef.current) {
      clearTimeout(destinationSearchTimeoutRef.current);
    }
    
    if (!value || value.trim().length < 2) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      return;
    }
    
    destinationSearchTimeoutRef.current = setTimeout(() => {
      searchCities(value);
    }, 300);
  }, [searchCities]);

  return {
    destinationSuggestions,
    showDestinationSuggestions,
    setShowDestinationSuggestions,
    triggerSearch
  };
};

