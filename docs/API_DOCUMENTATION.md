# 📚 Documentación de API - ViajeIA

**Versión:** 1.0.0  
**Base URL:** `http://localhost:8000` (desarrollo) | `https://travelai-production-8955.up.railway.app` (producción)  
**Formato:** JSON  
**Autenticación:** Bearer Token (Firebase ID Token)

---

## 🔐 Autenticación

Todos los endpoints protegidos requieren autenticación mediante Firebase ID Token en el header `Authorization`:

```
Authorization: Bearer <firebase_id_token>
```

El token debe ser obtenido del frontend después de que el usuario inicie sesión con Firebase Authentication.

---

## 📍 Endpoints Disponibles

### 1. **GET /** - Root
Endpoint raíz para verificar que el servidor está funcionando.

**Autenticación:** No requerida

**Respuesta Exitosa (200):**
```json
{
  "message": "🚀 ViajeIA API está funcionando correctamente",
  "status": "ok",
  "endpoints": {
    "plan": "/api/plan",
    "chat": "/api/chat",
    "health": "/health"
  }
}
```

---

### 2. **GET /health** - Health Check
Verifica el estado de salud del servidor y servicios externos.

**Autenticación:** No requerida

**Respuesta Exitosa (200):**
```json
{
  "status": "healthy",
  "gemini_service": "available"
}
```

**Respuesta con Error (200):**
```json
{
  "status": "unhealthy",
  "gemini_service": "unavailable",
  "error": "Error description"
}
```

---

### 3. **GET /api/stats** - Estadísticas
Obtiene estadísticas de uso de la API.

**Autenticación:** No requerida

**Respuesta Exitosa (200):**
```json
{
  "total_plans_generated": 42,
  "top_destinations": [
    {
      "destination": "París",
      "count": 15
    },
    {
      "destination": "Tokio",
      "count": 12
    }
  ],
  "last_reset": "2025-01-27T10:30:00"
}
```

---

### 4. **POST /api/plan** - Planificar Viaje
Genera recomendaciones de viaje con datos en tiempo real (clima, imágenes, recomendaciones de IA).

**Autenticación:** ✅ Requerida (Bearer Token)

**Rate Limit:** 5 solicitudes por minuto por usuario

**Request Body:**
```json
{
  "destination": "París",
  "date": "2025-06-15 a 2025-06-20",
  "budget": "moderado",
  "style": "cultural",
  "user_currency": "COP"
}
```

**Campos:**
- `destination` (string, requerido): Nombre del destino
- `date` (string, opcional): Fechas del viaje
- `budget` (string, opcional): Presupuesto (ej: "mochilero", "moderado", "lujo")
- `style` (string, opcional): Estilo de viaje (ej: "aventura", "cultural", "relajación")
- `user_currency` (string, opcional, default: "USD"): Moneda del usuario

**Respuesta Exitosa (200):**
```json
{
  "gemini_response": "## 🏨 ALOJAMIENTO\n\n...",
  "finish_reason": "STOP",
  "weather": {
    "temp": 22,
    "condition": "Parcialmente nublado",
    "feels_like": 20
  },
  "images": [
    "https://images.unsplash.com/...",
    "https://images.unsplash.com/..."
  ],
  "info": {
    "local_time": "2025-01-27T15:30:00+01:00"
  }
}
```

**Códigos de Error:**
- `400`: Error de validación (destino vacío, input inválido, prompt injection detectado)
- `401`: Token de autorización inválido o ausente
- `429`: Límite de tasa excedido
- `500`: Error interno del servidor

**Ejemplo de Error (400):**
```json
{
  "detail": "El destino no puede estar vacío. Por favor, proporciona un destino para tu viaje."
}
```

---

### 5. **POST /api/chat** - Chat con Memoria
Genera respuestas de chat con memoria conversacional usando el historial de mensajes anteriores.

**Autenticación:** ✅ Requerida (Bearer Token)

**Rate Limit:** 10 solicitudes por minuto por usuario

**Request Body:**
```json
{
  "destination": "París",
  "date": "2025-06-15 a 2025-06-20",
  "budget": "moderado",
  "style": "cultural",
  "message": "¿Qué restaurantes recomiendas?",
  "history": [
    {
      "role": "user",
      "parts": "Quiero ir a París"
    },
    {
      "role": "model",
      "parts": "¡Perfecto! París es una ciudad increíble..."
    }
  ]
}
```

**Campos:**
- `destination` (string, requerido): Nombre del destino
- `date` (string, opcional): Fechas del viaje
- `budget` (string, opcional): Presupuesto
- `style` (string, opcional): Estilo de viaje
- `message` (string, requerido): Nuevo mensaje del usuario
- `history` (array, opcional): Historial de mensajes anteriores (máximo 6 mensajes)

**Respuesta Exitosa (200):**
```json
{
  "gemini_response": "Para tu estilo cultural, te recomiendo...",
  "finish_reason": "STOP",
  "weather": {
    "temp": 22,
    "condition": "Parcialmente nublado",
    "feels_like": 20
  },
  "images": [
    "https://images.unsplash.com/..."
  ],
  "info": {
    "local_time": "2025-01-27T15:30:00+01:00"
  }
}
```

**Códigos de Error:**
- `400`: Error de validación (destino o mensaje vacío, input inválido)
- `401`: Token de autorización inválido o ausente
- `429`: Límite de tasa excedido
- `500`: Error interno del servidor

---

## 🛡️ Reglas de Validación

### Sanitización de Inputs
Todos los inputs del usuario son sanitizados para prevenir:
- **Prompt Injection**: Detección de patrones maliciosos
- **Longitud Excesiva**: Límites de caracteres por campo
- **Contenido Peligroso**: Filtrado de comandos y scripts

**Límites de Longitud:**
- `destination`: Máximo 100 caracteres
- `date`, `budget`, `style`: Máximo 50 caracteres cada uno
- `message` (chat): Máximo 500 caracteres

### Rate Limiting
- **`/api/plan`**: 5 solicitudes por minuto por usuario
- **`/api/chat`**: 10 solicitudes por minuto por usuario
- El límite se aplica por User ID (Firebase UID) o IP si no hay autenticación

**Respuesta de Rate Limit (429):**
```json
{
  "detail": "Has alcanzado el límite de consultas. Espera un momento."
}
```

---

## 📝 Notas Técnicas

### Finish Reason
El campo `finish_reason` en las respuestas puede tener los siguientes valores:
- `"STOP"`: Respuesta completada normalmente
- `"MAX_TOKENS"`: Respuesta cortada por límite de tokens
- `"SAFETY"`: Respuesta bloqueada por filtros de seguridad
- `"RECITATION"`: Respuesta bloqueada por contenido duplicado

### Manejo de Errores
Todos los errores devuelven un objeto JSON con el campo `detail`:
```json
{
  "detail": "Mensaje de error descriptivo"
}
```

### CORS
El servidor está configurado para aceptar requests desde:
- `http://localhost:5173` (desarrollo)
- `http://localhost:3000` (desarrollo alternativo)
- URLs de producción configuradas en `FRONTEND_URL`

---

## 🔗 Referencias

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Google Gemini API](https://ai.google.dev/)

---

**Última actualización:** 2025-01-27

