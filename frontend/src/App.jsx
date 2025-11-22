/**
 * App.jsx - Componente raíz de la aplicación
 * 
 * Protege las rutas: muestra Login si no está autenticado, TravelPlanner si está autenticado
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import TravelPlanner from './TravelPlanner';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const { user } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Resetear showRegister a false cuando el usuario se desloguea
  // Esto asegura que siempre se muestre Login después del logout, no Register
  useEffect(() => {
    if (!user) {
      setShowRegister(false);
    }
  }, [user]);

  // Si no hay usuario, mostrar pantalla de acceso (siempre Login por defecto)
  if (!user) {
    if (showRegister) {
      return <Register onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return <Login onSwitchToRegister={() => setShowRegister(true)} />;
  }

  // Si hay usuario, mostrar el asistente
  return <TravelPlanner />;
}

export default App;
