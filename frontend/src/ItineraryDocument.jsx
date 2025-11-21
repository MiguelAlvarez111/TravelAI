/**
 * ItineraryDocument.jsx - Componente oculto para generar PDF estilo revista
 * 
 * Este componente se renderiza oculto en el DOM y se captura con html2canvas
 * para generar un PDF de alta calidad estilo revista de viajes.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Cloud, DollarSign, MapPin, Calendar, Plane } from 'lucide-react';

const ItineraryDocument = ({ travelData, formData }) => {
  if (!travelData || !formData) return null;

  const heroImage = travelData.images && travelData.images.length > 0 
    ? travelData.images[0] 
    : null;

  return (
    <div 
      id="itinerary-document"
      className="w-[210mm] min-h-[297mm] bg-white"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '210mm', // A4 width
        minHeight: '297mm', // A4 height
        visibility: 'visible', // Visible para html2canvas
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      {/* Hero Banner con Imagen */}
      {heroImage && (
        <div className="relative w-full h-64 overflow-hidden">
          <img 
            src={heroImage} 
            alt={formData.destination}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
            }}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="w-6 h-6" style={{ color: '#ffffff' }} />
              <h1 className="text-4xl font-bold" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {formData.destination}
              </h1>
            </div>
            {formData.date && (
              <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <Calendar className="w-5 h-5" />
                <span className="text-lg font-medium">{formData.date}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="p-8">
        {/* Grid de 2 Columnas */}
        <div className="grid grid-cols-10 gap-6 mb-8">
          
          {/* Columna Izquierda - Resumen (30%) */}
          <div className="col-span-3 space-y-6">
            <div 
              className="rounded-2xl p-6 border"
              style={{
                background: 'linear-gradient(to bottom right, #eff6ff 0%, #eef2ff 100%)',
                borderColor: '#dbeafe'
              }}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1e293b' }}>
                <MapPin className="w-5 h-5" style={{ color: '#2563eb' }} />
                Resumen del Viaje
              </h2>
              
              <div className="space-y-4">
                {/* Clima */}
                {travelData.weather && travelData.weather.temp !== null && (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#dbeafe' }}>
                      <Cloud className="w-5 h-5" style={{ color: '#2563eb' }} />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>Clima</div>
                      <div className="text-lg font-bold" style={{ color: '#1e293b' }}>
                        {travelData.weather.temp}°C
                      </div>
                      {travelData.weather.condition && (
                        <div className="text-sm" style={{ color: '#475569' }}>{travelData.weather.condition}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Presupuesto */}
                {formData.budget && (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#dcfce7' }}>
                      <DollarSign className="w-5 h-5" style={{ color: '#16a34a' }} />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>Presupuesto</div>
                      <div className="text-lg font-bold" style={{ color: '#1e293b' }}>{formData.budget}</div>
                    </div>
                  </div>
                )}

                {/* Estilo */}
                {formData.style && (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#f3e8ff' }}>
                      <MapPin className="w-5 h-5" style={{ color: '#9333ea' }} />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>Estilo</div>
                      <div className="text-lg font-bold" style={{ color: '#1e293b' }}>{formData.style}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hora Local */}
            {travelData.info && travelData.info.local_time && (
              <div className="rounded-2xl p-4 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Hora Local</div>
                <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{travelData.info.local_time}</div>
              </div>
            )}
          </div>

          {/* Columna Derecha - Contenido Principal (70%) */}
          <div className="col-span-7">
            <div 
              style={{
                color: '#334155',
                fontSize: '1.125rem',
                lineHeight: '1.75rem',
              }}
              className="markdown-content"
            >
              <style>{`
                .markdown-content h1 {
                  font-size: 1.875rem;
                  font-weight: 700;
                  color: #0f172a;
                  margin-top: 0;
                  margin-bottom: 1rem;
                  padding-bottom: 0.75rem;
                  border-bottom: 2px solid #bfdbfe;
                }
                .markdown-content h2 {
                  font-size: 1.5rem;
                  font-weight: 700;
                  color: #1e40af;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                  padding-bottom: 0.5rem;
                  border-bottom: 1px solid #dbeafe;
                }
                .markdown-content h3 {
                  font-size: 1.25rem;
                  font-weight: 700;
                  color: #1e293b;
                  margin-top: 1rem;
                  margin-bottom: 0.5rem;
                }
                .markdown-content p {
                  color: #334155;
                  line-height: 1.75;
                  margin-top: 1rem;
                  margin-bottom: 1rem;
                }
                .markdown-content strong {
                  color: #0f172a;
                  font-weight: 600;
                }
                .markdown-content em {
                  color: #475569;
                  font-style: italic;
                }
                .markdown-content ul, .markdown-content ol {
                  margin-top: 1rem;
                  margin-bottom: 1rem;
                  padding-left: 1.5rem;
                }
                .markdown-content li {
                  color: #334155;
                  line-height: 1.75;
                  margin-top: 0.5rem;
                }
                .markdown-content a {
                  color: #2563eb;
                  text-decoration: none;
                  font-weight: 500;
                }
                .markdown-content a:hover {
                  text-decoration: underline;
                }
                .markdown-content code {
                  color: #1e40af;
                  background-color: #eff6ff;
                  padding: 0.125rem 0.5rem;
                  border-radius: 0.25rem;
                  font-size: 0.875rem;
                  font-family: monospace;
                }
                .markdown-content blockquote {
                  border-left: 4px solid #93c5fd;
                  padding-left: 1rem;
                  font-style: italic;
                  color: #475569;
                  margin-top: 1rem;
                  margin-bottom: 1rem;
                }
                .markdown-content hr {
                  border-color: #cbd5e1;
                  margin-top: 1.5rem;
                  margin-bottom: 1.5rem;
                }
              `}</style>
              <ReactMarkdown>{travelData.gemini_response}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Galería de Imágenes */}
        {travelData.images && travelData.images.length > 1 && (
          <div className="mt-8 pt-8 border-t-2" style={{ borderTopColor: '#e2e8f0' }}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#0f172a' }}>
              <MapPin className="w-6 h-6" style={{ color: '#2563eb' }} />
              Galería de Imágenes
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {travelData.images.slice(1).map((imageUrl, index) => (
                <div 
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden"
                  style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
                >
                  <img 
                    src={imageUrl} 
                    alt={`${formData.destination} ${index + 2}`}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div 
        className="mt-12 pt-8 border-t-2"
        style={{
          borderTopColor: '#e2e8f0',
          background: 'linear-gradient(to right, #eff6ff 0%, #eef2ff 100%)'
        }}
      >
        <div className="px-8 pb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plane className="w-6 h-6" style={{ color: '#2563eb' }} />
            <span className="text-2xl font-bold" style={{ color: '#2563eb' }}>ViajeIA</span>
          </div>
          <div className="text-sm text-right" style={{ color: '#475569' }}>
            <div>Generado el {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
            <div className="text-xs mt-1" style={{ color: '#64748b' }}>Powered by Google Gemini AI</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDocument;

