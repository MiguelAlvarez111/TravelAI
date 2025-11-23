# 🔐 Guía de Prueba - Autenticación con Firebase

## 📋 Checklist de Preparación

### 1. Instalar Dependencias del Backend

```bash
# Opción A: Usar --user (recomendado si no tienes venv)
pip install --user -r requirements.txt

# Opción B: Usar entorno virtual (mejor práctica)
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurar Credenciales de Firebase

**Opción A: Variable de Entorno (Recomendado para Railway)**
```bash
# En tu archivo .env o variable de entorno de Railway
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Opción B: Archivo Local (Para desarrollo)**
1. Descarga tu Service Account Key desde Firebase Console
2. Guárdalo como `serviceAccountKey.json` en la raíz del proyecto
3. **IMPORTANTE**: Asegúrate de que está en `.gitignore`

### 3. Verificar que Firebase está Inicializado

Al iniciar el backend, deberías ver en los logs:
```
✅ Firebase Admin SDK inicializado desde FIREBASE_CREDENTIALS
```
o
```
✅ Firebase Admin SDK inicializado desde serviceAccountKey.json
```

Si ves:
```
❌ ERROR: Firebase Admin SDK no pudo ser inicializado
```
Revisa tus credenciales.

---

## 🧪 Pasos para Probar

### Paso 1: Iniciar el Backend

```bash
# Desde la raíz del proyecto
cd /Users/miguelalvarezavendano/ViajeIA
python3 main.py
```

**Verifica en los logs:**
- ✅ Firebase Admin SDK inicializado
- ✅ GEMINI_API_KEY encontrada y validada
- 🚀 Iniciando servidor ViajeIA...

### Paso 2: Iniciar el Frontend

```bash
# En otra terminal
cd frontend
npm run dev
```

### Paso 3: Probar la Autenticación

1. **Abre el navegador en** `http://localhost:5173`

2. **Inicia sesión** con Firebase Auth (Login/Register)

3. **Intenta crear un plan de viaje:**
   - Ingresa un destino
   - Haz clic en "Planificar"
   - **Verifica en la consola del navegador (F12):**
     - No debería haber errores de autenticación
     - El token debería obtenerse correctamente

4. **Verifica en los logs del backend:**
   ```
   ✅ Token verificado para usuario: <uid>
   📨 Nueva solicitud recibida: Destino=...
   ```

### Paso 4: Probar el Chat

1. Después de crear un plan, intenta usar el chat
2. Envía un mensaje
3. **Verifica:**
   - El mensaje se envía correctamente
   - No hay errores 401 (Unauthorized)

---

## 🐛 Solución de Problemas

### Error: "Token de autorización requerido"

**Causa:** El frontend no está enviando el token o el usuario no está autenticado.

**Solución:**
1. Verifica que el usuario esté logueado en Firebase
2. Abre la consola del navegador (F12) y verifica:
   ```javascript
   // Deberías ver en Network tab:
   // Headers → Authorization: Bearer <token>
   ```
3. Si no ves el header, verifica que `user.getIdToken()` se esté llamando correctamente

### Error: "Firebase Admin SDK no pudo ser inicializado"

**Causa:** Las credenciales no están configuradas correctamente.

**Solución:**
1. Verifica que `FIREBASE_CREDENTIALS` esté en el `.env` o
2. Verifica que `serviceAccountKey.json` exista en la raíz del proyecto
3. Verifica que el JSON sea válido

### Error: "Token de autorización inválido"

**Causa:** El token expiró o es inválido.

**Solución:**
1. Firebase SDK debería refrescar automáticamente, pero si persiste:
2. Cierra sesión y vuelve a iniciar sesión
3. Verifica que el proyecto de Firebase en el frontend coincida con las credenciales del backend

### Error 401 en todas las peticiones

**Causa:** El backend requiere autenticación pero el frontend no está enviando tokens.

**Verificación:**
1. Abre DevTools → Network
2. Selecciona una petición a `/api/plan` o `/api/chat`
3. Ve a la pestaña "Headers"
4. Busca "Authorization" header
5. Debería ser: `Authorization: Bearer <token>`

Si no está:
- Verifica que el usuario esté autenticado
- Verifica que `user.getIdToken()` se esté llamando
- Revisa la consola por errores de JavaScript

---

## ✅ Verificación Exitosa

Si todo funciona correctamente, deberías ver:

1. **En el Frontend:**
   - Los planes se generan correctamente
   - El chat funciona sin errores
   - No hay mensajes de error 401

2. **En el Backend (logs):**
   ```
   ✅ Token verificado para usuario: abc123...
   📨 Nueva solicitud recibida: Destino=París...
   ✅ Recomendación generada con datos en tiempo real
   ```

3. **En la Consola del Navegador:**
   - No hay errores de autenticación
   - Las peticiones tienen status 200

---

## 🔍 Verificación Manual con curl

Puedes probar el endpoint directamente con un token:

```bash
# 1. Obtén un token desde el navegador (consola):
# En la consola del navegador, ejecuta:
# const user = firebase.auth().currentUser; const token = await user.getIdToken(); console.log(token);

# 2. Usa el token en curl:
curl -X POST "http://localhost:8000/api/plan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TU_TOKEN_AQUI>" \
  -d '{
    "destination": "París",
    "date": "2025-06-01",
    "budget": "1000 USD",
    "style": "aventura"
  }'
```

Si el token es válido, deberías recibir una respuesta 200 con el plan de viaje.

---

## 📝 Notas Importantes

1. **Los endpoints `/api/plan` y `/api/chat` ahora REQUIEREN autenticación**
2. **Sin token válido, recibirás error 401**
3. **El rate limiting ahora usa el UID del token validado**
4. **Si no hay token, el rate limiting usa la IP como fallback**

