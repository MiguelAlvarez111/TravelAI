/**
 * TravelPlanner.jsx - Componente principal de ViajeIA
 * 
 * Interfaz moderna y responsive para planificar viajes usando Google Gemini AI
 * Con funcionalidades Pro: Chat Continuo, Exportación PDF y Favoritos
 * 
 * Dependencias requeridas:
 * - react-markdown
 * - lucide-react
 * - jspdf
 * - tailwindcss (configurado en el proyecto)
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plane, Loader2, Send, AlertCircle, Cloud, Clock, Thermometer, Heart, Download, BookOpen, X, MessageCircle, User, Bot, LogOut } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Toaster, toast } from 'sonner';
import DOMPurify from 'dompurify';
import ItineraryDocument from './ItineraryDocument';
import { useAuth } from './contexts/AuthContext';
import { database } from './firebase/config';
import { ref, push } from 'firebase/database';

// Constante para la URL de la API - Lee de variables de entorno o usa fallback
// NOTA: Las variables VITE_* se inyectan en tiempo de BUILD, no en runtime
// En Railway, asegúrate de configurar VITE_API_URL antes del build
const API_URL = import.meta.env.VITE_API_URL || 
                (typeof window !== 'undefined' && window.location.hostname.includes('railway.app') 
                  ? 'https://travelai-production-8955.up.railway.app'  // Fallback para Railway
                  : 'http://localhost:8000');  // Fallback para desarrollo local

const TravelPlanner = () => {
  const { user, logout } = useAuth();
  
  // Estado único para el formulario estructurado
  const [formData, setFormData] = useState({
    destination: '',
    date: '',
    budget: '',
    style: ''
  });
  
  // Estado para almacenar la respuesta completa con datos en tiempo real
  const [travelData, setTravelData] = useState(null);
  
  // Estado para manejar el loading (mientras esperamos la respuesta)
  const [loading, setLoading] = useState(false);
  
  // Estado para manejar errores
  const [error, setError] = useState('');

  // Estados para Chat Continuo
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Estado para Lightbox de imágenes
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // Scroll automático al final del chat cuando hay nuevos mensajes (solo dentro del contenedor)
  useEffect(() => {
    if (chatContainerRef.current && messagesEndRef.current) {
      // Hacer scroll solo dentro del contenedor del chat, no en toda la página
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, chatLoading]);

  // Estados para Favoritos
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Estados para Métricas
  const [stats, setStats] = useState({ total_plans_generated: 0 });

  // Mostrar toast de bienvenida cuando el usuario está autenticado (solo una vez)
  const hasShownWelcome = useRef(false);
  useEffect(() => {
    if (user && !hasShownWelcome.current) {
      toast.success('¡Bienvenido de nuevo!');
      hasShownWelcome.current = true;
    }
  }, [user]);

  // Cargar favoritos al iniciar
  useEffect(() => {
    const savedFavorites = localStorage.getItem('viajeia_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Verificar si el viaje actual está en favoritos
  useEffect(() => {
    if (travelData && formData.destination) {
      const currentTrip = {
        destination: formData.destination,
        date: formData.date,
        budget: formData.budget,
        style: formData.style
      };
      const isSaved = favorites.some(fav => 
        fav.destination === currentTrip.destination &&
        fav.date === currentTrip.date
      );
      setIsFavorited(isSaved);
    }
  }, [travelData, formData, favorites]);

  // Cargar métricas al iniciar y refrescar periódicamente
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        // Silenciar errores de stats - no crítico
        console.debug('No se pudieron cargar estadísticas:', err);
      }
    };

    fetchStats();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refrescar stats después de planificar
  useEffect(() => {
    if (travelData) {
      const fetchStats = async () => {
        try {
          const response = await fetch(`${API_URL}/api/stats`);
          if (response.ok) {
            const data = await response.json();
            setStats(data);
          }
        } catch (err) {
          // Silenciar errores
        }
      };
      // Pequeño delay para que el backend haya actualizado
      setTimeout(fetchStats, 500);
    }
  }, [travelData]);

  /**
   * Función que maneja los cambios en los campos del formulario
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Función para guardar el historial del viaje en Firebase Realtime Database
   * @param {Object} travelData - Datos del viaje generado
   */
  const saveHistoryToFirebase = async (travelData) => {
    // Validación defensiva: verificar que user existe y tiene uid
    if (!user || !user.uid) {
      console.warn('No se puede guardar historial: usuario no autenticado o sin UID');
      return;
    }

    try {
      const historyRef = ref(database, `users/${user.uid}/history`);
      const historyEntry = {
        destination: formData.destination,
        date: formData.date || null,
        timestamp: new Date().toISOString(),
        summary: travelData.gemini_response.substring(0, 500) + (travelData.gemini_response.length > 500 ? '...' : ''),
        budget: formData.budget || null,
        style: formData.style || null
      };

      await push(historyRef, historyEntry);
      // Removido console.log para producción - solo logs de error son necesarios
    } catch (error) {
      // Solo loguear errores críticos, sin exponer detalles sensibles
      console.error('Error al guardar historial en Firebase');
      // No mostramos error al usuario, es una operación en segundo plano
    }
  };

  /**
   * Función para cerrar sesión
   */
  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      toast.error('Error al cerrar sesión');
      setError('Error al cerrar sesión');
    }
  };

  /**
   * Función que se ejecuta cuando el usuario hace clic en "Planificar Aventura"
   * Conecta con el backend FastAPI usando API_URL configurada desde variables de entorno
   */
  const handlePlanificar = async () => {
    // Validar que el destino no esté vacío
    if (!formData.destination.trim()) {
      setError('Por favor, ingresa un destino para tu viaje');
      return;
    }

    // Limpiar errores previos, respuesta anterior y chat
    setError('');
    setTravelData(null);
    setChatHistory([]);
    setLoading(true);

    try {
      // Detectar moneda local del usuario
      const userCurrency = Intl.NumberFormat().resolvedOptions().currency || 'USD';
      
      // Sanitizar el destino antes de enviarlo al backend (protección XSS)
      const cleanDestination = DOMPurify.sanitize(formData.destination.trim());
      
      // Llamar al backend FastAPI
      const apiResponse = await fetch(`${API_URL}/api/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.uid || 'anonymous',
        },
        body: JSON.stringify({
          destination: cleanDestination,
          date: formData.date || '',
          budget: formData.budget || '',
          style: formData.style || '',
          user_currency: userCurrency
        }),
      });

      // Manejo específico de error 429 (Rate Limit)
      if (apiResponse.status === 429) {
        const errorData = await apiResponse.json().catch(() => ({ detail: 'Has alcanzado el límite de consultas. Por favor, espera un minuto.' }));
        const errorMessage = errorData.detail || 'Has alcanzado el límite de consultas. Por favor, espera un minuto.';
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || 'Error al consultar la IA');
      }

      const data = await apiResponse.json();
      setTravelData(data);
      
      // Detectar si la respuesta fue cortada por límite de tokens
      if (data.finish_reason && data.finish_reason !== 'STOP') {
        toast.warning('Nota: La respuesta fue cortada por límite de longitud.', {
          duration: 5000,
        });
      }
      
      // Agregar mensaje simulado de Alex (evitar redundancia con las cards visuales)
      setChatHistory([
        {
          role: 'user',
          parts: `Planifica un viaje a ${formData.destination}${formData.date ? ` para ${formData.date}` : ''}${formData.budget ? ` con presupuesto ${formData.budget}` : ''}${formData.style ? ` y estilo ${formData.style}` : ''}`
        },
        {
          role: 'model',
          parts: `¡Listo! He diseñado tu viaje a ${formData.destination}. Revisa los detalles visuales arriba. ☝️`
        }
      ]);

      // Guardar historial en Firebase Realtime Database
      await saveHistoryToFirebase(data);
      
    } catch (err) {
      let errorMessage = 'Ocurrió un error consultando a la IA';
      
      // Mejor manejo de errores con más detalles para debugging
      console.error('Error al planificar viaje:', err);
      
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        errorMessage = `No pudimos conectar con el servidor. Verifica que el backend esté corriendo en ${API_URL}`;
        console.error('Error de conexión - URL:', `${API_URL}/api/plan`);
      } else if (err.message.includes('Unexpected token') || err.message.includes('JSON')) {
        errorMessage = `Error al procesar la respuesta del servidor. Por favor, intenta nuevamente.`;
        console.error('Error de parsing JSON - puede ser un problema de CORS');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Toast de error
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para enviar un mensaje en el chat continuo
   * IMPORTANTE: Esta función NO debe actualizar travelData para preservar el Dashboard visual
   * El endpoint /api/chat es solo para respuestas conversacionales, no para planes nuevos
   */
  const handleChatSend = async () => {
    if (!chatMessage.trim() || !travelData) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setChatLoading(true);

    // Agregar mensaje del usuario al historial visual (para mostrar en la UI)
    const newUserMessage = { role: 'user', parts: userMessage };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      // Llamar al endpoint /api/chat con historial (sin incluir el nuevo mensaje, ya que va en el campo 'message')
      const apiResponse = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.uid || 'anonymous',
        },
        body: JSON.stringify({
          destination: formData.destination.trim(),
          date: formData.date || '',
          budget: formData.budget || '',
          style: formData.style || '',
          message: userMessage,
          history: chatHistory  // Historial sin el nuevo mensaje (ya que va en 'message')
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || 'Error al consultar la IA');
      }

      const data = await apiResponse.json();
      
      // Detectar si la respuesta fue cortada por límite de tokens
      if (data.finish_reason && data.finish_reason !== 'STOP') {
        toast.warning('Nota: La respuesta fue cortada por límite de longitud.', {
          duration: 5000,
        });
      }
      
      // Agregar respuesta del modelo al historial (siempre)
      const newModelMessage = { role: 'model', parts: data.gemini_response };
      setChatHistory(prev => [...prev, newModelMessage]);

      // NO actualizar travelData - Preservar el Dashboard visual
      // El endpoint /api/chat devuelve las mismas imágenes/weather del plan original
      // Solo actualizamos el chatHistory para mantener la conversación
      // Esto evita que desaparezcan las imágenes, clima y tarjetas visuales

    } catch (err) {
      const errorMsg = err.message || 'Error al enviar mensaje';
      toast.error(errorMsg);
      setError(errorMsg);
      // Remover el mensaje del usuario si falló
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * Exporta el plan de viaje a PDF estilo revista usando html2canvas y jsPDF.
   * 
   * Estrategia "Smart Canvas": Genera un PDF de altura dinámica (una sola página larga tipo infografía)
   * que garantiza que el diseño de revista se mantenga intacto de principio a fin.
   * 
   * Proceso:
   * 1. Espera a que el componente ItineraryDocument se renderice completamente
   * 2. Oculta elementos de UI que no deben aparecer en el PDF (botones de descarga)
   * 3. Configura todas las imágenes con crossOrigin="anonymous" para evitar problemas CORS
   * 4. Hace visible temporalmente el elemento oculto para que html2canvas pueda capturarlo
   * 5. Espera a que todas las imágenes se carguen completamente (con timeout de 5s por imagen)
   * 6. Captura el elemento usando html2canvas con escala 2x para alta calidad
   * 7. Calcula las dimensiones del PDF en mm basándose en los píxeles del canvas
   * 8. Crea un PDF con dimensiones exactas del contenido (página dinámica)
   * 9. Restaura los estilos originales del elemento y los botones de UI
   * 
   * @throws {Error} Si no se encuentra el elemento #itinerary-document o si falla la generación del PDF
   */
  const handleExportPDF = async () => {
    if (!travelData) return;

    try {
      // Mostrar indicador de carga
      setLoading(true);
      setError('');
      
      // Toast de inicio de generación
      toast.info('Generando tu itinerario... 📄');

      // Esperar un momento para que el componente se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Buscar el elemento del documento oculto
      const element = document.getElementById('itinerary-document');
      
      if (!element) {
        throw new Error('No se encontró el componente del documento. Asegúrate de que el plan esté cargado.');
      }

      // Limpieza: Ocultar elementos de UI que no deben aparecer en el PDF
      const downloadButtons = document.querySelectorAll('button[title="Descargar PDF"]');
      const originalButtonStyles = [];
      downloadButtons.forEach(btn => {
        originalButtonStyles.push({
          element: btn,
          display: btn.style.display,
          visibility: btn.style.visibility
        });
        btn.style.display = 'none';
        btn.style.visibility = 'hidden';
      });

      // Asegurar que todas las imágenes tengan crossOrigin="anonymous" para CORS
      const images = element.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('crossOrigin')) {
          img.setAttribute('crossOrigin', 'anonymous');
        }
      });

      // Hacer visible temporalmente el elemento para que html2canvas pueda capturarlo
      const originalStyles = {
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
        zIndex: element.style.zIndex,
        visibility: element.style.visibility
      };
      
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.zIndex = '9999';
      element.style.visibility = 'visible';

      // Esperar a que las imágenes se carguen completamente
      const imagePromises = Array.from(images).map(img => {
        if (img.complete && img.naturalHeight !== 0) {
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve(); // Continuar aunque falle una imagen (timeout de 5s)
          }, 5000);
          
          img.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(); // Continuar aunque falle una imagen
          };
        });
      });
      await Promise.all(imagePromises);

      // Configurar html2canvas con opciones para alta calidad y CORS
      const canvas = await html2canvas(element, {
        useCORS: true, // Importante para cargar imágenes externas (Unsplash)
        allowTaint: true, // Permitir imágenes con taint (necesario para CORS)
        scale: 2, // Resolución alta (2x para balance entre calidad y tamaño)
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Asegurar que el clon también tenga las imágenes visibles y con CORS
          const clonedElement = clonedDoc.getElementById('itinerary-document');
          if (clonedElement) {
            clonedElement.style.visibility = 'visible';
            clonedElement.style.position = 'absolute';
            clonedElement.style.left = '-9999px';
            
            // Asegurar crossOrigin en el clon también
            const clonedImages = clonedElement.querySelectorAll('img');
            clonedImages.forEach(img => {
              if (!img.hasAttribute('crossOrigin')) {
                img.setAttribute('crossOrigin', 'anonymous');
              }
            });
          }
        }
      });

      // Obtener dimensiones del canvas
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Convertir canvas a imagen
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Restaurar estilos originales del elemento
      element.style.position = originalStyles.position;
      element.style.left = originalStyles.left;
      element.style.top = originalStyles.top;
      element.style.zIndex = originalStyles.zIndex;
      element.style.visibility = originalStyles.visibility;

      // Restaurar botones de UI
      originalButtonStyles.forEach(({ element: btn, display, visibility }) => {
        btn.style.display = display;
        btn.style.visibility = visibility;
      });

      // PDF DINÁMICO: Inicializar jsPDF con el tamaño exacto del contenido
      // Convertir píxeles a mm (asumiendo 96 DPI estándar: 1mm = 3.779527559 pixels)
      const mmPerPixel = 0.264583333; // 1 pixel = 0.264583333 mm (a 96 DPI)
      const pdfWidthMm = imgWidth * mmPerPixel;
      const pdfHeightMm = imgHeight * mmPerPixel;

      // Crear PDF con dimensiones exactas del contenido (página dinámica)
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidthMm, pdfHeightMm] // ¡El PDF tendrá el tamaño exacto de la imagen!
      });

      // Agregar la imagen en (0, 0) con las dimensiones exactas
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');

      // Generar nombre de archivo
      const fileName = `ViajeIA_${formData.destination.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Guardar PDF
      pdf.save(fileName);
      
      setLoading(false);
      
      // Toast de éxito
      toast.success('Descarga lista');
      
    } catch (error) {
      // Asegurar que el elemento se oculte incluso si hay error
      const element = document.getElementById('itinerary-document');
      if (element) {
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.visibility = 'hidden';
        element.style.zIndex = '-1';
      }
      
      // Mensaje de error más descriptivo
      const errorMessage = error.message || 'Error desconocido al generar el PDF';
      const fullErrorMessage = `Error al generar el PDF: ${errorMessage}. Por favor, intenta nuevamente.`;
      toast.error(fullErrorMessage);
      setError(fullErrorMessage);
      setLoading(false);
    }
  };

  /**
   * Función para agregar/quitar de favoritos
   */
  const handleToggleFavorite = () => {
    if (!travelData || !formData.destination) return;

    const currentTrip = {
      destination: formData.destination,
      date: formData.date,
      budget: formData.budget,
      style: formData.style,
      summary: travelData.gemini_response.substring(0, 200) + '...',
      createdAt: new Date().toISOString()
    };

    if (isFavorited) {
      // Remover de favoritos
      const updatedFavorites = favorites.filter(fav => 
        !(fav.destination === currentTrip.destination && fav.date === currentTrip.date)
      );
      setFavorites(updatedFavorites);
      localStorage.setItem('viajeia_favorites', JSON.stringify(updatedFavorites));
      setIsFavorited(false);
    } else {
      // Agregar a favoritos
      const updatedFavorites = [...favorites, currentTrip];
      setFavorites(updatedFavorites);
      localStorage.setItem('viajeia_favorites', JSON.stringify(updatedFavorites));
      setIsFavorited(true);
      // Toast de éxito
      toast.success('Viaje guardado en tus favoritos ❤️');
    }
  };

  /**
   * Función para cargar un viaje desde favoritos
   */
  const handleLoadFavorite = (favorite) => {
    setFormData({
      destination: favorite.destination,
      date: favorite.date || '',
      budget: favorite.budget || '',
      style: favorite.style || ''
    });
    setShowFavorites(false);
    // Opcional: auto-planificar
    // handlePlanificar();
  };

  /**
   * Función para eliminar un favorito
   */
  const handleDeleteFavorite = (index) => {
    const updatedFavorites = favorites.filter((_, i) => i !== index);
    setFavorites(updatedFavorites);
    localStorage.setItem('viajeia_favorites', JSON.stringify(updatedFavorites));
  };

  // Función helper para obtener iniciales del usuario
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Componente LoadingSkeleton para carga percibida
  const LoadingSkeleton = () => (
    <section className="animate-fade-in-up bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-10 space-y-8">
      {/* Skeleton de imagen principal */}
      <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-200 animate-pulse"></div>
      
      {/* Layout Principal: Sidebar + Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel Lateral (Sidebar) - Widgets Skeleton */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-200 rounded-[2rem] p-6 h-32 animate-pulse"></div>
          <div className="bg-slate-200 rounded-[2rem] p-6 h-24 animate-pulse"></div>
        </div>
        
        {/* Panel Central - Plan de Viaje Skeleton */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] shadow-sm p-8 space-y-4">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
            </div>
            <div className="space-y-3 mt-6">
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans">
      {/* Toaster para feedback visual */}
      <Toaster position="top-center" richColors />
      
      {/* Header Sticky - Estilo Apple */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="w-7 h-7 text-slate-900" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                ViajeIA
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
                    {getUserInitials()}
                  </div>
                  <span className="text-sm text-slate-600 hidden sm:inline font-medium">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Contenedor Principal Centrado */}
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Tarjeta de Entrada (Hero Section): Estilo Apple */}
        <section className="bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-10 mb-8">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-8">Planifica tu Aventura</h2>
          
          {/* Formulario con Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Campo: Destino (Full Width) */}
            <div className="md:col-span-2">
              <label htmlFor="destination" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Destino
              </label>
              <div className="relative">
                <Plane className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="¿París, Bali, Nueva York?"
                  disabled={loading}
                  className="w-full pl-12 pr-5 py-4 
                             bg-[#F5F5F7] border-transparent rounded-xl
                             focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                             disabled:bg-slate-100 disabled:cursor-not-allowed
                             text-lg text-slate-900 placeholder-slate-400
                             transition-all duration-300"
                />
              </div>
            </div>

            {/* Campo: Fechas */}
            <div>
              <label htmlFor="date" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                ¿Cuándo viajas?
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-12 pr-5 py-4 
                             bg-[#F5F5F7] border-transparent rounded-xl
                             focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                             disabled:bg-slate-100 disabled:cursor-not-allowed
                             text-lg text-slate-900
                             transition-all duration-300"
                />
              </div>
            </div>

            {/* Campo: Presupuesto */}
            <div>
              <label htmlFor="budget" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Presupuesto
              </label>
              <div className="relative">
                <select
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-5 pr-5 py-4 
                             bg-[#F5F5F7] border-transparent rounded-xl
                             focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                             disabled:bg-slate-100 disabled:cursor-not-allowed
                             text-lg text-slate-900
                             transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="">Selecciona tu presupuesto</option>
                  <option value="Mochilero 🎒">Mochilero 🎒</option>
                  <option value="Moderado ⚖️">Moderado ⚖️</option>
                  <option value="Lujo ✨">Lujo ✨</option>
                </select>
              </div>
            </div>

            {/* Campo: Estilo de Viaje */}
            <div>
              <label htmlFor="style" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Estilo de Viaje
              </label>
              <div className="relative">
                <select
                  id="style"
                  name="style"
                  value={formData.style}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-5 pr-5 py-4 
                             bg-[#F5F5F7] border-transparent rounded-xl
                             focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                             disabled:bg-slate-100 disabled:cursor-not-allowed
                             text-lg text-slate-900
                             transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="">Selecciona tu estilo</option>
                  <option value="Aventura 🧗">Aventura 🧗</option>
                  <option value="Relax 🏖️">Relax 🏖️</option>
                  <option value="Cultura 🏛️">Cultura 🏛️</option>
                  <option value="Gastronomía 🌮">Gastronomía 🌮</option>
                </select>
              </div>
            </div>

          </div>

          {/* Botón Principal: Estilo Apple */}
          <button
            onClick={handlePlanificar}
            disabled={loading || !formData.destination.trim()}
            className="w-full md:w-auto md:min-w-[280px] flex items-center justify-center gap-3
                       bg-black text-white
                       hover:bg-slate-800
                       disabled:bg-slate-300 disabled:text-slate-500
                       font-semibold py-4 px-8 rounded-full
                       transition-colors duration-300
                       disabled:cursor-not-allowed
                       active:scale-95 transition-transform"
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
        </section>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-8 p-5 bg-red-50 border-l-4 border-red-500 rounded-2xl
                          flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-1">Error de conexión</p>
              <p className="text-red-600 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Skeleton Loader durante la carga */}
        {loading && !travelData && <LoadingSkeleton />}

        {/* Resultados (El Plan): Tarjeta separada con animación */}
        {travelData && !loading && (
          <section className="animate-fade-in-up bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-10 space-y-8">
            
            {/* Header del Plan con Botones de Acción */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Tu Plan</h2>
              <div className="flex items-center gap-2">
                {travelData && (
                  <button
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
                  onClick={() => setShowFavorites(true)}
                  className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200"
                  title="Mis Viajes Guardados"
                >
                  <BookOpen className="w-5 h-5" />
                </button>
                {travelData && (
                  <button
                    onClick={handleExportPDF}
                    className="p-2.5 rounded-full bg-[#007AFF] text-white hover:bg-[#0051D5] transition-all duration-200"
                    title="Descargar PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Header del Plan: Imagen de fondo con overlay oscuro */}
            {travelData.images && travelData.images.length > 0 && (
              <div 
                className="relative w-full h-64 md:h-80 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLightboxImage(travelData.images[0])}
              >
                <img 
                  src={travelData.images[0]} 
                  alt={formData.destination}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">
                    {formData.destination}
                  </h3>
                  {travelData.weather && (
                    <p className="text-white/90 text-lg font-medium">
                      {travelData.weather.condition}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Layout Principal: Sidebar + Contenido */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Panel Lateral (Sidebar) - Widgets */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* Widget: Clima */}
                {travelData.weather && travelData.weather.temp !== null && (
                  <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Cloud className="w-6 h-6 text-slate-400" />
                      <h3 className="font-semibold text-lg text-slate-900">Clima Actual</h3>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-slate-900">{travelData.weather.temp}°</span>
                      <span className="text-xl text-slate-500">C</span>
                    </div>
                    {travelData.weather.condition && (
                      <p className="text-slate-500 mb-3 font-medium">{travelData.weather.condition}</p>
                    )}
                    {travelData.weather.feels_like && (
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Thermometer className="w-4 h-4" />
                        <span>Sensación: {travelData.weather.feels_like}°C</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Widget: Hora Local */}
                {travelData.info && travelData.info.local_time && (
                  <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-6 h-6 text-slate-400" />
                      <h3 className="font-semibold text-lg text-slate-900">Hora Local</h3>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{travelData.info.local_time}</div>
                  </div>
                )}

              </div>

              {/* Panel Central - Plan de Viaje */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-8">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/50">
                    <div className="p-2 bg-slate-100 rounded-xl">
                      <Plane className="w-5 h-5 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                      Tu Plan de Viaje por Alex
                    </h2>
                  </div>
                  
                  {/* ReactMarkdown con estilos profesionales */}
                  <div className="markdown-content text-slate-600 leading-relaxed
                                  [&>h1]:text-3xl [&>h1]:font-extrabold [&>h1]:tracking-tight [&>h1]:text-slate-900 [&>h1]:mt-8 [&>h1]:mb-4 [&>h1]:pb-3 [&>h1]:border-b [&>h1]:border-slate-200
                                  [&>h2]:text-2xl [&>h2]:font-extrabold [&>h2]:tracking-tight [&>h2]:text-slate-900 [&>h2]:mt-6 [&>h2]:mb-3
                                  [&>h3]:text-xl [&>h3]:font-extrabold [&>h3]:tracking-tight [&>h3]:text-slate-900 [&>h3]:mt-5 [&>h3]:mb-2
                                  [&>p]:my-4 [&>p]:leading-relaxed [&>p]:text-slate-600
                                  [&>strong]:font-semibold [&>strong]:text-slate-900
                                  [&>em]:italic [&>em]:text-slate-600
                                  [&>ul]:my-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:space-y-3 [&>ul>li]:leading-relaxed [&>ul>li]:marker:text-blue-600
                                  [&>ol]:my-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:space-y-3 [&>ol>li]:leading-relaxed [&>ol>li]:marker:text-blue-600
                                  [&>a]:text-blue-600 [&>a]:no-underline [&>a]:font-medium hover:[&>a]:underline
                                  [&>code]:text-blue-700 [&>code]:bg-blue-50 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
                                  [&>blockquote]:border-l-4 [&>blockquote]:border-blue-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-600 [&>blockquote]:my-4
                                  [&>hr]:border-slate-200 [&>hr]:my-8 [&>hr]:border-t">
                    <ReactMarkdown>{travelData.gemini_response}</ReactMarkdown>
                  </div>
                </div>
              </div>

            </div>

            {/* Grid de Galería: grid-cols-1 md:grid-cols-3 gap-4 */}
            {travelData.images && travelData.images.length > 1 && (
              <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-8">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-6">Galería de Imágenes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {travelData.images.slice(1).map((imageUrl, index) => (
                    <div 
                      key={index}
                      className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
                      onClick={() => setLightboxImage(imageUrl)}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`${formData.destination} ${index + 2}`}
                        className="w-full h-48 object-cover rounded-2xl hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interfaz de Chat Continuo - Estilo iMessage */}
            <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/50">
                <MessageCircle className="w-5 h-5 text-slate-400" />
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">Chat con Alex</h3>
              </div>

              {/* Historial de Chat - Contenedor estabilizado con altura fija */}
              <div 
                ref={chatContainerRef}
                className="h-[400px] overflow-y-auto p-4 bg-white rounded-xl mb-4 space-y-3"
                style={{ scrollbarWidth: 'thin', msOverflowStyle: 'auto' }}
              >
                <style>{`
                  div[style*="scrollbarWidth"]::-webkit-scrollbar {
                    width: 6px;
                  }
                  div[style*="scrollbarWidth"]::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                  }
                  div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                  }
                  div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                `}</style>
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar para Alex (solo a la izquierda) */}
                    {msg.role === 'model' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Burbuja de Mensaje - Estilo iMessage */}
                    <div
                      className={`max-w-[75%] ${
                        msg.role === 'user'
                          ? 'bg-[#007AFF] text-white rounded-3xl rounded-br-md px-5 py-3'
                          : 'bg-[#F5F5F7] text-slate-800 rounded-3xl rounded-bl-md px-5 py-3'
                      }`}
                    >
                      {/* Nombre del remitente */}
                      <div className={`text-xs font-semibold mb-1.5 ${
                        msg.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {msg.role === 'user' ? 'Tú' : 'Alex'}
                      </div>
                      
                      {/* Contenido del mensaje */}
                      {msg.role === 'model' ? (
                        <div className="text-sm leading-relaxed text-slate-800
                          [&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-slate-900 [&>h1]:mt-3 [&>h1]:mb-2 [&>h1]:pb-1 [&>h1]:border-b [&>h1]:border-slate-300
                          [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-3 [&>h2]:mb-2 [&>h2]:pb-1 [&>h2]:border-b [&>h2]:border-slate-300
                          [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:mt-2 [&>h3]:mb-1
                          [&>p]:my-2 [&>p]:leading-relaxed [&>p]:text-slate-800
                          [&>strong]:text-slate-900 [&>strong]:font-semibold
                          [&>em]:text-slate-700 [&>em]:italic
                          [&>ul]:my-2 [&>ul]:pl-4 [&>ul]:list-disc [&>ul]:space-y-1
                          [&>ol]:my-2 [&>ol]:pl-4 [&>ol]:list-decimal [&>ol]:space-y-1
                          [&>li]:leading-relaxed [&>li]:text-slate-800
                          [&>a]:text-[#007AFF] [&>a]:no-underline [&>a]:font-medium hover:[&>a]:underline
                          [&>code]:text-[#007AFF] [&>code]:bg-blue-50 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono
                          [&>blockquote]:border-l-4 [&>blockquote]:border-blue-300 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-slate-600 [&>blockquote]:my-2
                          [&>hr]:border-slate-300 [&>hr]:my-3">
                          <ReactMarkdown>{msg.parts}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                          {msg.parts}
                        </div>
                      )}
                    </div>
                    
                    {/* Avatar para Usuario (solo a la derecha) */}
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="bg-[#F5F5F7] text-slate-800 rounded-3xl rounded-bl-md px-5 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-[#007AFF]" />
                    </div>
                  </div>
                )}
                {/* Elemento invisible para scroll automático */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Chat - Estilo iMessage (redondeado completo) */}
              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-200/50">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleChatSend()}
                  placeholder="Pregunta algo sobre tu viaje..."
                  disabled={chatLoading}
                  className="flex-1 px-5 py-3 
                             bg-[#F5F5F7] border-transparent rounded-full
                             focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                             disabled:bg-slate-100 disabled:cursor-not-allowed
                             text-lg text-slate-900 placeholder-slate-400
                             transition-all duration-300"
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="w-12 h-12 
                             bg-[#007AFF] text-white rounded-full
                             hover:bg-[#0051D5] disabled:bg-slate-300 disabled:cursor-not-allowed
                             transition-all duration-300
                             flex items-center justify-center
                             active:scale-95 transition-transform"
                >
                  {chatLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

          </section>
        )}

        {/* Sección ViajeIA Pro: Footer Premium */}
        <footer className="mt-8 bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">👑</span>
            <h3 className="text-3xl font-semibold tracking-tight text-slate-900">ViajeIA PRO</h3>
          </div>
          
          <p className="text-lg text-slate-500 mb-6 leading-relaxed font-medium">
            Próximamente: Reservas directas, Alertas de precios y Guías offline.
          </p>
          
          <p className="text-sm text-slate-400 mb-6">
            Accede a funcionalidades premium que harán tu experiencia de viaje aún mejor. 
            Únete a nuestra lista de espera para ser de los primeros en conocerlas.
          </p>
          
          <button
            onClick={() => {
              toast.success('¡Gracias por tu interés! Te notificaremos cuando ViajeIA PRO esté disponible. 🎉');
            }}
            className="px-6 py-3 
                       bg-black text-white
                       hover:bg-slate-800
                       font-semibold rounded-full
                       transition-colors duration-300
                       active:scale-95 transition-transform
                       flex items-center gap-2"
          >
            <span>Unirse a la lista de espera</span>
            <span className="text-lg">→</span>
          </button>
        </footer>

        {/* Footer con métricas */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-slate-500 font-medium">
            Powered by <span className="text-slate-900 font-semibold">Google Gemini AI</span> ✨
          </p>
          {stats.total_plans_generated > 0 && (
            <p className="text-sm text-slate-400 font-medium">
              🌍 Viajes planeados hoy: <span className="text-slate-600 font-semibold">{stats.total_plans_generated}</span>
            </p>
          )}
        </div>

      </div>

      {/* Modal de Favoritos */}
      {showFavorites && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-slate-400" />
                Mis Viajes Guardados
              </h2>
              <button
                onClick={() => setShowFavorites(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No tienes viajes guardados aún</p>
                  <p className="text-sm mt-2 text-slate-400">Planifica un viaje y guárdalo para accederlo después</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favorites.map((fav, index) => (
                    <div
                      key={index}
                      className="border border-slate-200/50 rounded-2xl p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-slate-900 mb-1">
                            {fav.destination}
                          </h3>
                          <div className="text-sm text-slate-500 space-y-1">
                            {fav.date && <p>📅 {fav.date}</p>}
                            {fav.budget && <p>💰 {fav.budget}</p>}
                            {fav.style && <p>🎯 {fav.style}</p>}
                          </div>
                          {fav.summary && (
                            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                              {fav.summary}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleLoadFavorite(fav)}
                            className="px-4 py-2 bg-[#007AFF] text-white rounded-full hover:bg-[#0051D5] transition-colors text-sm font-medium"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => handleDeleteFavorite(index)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Componente oculto para generar PDF estilo revista */}
      {travelData && (
        <ItineraryDocument travelData={travelData} formData={formData} />
      )}

      {/* Lightbox Modal para imágenes */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
            >
              <X className="w-6 h-6 text-slate-900" />
            </button>
            <img 
              src={lightboxImage} 
              alt="Vista ampliada"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelPlanner;
