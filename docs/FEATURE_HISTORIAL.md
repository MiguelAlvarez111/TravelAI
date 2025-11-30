# 📜 Especificación de Funcionalidad: Historial de Conversaciones

**Versión:** 1.0.0  
**Última actualización:** 2025-01-27  
**Estado:** Implementado (parcialmente)

---

## 📋 Descripción General

La funcionalidad de historial permite a los usuarios mantener un registro de sus consultas de viaje y conversaciones con el asistente Alex. Esta característica mejora la experiencia del usuario al permitirle acceder a recomendaciones anteriores y mantener contexto en conversaciones continuas.

---

## 🏗️ Arquitectura de Persistencia

### Frontend: LocalStorage (Favoritos)

**Ubicación:** `frontend/src/components/travel-planner/hooks/useFavorites.js`

**Almacenamiento:**
- **Clave:** `viajeia_favorites`
- **Formato:** JSON array
- **Datos:** Viajes guardados como favoritos

**Estructura de Datos:**
```javascript
[
  {
    destination: "París",
    date_start: "2025-06-15",
    date_end: "2025-06-20",
    budget: "moderado",
    style: "cultural",
    summary: "Resumen del plan generado...",
    gemini_response: "## 🏨 ALOJAMIENTO\n\n..."
  }
]
```

**Operaciones:**
- **Guardar:** `localStorage.setItem('viajeia_favorites', JSON.stringify(favorites))`
- **Cargar:** `JSON.parse(localStorage.getItem('viajeia_favorites'))`
- **Eliminar:** Filtrado del array y actualización de localStorage

**Limitaciones:**
- Solo disponible en el navegador donde se guardó
- Tamaño máximo: ~5-10MB (depende del navegador)
- No se sincroniza entre dispositivos

---

### Backend: Firebase Realtime Database (Historial)

**Ubicación:** `frontend/src/components/travel-planner/utils/firebase.js`

**Función:** `saveHistoryToFirebase(user, formData, travelData)`

**Estructura de Datos en Firebase:**
```
users/
  {uid}/
    history/
      {pushId}/
        destination: "París"
        date_start: "2025-06-15"
        date_end: "2025-06-20"
        timestamp: "2025-01-27T10:30:00Z"
        summary: "Resumen del plan (primeros 500 caracteres)..."
        budget: "moderado"
        style: "cultural"
```

**Ruta en Firebase:**
```javascript
const historyRef = ref(database, `users/${user.uid}/history`);
await push(historyRef, historyEntry);
```

**Características:**
- **Persistencia:** Permanente en Firebase
- **Sincronización:** Entre dispositivos (si el usuario inicia sesión)
- **Resumen:** Solo se guarda los primeros 500 caracteres de `gemini_response`
- **Timestamp:** Automático con `new Date().toISOString()`

**Cuándo se guarda:**
- Se llama desde `useTravelPlan.js` después de una planificación exitosa
- Solo si el usuario está autenticado (`user.uid` existe)

---

## 💬 Historial de Chat (Memoria Conversacional)

### Frontend: Estado en Memoria

**Ubicación:** `frontend/src/components/travel-planner/ChatWithAlex.jsx`

**Estado:**
```javascript
const [chatHistory, setChatHistory] = useState([]);
```

**Estructura:**
```javascript
[
  {
    role: "user",
    parts: "Quiero ir a París"
  },
  {
    role: "model",
    parts: "¡Perfecto! París es una ciudad increíble..."
  }
]
```

**Características:**
- **Alcance:** Solo durante la sesión actual
- **Persistencia:** No se persiste (solo en memoria del componente)
- **Límite:** Se envía máximo 6 mensajes al backend (últimos 6)
- **Inicialización:** Se inicializa con mensaje inicial del plan generado

**Flujo:**
1. Usuario genera un plan → Se crea `chatInitialMessage`
2. `ChatWithAlex` se inicializa con este mensaje
3. Usuario envía mensajes → Se agregan a `chatHistory`
4. Al enviar a `/api/chat`, se incluye `history: chatHistory`
5. Backend limita a últimos 6 mensajes para optimizar tokens

---

### Backend: Procesamiento de Historial

**Ubicación:** `main.py` - Endpoint `/api/chat`

**Procesamiento:**
1. **Recepción:** Historial llega en `ChatRequest.history`
2. **Sanitización:** Cada mensaje se valida con `sanitize_input()`
3. **Limitación:** Se limita a últimos 6 mensajes
4. **Envío a Gemini:** Se construye prompt con historial concatenado

**Código relevante:**
```python
# Limitar el historial a los últimos 6 mensajes para optimizar tokens
limited_history = sanitized_history[-6:] if len(sanitized_history) > 6 else sanitized_history
```

**Optimización de Tokens:**
- Historial limitado a 6 mensajes reduce tokens de entrada
- Cada token tiene costo en la API de Gemini
- Historial muy largo podría exceder límites del modelo

---

## 🔄 Flujo Completo de Historial

### 1. Planificación Inicial

```
Usuario completa formulario
    ↓
POST /api/plan
    ↓
Backend genera recomendación
    ↓
Frontend recibe respuesta
    ↓
useTravelPlan guarda en Firebase (saveHistoryToFirebase)
    ↓
Se crea chatInitialMessage
    ↓
ChatWithAlex se inicializa con historial inicial
```

### 2. Conversación Continua

```
Usuario envía mensaje en ChatWithAlex
    ↓
Se agrega a chatHistory (estado local)
    ↓
POST /api/chat con history: chatHistory
    ↓
Backend sanitiza y limita historial (últimos 6)
    ↓
Gemini genera respuesta con contexto
    ↓
Frontend actualiza chatHistory con nueva respuesta
```

### 3. Guardar como Favorito

```
Usuario hace clic en botón de favorito
    ↓
useFavorites guarda en localStorage
    ↓
Datos guardados: destination, dates, budget, style, summary
    ↓
Usuario puede ver favoritos en FavoritesModal
    ↓
Usuario puede cargar favorito → Se regenera plan
```

---

## 📊 Diferencias: Favoritos vs Historial

| Característica | Favoritos (LocalStorage) | Historial (Firebase) |
|----------------|---------------------------|----------------------|
| **Ubicación** | Navegador local | Firebase Cloud |
| **Sincronización** | No | Sí (entre dispositivos) |
| **Datos completos** | Sí (gemini_response completo) | No (solo resumen 500 chars) |
| **Persistencia** | Hasta limpiar navegador | Permanente |
| **Acceso** | Modal de favoritos | No hay UI actual (solo backend) |
| **Uso** | Guardar planes favoritos | Registro de consultas |

---

## 🎯 Casos de Uso

### Caso 1: Usuario quiere ver planes anteriores
**Solución actual:** Favoritos (LocalStorage)  
**Limitación:** Solo planes guardados manualmente como favoritos

### Caso 2: Usuario quiere continuar conversación
**Solución actual:** Historial en memoria (ChatWithAlex)  
**Limitación:** Solo durante la sesión actual, se pierde al recargar

### Caso 3: Usuario quiere ver historial completo
**Solución actual:** Firebase Realtime Database  
**Limitación:** No hay UI para visualizar, solo se guarda automáticamente

---

## 🔮 Mejoras Futuras Sugeridas

### 1. Endpoint GET /api/historial
```python
@app.get("/api/historial")
async def get_historial(uid: str = Depends(verify_token)):
    """Obtiene el historial completo de consultas del usuario."""
    # Recuperar desde Firebase
    # Retornar lista de consultas ordenadas por timestamp
```

### 2. UI para Visualizar Historial
- Componente `HistoryModal.jsx` similar a `FavoritesModal.jsx`
- Lista de consultas anteriores con fecha y destino
- Opción de cargar consulta anterior

### 3. Persistencia de Chat History
- Guardar historial de chat completo en Firebase
- Recuperar historial al iniciar sesión
- Continuar conversaciones anteriores

### 4. Búsqueda en Historial
- Filtro por destino
- Filtro por fecha
- Búsqueda por texto en resumen

---

## 📝 Notas Técnicas

### Optimización de Tokens
- Historial limitado a 6 mensajes reduce costos de API
- Resumen de 500 caracteres en Firebase reduce almacenamiento
- Historial muy largo podría exceder límites de contexto de Gemini

### Seguridad
- Historial solo accesible por el usuario autenticado (Firebase UID)
- Sanitización de mensajes previene prompt injection
- Validación de longitud previene payloads gigantes

### Rendimiento
- LocalStorage es rápido pero limitado en tamaño
- Firebase Realtime Database es asíncrono y escalable
- Historial en memoria es instantáneo pero no persistente

---

## 🔗 Referencias

- [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [React State Management](https://react.dev/learn/managing-state)

---

**Última actualización:** 2025-01-27

