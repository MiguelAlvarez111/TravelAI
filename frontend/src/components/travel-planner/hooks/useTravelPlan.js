/**
 * useTravelPlan.js - Hook personalizado para la lógica de planificación de viajes
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { saveHistoryToFirebase } from '../utils/firebase';

const API_URL = import.meta.env.VITE_API_URL || 
                (typeof window !== 'undefined' && window.location.hostname.includes('railway.app') 
                  ? 'https://travelai-production-8955.up.railway.app'
                  : 'http://localhost:8000');

export const useTravelPlan = (user, formData, setFormData, destinationInputRef, destinationValueRef) => {
  const [travelData, setTravelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatInitialMessage, setChatInitialMessage] = useState(null);

  const handlePlanificar = useCallback(async () => {
    const currentDestination = destinationInputRef.current?.value || formData.destination || destinationValueRef.current;
    
    if (!currentDestination.trim()) {
      setError('Por favor, ingresa un destino para tu viaje');
      return;
    }
    
    const finalDestination = currentDestination.trim();
    setFormData(prev => ({
      ...prev,
      destination: finalDestination
    }));

    setError('');
    setTravelData(null);
    setChatInitialMessage(null);
    setLoading(true);

    try {
      // Verify user is authenticated
      if (!user) {
        const errorMessage = 'Debes iniciar sesión para crear un plan de viaje.';
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const userCurrency = Intl.NumberFormat().resolvedOptions().currency || 'USD';
      const cleanDestination = DOMPurify.sanitize(finalDestination);
      
      // Get Firebase ID token - required for backend authentication
      let authHeader = '';
      try {
        const token = await user.getIdToken();
        if (!token) {
          throw new Error('No se pudo obtener el token de autenticación');
        }
        authHeader = `Bearer ${token}`;
      } catch (tokenError) {
        console.error('Error al obtener token de Firebase:', tokenError);
        const errorMessage = 'Error al obtener token de autenticación. Por favor, cierra sesión y vuelve a iniciar sesión.';
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      // Build headers object
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Always include since we verified user exists
      };
      
      const apiResponse = await fetch(`${API_URL}/api/plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          destination: cleanDestination,
          date: formData.date_start && formData.date_end 
            ? `${formData.date_start} a ${formData.date_end}` 
            : formData.date_start || formData.date_end || '',
          budget: formData.budget || '',
          style: formData.style || '',
          user_currency: userCurrency
        }),
      });

      if (apiResponse.status === 401) {
        const errorData = await apiResponse.json().catch(() => ({ detail: 'Token de autorización requerido. Por favor, inicia sesión.' }));
        const errorMessage = errorData.detail || 'Token de autorización requerido. Por favor, inicia sesión.';
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (apiResponse.status === 429) {
        const errorData = await apiResponse.json().catch(() => ({ detail: 'Has alcanzado el límite de consultas. Por favor, espera un minuto.' }));
        const errorMessage = errorData.detail || 'Has alcanzado el límite de consultas. Por favor, espera un minuto.';
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ detail: 'Error al consultar la IA' }));
        throw new Error(errorData.detail || 'Error al consultar la IA');
      }

      const data = await apiResponse.json();
      setTravelData(data);
      
      if (data.finish_reason && data.finish_reason !== 'STOP') {
        toast.warning('Nota: La respuesta fue cortada por límite de longitud.', {
          duration: 5000,
        });
      }
      
      const dateRange = formData.date_start && formData.date_end 
        ? ` del ${formData.date_start} al ${formData.date_end}`
        : formData.date_start 
          ? ` para ${formData.date_start}`
          : '';
      setChatInitialMessage({
        userMessage: `Planifica un viaje a ${finalDestination}${dateRange}${formData.budget ? ` con presupuesto ${formData.budget}` : ''}${formData.style ? ` y estilo ${formData.style}` : ''}`,
        modelMessage: `¡Listo! He diseñado tu viaje a ${finalDestination}. Revisa los detalles visuales arriba. ☝️`
      });

      await saveHistoryToFirebase(user, formData, data);
      destinationValueRef.current = finalDestination;
      
    } catch (err) {
      let errorMessage = 'Ocurrió un error consultando a la IA';
      
      console.error('Error al planificar viaje:', err);
      
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        errorMessage = `No pudimos conectar con el servidor. Verifica que el backend esté corriendo en ${API_URL}`;
      } else if (err.message.includes('Unexpected token') || err.message.includes('JSON')) {
        errorMessage = `Error al procesar la respuesta del servidor. Por favor, intenta nuevamente.`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData.date_start, formData.date_end, formData.budget, formData.style, user, setFormData, destinationInputRef, destinationValueRef]);

  return {
    travelData,
    loading,
    error,
    chatInitialMessage,
    handlePlanificar,
    setError,
    setLoading
  };
};

