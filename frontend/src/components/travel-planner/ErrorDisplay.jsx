/**
 * ErrorDisplay.jsx - Componente para mostrar errores
 */

import React, { memo } from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorDisplay = memo(({ error }) => {
  if (!error) return null;

  return (
    <div className="mb-8 p-5 bg-red-50 border-l-4 border-red-500 rounded-2xl flex items-start gap-3">
      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-800 font-semibold mb-1">Error de conexión</p>
        <p className="text-red-600 text-sm leading-relaxed">{error}</p>
      </div>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';

export default ErrorDisplay;

