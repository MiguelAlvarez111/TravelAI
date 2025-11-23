/**
 * TravelDashboard.jsx - Muestra el plan de viaje parseado
 * Memoizado para evitar re-renders innecesarios cuando cambia el chat
 * Con función de comparación personalizada para evitar re-renders cuando el contenido no cambia
 */

import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plane, Cloud, Wallet, Sparkles, Heart, Download, BookOpen, ChevronDown } from 'lucide-react';
import { parseTravelPlan } from './utils';
import ImageGallery from './ImageGallery';

/**
 * Parser function to separate intro text from list items
 * Returns an object with intro text and array of list items
 */
const parseSectionContent = (text) => {
  if (!text) return { intro: '', items: [] };
  
  // Convert to string if not already
  const textStr = typeof text === 'string' ? text : String(text);
  
  // Find the index of the first bullet character ("•" or newline followed by "-")
  const bulletPattern = /•|\n\s*-\s*/;
  const bulletMatch = textStr.match(bulletPattern);
  
  if (bulletMatch) {
    // Bullet found: split into intro (before) and items (after)
    const bulletIndex = bulletMatch.index;
    const intro = textStr.substring(0, bulletIndex).trim();
    
    // Get everything after the first bullet
    const itemsText = textStr.substring(bulletIndex + bulletMatch[0].length);
    
    // Split items by common separators: "•", "-", or newlines
    let items = itemsText.split(/•|\n\s*-\s*|\n/);
    
    // Clean up: trim whitespace from each item
    items = items.map(item => item.trim());
    
    // Filter out empty strings or strings that are just punctuation
    items = items.filter(item => {
      if (item.length === 0) return false;
      if (/^[^\w\s]+$/.test(item)) return false;
      return true;
    });
    
    return { intro, items };
  }
  
  // No bullet found: check if there are multiple lines
  const lines = textStr.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length > 1) {
    // First line is intro, rest are items
    const intro = lines[0];
    const items = lines.slice(1);
    
    // Filter out items that are just punctuation
    const filteredItems = items.filter(item => {
      if (/^[^\w\s]+$/.test(item)) return false;
      return true;
    });
    
    return { intro, items: filteredItems };
  }
  
  // Single line or no clear structure: treat whole text as intro
  return { intro: textStr.trim(), items: [] };
};

const TravelDashboard = memo(({ plan, formData, isFavorited, handleToggleFavorite, setShowFavorites, handleExportPDF, setLightboxImage }) => {
  // Estado para controlar qué acordeones están abiertos (evita que se cierren en re-renders)
  // Usamos useRef para persistir el estado entre re-renders del componente memoizado
  const openSectionsRef = useRef(new Set());
  const [openSections, setOpenSections] = useState(() => openSectionsRef.current);
  
  // Parsear el plan usando parseTravelPlan - Optimizado con useMemo para evitar lag al escribir
  const parsedSections = useMemo(() => {
    return parseTravelPlan(plan?.gemini_response);
  }, [plan?.gemini_response]);
  
  // Función para toggle de acordeones
  // Sincronizamos el ref con el estado para persistir entre re-renders
  const toggleSection = useCallback((sectionKey) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      // Sincronizar el ref para persistencia entre re-renders
      openSectionsRef.current = newSet;
      return newSet;
    });
  }, []);
  
  return (
    <section className="animate-fade-in-up bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-10 space-y-8">
      {/* Header del Plan con Botones de Acción */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Tu Plan</h2>
        <div className="flex items-center gap-2">
          {plan && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                isFavorited
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={isFavorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFavorites(true)}
            className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200"
            title="Mis Viajes Guardados"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          {plan && (
            <button
              type="button"
              onClick={handleExportPDF}
              className="p-2.5 rounded-full bg-[#007AFF] text-white hover:bg-[#0051D5] transition-all duration-200"
              title="Descargar PDF"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero del Destino */}
      {plan.images && plan.images.length > 0 && (
        <div 
          className="relative w-full h-64 md:h-80 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-8"
          onClick={() => setLightboxImage(plan.images[0])}
        >
          <img 
            src={plan.images[0]} 
            alt={formData.destination}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">
              {formData.destination}
            </h3>
            {plan.weather && (
              <p className="text-white/90 text-lg font-medium">
                {plan.weather.condition}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Widgets de Cabecera */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {plan.weather && plan.weather.temp !== null && (
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col items-center justify-center text-center min-h-[140px] border border-slate-100/50">
            <Cloud className="w-10 h-10 text-blue-500 mb-3" />
            <div className="text-3xl font-bold text-[#111111] mb-1 tracking-tight">
              {plan.weather.temp}°
            </div>
            {plan.weather.condition && (
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {plan.weather.condition}
              </p>
            )}
          </div>
        )}

        {formData.budget && (
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col items-center justify-center text-center min-h-[140px] border border-slate-100/50">
            <Wallet className="w-10 h-10 text-gray-600 mb-3" />
            <div className="text-xl font-bold text-[#111111] mb-1">
              {formData.budget.split(' ')[0]}
            </div>
            <p className="text-sm text-gray-500 font-medium">Presupuesto</p>
          </div>
        )}

        {formData.style && (
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col items-center justify-center text-center min-h-[140px] border border-slate-100/50">
            <Sparkles className="w-10 h-10 text-gray-600 mb-3" />
            <div className="text-xl font-bold text-[#111111] mb-1">
              {formData.style.split(' ')[0]}
            </div>
            <p className="text-sm text-gray-500 font-medium">Estilo</p>
          </div>
        )}
      </div>

      {/* Acordeones del Plan de Viaje */}
      <div>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/50">
          <div className="p-2 bg-slate-100 rounded-xl">
            <Plane className="w-5 h-5 text-slate-400" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Tu Plan de Viaje por Alex
          </h2>
        </div>
        
        {(() => {
          // Si no hay secciones parseadas, mostrar fallback
          if (!parsedSections || Object.keys(parsedSections).length === 0) {
            return (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/50">
                <div className="prose prose-sm text-slate-700 max-w-none leading-relaxed
                                prose-headings:font-semibold prose-headings:text-[#111111]
                                prose-p:leading-relaxed prose-p:mb-4
                                prose-strong:font-bold prose-strong:text-slate-900
                                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-2 prose-ul:my-2
                                prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-2 prose-ol:my-2
                                prose-li:mb-2 prose-li:my-2 prose-li:leading-relaxed prose-li:text-gray-600 prose-li:marker:text-blue-500">
                  <ReactMarkdown>{plan.gemini_response}</ReactMarkdown>
                </div>
              </div>
            );
          }

          // Orden de secciones a renderizar (con claves que coinciden con parseTravelPlan)
          const sectionOrder = [
            'intro',
            'alojamiento',
            'gastronomia',
            'lugares',
            'consejos',
            'costos'
          ];
          
          return (
            <>
              <style>{`
                details summary::-webkit-details-marker {
                  display: none;
                }
                details summary::marker {
                  display: none;
                }
                details summary {
                  list-style: none;
                }
              `}</style>
              
              <div className="space-y-3">
                {sectionOrder.map((sectionKey) => {
                  const section = parsedSections[sectionKey];
                  
                  // Caso especial: intro es un string, no un objeto
                  // Verificar explícitamente que existe, es string y tiene contenido válido
                  // La condición envuelve TODO el contenedor para evitar renderizar el div vacío
                  if (sectionKey === 'intro') {
                    // Verificación de seguridad: parsedSections existe y el intro tiene contenido válido
                    // Verificar explícitamente que no es null, undefined, o string vacío
                    const introValue = parsedSections?.intro;
                    
                    // Verificación exhaustiva: el intro debe ser un string no vacío
                    const hasValidIntro = introValue !== null && 
                                         introValue !== undefined && 
                                         typeof introValue === 'string' && 
                                         introValue.trim().length > 0;
                    
                    // Si no hay contenido válido, no renderizar nada (ni siquiera el contenedor)
                    if (!hasValidIntro) {
                      return null;
                    }
                    
                    // Verificación final: asegurar que el contenido no esté vacío después de trim
                    // También eliminar caracteres invisibles
                    const finalIntro = introValue.trim().replace(/[\s\u00A0\u2000-\u200B\u2028\u2029]/g, '');
                    if (finalIntro.length === 0) {
                      return null;
                    }
                    
                    // Keep ReactMarkdown for intro since it's usually a paragraph
                    // Usar el valor original (introValue.trim()) para ReactMarkdown
                    const introForRender = introValue.trim();
                    
                    return (
                      <div key="intro" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/50">
                        <div className="prose prose-sm text-slate-700 max-w-none leading-relaxed
                                      prose-headings:font-semibold prose-headings:text-[#111111]
                                      prose-p:leading-relaxed prose-p:mb-4
                                      prose-strong:font-bold prose-strong:text-slate-900
                                      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                      prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-2 prose-ul:my-2
                                      prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-2 prose-ol:my-2
                                      prose-li:mb-2 prose-li:my-2 prose-li:leading-relaxed prose-li:text-gray-600 prose-li:marker:text-blue-500">
                          <ReactMarkdown 
                            components={{
                              p: ({ children }) => <p className="mb-0">{children}</p>
                            }}
                          >
                            {introForRender}
                          </ReactMarkdown>
                        </div>
                      </div>
                    );
                  }
                  
                  // Si la sección es null o vacía, no renderizar (para otras secciones)
                  if (!section) return null;
                  
                  // Validar que la sección tenga el formato correcto (objeto con title, icon, content)
                  if (typeof section !== 'object' || !section.title || !section.content || !section.icon) {
                    return null;
                  }

                  const IconComponent = section.icon;
                  
                  const isOpen = openSections.has(sectionKey);
                  
                  // Parse section content into intro and list items
                  const { intro, items } = parseSectionContent(section.content);
                  
                  return (
                    <details
                      key={sectionKey}
                      open={isOpen}
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100/50 overflow-hidden transition-all duration-200"
                    >
                      <summary 
                        className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-gray-50/50 transition-colors duration-200 select-none"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSection(sectionKey);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gray-100 rounded-xl group-open:bg-blue-50 transition-colors duration-200">
                            <IconComponent className="w-5 h-5 text-gray-600 group-open:text-blue-600 transition-colors duration-200" />
                          </div>
                          <h3 className="text-lg font-semibold text-[#111111]">{section.title}</h3>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-300 flex-shrink-0" />
                      </summary>
                      
                      <div className="px-4 pb-6 pt-2 border-t border-slate-100/50">
                        {/* Render Intro Text if it exists */}
                        {intro && (
                          <p className="text-slate-600 mb-4 text-base leading-relaxed italic">
                            {intro}
                          </p>
                        )}
                        
                        {/* Render List if items exist */}
                        {items.length > 0 && (
                          <ul className="list-disc pl-5 space-y-3 text-slate-700 text-base leading-relaxed marker:text-blue-500">
                            {items.map((item, i) => (
                              <li key={i} className="pl-1">
                                <ReactMarkdown components={{ p: 'span' }}>
                                  {item}
                                </ReactMarkdown>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* Galería de Fotos */}
      {plan.images && plan.images.length > 1 && (
        <ImageGallery
          images={plan.images.slice(1)}
          destination={formData.destination}
          onImageClick={setLightboxImage}
        />
      )}
    </section>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada: solo re-renderizar si cambió el contenido del plan
  return prevProps.plan?.gemini_response === nextProps.plan?.gemini_response &&
         prevProps.plan?.images?.[0] === nextProps.plan?.images?.[0] &&
         prevProps.plan?.weather?.temp === nextProps.plan?.weather?.temp &&
         prevProps.formData.destination === nextProps.formData.destination &&
         prevProps.formData.budget === nextProps.formData.budget &&
         prevProps.formData.style === nextProps.formData.style &&
         prevProps.isFavorited === nextProps.isFavorited;
});

TravelDashboard.displayName = 'TravelDashboard';

export default TravelDashboard;

