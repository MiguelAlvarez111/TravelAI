# 🏗️ Arquitectura del Sistema - ViajeIA

**Versión:** 1.0.0  
**Última actualización:** 2025-01-27

---

## 📐 Visión General

ViajeIA es una aplicación full-stack con arquitectura de cliente-servidor que separa claramente el frontend (React) del backend (FastAPI). La aplicación utiliza servicios externos para autenticación, IA, clima e imágenes.

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   React     │  HTTP   │   FastAPI   │  HTTP   │   Servicios  │
│  Frontend    │◄───────►│   Backend   │◄───────►│  Externos   │
│  (Vite)      │         │  (Python)   │         │             │
└─────────────┘         └─────────────┘         └──────────────┘
      │                        │                        │
      │                        │                        │
      ▼                        ▼                        ▼
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│  Firebase   │         │   Logs      │         │   Gemini AI  │
│  Auth/DB    │         │   (Archivo) │         │   WeatherAPI │
│             │         │             │         │   Unsplash   │
└─────────────┘         └─────────────┘         └──────────────┘
```

---

## 🎨 Capa de Presentación (Frontend)

### Stack Tecnológico
- **React 19.2.0**: Biblioteca de UI
- **Vite 7.2.4**: Build tool y dev server
- **Tailwind CSS 4.1.17**: Framework CSS utility-first
- **Firebase SDK**: Autenticación y base de datos
- **React Markdown**: Renderizado de contenido Markdown
- **jsPDF + html2canvas**: Exportación a PDF

### Estructura de Componentes

```
frontend/src/
├── App.jsx                    # Componente raíz (ruteo Login/Register/TravelPlanner)
├── TravelPlanner.jsx          # Orquestador principal del planificador
├── contexts/
│   └── AuthContext.jsx        # Contexto de autenticación global
├── components/
│   ├── Login.jsx             # Pantalla de login
│   ├── Register.jsx          # Pantalla de registro
│   └── travel-planner/
│       ├── Header.jsx        # Header con logout
│       ├── HeroSearch.jsx    # Formulario de búsqueda
│       ├── TravelDashboard.jsx # Visualización del plan
│       ├── ChatWithAlex.jsx  # Chat conversacional
│       ├── FavoritesModal.jsx # Modal de favoritos
│       ├── ImageGallery.jsx  # Galería de imágenes
│       ├── hooks/            # Hooks personalizados
│       └── utils/             # Utilidades (PDF, Firebase)
└── firebase/
    └── config.js             # Configuración de Firebase
```

### Flujo de Datos Frontend

1. **Autenticación:**
   ```
   Usuario → Login.jsx → Firebase Auth → AuthContext → App.jsx → TravelPlanner
   ```

2. **Planificación de Viaje:**
   ```
   HeroSearch → useTravelPlan → API /api/plan → TravelDashboard → ChatWithAlex
   ```

3. **Chat Conversacional:**
   ```
   ChatWithAlex → API /api/chat (con history) → Actualización de estado local
   ```

4. **Persistencia:**
   ```
   Favoritos → localStorage (viajeia_favorites)
   Historial → Firebase Realtime Database (users/{uid}/history)
   ```

---

## ⚙️ Capa de Lógica de Negocio (Backend)

### Stack Tecnológico
- **FastAPI 0.104.1**: Framework web asíncrono
- **Uvicorn 0.24.0**: Servidor ASGI
- **Pydantic 2.5.0**: Validación de datos
- **Firebase Admin SDK**: Verificación de tokens
- **Google Generative AI**: SDK de Gemini
- **httpx 0.25.2**: Cliente HTTP asíncrono
- **slowapi 0.1.9**: Rate limiting

### Estructura del Backend

```
/
├── main.py                    # Aplicación FastAPI principal
├── services/
│   ├── gemini_service.py     # Servicio de integración con Gemini
│   ├── weather_service.py    # Servicio de integración con WeatherAPI
│   └── unsplash_service.py   # Servicio de integración con Unsplash
└── backend/
    └── logs/
        └── app.log           # Archivo de logs (RotatingFileHandler)
```

### Flujo de Procesamiento de Requests

#### 1. Request de Planificación (`POST /api/plan`)

```
Cliente → FastAPI → verify_token() → Rate Limiting
    ↓
Sanitización de Inputs (sanitize_input)
    ↓
Llamadas Paralelas:
    ├── Gemini Service (generate_travel_recommendation)
    ├── Weather Service (get_weather) ──┐
    └── Unsplash Service (get_images) ──┼──► asyncio.gather()
                                         │
    ↓                                    ↓
Respuesta Combinada ←───────────────────┘
    ↓
Incrementar Stats → Guardar en stats.json
    ↓
Response JSON al Cliente
```

#### 2. Request de Chat (`POST /api/chat`)

```
Cliente → FastAPI → verify_token() → Rate Limiting
    ↓
Sanitización de Inputs + Historial
    ↓
Limitar Historial (últimos 6 mensajes)
    ↓
Llamadas Paralelas:
    ├── Gemini Service (generate_chat_response con history)
    ├── Weather Service
    └── Unsplash Service
    ↓
Response JSON al Cliente
```

### Servicios Externos

#### Gemini Service (`services/gemini_service.py`)
- **Modelo:** `gemini-2.0-flash`
- **Configuración:**
  - `max_output_tokens`: 2048
  - `temperature`: 0.7
- **System Prompts:**
  - `SYSTEM_INSTRUCTION_PLAN`: Para planes completos de viaje
  - `SYSTEM_INSTRUCTION_CHAT`: Para conversaciones contextuales
- **Funciones:**
  - `generate_travel_recommendation()`: Genera plan completo
  - `generate_chat_response()`: Genera respuesta conversacional

#### Weather Service (`services/weather_service.py`)
- **API:** WeatherAPI.com
- **Endpoint:** `/current.json`
- **Datos retornados:** Temperatura, condición, sensación térmica, hora local

#### Unsplash Service (`services/unsplash_service.py`)
- **API:** Unsplash API
- **Endpoint:** `/search/photos`
- **Datos retornados:** URLs de imágenes de alta calidad

---

## 🔐 Seguridad y Autenticación

### Flujo de Autenticación

```
1. Usuario inicia sesión en Frontend (Firebase Auth)
   ↓
2. Frontend obtiene Firebase ID Token
   ↓
3. Frontend envía token en header: Authorization: Bearer <token>
   ↓
4. Backend verifica token con Firebase Admin SDK
   ↓
5. Si válido: Extrae UID y permite acceso
   Si inválido: Retorna 401 Unauthorized
```

### Rate Limiting
- **Estrategia:** Por User ID (Firebase UID) o IP como fallback
- **Límites:**
  - `/api/plan`: 5 solicitudes/minuto
  - `/api/chat`: 10 solicitudes/minuto
- **Implementación:** `slowapi` con función personalizada `get_rate_limit_key()`

### Validación y Sanitización
- **Función:** `sanitize_input()` en `gemini_service.py`
- **Protecciones:**
  - Detección de prompt injection (patrones maliciosos)
  - Validación de longitud máxima
  - Filtrado de comandos y scripts

---

## 💾 Persistencia de Datos

### Frontend (LocalStorage)
- **Clave:** `viajeia_favorites`
- **Datos:** Viajes guardados como favoritos
- **Formato:** JSON array de objetos de viaje

### Backend (Archivos)
- **`stats.json`**: Estadísticas de uso (planes generados, destinos populares)
- **`backend/logs/app.log`**: Logs de aplicación (RotatingFileHandler)

### Firebase Realtime Database
- **Ruta:** `users/{uid}/history`
- **Datos:** Historial de consultas de viaje
- **Estructura:**
  ```json
  {
    "destination": "París",
    "date_start": "2025-06-15",
    "date_end": "2025-06-20",
    "timestamp": "2025-01-27T10:30:00Z",
    "summary": "Resumen del plan...",
    "budget": "moderado",
    "style": "cultural"
  }
  ```

---

## 🔄 Flujo Completo de una Solicitud

### Ejemplo: Planificar un Viaje

```
1. Usuario completa formulario en HeroSearch.jsx
   ↓
2. Frontend valida inputs y obtiene Firebase token
   ↓
3. POST /api/plan con:
   {
     "destination": "París",
     "date": "2025-06-15 a 2025-06-20",
     "budget": "moderado",
     "style": "cultural"
   }
   ↓
4. Backend:
   a. Verifica token (verify_token)
   b. Aplica rate limiting
   c. Sanitiza inputs
   d. Ejecuta llamadas paralelas:
      - Gemini: Genera recomendaciones
      - WeatherAPI: Obtiene clima actual
      - Unsplash: Obtiene imágenes
   ↓
5. Backend combina respuestas y retorna JSON
   ↓
6. Frontend:
   a. Actualiza TravelDashboard con plan
   b. Muestra imágenes en ImageGallery
   c. Inicializa ChatWithAlex con mensaje inicial
   d. Opcionalmente guarda en Firebase (saveHistoryToFirebase)
   ↓
7. Usuario puede:
   - Continuar chat con Alex
   - Guardar como favorito
   - Exportar a PDF
```

---

## 📊 Logging y Monitoreo

### Niveles de Log
- **INFO**: Operaciones normales, inicialización de servicios
- **WARNING**: Advertencias (Firebase no inicializado, rate limits)
- **ERROR**: Errores en procesamiento, excepciones

### Destinos de Log
- **Consola:** `logging.basicConfig()` (siempre activo)
- **Archivo:** `backend/logs/app.log` (RotatingFileHandler, 10MB, 5 backups)

### Información Registrada
- Inicialización de servicios (Gemini, Weather, Unsplash, Firebase)
- Requests recibidos (destino, fecha, presupuesto)
- Errores y excepciones con traceback completo
- Verificación de tokens
- Rate limiting activado

---

## 🚀 Despliegue

### Desarrollo Local
- **Backend:** `python main.py` o `uvicorn main:app --reload`
- **Frontend:** `npm run dev` (Vite dev server)

### Producción (Railway)
- **Backend:** Desplegado como servicio Python en Railway
- **Frontend:** Desplegado como servicio estático en Railway
- **Variables de Entorno:** Configuradas en Railway dashboard
- **CORS:** Configurado para URLs de producción

---

## 📚 Referencias Técnicas

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Gemini API](https://ai.google.dev/)
- [WeatherAPI Documentation](https://www.weatherapi.com/docs/)
- [Unsplash API Documentation](https://unsplash.com/developers)

---

**Última actualización:** 2025-01-27

