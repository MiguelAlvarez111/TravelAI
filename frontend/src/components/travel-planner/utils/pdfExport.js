/**
 * pdfExport.js - Utilidad para exportar PDF
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const exportToPDF = async (travelData, formData, setLoading, setError) => {
  if (!travelData) return;

  try {
    setLoading(true);
    setError('');
    toast.info('Generando tu itinerario... 📄');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const element = document.getElementById('itinerary-document');
    
    if (!element) {
      throw new Error('No se encontró el componente del documento. Asegúrate de que el plan esté cargado.');
    }

    const downloadButtons = document.querySelectorAll('button[title="Descargar PDF"]');
    const originalButtonStyles = [];
    downloadButtons.forEach(btn => {
      if (btn && btn.style) {
        originalButtonStyles.push({
          element: btn,
          display: btn.style.display || '',
          visibility: btn.style.visibility || ''
        });
        if (typeof btn.style.setProperty === 'function') {
          btn.style.setProperty('display', 'none', 'important');
          btn.style.setProperty('visibility', 'hidden', 'important');
        } else {
          btn.style.display = 'none';
          btn.style.visibility = 'hidden';
        }
      }
    });

    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (img && img.setAttribute && !img.hasAttribute('crossOrigin')) {
        img.setAttribute('crossOrigin', 'anonymous');
      }
    });

    const originalStyles = {
      position: element.style?.position || '',
      left: element.style?.left || '',
      top: element.style?.top || '',
      zIndex: element.style?.zIndex || '',
      visibility: element.style?.visibility || ''
    };
    
    if (element.style) {
      if (typeof element.style.setProperty === 'function') {
        element.style.setProperty('position', 'absolute', 'important');
        element.style.setProperty('left', '-9999px', 'important');
        element.style.setProperty('top', '0', 'important');
        element.style.setProperty('z-index', '9999', 'important');
        element.style.setProperty('visibility', 'visible', 'important');
      } else {
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.top = '0';
        element.style.zIndex = '9999';
        element.style.visibility = 'visible';
      }
    }

    const imagePromises = Array.from(images).map(img => {
      if (img.complete && img.naturalHeight !== 0) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(), 5000);
        img.onload = () => { clearTimeout(timeout); resolve(); };
        img.onerror = () => { clearTimeout(timeout); resolve(); };
      });
    });
    await Promise.all(imagePromises);

    // Mejorar la calidad aumentando la escala y optimizando las opciones
    const scale = 3; // Aumentar a 3x para mejor calidad (era 2)
    
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true, // Permitir para imágenes de dominios diferentes
      scale: scale,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      // Opciones adicionales para mejorar calidad
      removeContainer: false,
      imageTimeout: 15000, // Aumentar timeout para imágenes grandes
      // Deshabilitar foreignObjectRendering para evitar errores con setProperty
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        try {
          const clonedElement = clonedDoc.getElementById('itinerary-document');
          if (clonedElement) {
            // Asegurar que el elemento sea visible en el clon
            if (clonedElement.style) {
              try {
                clonedElement.style.visibility = 'visible';
                clonedElement.style.position = 'absolute';
                clonedElement.style.left = '-9999px';
              } catch (styleError) {
                console.warn('Error al establecer estilos en clon:', styleError);
              }
            }
            
            // Asegurar que las fuentes estén cargadas
            try {
              const style = clonedDoc.createElement('style');
              if (style) {
                style.textContent = `
                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                  * {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                  }
                `;
                if (clonedDoc.head) {
                  clonedDoc.head.appendChild(style);
                }
              }
            } catch (styleError) {
              console.warn('Error al agregar estilos de fuentes:', styleError);
            }
            
            // Asegurar que todas las imágenes tengan crossOrigin
            try {
              const clonedImages = clonedElement.querySelectorAll('img');
              clonedImages.forEach(img => {
                if (img && typeof img.setAttribute === 'function') {
                  if (!img.hasAttribute('crossOrigin')) {
                    img.setAttribute('crossOrigin', 'anonymous');
                  }
                }
              });
            } catch (imgError) {
              console.warn('Error al procesar imágenes en clon:', imgError);
            }
          }
        } catch (error) {
          console.warn('Error en onclone callback:', error);
          // Continuar con la generación del PDF aunque haya un error menor
        }
      }
    });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Usar JPEG con alta calidad para mejor compresión sin perder mucha calidad visual
    // Para máxima calidad, usar PNG (más pesado) o JPEG al 98% (mejor balance)
    // JPEG al 98% ofrece excelente calidad visual con mejor compresión
    const imgData = canvas.toDataURL('image/jpeg', 0.98); // 98% de calidad JPEG (muy alta)

    if (element && element.style) {
      if (typeof element.style.setProperty === 'function') {
        element.style.setProperty('position', originalStyles.position || '', 'important');
        element.style.setProperty('left', originalStyles.left || '', 'important');
        element.style.setProperty('top', originalStyles.top || '', 'important');
        element.style.setProperty('z-index', originalStyles.zIndex || '', 'important');
        element.style.setProperty('visibility', originalStyles.visibility || '', 'important');
      } else {
        element.style.position = originalStyles.position || '';
        element.style.left = originalStyles.left || '';
        element.style.top = originalStyles.top || '';
        element.style.zIndex = originalStyles.zIndex || '';
        element.style.visibility = originalStyles.visibility || '';
      }
    }

    originalButtonStyles.forEach(({ element: btn, display, visibility }) => {
      if (btn && btn.style) {
        if (typeof btn.style.setProperty === 'function') {
          btn.style.setProperty('display', display || '', 'important');
          btn.style.setProperty('visibility', visibility || '', 'important');
        } else {
          btn.style.display = display || '';
          btn.style.visibility = visibility || '';
        }
      }
    });

    // Calcular dimensiones en mm (1 pulgada = 25.4mm, 1 pulgada = 96px a 1x)
    // Con scale de 3, tenemos más píxeles por mm, así que ajustamos
    const mmPerPixel = 0.264583333; // 1px a 96dpi = 0.264583333mm
    const pdfWidthMm = imgWidth * mmPerPixel;
    const pdfHeightMm = imgHeight * mmPerPixel;

    // Crear PDF con mejor compresión
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [pdfWidthMm, pdfHeightMm],
      compress: true // Habilitar compresión
    });

    // Usar 'MEDIUM' o 'SLOW' en lugar de 'FAST' para mejor calidad
    // 'SLOW' usa compresión sin pérdidas, 'MEDIUM' es un balance
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'SLOW');

    const fileName = `ViajeIA_${formData.destination.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    setLoading(false);
    toast.success('Descarga lista');
    
  } catch (error) {
    try {
      const element = document.getElementById('itinerary-document');
      if (element && element.style) {
        if (typeof element.style.setProperty === 'function') {
          element.style.setProperty('position', 'absolute', 'important');
          element.style.setProperty('left', '-9999px', 'important');
          element.style.setProperty('visibility', 'hidden', 'important');
          element.style.setProperty('z-index', '-1', 'important');
        } else {
          element.style.position = 'absolute';
          element.style.left = '-9999px';
          element.style.visibility = 'hidden';
          element.style.zIndex = '-1';
        }
      }
    } catch (cleanupError) {
      console.warn('Error al limpiar estilos:', cleanupError);
    }
    
    const errorMessage = error.message || 'Error desconocido al generar el PDF';
    const fullErrorMessage = `Error al generar el PDF: ${errorMessage}. Por favor, intenta nuevamente.`;
    toast.error(fullErrorMessage);
    setError(fullErrorMessage);
    setLoading(false);
  }
};

