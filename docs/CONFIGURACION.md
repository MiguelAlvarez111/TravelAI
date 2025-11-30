# ⚙️ Guía de Configuración - ViajeIA

**Versión:** 1.0.0  
**Última actualización:** 2025-01-27

---

## 📋 Variables de Entorno Requeridas

Todas las variables de entorno deben configurarse en un archivo `.env` en la raíz del proyecto (al mismo nivel que `main.py`).

### 🔑 Variables Obligatorias

#### `GEMINI_API_KEY`
**Tipo:** String  
**Requerida:** ✅ Sí (crítica)  
**Descripción:** API Key de Google Gemini AI para generar recomendaciones de viaje.

**Cómo obtenerla:**
1. Visita [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API key
4. Copia la clave generada

**Ejemplo:**
```bash
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Validación:** El servidor no iniciará si esta variable no está configurada.

---

### 🔑 Variables Opcionales (pero recomendadas)

#### `WEATHER_API_KEY`
**Tipo:** String  
**Requerida:** ⚠️ No (pero recomendada)  
**Descripción:** API Key de WeatherAPI.com para obtener datos meteorológicos en tiempo real.

**Cómo obtenerla:**
1. Visita [WeatherAPI.com](https://www.weatherapi.com/)
2. Crea una cuenta gratuita
3. Obtén tu API key desde el dashboard
4. El plan gratuito permite 1 millón de llamadas/mes

**Ejemplo:**
```bash
WEATHER_API_KEY=abc123def456ghi789
```

**Comportamiento si falta:** El sistema continuará funcionando pero no mostrará información del clima.

---

#### `UNSPLASH_ACCESS_KEY`
**Tipo:** String  
**Requerida:** ⚠️ No (pero recomendada)  
**Descripción:** Access Key de Unsplash API para obtener imágenes de alta calidad de los destinos.

**Cómo obtenerla:**
1. Visita [Unsplash Developers](https://unsplash.com/developers)
2. Crea una aplicación
3. Obtén tu Access Key

**Ejemplo:**
```bash
UNSPLASH_ACCESS_KEY=abc123def456ghi789jkl012mno345pqr678
```

**Comportamiento si falta:** El sistema continuará funcionando pero no mostrará imágenes de los destinos.

---

#### `FIREBASE_CREDENTIALS`
**Tipo:** String (JSON)  
**Requerida:** ✅ Sí (para endpoints protegidos)  
**Descripción:** Credenciales de Service Account de Firebase Admin SDK en formato JSON como string.

**Cómo obtenerla:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** → **Service Accounts**
4. Haz clic en **Generate New Private Key**
5. Descarga el archivo JSON
6. Convierte el JSON a string (puedes usar un formateador online)

**Ejemplo:**
```bash
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"tu-proyecto","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Nota:** En producción (Railway), puedes configurar esto directamente en el dashboard sin comillas externas.

**Comportamiento si falta:** El servidor iniciará pero los endpoints protegidos (`/api/plan`, `/api/chat`) retornarán error 503.

**Fallback:** Si no está configurada, el sistema intentará cargar desde `serviceAccountKey.json` en la raíz del proyecto (solo para desarrollo local).

---

#### `FRONTEND_URL`
**Tipo:** String (URL)  
**Requerida:** ⚠️ No  
**Descripción:** URL del frontend para configuración de CORS.

**Ejemplo:**
```bash
FRONTEND_URL=http://localhost:5173
```

**Valores por defecto (si no se configura):**
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`
- URLs de Railway (hardcodeadas)

---

## 📝 Archivo .env Completo

Crea un archivo `.env` en la raíz del proyecto con el siguiente formato:

```bash
# API Keys - Obligatorias
GEMINI_API_KEY=tu_api_key_de_google_gemini_aqui

# API Keys - Opcionales (pero recomendadas)
WEATHER_API_KEY=tu_api_key_de_weatherapi_aqui
UNSPLASH_ACCESS_KEY=tu_access_key_de_unsplash_aqui

# Firebase - Obligatorio para endpoints protegidos
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Frontend URL - Opcional
FRONTEND_URL=http://localhost:5173
```

---

## 🔧 Configuración del Frontend

### Firebase Config (`frontend/src/firebase/config.js`)

Crea este archivo con tu configuración de Firebase:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
```

**Cómo obtener estos valores:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** → **General**
4. En "Your apps", selecciona la app web o crea una nueva
5. Copia los valores de configuración

---

## 🏗️ Configuración de Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **Add project**
3. Sigue los pasos del asistente

### 2. Habilitar Authentication

1. En el menú lateral, ve a **Authentication**
2. Haz clic en **Get started**
3. Habilita los siguientes proveedores:
   - **Email/Password**
   - **Google** (opcional pero recomendado)

### 3. Habilitar Realtime Database

1. En el menú lateral, ve a **Realtime Database**
2. Haz clic en **Create Database**
3. Selecciona **Start in test mode** (para desarrollo)
4. Selecciona una ubicación (ej: `us-central1`)

### 4. Obtener Service Account Credentials

1. Ve a **Project Settings** → **Service Accounts**
2. Haz clic en **Generate New Private Key**
3. Descarga el archivo JSON
4. Convierte el contenido a string JSON para `FIREBASE_CREDENTIALS`

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE: Nunca commitees el archivo `.env`

El archivo `.env` debe estar en `.gitignore`:

```gitignore
# .env
.env
.env.local
.env.*.local
serviceAccountKey.json
```

### Verificar que .env está en .gitignore

```bash
git check-ignore .env
# Debe retornar: .env
```

---

## 🚀 Configuración en Producción (Railway)

En Railway, configura las variables de entorno en el dashboard:

1. Ve a tu proyecto en Railway
2. Selecciona el servicio (backend)
3. Ve a la pestaña **Variables**
4. Agrega cada variable de entorno:
   - `GEMINI_API_KEY`
   - `WEATHER_API_KEY`
   - `UNSPLASH_ACCESS_KEY`
   - `FIREBASE_CREDENTIALS` (como string JSON, sin comillas externas)
   - `FRONTEND_URL` (opcional)

**Nota:** En Railway, `FIREBASE_CREDENTIALS` debe ser el JSON completo como string, sin comillas externas adicionales.

---

## ✅ Verificación de Configuración

### Backend

1. Inicia el servidor:
   ```bash
   python main.py
   ```

2. Verifica los logs:
   - ✅ Debe mostrar: `✅ GEMINI_API_KEY encontrada y validada`
   - ✅ Debe mostrar: `✅ Firebase Admin SDK inicializado...` (si está configurado)
   - ⚠️ Si falta Firebase: `⚠️ ADVERTENCIA: Firebase Admin SDK no pudo ser inicializado`

3. Prueba el endpoint de health:
   ```bash
   curl http://localhost:8000/health
   ```

### Frontend

1. Inicia el servidor de desarrollo:
   ```bash
   cd frontend
   npm run dev
   ```

2. Abre `http://localhost:5173`
3. Intenta registrar un usuario
4. Verifica que puedas iniciar sesión

---

## 📚 Referencias

- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [WeatherAPI.com](https://www.weatherapi.com/)
- [Unsplash Developers](https://unsplash.com/developers)
- [Firebase Console](https://console.firebase.google.com/)
- [Railway Documentation](https://docs.railway.app/)

---

**Última actualización:** 2025-01-27

