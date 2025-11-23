# 🚂 Guía de Despliegue en Railway

Esta guía te llevará paso a paso para desplegar **ViajeIA** en Railway, configurando el backend y frontend como servicios separados.

---

## 📋 Índice

1. [Prerrequisitos](#prerrequisitos)
2. [Paso 1: Conectar Repositorio de GitHub](#paso-1-conectar-repositorio-de-github)
3. [Paso 2: Crear Servicio Backend](#paso-2-crear-servicio-backend)
4. [Paso 3: Crear Servicio Frontend](#paso-3-crear-servicio-frontend)
5. [Paso 4: Configurar Variables de Entorno](#paso-4-configurar-variables-de-entorno)
6. [Paso 5: Verificar Despliegue](#paso-5-verificar-despliegue)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Prerrequisitos

- ✅ Cuenta en [Railway](https://railway.app/) (crear cuenta gratuita)
- ✅ Repositorio de GitHub con el código de ViajeIA
- ✅ API Key de Google Gemini ([obtener aquí](https://makersuite.google.com/app/apikey))
- ✅ API Key de OpenWeatherMap (opcional, para clima)
- ✅ API Key de Unsplash (opcional, para imágenes)

---

## 📝 Paso 1: Conectar Repositorio de GitHub

1. **Inicia sesión en Railway**
   - Ve a [railway.app](https://railway.app/)
   - Haz clic en **"Login"** y autoriza Railway para acceder a tu cuenta de GitHub

2. **Crear Nuevo Proyecto**
   - Haz clic en **"New Project"**
   - Selecciona **"Deploy from GitHub repo"**
   - Busca y selecciona tu repositorio **ViajeIA**
   - Railway creará un proyecto y detectará automáticamente los servicios (aún no está configurado)

---

## 🔙 Paso 2: Crear Servicio Backend

1. **Agregar Nuevo Servicio**
   - En el dashboard de Railway, haz clic en **"+ New"** → **"Service"**
   - Selecciona **"GitHub Repo"** y elige tu repositorio **ViajeIA**

2. **Configurar Servicio Backend**
   - Railway detectará que es un proyecto Python
   - En la pestaña **"Settings"**, configura lo siguiente:
   
   **Root Directory:** `./` (raíz del repositorio)
   
   **Build Command:**
   ```bash
   pip install -r requirements.txt
   ```
   
   **Start Command:**
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT
   ```
   
   > **Nota:** Railway proporciona la variable `$PORT` automáticamente. Asegúrate de que el comando use `$PORT` en lugar de un puerto fijo.

3. **Variables de Entorno del Backend**
   - Ve a la pestaña **"Variables"**
   - Agrega las siguientes variables (ver detalles en [Paso 4](#paso-4-configurar-variables-de-entorno))

4. **Generar Dominio Público**
   - En la pestaña **"Settings"**, haz clic en **"Generate Domain"**
   - Railway te proporcionará una URL como: `https://viajeia-backend-xxxxx.up.railway.app`
   - **¡Guarda esta URL!** La necesitarás para configurar el frontend

---

## 🎨 Paso 3: Crear Servicio Frontend

1. **Agregar Segundo Servicio**
   - En el mismo proyecto de Railway, haz clic en **"+ New"** → **"Service"**
   - Selecciona **"GitHub Repo"** y elige el mismo repositorio **ViajeIA**

2. **Configurar Servicio Frontend**
   - En la pestaña **"Settings"**, configura lo siguiente:
   
   **Root Directory:** `./frontend`
   
   **Build Command:**
   ```bash
   npm install && npm run build
   ```
   
   **Start Command:**
   ```bash
   npx serve -s dist -l $PORT
   ```
   
   > **Nota:** Si prefieres usar un servidor de Node.js, puedes cambiar el comando:
   > ```bash
   > npm install -g serve && serve -s dist -l $PORT
   > ```
   > 
   > O si tienes `vite preview` configurado:
   > ```bash
   > npm run build && npm run preview -- --host 0.0.0.0 --port $PORT
   > ```

3. **Variables de Entorno del Frontend**
   - Ve a la pestaña **"Variables"**
   - Agrega las siguientes variables (ver detalles en [Paso 4](#paso-4-configurar-variables-de-entorno))

4. **Generar Dominio Público**
   - En la pestaña **"Settings"**, haz clic en **"Generate Domain"**
   - Railway te proporcionará una URL como: `https://viajeia-frontend-xxxxx.up.railway.app`
   - Esta será la URL pública de tu aplicación

---

## 🔐 Paso 4: Configurar Variables de Entorno

### Variables del Backend (`main.py`)

Ve a **Settings** → **Variables** del servicio backend y agrega:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `GEMINI_API_KEY` | ⚠️ **REQUERIDA** - API Key de Google Gemini | `AIza...` |
| `OPENWEATHER_API_KEY` | Opcional - API Key de OpenWeatherMap | `abc123...` |
| `UNSPLASH_ACCESS_KEY` | Opcional - API Key de Unsplash | `xyz789...` |
| `FRONTEND_URL` | Opcional - URL del frontend (para CORS). Si no se define, usa `"*"` | `https://viajeia-frontend-xxxxx.up.railway.app` |

### Variables del Frontend (`frontend/`)

Ve a **Settings** → **Variables** del servicio frontend y agrega:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | ⚠️ **REQUERIDA** - URL del backend (usa la URL del dominio del backend de Railway) | `https://viajeia-backend-xxxxx.up.railway.app` |

> **⚠️ Importante:** 
> - Las variables que empiezan con `VITE_` en Vite son expuestas al cliente
> - `VITE_API_URL` debe ser la URL completa del backend sin la barra final (`/`)
> - Si no defines `VITE_API_URL`, el frontend usará `http://localhost:8000` como fallback (útil solo para desarrollo local)

---

## ✅ Paso 5: Verificar Despliegue

1. **Verificar Backend**
   - Abre la URL del backend (ej: `https://viajeia-backend-xxxxx.up.railway.app/`)
   - Deberías ver un JSON con `{"message": "🚀 ViajeIA API está funcionando correctamente", ...}`
   - Prueba el endpoint de health: `https://viajeia-backend-xxxxx.up.railway.app/health`
   - Prueba el endpoint de stats: `https://viajeia-backend-xxxxx.up.railway.app/api/stats`

2. **Verificar Frontend**
   - Abre la URL del frontend (ej: `https://viajeia-frontend-xxxxx.up.railway.app`)
   - Deberías ver la interfaz de ViajeIA
   - Intenta planificar un viaje para verificar que la conexión con el backend funciona

3. **Verificar Conexión Frontend-Backend**
   - Abre las DevTools del navegador (F12) → pestaña **Network**
   - Intenta planificar un viaje
   - Verifica que las peticiones a `/api/plan` vayan a la URL correcta del backend

---

## 🔍 Solución de Problemas

### Problema: El backend no inicia

**Síntomas:** El servicio backend muestra errores en los logs de Railway.

**Soluciones:**
- ✅ Verifica que `GEMINI_API_KEY` esté configurada correctamente
- ✅ Verifica que `gunicorn` esté en `requirements.txt`
- ✅ Verifica que el comando de inicio use `$PORT` y no un puerto fijo
- ✅ Revisa los logs en Railway → pestaña **"Deployments"** → haz clic en el deployment más reciente

### Problema: El frontend no puede conectar con el backend

**Síntomas:** Errores CORS o "Failed to fetch" en el navegador.

**Soluciones:**
- ✅ Verifica que `VITE_API_URL` en el frontend sea la URL correcta del backend
- ✅ Verifica que `FRONTEND_URL` en el backend incluya la URL del frontend (o usa `"*"`)
- ✅ Asegúrate de que la URL del backend no termine con `/` (ej: `https://backend.up.railway.app`, no `https://backend.up.railway.app/`)
- ✅ Reinicia ambos servicios después de cambiar variables de entorno

### Problema: El frontend muestra "localhost:8000" en las peticiones

**Síntomas:** Las peticiones HTTP van a `http://localhost:8000` en lugar de la URL de producción.

**Soluciones:**
- ✅ Verifica que `VITE_API_URL` esté configurada en las variables de entorno del frontend
- ✅ **Importante:** Después de cambiar variables de entorno, Railway debe hacer un nuevo build
- ✅ Ve a **Settings** → **"Redeploy"** o haz un push al repositorio para forzar un nuevo build

### Problema: El build del frontend falla

**Síntomas:** El servicio frontend muestra errores durante el build.

**Soluciones:**
- ✅ Verifica que el **Root Directory** esté configurado como `./frontend`
- ✅ Verifica que `package.json` esté en el directorio `frontend/`
- ✅ Revisa los logs del build en Railway para ver el error específico

### Problema: Stats no se actualizan

**Síntomas:** El contador de viajes no aumenta en el footer.

**Soluciones:**
- ✅ Verifica que el endpoint `/api/stats` funcione en el backend
- ✅ Verifica que el frontend esté haciendo peticiones a la URL correcta
- ✅ El archivo `stats.json` se crea en el servidor, pero puede perderse si el servicio se reinicia (esto es normal)

---

## 📊 Estructura de Despliegue en Railway

```
Railway Project: ViajeIA
│
├── Service 1: Backend
│   ├── Root Directory: ./
│   ├── Build Command: pip install -r requirements.txt
│   ├── Start Command: gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT
│   ├── Variables:
│   │   ├── GEMINI_API_KEY
│   │   ├── OPENWEATHER_API_KEY (opcional)
│   │   ├── UNSPLASH_ACCESS_KEY (opcional)
│   │   └── FRONTEND_URL (opcional)
│   └── Domain: https://viajeia-backend-xxxxx.up.railway.app
│
└── Service 2: Frontend
    ├── Root Directory: ./frontend
    ├── Build Command: npm install && npm run build
    ├── Start Command: npx serve -s dist -l $PORT
    ├── Variables:
    │   └── VITE_API_URL (https://viajeia-backend-xxxxx.up.railway.app)
    └── Domain: https://viajeia-frontend-xxxxx.up.railway.app
```

---

## 🎯 Comandos de Despliegue Resumidos

### Backend

**Root Directory:** `./`  
**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT
```

### Frontend

**Root Directory:** `./frontend`  
**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npx serve -s dist -l $PORT
```

---

## 📝 Notas Adicionales

1. **Variables de Entorno Sensibles:**
   - Railway encripta automáticamente las variables de entorno
   - Nunca compartas tus API keys públicamente
   - Usa variables de entorno de Railway, no las hardcodees en el código

2. **Dominios Personalizados:**
   - Railway permite agregar dominios personalizados en la pestaña **"Settings"** → **"Custom Domain"**
   - Puedes configurar un dominio como `viajeia.com` si tienes uno

3. **Monitoreo:**
   - Railway proporciona métricas de uso en el dashboard
   - Revisa los logs en tiempo real en la pestaña **"Deployments"**

4. **Costos:**
   - El plan gratuito de Railway incluye $5 USD de crédito al mes
   - Cada servicio usa recursos cuando está activo
   - Revisa el uso en el dashboard de Railway

---

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación **ViajeIA** estará desplegada en producción y accesible desde cualquier lugar del mundo.

Si tienes problemas o preguntas, revisa los logs en Railway o consulta la [documentación oficial de Railway](https://docs.railway.app/).

---

**Última actualización:** 2024

