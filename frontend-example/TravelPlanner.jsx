/**
 * TravelPlanner.jsx - Componente principal de ViajeIA
 * 
 * Interfaz moderna y responsive para planificar viajes usando Google Gemini AI
 * 
 * Dependencias requeridas:
 * - react-markdown
 * - lucide-react
 * - tailwindcss (configurado en el proyecto)
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plane, Loader2, Send, AlertCircle } from 'lucide-react';

const TravelPlanner = () => {
  // Estado para almacenar la pregunta del usuario
  const [query, setQuery] = useState('');
  
  // Estado para almacenar la respuesta de Gemini
  const [response, setResponse] = useState('');
  
  // Estado para manejar el loading (mientras esperamos la respuesta)
  const [loading, setLoading] = useState(false);
  
  // Estado para manejar errores
  const [error, setError] = useState('');

  /**
   * Función que se ejecuta cuando el usuario hace clic en "Planificar Aventura"
   * Conecta con el backend FastAPI en http://localhost:8000/api/plan
   */
  const handlePlanificar = async () => {
    // Validar que haya una pregunta
    if (!query.trim()) {
      setError('Por favor, ingresa una pregunta sobre tu viaje');
      return;
    }

    // Limpiar errores previos y respuesta anterior
    setError('');
    setResponse('');
    setLoading(true);

    try {
      // Llamar al backend FastAPI
      // El endpoint /api/plan recibe {"query": "..."} y devuelve {"response": "..."}
      const apiResponse = await fetch('http://localhost:8000/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          preferences: null,
        }),
      });

      // Verificar si la respuesta fue exitosa
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || 'Error al consultar la IA');
      }

      // Extraer la respuesta del JSON
      // El backend devuelve: {"response": "texto de gemini..."}
      const data = await apiResponse.json();
      
      // Mostrar la respuesta en la pantalla
      setResponse(data.response);
      
    } catch (err) {
      // Manejo de errores: CORS, conexión, etc.
      let errorMessage = 'Ocurrió un error consultando a la IA';
      
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        errorMessage = 'No pudimos conectar con el servidor. Asegúrate de que el backend esté corriendo en http://localhost:8000';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      // Desactivar el estado de loading
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Card Principal con sombras suaves */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          
          {/* Header con título */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Plane className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-blue-600">
                ViajeIA
              </h1>
            </div>
            <p className="text-slate-600 text-lg mt-2">
              Tu asistente inteligente para planificar aventuras inolvidables
            </p>
          </div>

          {/* Input: Textarea cómodo con borde redondeado */}
          <div className="mb-6">
            <label htmlFor="travel-query" className="block text-sm font-medium text-slate-700 mb-2">
              ¿A dónde quieres viajar?
            </label>
            <textarea
              id="travel-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ejemplo: Quiero viajar a París por 3 días, me gustan los museos y la gastronomía"
              disabled={loading}
              className="w-full min-h-[120px] px-4 py-3 border-2 border-slate-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:bg-slate-100 disabled:cursor-not-allowed
                         text-slate-700 placeholder-slate-400
                         transition-all duration-200 resize-y"
            />
          </div>

          {/* Botón: "Planificar Aventura" con estados */}
          <div className="mb-6">
            <button
              onClick={handlePlanificar}
              disabled={loading || !query.trim()}
              className="w-full flex items-center justify-center gap-3
                         bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400
                         text-white font-semibold py-4 px-6 rounded-xl
                         shadow-lg hover:shadow-xl disabled:shadow-none
                         transition-all duration-200
                         disabled:cursor-not-allowed
                         transform hover:scale-[1.02] disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Consultando satélites...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Planificar Aventura</span>
                </>
              )}
            </button>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg
                          flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error de conexión</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Visualización de Respuesta: Contenedor con fondo gris suave */}
          {response && (
            <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200
                          animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Plane className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-800">
                  Tu Plan de Viaje
                </h2>
              </div>
              
              {/* ReactMarkdown renderiza el texto Markdown de Gemini */}
              {/* Aplicamos estilos prose de Tailwind o estilos manuales */}
              <div className="prose prose-slate max-w-none
                            prose-headings:text-slate-800 prose-headings:font-bold
                            prose-p:text-slate-700 prose-p:leading-relaxed
                            prose-strong:text-slate-900 prose-strong:font-semibold
                            prose-ul:text-slate-700 prose-ul:list-disc prose-ul:ml-6
                            prose-ol:text-slate-700 prose-ol:list-decimal prose-ol:ml-6
                            prose-li:my-2 prose-li:leading-relaxed
                            prose-em:text-slate-600
                            [&>ul]:space-y-2 [&>ol]:space-y-2">
                <ReactMarkdown>{response}</ReactMarkdown>
              </div>
            </div>
          )}

        </div>

        {/* Footer informativo */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Powered by Google Gemini AI ✨</p>
        </div>
      </div>
    </div>
  );
};

export default TravelPlanner;
