# ✈️ ViajeIA - Asistente Inteligente de Viajes

<div align="center">

![ViajeIA Banner](https://img.shields.io/badge/ViajeIA-Asistente%20Inteligente-blue?style=for-the-badge)

**Plataforma web moderna para planificación de viajes asistida por Inteligencia Artificial**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0--Flash-4285F4?logo=google)](https://gemini.google.com/)

</div>

---

## 📋 Descripción del Proyecto

**ViajeIA** es una aplicación web full-stack que utiliza Inteligencia Artificial (Google Gemini AI) para generar recomendaciones personalizadas de viajes. La plataforma combina un frontend moderno construido con React y Tailwind CSS, con un backend robusto desarrollado en FastAPI que integra múltiples servicios externos para proporcionar información en tiempo real sobre destinos turísticos.

### Características Principales

- 🤖 **IA Personalizada**: Asistente virtual "Alex" que genera planes de viaje detallados y personalizados usando Google Gemini 2.0 Flash
- 🌤️ **Clima en Tiempo Real**: Integración con WeatherAPI.com para mostrar condiciones climáticas actuales del destino
- 📸 **Galería de Imágenes**: Imágenes de alta calidad obtenidas de Unsplash para cada destino
- 💬 **Chat Continuo**: Sistema de conversación con memoria contextual para hacer preguntas de seguimiento sobre el viaje
- 📄 **Generación de PDF**: Exportación de planes de viaje a PDF estilo revista con diseño profesional
- ⭐ **Sistema de Favoritos**: Guardado y gestión de viajes favoritos en el navegador (localStorage)
- 🎨 **Interfaz Moderna**: Diseño responsive con Tailwind CSS y animaciones fluidas

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2.0** - Biblioteca de JavaScript para construir interfaces de usuario
- **Vite 7.2.4** - Build tool y dev server de alta velocidad
- **Tailwind CSS 4.1.17** - Framework de CSS utility-first para diseño moderno
- **React Markdown 10.1.0** - Renderizado de contenido Markdown
- **Lucide React 0.554.0** - Iconos modernos y ligeros
- **jsPDF 3.0.4** - Generación de documentos PDF
- **html2canvas 1.4.1** - Captura de elementos HTML como imágenes

### Backend
- **FastAPI 0.104.1** - Framework web moderno y rápido para Python
- **Uvicorn 0.24.0** - Servidor ASGI de alto rendimiento
- **Google Generative AI 0.3.2** - SDK oficial para Google Gemini
- **Pydantic 2.5.0** - Validación de datos con type hints
- **httpx 0.25.2** - Cliente HTTP asíncrono para llamadas a APIs externas
- **python-dotenv 1.0.0** - Gestión de variables de entorno

### APIs Externas
- **Google Gemini AI** - Motor de IA para generación de recomendaciones
- **WeatherAPI.com** - Datos meteorológicos en tiempo real
- **Unsplash API** - Banco de imágenes de alta calidad

---

## 🚀 Guía de Instalación

### Prerrequisitos

- **Node.js** 18.0 o superior ([Descargar](https://nodejs.org/))
- **Python** 3.10 o superior ([Descargar](https://www.python.org/downloads/))
- **npm** o **yarn** (incluido con Node.js)
- **pip** (incluido con Python)

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/ViajeIA.git
cd ViajeIA
```

### Paso 2: Configurar el Backend

1. **Instalar dependencias de Python:**

```bash
pip install -r requirements.txt
```

2. **Configurar variables de entorno:**

Crea un archivo `.env` en la raíz del proyecto (al mismo nivel que `main.py`):

```bash
# .env
GEMINI_API_KEY=tu_api_key_de_google_gemini_aqui
WEATHER_API_KEY=tu_api_key_de_weatherapi_aqui
UNSPLASH_ACCESS_KEY=tu_access_key_de_unsplash_aqui
```

**Obtener API Keys:**
- **Google Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **WeatherAPI**: [WeatherAPI.com](https://www.weatherapi.com/)
- **Unsplash**: [Unsplash Developers](https://unsplash.com/developers)

> ⚠️ **IMPORTANTE**: Nunca commitees el archivo `.env` con tus API keys reales. El archivo está incluido en `.gitignore` por seguridad.

### Paso 3: Configurar el Frontend

1. **Navegar a la carpeta del frontend:**

```bash
cd frontend
```

2. **Instalar dependencias:**

```bash
npm install
```

---

## 🏃 Cómo Ejecutar

### Opción 1: Ejecutar en Terminales Separadas (Recomendado)

**Terminal 1 - Backend:**
```bash
# Desde la raíz del proyecto
python main.py
```

El servidor backend estará disponible en: `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
# Desde la carpeta frontend
cd frontend
npm run dev
```

El servidor frontend estará disponible en: `http://localhost:5173`

### Opción 2: Usar uvicorn directamente (Backend)

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Verificar que Todo Funciona

1. Abre tu navegador en `http://localhost:5173`
2. Verifica que el backend esté corriendo visitando `http://localhost:8000` (deberías ver un mensaje JSON)
3. Prueba el endpoint de health: `http://localhost:8000/health`

---

## 📚 Estructura del Proyecto

```
ViajeIA/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── App.jsx          # Componente raíz
│   │   ├── TravelPlanner.jsx # Componente principal con toda la lógica
│   │   ├── ItineraryDocument.jsx # Componente para generación de PDF
│   │   ├── main.jsx         # Punto de entrada
│   │   └── index.css        # Estilos globales y animaciones
│   ├── public/              # Archivos estáticos
│   ├── package.json         # Dependencias del frontend
│   └── vite.config.js       # Configuración de Vite
│
├── services/                 # Servicios del backend
│   ├── __init__.py
│   ├── gemini_service.py    # Integración con Google Gemini AI
│   ├── weather_service.py   # Integración con WeatherAPI
│   └── unsplash_service.py  # Integración con Unsplash API
│
├── main.py                  # Aplicación FastAPI y endpoints
├── requirements.txt         # Dependencias de Python
├── .env                     # Variables de entorno (no commiteado)
└── README.md                # Este archivo
```

---

## 🔌 Endpoints de la API

### `GET /`
Endpoint raíz para verificar que el servidor está funcionando.

**Respuesta:**
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

### `GET /health`
Health check del servicio, verifica que Gemini esté disponible.

**Respuesta:**
```json
{
  "status": "healthy",
  "gemini_service": "available"
}
```

### `POST /api/plan`
Endpoint principal para generar recomendaciones de viaje.

**Request Body:**
```json
{
  "destination": "París",
  "date": "2024-06-15",
  "budget": "Moderado ⚖️",
  "style": "Cultura 🏛️"
}
```

**Response:**
```json
{
  "gemini_response": "## 🏨 ALOJAMIENTO IDEAL\n\n...",
  "weather": {
    "temp": 18.5,
    "condition": "Parcialmente nublado",
    "feels_like": 17.2
  },
  "images": [
    "https://images.unsplash.com/...",
    "https://images.unsplash.com/..."
  ],
  "info": {
    "local_time": "14:30"
  }
}
```

### `POST /api/chat`
Endpoint para chat continuo con memoria conversacional.

**Request Body:**
```json
{
  "destination": "París",
  "date": "2024-06-15",
  "budget": "Moderado ⚖️",
  "style": "Cultura 🏛️",
  "message": "¿Es seguro viajar en junio?",
  "history": [
    {
      "role": "user",
      "parts": "Planifica un viaje a París..."
    },
    {
      "role": "model",
      "parts": "## 🏨 ALOJAMIENTO IDEAL\n\n..."
    }
  ]
}
```

**Response:** Similar a `/api/plan`

---

## 🎯 Características Técnicas Destacadas

### Arquitectura
- **Separación Frontend/Backend**: Arquitectura cliente-servidor clara
- **APIs Asíncronas**: Llamadas paralelas a múltiples servicios para mejor rendimiento
- **Manejo de Errores Robusto**: Los servicios externos fallan de forma silenciosa sin afectar la experiencia

### Frontend
- **Componentes Funcionales**: Uso de React Hooks (useState, useEffect, useRef)
- **Estado Local**: Gestión de estado con React hooks y localStorage para favoritos
- **Renderizado Condicional**: UI adaptativa según el estado de la aplicación
- **Optimización de PDF**: Estrategia "Smart Canvas" para PDFs de altura dinámica

### Backend
- **Validación de Datos**: Uso de Pydantic para validación automática de requests
- **Singleton Pattern**: Servicios globales para evitar múltiples inicializaciones
- **Logging Estructurado**: Sistema de logs para debugging y monitoreo
- **CORS Configurado**: Permite requests desde el frontend en desarrollo

---

## 🔒 Seguridad

- ✅ API Keys almacenadas en variables de entorno (`.env`)
- ✅ Archivo `.env` incluido en `.gitignore`
- ✅ Validación de API keys al iniciar el servidor
- ✅ CORS configurado para desarrollo (ajustar para producción)
- ✅ Manejo seguro de errores sin exponer información sensible

---

## 🧪 Pruebas

### Probar el Backend con curl

```bash
curl -X POST "http://localhost:8000/api/plan" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Tokio",
    "date": "2024-07-20",
    "budget": "Lujo ✨",
    "style": "Gastronomía 🌮"
  }'
```

### Probar el Health Check

```bash
curl http://localhost:8000/health
```

---

## 📝 Notas de Desarrollo

- El servidor backend usa `reload=True` en desarrollo para auto-recargar cambios
- Los logs incluyen información detallada para debugging
- El formato de respuesta de Gemini es Markdown para renderizado en el frontend
- El sistema de favoritos usa `localStorage` del navegador (no persiste entre dispositivos)

---

## 🚀 Próximas Mejoras

- [ ] Autenticación de usuarios
- [ ] Base de datos para historial de viajes persistente
- [ ] Sistema de caché para recomendaciones
- [ ] Rate limiting en la API
- [ ] Tests unitarios y de integración
- [ ] Despliegue en producción (Docker, CI/CD)
- [ ] Soporte para múltiples idiomas
- [ ] Integración con servicios de reservas (hoteles, vuelos)

---

## 👤 Autor

**Miguel Alvarez**

Proyecto desarrollado como parte de [Nombre del Curso/Universidad]

---

## 📄 Licencia

Este proyecto es de uso educativo. Todos los derechos reservados.

---

<div align="center">

**Hecho con ❤️ usando React, FastAPI y Google Gemini AI**

[Reportar un Bug](https://github.com/tu-usuario/ViajeIA/issues) · [Solicitar una Feature](https://github.com/tu-usuario/ViajeIA/issues)

</div>
