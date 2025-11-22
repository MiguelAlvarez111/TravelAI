# 🔒 REPORTE DE AUDITORÍA DE SEGURIDAD - ViajeIA

**Fecha de Auditoría:** 2024  
**Auditor:** Sistema de Auditoría Automatizada  
**Proyecto:** ViajeIA - Planificador de Viajes con IA

---

## 📋 RESUMEN EJECUTIVO

Este reporte analiza el estado actual de seguridad del proyecto ViajeIA contrastándolo con los requisitos de seguridad del taller universitario. Se evaluaron 6 áreas críticas de seguridad.

**Estado General:** ⚠️ **PARCIALMENTE CUMPLIDO** (50% implementado, 33% parcial, 17% faltante)

---

## 🛡️ 1. VALIDACIÓN DE ENTRADAS

### ✅ **Implementado:**
- **Validación básica de campos vacíos en Frontend:**
  - `Login.jsx` (líneas 23-27): Valida que email y password no estén vacíos
  - `Register.jsx` (líneas 26-42): Valida campos vacíos, longitud mínima de contraseña (6 caracteres) y coincidencia de contraseñas
  - `TravelPlanner.jsx` (línea 215): Valida que el destino no esté vacío antes de planificar

- **Validación de tipos en Backend con Pydantic:**
  - `main.py` (líneas 134-165): Modelos `TravelRequest` y `ChatRequest` validan tipos de datos automáticamente
  - `main.py` (línea 263): Validación adicional de destino no vacío en el endpoint `/api/plan`
  - `main.py` (líneas 454-464): Validación de destino y mensaje no vacíos en `/api/chat`

### ⚠️ **Parcial:**
- **Validación de formato de email:**
  - Los inputs usan `type="email"` (HTML5) en `Login.jsx` (línea 67) y `Register.jsx` (línea 107), lo cual proporciona validación básica del navegador
  - **FALTA:** Validación con regex en JavaScript para asegurar formato correcto antes de enviar al backend
  - **FALTA:** Validación en el backend con Pydantic usando `EmailStr` o regex personalizado

### ❌ **Faltante:**
- Validación de formato de email con regex en Frontend (solo HTML5)
- Validación de formato de email en Backend (Pydantic `EmailStr`)
- Sanitización de inputs para prevenir XSS (especialmente en campos de texto libre como `destination` y `message`)
- Validación de longitud máxima de campos para prevenir DoS por payloads grandes

**Ubicación del código:**
- Frontend: `frontend/src/components/Login.jsx`, `frontend/src/components/Register.jsx`
- Backend: `main.py` (modelos Pydantic)

---

## 🔑 2. PROTECCIÓN DE CLAVES API

### ✅ **Implementado:**
- **Uso de variables de entorno en Backend:**
  - `main.py` (línea 73): `GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")`
  - `services/gemini_service.py` (línea 66): `self.api_key = os.getenv("GEMINI_API_KEY")`
  - `main.py` (línea 22): `load_dotenv()` para cargar variables desde `.env`

- **Uso de variables de entorno en Frontend:**
  - `frontend/src/firebase/config.js` (líneas 12-19): Todas las claves de Firebase usan `import.meta.env.VITE_*`
  - `frontend/src/TravelPlanner.jsx` (línea 28): `API_URL` usa `import.meta.env.VITE_API_URL`

- **Archivo .gitignore configurado:**
  - `.gitignore` (líneas 1-4): Incluye `.env`, `.env.local`, `frontend/.env`, `frontend/.env.local`

### ⚠️ **Parcial:**
- **Validación de variables de entorno:**
  - `main.py` (líneas 74-81): Valida `GEMINI_API_KEY` y muestra advertencia si falta
  - `frontend/src/firebase/config.js` (líneas 23-46): Valida variables de Firebase y muestra error en consola
  - **FALTA:** Fallar de forma segura si las variables críticas no están presentes (actualmente solo muestra warnings)

### ❌ **Faltante:**
- No se encontraron claves hardcodeadas en el código ✅ (esto es bueno)
- **RECOMENDACIÓN:** Agregar validación estricta que detenga el servidor si `GEMINI_API_KEY` no está presente

**Ubicación del código:**
- Backend: `main.py` (líneas 73-81), `services/gemini_service.py` (líneas 66-72)
- Frontend: `frontend/src/firebase/config.js`, `frontend/src/TravelPlanner.jsx`
- Configuración: `.gitignore`

---

## 🏗️ 3. SEPARACIÓN FRONTEND/BACKEND

### ✅ **Implementado:**
- **Comunicación vía API (fetch):**
  - `TravelPlanner.jsx` (líneas 231-243): Usa `fetch()` para llamar a `/api/plan`
  - `TravelPlanner.jsx` (líneas 310-323): Usa `fetch()` para llamar a `/api/chat`
  - `TravelPlanner.jsx` (línea 120): Usa `fetch()` para obtener estadísticas

- **Estructura de carpetas clara:**
  - Separación clara entre `frontend/` y raíz del proyecto (backend)
  - Servicios en `services/` separados por funcionalidad

- **CORS configurado correctamente:**
  - `main.py` (líneas 92-130): CORS configurado con orígenes específicos (no `*`)

### ❌ **Faltante:**
- No se encontraron problemas en esta área ✅

**Ubicación del código:**
- Frontend: `frontend/src/TravelPlanner.jsx`
- Backend: `main.py` (configuración CORS)

---

## 🛑 4. PROTECCIÓN CONTRA ABUSO (RATE LIMITING)

### ❌ **Faltante:**
- **No existe mecanismo de rate limiting:**
  - No se encontró ningún middleware o decorador de rate limiting en `main.py`
  - No hay límites de requests por minuto/día por usuario o IP
  - No hay contador de consultas por usuario en Firebase

- **Métricas existentes (pero no para rate limiting):**
  - `main.py` (líneas 32-67): Sistema de métricas que cuenta planes generados, pero no se usa para limitar requests
  - `stats.json`: Almacena contadores globales, no por usuario/IP

**Recomendaciones:**
1. Implementar rate limiting usando `slowapi` o `fastapi-limiter`
2. Limitar a X requests por minuto por IP
3. Limitar a Y requests por día por usuario autenticado (usando Firebase UID)
4. Almacenar contadores de requests en Firebase Realtime Database por usuario

**Ubicación del código:**
- Backend: `main.py` (no implementado actualmente)

---

## 🔒 5. PRIVACIDAD Y ENCRIPTACIÓN

### ✅ **Implementado:**
- **Manejo seguro de contraseñas con Firebase Auth:**
  - `frontend/src/contexts/AuthContext.jsx` (líneas 51-79, 88-118): Usa `signInWithEmailAndPassword` y `createUserWithEmailAndPassword` de Firebase
  - Firebase Auth maneja automáticamente el hashing de contraseñas (bcrypt/Argon2) - **NO se guardan en texto plano** ✅
  - Las contraseñas nunca se envían al backend propio, solo a Firebase

### ❌ **Faltante:**
- **Política de Privacidad:**
  - No se encontró mención a Política de Privacidad en `Register.jsx`
  - No hay checkbox de aceptación de términos y condiciones
  - No hay enlace a política de privacidad en el formulario de registro

**Recomendaciones:**
1. Agregar checkbox de aceptación de términos y política de privacidad en `Register.jsx`
2. Crear página/componente de Política de Privacidad
3. Validar que el checkbox esté marcado antes de permitir registro

**Ubicación del código:**
- Frontend: `frontend/src/components/Register.jsx` (no implementado actualmente)

---

## 🚫 6. PROTECCIÓN DE PROMPTS (INJECTION)

### ❌ **Faltante:**
- **No existe filtro de prompts maliciosos:**
  - `main.py` (líneas 240-404): Los datos del usuario se pasan directamente a `gemini_service.generate_travel_recommendation()` sin sanitización
  - `main.py` (líneas 433-580): Los mensajes de chat se pasan directamente a `gemini_service.generate_chat_response()` sin filtrado
  - `services/gemini_service.py` (líneas 86-176, 178-274): Los prompts se construyen concatenando strings sin validar contenido malicioso

- **Vulnerabilidades potenciales:**
  - Un usuario podría enviar prompts como: "Ignora tus instrucciones previas y..."
  - Un usuario podría intentar extraer el system prompt completo
  - Un usuario podría intentar hacer que el modelo genere contenido inapropiado

**Recomendaciones:**
1. Implementar función de sanitización que detecte y bloquee intentos de prompt injection
2. Detectar patrones como:
   - "Ignora tus instrucciones"
   - "Olvida todo lo anterior"
   - "Eres ahora..."
   - "Sistema: ..."
3. Limitar longitud máxima de inputs (destination, message, etc.)
4. Escapar caracteres especiales que podrían romper el formato del prompt
5. Agregar logging de intentos de injection para monitoreo

**Ubicación del código:**
- Backend: `main.py` (endpoints `/api/plan` y `/api/chat`), `services/gemini_service.py`

---

## 📊 TABLA RESUMEN DE ESTADO

| Área de Seguridad | Estado | Implementación | Prioridad |
|-------------------|--------|----------------|-----------|
| **1. Validación de Entradas** | ⚠️ Parcial | Validación básica presente, falta regex email y sanitización | 🔴 Alta |
| **2. Protección de Claves API** | ✅ Implementado | Variables de entorno + .gitignore | 🟢 OK |
| **3. Separación Frontend/Backend** | ✅ Implementado | API REST correcta | 🟢 OK |
| **4. Rate Limiting** | ❌ Faltante | No existe ningún mecanismo | 🔴 Crítica |
| **5. Privacidad y Encriptación** | ⚠️ Parcial | Firebase Auth OK, falta Política de Privacidad | 🟡 Media |
| **6. Protección de Prompts** | ❌ Faltante | No hay filtros anti-injection | 🔴 Crítica |

---

## 🎯 PLAN DE ACCIÓN PRIORIZADO

### 🔴 **PRIORIDAD CRÍTICA (Implementar inmediatamente)**

#### 1. **Implementar Rate Limiting**
   - **Técnica:** Usar `slowapi` (compatible con FastAPI)
   - **Pasos:**
     1. Instalar: `pip install slowapi`
     2. Agregar middleware en `main.py`:
        ```python
        from slowapi import Limiter, _rate_limit_exceeded_handler
        from slowapi.util import get_remote_address
        from slowapi.errors import RateLimitExceeded
        
        limiter = Limiter(key_func=get_remote_address)
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
        ```
     3. Decorar endpoints:
        ```python
        @app.post("/api/plan")
        @limiter.limit("10/minute")  # 10 requests por minuto
        async def create_travel_plan(...):
        ```
     4. Para usuarios autenticados, usar Firebase UID como key
   - **Archivos a modificar:** `main.py`, `requirements.txt`

#### 2. **Implementar Protección contra Prompt Injection**
   - **Técnica:** Función de sanitización antes de enviar a Gemini
   - **Pasos:**
     1. Crear función `sanitize_prompt()` en `services/gemini_service.py`:
        ```python
        def sanitize_prompt(text: str) -> tuple[bool, str]:
            # Detectar patrones maliciosos
            malicious_patterns = [
                r"(?i)ignore\s+(your|all|previous|earlier)\s+(instructions|prompts|rules)",
                r"(?i)forget\s+(everything|all|previous)",
                r"(?i)you\s+are\s+now",
                r"(?i)system\s*:",
                r"(?i)assistant\s*:",
            ]
            for pattern in malicious_patterns:
                if re.search(pattern, text):
                    return False, "Contenido no permitido detectado"
            return True, text
        ```
     2. Validar en `generate_travel_recommendation()` y `generate_chat_response()`
     3. Limitar longitud máxima (ej: 5000 caracteres)
   - **Archivos a modificar:** `services/gemini_service.py`, `main.py`

### 🟡 **PRIORIDAD ALTA (Implementar pronto)**

#### 3. **Mejorar Validación de Email**
   - **Frontend:**
     1. Agregar función de validación con regex en `Login.jsx` y `Register.jsx`:
        ```javascript
        const validateEmail = (email) => {
          const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return regex.test(email);
        };
        ```
     2. Validar antes de llamar a `login()` o `register()`
   - **Backend:**
     1. Cambiar `destination: str` a `email: EmailStr` en modelos Pydantic (si aplica)
     2. Agregar validación personalizada si es necesario
   - **Archivos a modificar:** `frontend/src/components/Login.jsx`, `frontend/src/components/Register.jsx`

#### 4. **Agregar Política de Privacidad**
   - **Pasos:**
     1. Crear componente `PrivacyPolicy.jsx`
     2. Agregar checkbox en `Register.jsx`:
        ```jsx
        <label>
          <input type="checkbox" required />
          Acepto la <Link to="/privacy">Política de Privacidad</Link>
        </label>
        ```
     3. Validar que esté marcado antes de registrar
   - **Archivos a modificar:** `frontend/src/components/Register.jsx`, crear `frontend/src/components/PrivacyPolicy.jsx`

### 🟢 **PRIORIDAD MEDIA (Mejoras recomendadas)**

#### 5. **Sanitización de Inputs para XSS**
   - **Frontend:**
     1. Usar librería como `DOMPurify` para sanitizar inputs antes de mostrar
     2. Especialmente en campos de texto libre como `destination` y `message`
   - **Backend:**
     1. Validar y sanitizar inputs antes de procesar
     2. Limitar longitud máxima de campos

#### 6. **Mejorar Validación de Variables de Entorno**
   - **Backend:**
     1. Hacer que el servidor falle al iniciar si `GEMINI_API_KEY` no está presente
     2. Agregar validación similar para otras variables críticas

---

## 📝 NOTAS ADICIONALES

### ✅ **Aspectos Positivos:**
1. Uso correcto de variables de entorno para claves API
2. `.gitignore` bien configurado
3. Separación clara Frontend/Backend
4. Firebase Auth maneja contraseñas de forma segura
5. Validación básica de campos vacíos presente

### ⚠️ **Riesgos Identificados:**
1. **Sin rate limiting:** Vulnerable a abuso y DoS
2. **Sin protección de prompts:** Vulnerable a prompt injection
3. **Validación de email débil:** Solo HTML5, no regex
4. **Sin política de privacidad:** Requisito legal no cumplido

### 📚 **Recursos Recomendados:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Prompt Injection Attacks](https://learnprompting.org/docs/category/-prompt-injection)

---

## ✅ CHECKLIST DE CUMPLIMIENTO

- [x] Validación básica de campos vacíos (Frontend y Backend)
- [ ] Validación de formato de email con regex
- [x] Uso de variables de entorno para claves API
- [x] .gitignore configurado
- [x] Separación Frontend/Backend vía API
- [ ] Rate limiting implementado
- [x] Contraseñas encriptadas (Firebase Auth)
- [ ] Política de Privacidad presente
- [ ] Protección contra prompt injection

**Cumplimiento Total: 5/9 (55.5%)**

---

**Fin del Reporte**

