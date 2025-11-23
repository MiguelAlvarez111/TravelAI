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

    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById('itinerary-document');
        if (clonedElement) {
          clonedElement.style.visibility = 'visible';
          clonedElement.style.position = 'absolute';
          clonedElement.style.left = '-9999px';
          
          const clonedImages = clonedElement.querySelectorAll('img');
          clonedImages.forEach(img => {
            if (!img.hasAttribute('crossOrigin')) {
              img.setAttribute('crossOrigin', 'anonymous');
            }
          });
        }
      }
    });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgData = canvas.toDataURL('image/png', 1.0);

    element.style.position = originalStyles.position;
    element.style.left = originalStyles.left;
    element.style.top = originalStyles.top;
    element.style.zIndex = originalStyles.zIndex;
    element.style.visibility = originalStyles.visibility;

    originalButtonStyles.forEach(({ element: btn, display, visibility }) => {
      btn.style.display = display;
      btn.style.visibility = visibility;
    });

    const mmPerPixel = 0.264583333;
    const pdfWidthMm = imgWidth * mmPerPixel;
    const pdfHeightMm = imgHeight * mmPerPixel;

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [pdfWidthMm, pdfHeightMm]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');

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

