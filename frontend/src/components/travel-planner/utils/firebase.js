/**
 * firebase.js - Utilidad para guardar historial en Firebase
 */

import { ref, push } from 'firebase/database';
import { database } from '../../../firebase/config';

export const saveHistoryToFirebase = async (user, formData, travelData) => {
  if (!user || !user.uid) {
    console.warn('No se puede guardar historial: usuario no autenticado o sin UID');
    return;
  }

  try {
    const historyRef = ref(database, `users/${user.uid}/history`);
    const historyEntry = {
      destination: formData.destination,
      date_start: formData.date_start || null,
      date_end: formData.date_end || null,
      timestamp: new Date().toISOString(),
      summary: travelData.gemini_response.substring(0, 500) + (travelData.gemini_response.length > 500 ? '...' : ''),
      budget: formData.budget || null,
      style: formData.style || null
    };

    await push(historyRef, historyEntry);
  } catch (error) {
    console.error('Error al guardar historial en Firebase');
  }
};

