/**
 * utils.js - Funciones auxiliares para el parseo del plan de viaje
 */

import { Hotel, UtensilsCrossed, MapPin, Lightbulb, DollarSign } from 'lucide-react';

/**
 * Función para parsear el plan de viaje (Find & Slice Strategy)
 * Extrae secciones usando búsqueda de emojis y slice del texto (más robusto que split)
 * 
 * @param {string} text - Texto markdown del plan de viaje
 * @returns {Object|null} - Objeto con secciones separadas o null si falla el parsing
 * 
 * Estructura de retorno:
 * {
 *   intro: "...",
 *   alojamiento: { title: "Alojamiento", icon: Hotel, content: "..." },
 *   gastronomia: { title: "Gastronomía", icon: UtensilsCrossed, content: "..." },
 *   lugares: { title: "Lugares", icon: MapPin, content: "..." },
 *   consejos: { title: "Consejos", icon: Lightbulb, content: "..." },
 *   costos: { title: "Costos", icon: DollarSign, content: "..." }
 * }
 */
export const parseTravelPlan = (text) => {
  if (!text) return {};

  // Definir los marcadores exactos que buscamos
  const markers = {
    alojamiento: "🏨",
    gastronomia: "🥘",
    lugares: "💎",
    consejos: "💡",
    costos: "💰"
  };

  // Mapeo de secciones a información de renderizado
  const sectionInfo = {
    alojamiento: { title: "Alojamiento", icon: Hotel },
    gastronomia: { title: "Gastronomía", icon: UtensilsCrossed },
    lugares: { title: "Lugares", icon: MapPin },
    consejos: { title: "Consejos", icon: Lightbulb },
    costos: { title: "Costos", icon: DollarSign }
  };

  const sections = {};

  // Función auxiliar para extraer texto entre dos marcadores
  const extractSection = (emoji, key) => {
    const startIndex = text.indexOf(emoji);
    if (startIndex === -1) return null;

    // Buscar cuál es el siguiente emoji en el texto
    let endIndex = text.length;
    Object.values(markers).forEach(otherEmoji => {
      if (otherEmoji === emoji) return; // Ignorar el mismo
      const otherIndex = text.indexOf(otherEmoji, startIndex + 1); // Buscar después del actual
      if (otherIndex !== -1 && otherIndex < endIndex) {
        endIndex = otherIndex;
      }
    });

    // Extraer y limpiar
    let content = text.slice(startIndex, endIndex).trim();
    
    // Quitar la primera línea (que suele ser el título duplicado "🏨 ALOJAMIENTO...")
    const firstLineBreak = content.indexOf('\n');
    if (firstLineBreak !== -1) {
      content = content.slice(firstLineBreak).trim();
    }
    
    // Remover encabezados Markdown del contenido si quedaron
    content = content.replace(/^##\s+.*$/gm, '').trim();
    
    // Solo retornar si hay contenido válido
    if (content && content.length > 5) {
      return {
        title: sectionInfo[key].title,
        icon: sectionInfo[key].icon,
        content: content
      };
    }
    
    return null;
  };

  // Ejecutar extracción para cada sección
  sections.alojamiento = extractSection(markers.alojamiento, 'alojamiento');
  sections.gastronomia = extractSection(markers.gastronomia, 'gastronomia');
  sections.lugares = extractSection(markers.lugares, 'lugares');
  sections.consejos = extractSection(markers.consejos, 'consejos');
  sections.costos = extractSection(markers.costos, 'costos');
  
  // Capturar la intro (todo lo que está antes del primer emoji o header markdown)
  // Buscar el primer emoji o el header markdown (##) que precede a los emojis
  const emojiIndices = Object.values(markers)
    .map(m => text.indexOf(m))
    .filter(i => i !== -1);
  
  // Buscar el primer "##" en el texto (puede haber texto antes que sea el intro)
  const firstHeaderIndex = text.indexOf('##');
  
  // También buscar el primer emoji directamente (por si no hay header)
  const firstEmojiIndex = emojiIndices.length > 0 ? Math.min(...emojiIndices) : -1;
  
  // Inicializar intro como null por defecto
  sections.intro = null;
  
  // Determinar el índice de inicio de la primera sección
  // Usar el primer "##" si existe, o el primer emoji si no hay header
  let firstSectionIndex = text.length;
  
  // Priorizar el header markdown si existe
  if (firstHeaderIndex !== -1) {
    firstSectionIndex = firstHeaderIndex;
  } else if (firstEmojiIndex !== -1) {
    // Si no hay header, usar el primer emoji
    firstSectionIndex = firstEmojiIndex;
  }
  
  if (firstSectionIndex > 0 && firstSectionIndex < text.length) {
    // Extraer todo el contenido antes de la primera sección (emoji o header)
    let introContent = text.slice(0, firstSectionIndex);
    
    // Limpiar: remover espacios y saltos de línea al inicio y final
    introContent = introContent.trim();
    
    // Remover líneas vacías al inicio y final, pero mantener el contenido
    introContent = introContent.replace(/^\n+|\n+$/g, '').trim();
    
    // Remover cualquier markdown residual (##, ###, etc.) al final
    introContent = introContent.replace(/#+\s*$/, '').trim();
    
    // Remover cualquier espacio o símbolo de markdown al final (pero ser más conservador)
    introContent = introContent.replace(/[\s#*\-_]+$/, '').trim();
    
    // Remover todos los espacios en blanco múltiples y normalizar
    const cleanedContent = introContent.replace(/\s+/g, ' ').trim();
    
    // Verificación final: asegurar que hay contenido real (no solo espacios, saltos de línea, etc.)
    // Eliminar cualquier carácter que no sea visible (espacios, tabs, etc.)
    const visibleContent = cleanedContent.replace(/[\s\u00A0\u2000-\u200B\u2028\u2029]/g, '');
    
    // Si hay contenido válido (aunque sea corto, podría ser un saludo), capturarlo
    // IMPORTANTE: Solo establecer si hay contenido real, nunca como string vacío
    if (visibleContent && visibleContent.length > 0) {
      sections.intro = cleanedContent;
    } else {
      // Asegurar explícitamente que es null, no string vacío
      sections.intro = null;
    }
  } else {
    // Si no hay secciones o el índice es 0, no hay intro
    sections.intro = null;
  }

  // Si no se encontraron secciones válidas, retornar null para usar fallback
  const hasValidSections = Object.keys(sections).some(key => {
    const section = sections[key];
    return section && (typeof section === 'string' || (section.content && section.content.length > 5));
  });

  if (!hasValidSections) {
    return null;
  }

  return sections;
};

