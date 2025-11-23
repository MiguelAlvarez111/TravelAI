/**
 * TravelPlanner.jsx - Orquestador de estado principal
 * Componentes extraídos en src/components/travel-planner/
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { useAuth } from './contexts/AuthContext';

// Componentes extraídos
import Header from './components/travel-planner/Header';
import HeroSearch from './components/travel-planner/HeroSearch';
import TravelDashboard from './components/travel-planner/TravelDashboard';
import ChatWithAlex from './components/travel-planner/ChatWithAlex';
import LoadingSkeleton from './components/travel-planner/LoadingSkeleton';
import ItineraryDocument from './components/travel-planner/ItineraryDocument';
import FavoritesModal from './components/travel-planner/FavoritesModal';
import LightboxModal from './components/travel-planner/LightboxModal';
import ProSection from './components/travel-planner/ProSection';
import ErrorDisplay from './components/travel-planner/ErrorDisplay';

// Hooks personalizados
import { useDestinationSearch } from './components/travel-planner/hooks/useDestinationSearch';
import { useDestinationInput } from './components/travel-planner/hooks/useDestinationInput';
import { useFavorites } from './components/travel-planner/hooks/useFavorites';
import { useTravelPlan } from './components/travel-planner/hooks/useTravelPlan';

import { exportToPDF } from './components/travel-planner/utils/pdfExport';

const API_URL = import.meta.env.VITE_API_URL || 
                (typeof window !== 'undefined' && window.location.hostname.includes('railway.app') 
                  ? 'https://travelai-production-8955.up.railway.app'
                  : 'http://localhost:8000');

const TravelPlanner = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    destination: '',
    date_start: '',
    date_end: '',
    budget: '',
    style: ''
  });
  const [lightboxImage, setLightboxImage] = useState(null);
  const {
    destinationSuggestions,
    showDestinationSuggestions,
    setShowDestinationSuggestions,
    triggerSearch
  } = useDestinationSearch();
  
  const {
    destinationInputRef,
    destinationValueRef,
    handleInputChange,
    handleDestinationSelect,
    handleDestinationBlur
  } = useDestinationInput(setFormData, triggerSearch, setShowDestinationSuggestions);
  
  const {
    travelData,
    loading,
    error,
    chatInitialMessage,
    handlePlanificar,
    setError,
    setLoading
  } = useTravelPlan(user, formData, setFormData, destinationInputRef, destinationValueRef);
  
  const {
    favorites,
    showFavorites,
    setShowFavorites,
    isFavorited,
    handleToggleFavorite: toggleFavorite,
    handleLoadFavorite: loadFavorite,
    handleDeleteFavorite: deleteFavorite
  } = useFavorites(travelData, formData);

  const hasShownWelcome = useRef(false);
  useEffect(() => {
    if (user && !hasShownWelcome.current) {
      toast.success('¡Bienvenido de nuevo!');
      hasShownWelcome.current = true;
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    const result = await logout();
    if (!result.success) {
      toast.error('Error al cerrar sesión');
      setError('Error al cerrar sesión');
    }
  }, [logout, setError]);

  const handleExportPDF = useCallback(() => {
    exportToPDF(travelData, formData, setLoading, setError);
  }, [travelData, formData, setLoading, setError]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite();
    if (!isFavorited) {
      toast.success('Viaje guardado en tus favoritos ❤️');
    }
  }, [toggleFavorite, isFavorited]);

  const handleLoadFavorite = useCallback((favorite) => {
    setFormData(loadFavorite(favorite));
    setShowFavorites(false);
  }, [loadFavorite, setShowFavorites]);

  const handleDeleteFavorite = useCallback((index) => {
    deleteFavorite(index);
  }, [deleteFavorite]);

  return (
    <div className="bg-[#F5F5F7] min-h-screen font-sans text-[#111111] app-container overflow-x-hidden">
      <Toaster position="top-center" richColors />
      
      <Header 
        user={user}
        handleLogout={handleLogout}
      />
      
      <main>
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
          <HeroSearch 
            formData={formData}
            loading={loading}
            handleInputChange={handleInputChange}
            handlePlanificar={handlePlanificar}
            destinationInputRef={destinationInputRef}
            handleDestinationBlur={handleDestinationBlur}
            destinationSuggestions={destinationSuggestions}
            showDestinationSuggestions={showDestinationSuggestions}
            setShowDestinationSuggestions={setShowDestinationSuggestions}
            handleDestinationSelect={handleDestinationSelect}
          />

          <ErrorDisplay error={error} />

          {loading && !travelData && <LoadingSkeleton />}

          {travelData && !loading && (
            <TravelDashboard 
              plan={travelData} 
              formData={formData}
              isFavorited={isFavorited}
              handleToggleFavorite={handleToggleFavorite}
              setShowFavorites={setShowFavorites}
              handleExportPDF={handleExportPDF}
              setLightboxImage={setLightboxImage}
            />
          )}

          {travelData && !loading && (
            <ChatWithAlex 
              travelData={travelData}
              formData={formData}
              user={user}
              API_URL={API_URL}
              initialMessage={chatInitialMessage}
            />
          )}

          <ProSection />

        <footer className="text-center text-gray-400 text-sm py-8">
          Powered by Gemini AI • 2025
        </footer>
      </div>
      </main>

      <FavoritesModal
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
        favorites={favorites}
        handleLoadFavorite={handleLoadFavorite}
        handleDeleteFavorite={handleDeleteFavorite}
      />

      <div style={{ position: 'absolute', left: '-9999px', top: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }}>
      {travelData && (
        <ItineraryDocument travelData={travelData} formData={formData} />
      )}
      </div>

      <LightboxModal
        lightboxImage={lightboxImage}
        setLightboxImage={setLightboxImage}
      />
    </div>
  );
};

export default TravelPlanner;
