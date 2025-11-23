# 🔒 Guía de Seguridad - ViajeIA

Este documento describe las medidas de seguridad implementadas en ViajeIA y las mejores prácticas para mantener el proyecto seguro, especialmente al compartirlo en GitHub.

---

## 🛡️ Medidas de Seguridad Implementadas

### 1. Protección de Credenciales

#### Variables de Entorno
- ✅ Todas las API keys se almacenan en variables de entorno (`.env`)
- ✅ El archivo `.env` está incluido en `.gitignore`
- ✅ Nunca se commitean credenciales al repositorio

#### Archivos Protegidos en `.gitignore`
```
.env
.env.local
frontend/.env
frontend/.env.local
serviceAccountKey.json
*.firebase-adminsdk*.json
FIREBASE_CREDENTIALS_FORMAT.txt
*credentials*.json
*credentials*.txt
```

#### Verificación
Antes de hacer commit, verifica que estos archivos NO estén en el staging:
```bash
git status
# No deberías ver .env, serviceAccountKey.json, etc.
```

---

### 2. Autenticación y Autorización

#### Firebase Authentication
- ✅ Autenticación de usuarios con Firebase Auth
- ✅ Tokens JWT verificados en cada request protegido
- ✅ Contraseñas encriptadas por Firebase (nunca en texto plano)
- ✅ Soporte para Email/Password y Google OAuth

#### Protección de Endpoints
- ✅ Endpoints `/api/plan` y `/api/chat` requieren autenticación
- ✅ Verificación de tokens con Firebase Admin SDK
- ✅ Rechazo automático de requests sin token válido

---

### 3. Validación y Sanitización de Inputs

#### Validación Frontend
- ✅ Validación de formato de email con regex
- ✅ Validación de campos requeridos
- ✅ Validación de longitud de contraseña
- ✅ Mensajes de error claros para el usuario

#### Sanitización Backend
- ✅ Función `sanitize_input()` para prevenir prompt injection
- ✅ Detección de patrones maliciosos:
  - Intentos de ignorar instrucciones
  - Intentos de cambiar el rol del asistente
  - Intentos de ejecutar comandos
  - Intentos de inyección de código
- ✅ Límites de longitud por campo:
  - Destino: máximo 100 caracteres
  - Mensajes de chat: máximo 500 caracteres
  - Campos opcionales: máximo 50 caracteres

#### Validación con Pydantic
- ✅ Modelos Pydantic para validación automática de requests
- ✅ Type hints para validación de tipos
- ✅ Validación de campos requeridos y opcionales

---

### 4. Rate Limiting

#### Implementación
- ✅ Rate limiting con `slowapi`
- ✅ Límites por usuario (Firebase UID) o IP
- ✅ Límites configurados:
  - `/api/plan`: 5 requests por minuto
  - `/api/chat`: 10 requests por minuto
- ✅ Mensajes de error claros cuando se excede el límite

#### Beneficios
- Protección contra abuso
- Prevención de ataques DDoS básicos
- Control de costos de APIs externas

---

### 5. Protección contra Prompt Injection

#### Detección de Patrones Maliciosos
La función `sanitize_input()` detecta:
- Intentos de ignorar instrucciones: "ignore your instructions", "forget everything"
- Intentos de cambiar el rol: "you are now", "act as", "pretend to be"
- Intentos de acceso a instrucciones: "system:", "show me your instructions"
- Intentos de ejecutar comandos: "execute(", "javascript:", "<script"
- Intentos de inyección de código: "import", "__import__", "subprocess"

#### Acción
- Si se detecta contenido malicioso, se rechaza el request con HTTP 400
- Se registra en logs como advertencia
- El usuario recibe un mensaje genérico de error

---

### 6. Manejo Seguro de Errores

#### Principios
- ✅ No exponer información sensible en mensajes de error
- ✅ Logs detallados en servidor (no visibles al usuario)
- ✅ Mensajes genéricos al usuario
- ✅ No revelar estructura interna del sistema

#### Ejemplo
```python
# ❌ MALO
raise HTTPException(500, detail=f"Error en Gemini: {api_key}")

# ✅ BUENO
logger.error(f"Error en Gemini: {error}")
raise HTTPException(500, detail="Ocurrió un error consultando a la IA")
```

---

### 7. CORS (Cross-Origin Resource Sharing)

#### Configuración
- ✅ CORS configurado explícitamente
- ✅ Solo orígenes permitidos pueden hacer requests
- ✅ Credenciales permitidas solo desde orígenes confiables
- ✅ No usar `allow_origins=["*"]` con `allow_credentials=True`

#### Orígenes Permitidos
- `http://localhost:5173` (desarrollo)
- `http://localhost:3000` (desarrollo alternativo)
- URLs de producción en Railway

---

## 📋 Checklist de Seguridad para GitHub

Antes de hacer push a GitHub, verifica:

### ✅ Archivos Sensibles
- [ ] `.env` NO está en el repositorio
- [ ] `serviceAccountKey.json` NO está en el repositorio
- [ ] `FIREBASE_CREDENTIALS_FORMAT.txt` NO está en el repositorio (si contiene credenciales reales)
- [ ] No hay API keys hardcodeadas en el código
- [ ] No hay contraseñas en el código

### ✅ .gitignore
- [ ] `.gitignore` incluye `.env`
- [ ] `.gitignore` incluye `serviceAccountKey.json`
- [ ] `.gitignore` incluye archivos de credenciales

### ✅ Variables de Entorno
- [ ] Todas las API keys están en variables de entorno
- [ ] Hay un archivo `.env.example` con placeholders (opcional pero recomendado)

### ✅ Código
- [ ] No hay información sensible en comentarios
- [ ] No hay URLs de producción con credenciales
- [ ] Los mensajes de error no exponen información sensible

---

## 🔐 Mejores Prácticas para Producción

### 1. Variables de Entorno en Producción

En Railway, Vercel, o cualquier plataforma de despliegue:
- Configura todas las variables de entorno en el panel de control
- Nunca uses archivos `.env` en producción
- Usa secretos gestionados por la plataforma

### 2. Rotación de Credenciales

- Rota las API keys periódicamente
- Si una key se compromete, revócala inmediatamente
- Usa diferentes keys para desarrollo y producción

### 3. Monitoreo

- Monitorea logs para detectar intentos de abuso
- Revisa estadísticas de uso regularmente
- Configura alertas para errores inusuales

### 4. Actualizaciones de Dependencias

- Mantén las dependencias actualizadas
- Revisa vulnerabilidades conocidas regularmente
- Usa `npm audit` y `pip check` periódicamente

---

## 🚨 Qué Hacer Si Se Expone una Credencial

1. **Revoca la credencial inmediatamente**
   - Ve a la consola de la API correspondiente
   - Revoca o regenera la key

2. **Elimina del historial de Git** (si ya se hizo commit)
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch serviceAccountKey.json" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Actualiza todas las instancias**
   - Actualiza variables de entorno en producción
   - Notifica al equipo

4. **Revisa logs**
   - Busca uso no autorizado de la credencial
   - Monitorea actividad sospechosa

---

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [React Security Best Practices](https://reactjs.org/docs/faq-internals.html)

---

## ✅ Resumen

ViajeIA implementa múltiples capas de seguridad:
- ✅ Protección de credenciales
- ✅ Autenticación robusta
- ✅ Validación y sanitización
- ✅ Rate limiting
- ✅ Protección contra prompt injection
- ✅ Manejo seguro de errores
- ✅ CORS configurado

**El proyecto está listo para ser compartido en GitHub de forma segura.**

---

**Última actualización:** 2024  
**Autor:** Miguel Alvarez - Magister en Business Intelligence - Universidad EAN

