/**
 * App.jsx - Componente raíz de la aplicación
 * 
 * Importa y renderiza el componente TravelPlanner
 */

import React from 'react';
import TravelPlanner from './TravelPlanner';

function App() {
  return (
    <div className="App">
      <TravelPlanner />
    </div>
  );
}

export default App;

