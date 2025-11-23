/**
 * HeroSearch.jsx - Formulario de búsqueda
 * Memoizado para evitar re-renders que causan pérdida de foco en inputs
 * OPTIMIZADO: Form con preventDefault para evitar recargas de página
 * CON AUTocompletado: Integrado con OpenStreetMap Nominatim API
 * ACTUALIZADO: Usa estado local para el input de destino para evitar pérdida de foco
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Plane, Loader2, Clock, Wallet, Sparkles, MapPin, ChevronDown } from 'lucide-react';

const HeroSearch = memo(({ 
  formData, 
  loading, 
  handleInputChange, 
  handlePlanificar, 
  destinationInputRef, 
  handleDestinationBlur,
  destinationSuggestions,
  showDestinationSuggestions,
  setShowDestinationSuggestions,
  handleDestinationSelect
}) => {
  // Estado local para el valor del input de destino (evita pérdida de foco)
  const [localDestination, setLocalDestination] = useState(formData.destination || '');
  
  // Sincronizar con formData cuando cambia externamente (ej: al cargar favorito)
  useEffect(() => {
    setLocalDestination(formData.destination || '');
  }, [formData.destination]);
  
  // Handler local para cambios en el input de destino
  const handleDestinationInputChange = useCallback((e) => {
    const value = e.target.value;
    setLocalDestination(value);
    
    // Crear un evento sintético para pasar al handler del padre
    const syntheticEvent = {
      target: {
        name: 'destination',
        value: value
      }
    };
    
    // Llamar al handler del padre para búsqueda y actualización
    handleInputChange(syntheticEvent);
  }, [handleInputChange]);
  
  // Handler local para selección de sugerencia
  const handleLocalDestinationSelect = useCallback((suggestion) => {
    setLocalDestination(suggestion.display_name);
    handleDestinationSelect(suggestion);
  }, [handleDestinationSelect]);
  
  // Handler para prevenir recarga de página
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handlePlanificar();
  };

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-[32px] shadow-xl shadow-black/5 p-8 border border-white/50">
      <h2 className="text-2xl font-semibold tracking-tight text-[#111111] mb-6">Planifica tu viaje</h2>
      
      <form onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="md:col-span-2 relative">
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
              Destino
            </label>
            <div className="bg-[#F5F5F7] rounded-2xl flex items-center px-4 h-14 relative transition-all duration-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-lg focus-within:shadow-blue-500/10">
              <Plane className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <input
                ref={destinationInputRef}
                type="text"
                id="destination"
                name="destination"
                value={localDestination}
                onChange={handleDestinationInputChange}
                onBlur={handleDestinationBlur}
                onFocus={() => {
                  // Mostrar sugerencias si hay alguna disponible
                  if (destinationSuggestions.length > 0) {
                    setShowDestinationSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  // Prevenir submit del form al presionar Enter en este input
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // Si hay sugerencias y la primera está visible, seleccionarla
                    if (showDestinationSuggestions && destinationSuggestions.length > 0) {
                      handleLocalDestinationSelect(destinationSuggestions[0]);
                    }
                  }
                  // Cerrar sugerencias con Escape
                  if (e.key === 'Escape') {
                    setShowDestinationSuggestions(false);
                  }
                }}
                placeholder="Ej. Un fin de semana gastronómico en Lima..."
                disabled={loading}
                autoComplete="off"
                className="flex-1 bg-transparent border-none outline-none
                           text-lg text-[#111111] placeholder-gray-400
                           disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            
            {/* Lista desplegable de sugerencias - Estilo Apple */}
            {showDestinationSuggestions && destinationSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="py-1 max-h-64 overflow-y-auto">
                  {destinationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleLocalDestinationSelect(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-[#F5F5F7] transition-colors duration-150
                                 focus:bg-[#F5F5F7] focus:outline-none
                                 flex items-center gap-3 group"
                    >
                      <MapPin className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      <span className="text-sm text-[#111111] font-medium group-hover:text-blue-600 transition-colors">
                        {suggestion.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="date_start" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicial
            </label>
            <div className="bg-[#F5F5F7] rounded-2xl flex items-center px-4 py-3 transition-all duration-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
              <Clock className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <input
                type="date"
                id="date_start"
                name="date_start"
                value={formData.date_start}
                onChange={handleInputChange}
                onClick={(e) => {
                  // showPicker() solo funciona con gestos directos del usuario (click)
                  try {
                    e.target.showPicker?.();
                  } catch (error) {
                    // Si showPicker falla, el input nativo se abrirá automáticamente
                    console.debug('showPicker no disponible:', error);
                  }
                }}
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 bg-transparent border-none outline-none
                           text-base text-[#111111]
                           disabled:cursor-not-allowed disabled:opacity-60
                           cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label htmlFor="date_end" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Final
            </label>
            <div className="bg-[#F5F5F7] rounded-2xl flex items-center px-4 py-3 transition-all duration-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
              <Clock className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <input
                type="date"
                id="date_end"
                name="date_end"
                value={formData.date_end}
                onChange={handleInputChange}
                onClick={(e) => {
                  // showPicker() solo funciona con gestos directos del usuario (click)
                  try {
                    e.target.showPicker?.();
                  } catch (error) {
                    // Si showPicker falla, el input nativo se abrirá automáticamente
                    console.debug('showPicker no disponible:', error);
                  }
                }}
                disabled={loading}
                min={formData.date_start || new Date().toISOString().split('T')[0]}
                className="flex-1 bg-transparent border-none outline-none
                           text-base text-[#111111]
                           disabled:cursor-not-allowed disabled:opacity-60
                           cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto
            </label>
            <div className="bg-[#F5F5F7] rounded-2xl flex items-center px-4 py-3 relative transition-all duration-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
              <Wallet className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                disabled={loading}
                className="flex-1 bg-transparent border-none outline-none
                           text-base text-[#111111]
                           disabled:cursor-not-allowed disabled:opacity-60
                           appearance-none cursor-pointer
                           [&::-ms-expand]:hidden"
              >
                <option value="">Selecciona un presupuesto</option>
                <option value="Mochilero 🎒">Mochilero 🎒</option>
                <option value="Moderado ⚖️">Moderado ⚖️</option>
                <option value="Lujo ✨">Lujo ✨</option>
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 pointer-events-none top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
              Estilo de Viaje
            </label>
            <div className="bg-[#F5F5F7] rounded-2xl flex items-center px-4 py-3 relative transition-all duration-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
              <Sparkles className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <select
                id="style"
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                disabled={loading}
                className="flex-1 bg-transparent border-none outline-none
                           text-base text-[#111111]
                           disabled:cursor-not-allowed disabled:opacity-60
                           appearance-none cursor-pointer
                           [&::-ms-expand]:hidden"
              >
                <option value="">Selecciona un estilo</option>
                <option value="Aventura 🧗">Aventura 🧗</option>
                <option value="Relax 🏖️">Relax 🏖️</option>
                <option value="Cultura 🏛️">Cultura 🏛️</option>
                <option value="Gastronomía 🌮">Gastronomía 🌮</option>
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 pointer-events-none top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3
                     bg-gradient-to-r from-slate-900 to-slate-800 text-white
                     hover:-translate-y-0.5 hover:shadow-lg
                     disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:translate-y-0
                     font-semibold h-[56px] px-8 rounded-xl
                     transition-all duration-200
                     disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Consultando satélites...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generar mi Aventura</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada: El componente usa estado local para destination, así que no necesitamos compararlo
  // Solo re-renderizar si cambian otros campos, loading o sugerencias
  // NOTA: destination se maneja con estado local para evitar pérdida de foco
  return prevProps.formData.date_start === nextProps.formData.date_start &&
         prevProps.formData.date_end === nextProps.formData.date_end &&
         prevProps.formData.budget === nextProps.formData.budget &&
         prevProps.formData.style === nextProps.formData.style &&
         prevProps.loading === nextProps.loading &&
         prevProps.destinationSuggestions.length === nextProps.destinationSuggestions.length &&
         prevProps.showDestinationSuggestions === nextProps.showDestinationSuggestions &&
         JSON.stringify(prevProps.destinationSuggestions) === JSON.stringify(nextProps.destinationSuggestions);
});

HeroSearch.displayName = 'HeroSearch';

export default HeroSearch;

