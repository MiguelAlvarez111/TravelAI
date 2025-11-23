# ✈️ ViajeIA - Tu Asistente Personal de Viajes

<div align="center">

![ViajeIA Banner](https://img.shields.io/badge/ViajeIA-Asistente%20Inteligente-blue?style=for-the-badge)

**Plataforma web moderna para planificación de viajes asistida por Inteligencia Artificial**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0--Flash-4285F4?logo=google)](https://gemini.google.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Authentication-FFCA28?logo=firebase)](https://firebase.google.com/)

</div>

---

> **📚 Proyecto Académico**  
> Este proyecto fue desarrollado como parte del curso **"Construcción de Aplicación con IA: Diseño y Personalización de Asistentes"** de la **Universidad de los Andes**.  
> ViajeIA representa una exploración práctica de cómo la Inteligencia Artificial puede ser diseñada de manera responsable para servir genuinamente a las necesidades humanas.

---

## 📋 Sobre ViajeIA

**ViajeIA** es una aplicación web full-stack que utiliza Inteligencia Artificial (Google Gemini AI) para generar recomendaciones personalizadas de viajes. El proyecto combina un frontend moderno construido con React y Tailwind CSS, con un backend robusto desarrollado en FastAPI que integra múltiples servicios externos para proporcionar información en tiempo real sobre destinos turísticos.

El asistente virtual "Alex" no solo genera planes de viaje—mantiene conversaciones contextuales, proporciona información climática actualizada, muestra imágenes de alta calidad de los destinos, y permite exportar todo en un PDF profesional. Todo esto respaldado por sistemas de seguridad robustos que protegen tanto al sistema como a los usuarios.

El proyecto surgió de una pregunta simple: *"¿Qué pasaría si pudieras tener un asistente de viajes que realmente entiende lo que quieres?"* A lo largo del desarrollo, esta pregunta inicial se fue transformando en una exploración práctica de cómo diseñar sistemas de IA que sean tanto técnicamente sólidos como éticamente responsables.

---

## 🎓 Aprendizajes del Desarrollo

El proceso de construir ViajeIA fue un ejercicio intensivo de aprendizaje en múltiples dimensiones. A continuación, algunos de los aprendizajes más significativos:

### Aprendizajes Técnicos

**Arquitectura Full-Stack**: Construir una aplicación completa desde cero enseñó que la mejor arquitectura no es la más compleja, sino la que te permite iterar rápido y mantener el código legible. Separar frontend y backend de manera clara, usar APIs REST bien definidas, y mantener una estructura de componentes modular resultó fundamental.

**Integración de IA**: Trabajar con Google Gemini AI reveló la importancia del prompt engineering y el manejo de contexto. Aprendimos que la calidad de las respuestas no depende solo del modelo, sino de cómo estructuras las instrucciones, mantienes el contexto conversacional, y gestionas los tokens de manera eficiente.

**Seguridad en Sistemas con IA**: Implementar rate limiting, validación de inputs, y protección contra prompt injection demostró que la seguridad no es algo que agregas al final—es una consideración fundamental desde el diseño. Cada capa de seguridad (autenticación, validación, sanitización) juega un papel crítico.

**Optimización de Renderizado**: Generar PDFs de alta calidad con html2canvas y jsPDF requirió entender cómo el navegador renderiza elementos, cómo optimizar imágenes para diferentes formatos, y cómo balancear calidad con tamaño de archivo.

### Aprendizajes Conceptuales

**Diseño Centrado en el Usuario**: Más que seguir tendencias, aprendimos a priorizar la experiencia real del usuario. Esto significó simplificar flujos, reducir fricción, y asegurar que cada característica tuviera un propósito claro.

**Gestión de Estado Compleja**: Manejar el estado entre múltiples componentes (autenticación, planes de viaje, favoritos, chat) enseñó la importancia de un diseño de estado predecible y de usar patrones consistentes (context API, custom hooks).

**Trabajar con APIs Externas**: Integrar Firebase, WeatherAPI, Unsplash, y Gemini AI enseñó a manejar diferentes protocolos de autenticación, manejar errores de red, y crear abstracciones que faciliten el mantenimiento.

---

## 🤔 Una Reflexión sobre la IA y la Responsabilidad

Desarrollar un sistema que utiliza Inteligencia Artificial inevitablemente lleva a reflexionar sobre el impacto real de estas tecnologías. Cuando construyes con IA, no estás simplemente escribiendo código—estás moldeando cómo las personas interactúan con información y toman decisiones.

En ViajeIA, cada decisión de diseño tuvo implicaciones éticas. El rate limiting no es solo una característica técnica—protege contra el abuso y asegura acceso equitativo. La validación de inputs no es solo buenas prácticas—es respeto por la integridad del sistema. El diseño de prompts que no manipulen al usuario no es solo una preferencia—es responsabilidad moral.

La pregunta que guió el desarrollo no fue solo *"¿Puede la IA hacer esto?"*, sino más importante: *"¿Debe hacerlo, y si lo hace, cómo respeta la autonomía y dignidad del usuario?"*

Este proyecto representa un esfuerzo por construir algo correctamente: sistemas de seguridad que protegen, interfaces que respetan la inteligencia del usuario, y experiencias que empoderan en lugar de manipular. No es una declaración grandiosa sobre IA, sino una práctica consciente de desarrollo responsable.

---

## 🏗️ Construcción Responsable

A lo largo del desarrollo, quedó claro que construir sistemas de IA es inherentemente un acto que requiere tanto excelencia técnica como consideración ética. La mejor arquitectura es la que te permite iterar rápido y mantener código legible, pero también es la que facilita implementar seguridad y garantizar privacidad.

En ViajeIA encontrarás decisiones pragmáticas: código que funciona, una arquitectura que escala, y características que resuelven problemas reales. Pero también encontrarás sistemas de seguridad robustos, validación exhaustiva, y un compromiso genuino con la transparencia.

Porque al final del día, lo que importa no es solo si el código funciona, sino si ayuda a las personas de manera significativa. Y eso requiere balancear pragmatismo técnico con responsabilidad ética.

---

**Miguel Alvarez**  
*Magister en Business Intelligence - Universidad EAN*  
*Proyecto desarrollado para el curso "Construcción de Aplicación con IA: Diseño y Personalización de Asistentes" - Universidad de los Andes*

---

## ✨ Características Principales

- 🤖 **IA Personalizada**: Asistente virtual "Alex" que genera planes de viaje detallados y personalizados usando Google Gemini 2.0 Flash
- 🔐 **Autenticación Segura**: Sistema de login y registro con Firebase Authentication
- 🌤️ **Clima en Tiempo Real**: Integración con WeatherAPI.com para mostrar condiciones climáticas actuales del destino
- 📸 **Galería de Imágenes**: Imágenes de alta calidad obtenidas de Unsplash para cada destino
- 💬 **Chat Continuo**: Sistema de conversación con memoria contextual para hacer preguntas de seguimiento sobre el viaje
- 📄 **Generación de PDF**: Exportación de planes de viaje a PDF estilo revista con diseño profesional
- ⭐ **Sistema de Favoritos**: Guardado y gestión de viajes favoritos
- 🎨 **Interfaz Moderna**: Diseño responsive con Tailwind CSS y animaciones fluidas
- 🛡️ **Seguridad Robusta**: Rate limiting, validación de inputs, protección contra prompt injection

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2.0** - Biblioteca de JavaScript para construir interfaces de usuario
- **Vite 7.2.4** - Build tool y dev server de alta velocidad
- **Tailwind CSS 4.1.17** - Framework de CSS utility-first para diseño moderno
- **Firebase Authentication** - Autenticación de usuarios
- **React Markdown 10.1.0** - Renderizado de contenido Markdown
- **Lucide React 0.554.0** - Iconos modernos y ligeros
- **jsPDF 3.0.4** - Generación de documentos PDF
- **html2canvas 1.4.1** - Captura de elementos HTML como imágenes

### Backend
- **FastAPI 0.104.1** - Framework web moderno y rápido para Python
- **Uvicorn 0.24.0** - Servidor ASGI de alto rendimiento
- **Google Generative AI 0.3.2** - SDK oficial para Google Gemini
- **Firebase Admin SDK** - Verificación de tokens y gestión de usuarios
- **Pydantic 2.5.0** - Validación de datos con type hints
- **httpx 0.25.2** - Cliente HTTP asíncrono para llamadas a APIs externas
- **python-dotenv 1.0.0** - Gestión de variables de entorno
- **slowapi 0.1.9** - Rate limiting para protección contra abuso

### APIs Externas
- **Google Gemini AI** - Motor de IA para generación de recomendaciones
- **WeatherAPI.com** - Datos meteorológicos en tiempo real
- **Unsplash API** - Banco de imágenes de alta calidad
- **Firebase** - Autenticación y base de datos en tiempo real

---

## 📚 Documentación Adicional

Para documentación técnica detallada, auditorías, reportes y guías de desarrollo, consulta la carpeta [`docs/`](docs/).

**Documentación principal:**
- 📘 [Documentación Completa](docs/DOCUMENTACION.md)
- 🔒 [Implementación de Seguridad](docs/IMPLEMENTACION_SEGURIDAD.md)
- 📊 [Reporte de Arquitectura](docs/REPORTE_ARQUITECTURA_TECNICA.md)
- 🚀 [Guía de Despliegue en Railway](docs/RAILWAY_GUIDE.md)

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
FIREBASE_CREDENTIALS={"type":"service_account",...}  # JSON como string
FRONTEND_URL=http://localhost:5173
```

**Obtener API Keys:**
- **Google Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **WeatherAPI**: [WeatherAPI.com](https://www.weatherapi.com/)
- **Unsplash**: [Unsplash Developers](https://unsplash.com/developers)
- **Firebase**: [Firebase Console](https://console.firebase.google.com/)

> ⚠️ **IMPORTANTE**: Nunca commitees el archivo `.env` con tus API keys reales. El archivo está incluido en `.gitignore` por seguridad.

### Paso 3: Configurar Firebase

1. **Crear proyecto en Firebase Console**
2. **Habilitar Authentication** (Email/Password y Google)
3. **Obtener credenciales de Service Account**:
   - Ve a Project Settings → Service Accounts
   - Genera nueva clave privada
   - Copia el JSON completo y guárdalo como variable de entorno `FIREBASE_CREDENTIALS` (como string JSON)

### Paso 4: Configurar el Frontend

1. **Navegar a la carpeta del frontend:**

```bash
cd frontend
```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Configurar Firebase en el frontend:**

Crea `frontend/src/firebase/config.js` con tu configuración de Firebase:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  // ... resto de configuración
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
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
4. Registra un usuario y prueba el asistente

---

## 📚 Estructura del Proyecto

```
ViajeIA/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   │   ├── Login.jsx    # Pantalla de login
│   │   │   ├── Register.jsx # Pantalla de registro
│   │   │   └── travel-planner/
│   │   │       ├── TravelDashboard.jsx  # Dashboard principal
│   │   │       ├── ChatWithAlex.jsx      # Chat con IA
│   │   │       ├── HeroSearch.jsx        # Búsqueda de destinos
│   │   │       └── hooks/                # Custom hooks
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx           # Contexto de autenticación
│   │   ├── firebase/
│   │   │   └── config.js                 # Configuración Firebase
│   │   └── main.jsx                      # Punto de entrada
│   ├── package.json
│   └── vite.config.js
│
├── services/                 # Servicios del backend
│   ├── gemini_service.py    # Integración con Google Gemini AI
│   ├── weather_service.py   # Integración con WeatherAPI
│   └── unsplash_service.py  # Integración con Unsplash API
│
├── main.py                  # Aplicación FastAPI y endpoints
├── requirements.txt         # Dependencias de Python
├── .env                     # Variables de entorno (no commiteado)
├── .gitignore              # Archivos ignorados por Git
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

### `POST /api/plan`
Endpoint principal para generar recomendaciones de viaje. **Requiere autenticación.**

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Request Body:**
```json
{
  "destination": "París",
  "date": "2024-06-15",
  "budget": "Moderado ⚖️",
  "style": "Cultura 🏛️",
  "user_currency": "USD"
}
```

**Response:**
```json
{
  "gemini_response": "## 🏨 ALOJAMIENTO IDEAL\n\n...",
  "finish_reason": "STOP",
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
Endpoint para chat continuo con memoria conversacional. **Requiere autenticación.**

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

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

### `GET /api/stats`
Endpoint para obtener estadísticas de uso (público, sin autenticación).

---

## 🎯 Características Técnicas Destacadas

### Arquitectura
- **Separación Frontend/Backend**: Arquitectura cliente-servidor clara
- **APIs Asíncronas**: Llamadas paralelas a múltiples servicios para mejor rendimiento
- **Manejo de Errores Robusto**: Los servicios externos fallan de forma silenciosa sin afectar la experiencia

### Seguridad
- **Autenticación Firebase**: Verificación de tokens en cada request protegido
- **Rate Limiting**: 5 requests/minuto para `/api/plan`, 10 requests/minuto para `/api/chat`
- **Validación de Inputs**: Sanitización y validación de todos los datos de entrada
- **Protección contra Prompt Injection**: Detección de patrones maliciosos antes de enviar a Gemini
- **Variables de Entorno**: Todas las API keys protegidas en `.env`

### Frontend
- **Componentes Funcionales**: Uso de React Hooks (useState, useEffect, useRef)
- **Custom Hooks**: Lógica reutilizable extraída en hooks personalizados
- **Estado Local**: Gestión de estado con React hooks y localStorage para favoritos
- **Renderizado Condicional**: UI adaptativa según el estado de la aplicación
- **Optimización de PDF**: Estrategia "Smart Canvas" para PDFs de altura dinámica

### Backend
- **Validación de Datos**: Uso de Pydantic para validación automática de requests
- **Singleton Pattern**: Servicios globales para evitar múltiples inicializaciones
- **Logging Estructurado**: Sistema de logs para debugging y monitoreo
- **CORS Configurado**: Permite requests desde el frontend en desarrollo y producción
- **Control de Tokens**: Limitación de historial y max_output_tokens para optimizar costos

---

## 🔒 Seguridad

- ✅ API Keys almacenadas en variables de entorno (`.env`)
- ✅ Archivo `.env` incluido en `.gitignore`
- ✅ Validación de API keys al iniciar el servidor
- ✅ CORS configurado para desarrollo y producción
- ✅ Manejo seguro de errores sin exponer información sensible
- ✅ Autenticación Firebase con verificación de tokens
- ✅ Rate limiting por usuario/IP
- ✅ Sanitización de inputs contra prompt injection
- ✅ Validación de datos con Pydantic

Ver [SECURITY.md](SECURITY.md) para más detalles sobre seguridad.

---

## 📖 Documentación Adicional

- [CONTROL_TOKENS.md](CONTROL_TOKENS.md) - Guía sobre control de tokens y configuración de Gemini
- [RAILWAY_GUIDE.md](RAILWAY_GUIDE.md) - Guía de despliegue en Railway
- [CUMPLIMIENTO_TALLER.md](CUMPLIMIENTO_TALLER.md) - Análisis de cumplimiento de requisitos del taller
- [SECURITY.md](SECURITY.md) - Mejores prácticas de seguridad

---

## 🧪 Pruebas

### Probar el Backend con curl

```bash
# Health check
curl http://localhost:8000/health

# Generar plan (requiere token de Firebase)
curl -X POST "http://localhost:8000/api/plan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_firebase_token>" \
  -d '{
    "destination": "Tokio",
    "date": "2024-07-20",
    "budget": "Lujo ✨",
    "style": "Gastronomía 🌮",
    "user_currency": "USD"
  }'
```

---

## 🚀 Despliegue

### Railway (Recomendado)

Ver [docs/RAILWAY_GUIDE.md](docs/RAILWAY_GUIDE.md) para instrucciones detalladas.

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables de entorno en tu plataforma de despliegue:
- `GEMINI_API_KEY`
- `WEATHER_API_KEY`
- `UNSPLASH_ACCESS_KEY`
- `FIREBASE_CREDENTIALS` (JSON completo como string)
- `FRONTEND_URL`

---

## 📝 Notas de Desarrollo

- El servidor backend usa `reload=True` en desarrollo para auto-recargar cambios
- Los logs incluyen información detallada para debugging
- El formato de respuesta de Gemini es Markdown para renderizado en el frontend
- El sistema de favoritos usa `localStorage` del navegador
- El historial de chat se limita a los últimos 6 mensajes para optimizar tokens

---

## 🎓 Cumplimiento del Taller

Este proyecto cumple con todos los requisitos del taller "ViajeIA - Tu Asistente Personal de Viajes". Ver [docs/CUMPLIMIENTO_TALLER.md](docs/CUMPLIMIENTO_TALLER.md) para un análisis detallado.

**Fases Implementadas:**
- ✅ Fase 1: Chatbot Básico
- ✅ Fase 2: Especialización y Personalidad
- ✅ Fase 3: Integraciones (Clima, Fotos, Info en Tiempo Real)
- ✅ Fase 4: Funcionalidades Pro (Historial, PDF, Favoritos)
- ✅ Fase 5: Despliegue (Railway)
- ✅ Autenticación y Base de Datos (Firebase)
- ✅ Seguridad y Buenas Prácticas
- ✅ Control de Tokens

---

## 👤 Autor

**Miguel Alvarez**  
*Magister en Business Intelligence - Universidad EAN*

---

## 📄 Licencia

Este proyecto es de uso educativo. Todos los derechos reservados.

---

<div align="center">

**Hecho con ❤️ usando React, FastAPI y Google Gemini AI**

*"El mejor código es el que resuelve problemas reales para personas reales."*

[Reportar un Bug](https://github.com/tu-usuario/ViajeIA/issues) · [Solicitar una Feature](https://github.com/tu-usuario/ViajeIA/issues)

</div>
