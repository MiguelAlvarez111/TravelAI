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
      originalButtonStyles.push({
        element: btn,
        display: btn.style.display,
        visibility: btn.style.visibility
      });
      btn.style.display = 'none';
      btn.style.visibility = 'hidden';
    });

    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('crossOrigin')) {
        img.setAttribute('crossOrigin', 'anonymous');
      }
    });

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
      foreignObjectRendering: true, // Mejor renderizado de elementos complejos
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById('itinerary-document');
        if (clonedElement) {
          clonedElement.style.visibility = 'visible';
          clonedElement.style.position = 'absolute';
          clonedElement.style.left = '-9999px';
          
          // Asegurar que las fuentes estén cargadas
          const style = clonedDoc.createElement('style');
          style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            * {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
          `;
          clonedDoc.head.appendChild(style);
          
          // Asegurar que todas las imágenes tengan crossOrigin
          const clonedImages = clonedElement.querySelectorAll('img');
          clonedImages.forEach(img => {
            if (!img.hasAttribute('crossOrigin')) {
              img.setAttribute('crossOrigin', 'anonymous');
            }
            // Asegurar que las imágenes se muestren correctamente
            if (!img.complete) {
              img.style.display = 'block';
            }
          });
        }
      }
    });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Usar JPEG con alta calidad para mejor compresión sin perder mucha calidad visual
    // Para máxima calidad, usar PNG (más pesado) o JPEG al 98% (mejor balance)
    // JPEG al 98% ofrece excelente calidad visual con mejor compresión
    const imgData = canvas.toDataURL('image/jpeg', 0.98); // 98% de calidad JPEG (muy alta)

    element.style.position = originalStyles.position;
    element.style.left = originalStyles.left;
    element.style.top = originalStyles.top;
    element.style.zIndex = originalStyles.zIndex;
    element.style.visibility = originalStyles.visibility;

    originalButtonStyles.forEach(({ element: btn, display, visibility }) => {
      btn.style.display = display;
      btn.style.visibility = visibility;
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
    const element = document.getElementById('itinerary-document');
    if (element) {
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.visibility = 'hidden';
      element.style.zIndex = '-1';
    }
    
    const errorMessage = error.message || 'Error desconocido al generar el PDF';
    const fullErrorMessage = `Error al generar el PDF: ${errorMessage}. Por favor, intenta nuevamente.`;
    toast.error(fullErrorMessage);
    setError(fullErrorMessage);
    setLoading(false);
  }
};

