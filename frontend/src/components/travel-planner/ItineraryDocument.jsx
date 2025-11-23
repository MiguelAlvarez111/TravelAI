/**
 * ItineraryDocument.jsx - Componente oculto para generar PDF estilo moderno
 * 
 * Este componente se renderiza oculto en el DOM y se captura con html2canvas
 * para generar un PDF de alta calidad con el mismo diseño de la página principal.
 */

import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Cloud, Wallet, Sparkles, Plane, Hotel, UtensilsCrossed, MapPin, Lightbulb, DollarSign } from 'lucide-react';
import { parseTravelPlan } from './utils';

// Función auxiliar para parsear contenido de secciones (igual que en TravelDashboard)
const parseSectionContent = (text) => {
  if (!text) return { intro: '', items: [] };
  
  const textStr = typeof text === 'string' ? String(text) : String(text);
  const bulletPattern = /•|\n\s*-\s*/;
  const bulletMatch = textStr.match(bulletPattern);
  
  if (bulletMatch) {
    const bulletIndex = bulletMatch.index;
    const intro = textStr.substring(0, bulletIndex).trim();
    const itemsText = textStr.substring(bulletIndex + bulletMatch[0].length);
    let items = itemsText.split(/•|\n\s*-\s*|\n/);
    items = items.map(item => item.trim()).filter(item => item.length > 0 && !/^[^\w\s]+$/.test(item));
    return { intro, items };
  }
  
  const lines = textStr.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length > 1) {
    const intro = lines[0];
    const items = lines.slice(1).filter(item => !/^[^\w\s]+$/.test(item));
    return { intro, items };
  }
  
  return { intro: textStr.trim(), items: [] };
};

const ItineraryDocument = memo(({ travelData, formData }) => {
  if (!travelData || !formData) return null;

  const heroImage = travelData.images && travelData.images.length > 0 
    ? travelData.images[0] 
    : null;

  // Parsear el plan usando la misma función que la página principal
  const parsedSections = useMemo(() => {
    return parseTravelPlan(travelData?.gemini_response);
  }, [travelData?.gemini_response]);

  const sectionOrder = ['intro', 'alojamiento', 'gastronomia', 'lugares', 'consejos', 'costos'];

  return (
    <div 
      id="itinerary-document"
      className="bg-white"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '210mm', // A4 width
        minHeight: '297mm', // A4 height
        visibility: 'visible', // Visible para html2canvas
        zIndex: -1,
        pointerEvents: 'none',
        fontFamily: "'Inter', -apple-system, BlinkSystemFont, 'Segoe UI', sans-serif",
        // Optimizaciones para mejor calidad de renderizado
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        imageRendering: 'high-quality',
        // Asegurar que los colores se vean bien
        color: '#111111',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Hero Banner con Imagen - Estilo moderno */}
      {heroImage && (
        <div 
          className="relative w-full"
          style={{ 
            height: '280px',
            borderRadius: '32px 32px 0 0',
            overflow: 'hidden',
            marginBottom: '32px'
          }}
        >
          <img 
            src={heroImage} 
            alt={formData.destination}
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
            crossOrigin="anonymous"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
            }}
          ></div>
          <div 
            className="absolute bottom-0 left-0 right-0"
            style={{ padding: '32px' }}
          >
            <h1 
              className="text-white font-semibold"
              style={{ 
                fontSize: '36px',
                marginBottom: '8px',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
                {formData.destination}
              </h1>
            {travelData.weather && (
              <p 
                className="text-white"
                style={{ 
                  fontSize: '18px',
                  opacity: 0.9,
                  fontWeight: 500
                }}
              >
                {travelData.weather.condition}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div style={{ padding: '0 40px' }}>
        {/* Widgets de Información - Estilo de la página principal */}
        <div 
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          {travelData.weather && travelData.weather.temp !== null && (
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                border: '1px solid rgba(226, 232, 240, 0.5)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Cloud 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  color: '#3b82f6',
                  marginBottom: '12px'
                }} 
              />
              <div 
                style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#111111',
                  marginBottom: '4px',
                  letterSpacing: '-0.02em'
                }}
              >
                {travelData.weather.temp}°
                      </div>
                      {travelData.weather.condition && (
                <p 
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {travelData.weather.condition}
                </p>
                      )}
                    </div>
          )}

          {formData.budget && (
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                border: '1px solid rgba(226, 232, 240, 0.5)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Wallet 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  color: '#6b7280',
                  marginBottom: '12px'
                }} 
              />
              <div 
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#111111',
                  marginBottom: '4px'
                }}
              >
                {formData.budget.split(' ')[0]}
              </div>
              <p 
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: 500
                }}
              >
                Presupuesto
              </p>
                  </div>
                )}

          {formData.style && (
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                border: '1px solid rgba(226, 232, 240, 0.5)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  color: '#6b7280',
                  marginBottom: '12px'
                }} 
              />
              <div 
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#111111',
                  marginBottom: '4px'
                }}
              >
                {formData.style.split(' ')[0]}
              </div>
              <p 
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: 500
                }}
              >
                Estilo
              </p>
            </div>
          )}
        </div>

        {/* Header de Secciones */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
          }}
        >
          <div 
            style={{
              padding: '8px',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px'
            }}
          >
            <Plane 
              style={{ 
                width: '20px', 
                height: '20px', 
                color: '#94a3b8'
              }} 
            />
          </div>
          <h2 
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#111111',
              letterSpacing: '-0.02em'
            }}
          >
            Tu Plan de Viaje por Alex
          </h2>
        </div>

        {/* Contenido del Plan - Estructura igual que la página principal */}
        <div style={{ marginBottom: '32px' }}>
          {parsedSections && Object.keys(parsedSections).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sectionOrder.map((sectionKey) => {
                const section = parsedSections[sectionKey];
                
                // Intro es un string
                if (sectionKey === 'intro') {
                  const introValue = parsedSections?.intro;
                  const hasValidIntro = introValue !== null && 
                                       introValue !== undefined && 
                                       typeof introValue === 'string' && 
                                       introValue.trim().length > 0;
                  
                  if (!hasValidIntro) return null;
                  
                  const introForRender = introValue.trim();
                  
                  return (
                    <div 
                      key="intro"
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid rgba(226, 232, 240, 0.5)',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div 
                        style={{
                          color: '#475569',
                          fontSize: '14px',
                          lineHeight: '1.75',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      >
                        <ReactMarkdown 
                          components={{
                            p: ({ children }) => <p style={{ margin: 0, marginBottom: '8px' }}>{children}</p>
                          }}
                        >
                          {introForRender}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                }
                
                if (!section) return null;
                
                if (typeof section !== 'object' || !section.title || !section.content || !section.icon) {
                  return null;
                }

                const IconComponent = section.icon;
                const { intro, items } = parseSectionContent(section.content);
                
                return (
                  <div
                    key={sectionKey}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid rgba(226, 232, 240, 0.5)',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header de la sección */}
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <div 
                        style={{
                          padding: '10px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '12px'
                        }}
                      >
                        <IconComponent 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            color: '#4b5563'
                          }} 
                        />
                      </div>
                      <h3 
                        style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: '#111111'
                        }}
                      >
                        {section.title}
                      </h3>
                    </div>
                    
                    {/* Contenido de la sección */}
                    <div style={{ padding: '16px', paddingTop: '8px' }}>
                      {intro && (
                        <p 
                          style={{
                            color: '#64748b',
                            marginBottom: '16px',
                            fontSize: '14px',
                            lineHeight: '1.75',
                            fontStyle: 'italic'
                          }}
                        >
                          {intro}
                        </p>
                      )}
                      
                      {items.length > 0 && (
                        <ul 
                          style={{
                            listStyle: 'disc',
                            paddingLeft: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            color: '#475569',
                            fontSize: '14px',
                            lineHeight: '1.75'
                          }}
                        >
                          {items.map((item, i) => (
                            <li 
                              key={i}
                              style={{
                                paddingLeft: '4px',
                                color: '#475569'
                              }}
                            >
                              <ReactMarkdown components={{ p: 'span' }}>
                                {item}
                              </ReactMarkdown>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback si no se pudo parsear
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(226, 232, 240, 0.5)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            >
              <div 
                style={{
                  color: '#475569',
                  fontSize: '14px',
                  lineHeight: '1.75'
                }}
              >
              <ReactMarkdown>{travelData.gemini_response}</ReactMarkdown>
            </div>
          </div>
          )}
        </div>

        {/* Galería de Imágenes */}
        {travelData.images && travelData.images.length > 1 && (
          <div 
            style={{
              marginTop: '32px',
              paddingTop: '32px',
              borderTop: '2px solid #e2e8f0'
            }}
          >
            <h2 
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#111111',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MapPin style={{ width: '24px', height: '24px', color: '#007AFF' }} />
              Galería de Imágenes
            </h2>
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px'
              }}
            >
              {travelData.images.slice(1).map((imageUrl, index) => (
                <div 
                  key={index}
                  style={{
                    aspectRatio: '16/9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <img 
                    src={imageUrl} 
                    alt={`${formData.destination} ${index + 2}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Moderno */}
      <div 
        style={{
          marginTop: '48px',
          paddingTop: '32px',
          paddingBottom: '32px',
          paddingLeft: '40px',
          paddingRight: '40px',
          borderTop: '2px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Plane style={{ width: '24px', height: '24px', color: '#007AFF' }} />
          <span 
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#007AFF'
            }}
          >
            ViajeIA
          </span>
          </div>
        <div 
          style={{
            textAlign: 'right',
            fontSize: '14px',
            color: '#475569'
          }}
        >
          <div>
            Generado el {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div 
            style={{
              fontSize: '12px',
              marginTop: '4px',
              color: '#64748b'
            }}
          >
            Powered by Google Gemini AI
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.travelData?.gemini_response === nextProps.travelData?.gemini_response &&
         prevProps.travelData?.images?.[0] === nextProps.travelData?.images?.[0] &&
         prevProps.formData.destination === nextProps.formData.destination &&
         prevProps.formData.date_start === nextProps.formData.date_start &&
         prevProps.formData.date_end === nextProps.formData.date_end &&
         prevProps.formData.budget === nextProps.formData.budget &&
         prevProps.formData.style === nextProps.formData.style;
});

export default ItineraryDocument;

