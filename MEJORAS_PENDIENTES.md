# 🔧 MEJORAS PENDIENTES - ViajeIA

**Fecha:** 2024  
**Estado Actual:** ✅ Seguridad crítica implementada  
**Mejoras Recomendadas:** Prioridad Alta y Media

---

## 🟡 PRIORIDAD ALTA (Implementar pronto)

### 1. ✅ Validación de Email con Regex en Frontend

**Estado:** ⚠️ Solo validación HTML5 básica

**Problema:**
- Los inputs usan `type="email"` que solo valida formato básico del navegador
- No hay validación JavaScript antes de enviar al backend
- Usuarios pueden enviar emails inválidos que pasan la validación HTML5

**Solución:**
```javascript
// Agregar en Login.jsx y Register.jsx
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Usar antes de login/register
if (!validateEmail(email)) {
  setError('Por favor, ingresa un email válido');
  return;
}
```

**Archivos a modificar:**
- `frontend/src/components/Login.jsx`
- `frontend/src/components/Register.jsx`

**Impacto:** Mejora UX y previene errores en Firebase Auth

---

### 2. ✅ Política de Privacidad en Registro

**Estado:** ❌ No implementado

**Problema:**
- Requisito legal no cumplido (GDPR, LFPDPPP)
- No hay checkbox de aceptación de términos
- No hay enlace a política de privacidad

**Solución:**
1. Crear componente `PrivacyPolicy.jsx`
2. Agregar checkbox en `Register.jsx`:
```jsx
<div className="flex items-start gap-2">
  <input
    type="checkbox"
    id="privacy"
    required
    checked={acceptedPrivacy}
    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
    className="mt-1"
  />
  <label htmlFor="privacy" className="text-sm text-slate-600">
    Acepto la{' '}
    <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
      Política de Privacidad
    </a>
  </label>
</div>
```
3. Validar que esté marcado antes de registrar

**Archivos a crear/modificar:**
- `frontend/src/components/PrivacyPolicy.jsx` (nuevo)
- `frontend/src/components/Register.jsx`
- `frontend/src/App.jsx` (agregar ruta)

**Impacto:** Cumplimiento legal y mejor confianza del usuario

---

### 3. ✅ Validación Estricta de Variables de Entorno

**Estado:** ⚠️ Solo warnings, no falla

**Problema:**
- Si `GEMINI_API_KEY` falta, solo muestra warning pero el servidor inicia
- Puede causar errores confusos en producción
- No valida otras variables críticas

**Solución:**
```python
# En main.py, antes de inicializar FastAPI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("❌ ERROR CRÍTICO: GEMINI_API_KEY no encontrada")
    raise ValueError(
        "GEMINI_API_KEY es requerida. "
        "Configúrala en variables de entorno antes de iniciar el servidor."
    )

# Validar otras variables críticas si es necesario
```

**Archivos a modificar:**
- `main.py`

**Impacto:** Falla rápido y claro si falta configuración crítica

---

## 🟢 PRIORIDAD MEDIA (Mejoras recomendadas)

### 4. ✅ Sanitización XSS en Frontend

**Estado:** ⚠️ No implementado

**Problema:**
- Inputs de texto libre (destination, message) pueden contener HTML/JavaScript
- Aunque React escapa por defecto, mejor prevenir

**Solución:**
```bash
npm install dompurify
```

```javascript
import DOMPurify from 'dompurify';

// Sanitizar antes de mostrar
const sanitizedDestination = DOMPurify.sanitize(formData.destination);
```

**Archivos a modificar:**
- `frontend/src/TravelPlanner.jsx`
- `frontend/package.json`

**Impacto:** Protección adicional contra XSS

---

### 5. ✅ Rate Limiting por Usuario Autenticado

**Estado:** ⚠️ Solo por IP

**Problema:**
- Rate limiting actual usa IP, compartido entre usuarios en NAT
- No diferencia entre usuarios autenticados
- Usuarios legítimos pueden verse afectados

**Solución:**
```python
# En main.py
from slowapi.util import get_remote_address

def get_user_id(request: Request):
    """Obtiene UID de Firebase si está autenticado, sino usa IP."""
    # Obtener token de header Authorization
    auth_header = request.headers.get("Authorization")
    if auth_header:
        # Decodificar token Firebase y extraer UID
        # Por ahora, usar IP como fallback
        pass
    return get_remote_address(request)

limiter = Limiter(key_func=get_user_id)

# O usar decorador específico
@app.post("/api/plan")
@limiter.limit("5/minute", key_func=lambda request: get_user_id(request))
```

**Archivos a modificar:**
- `main.py`
- Agregar middleware para extraer Firebase token

**Impacto:** Mejor experiencia para usuarios autenticados

---

### 6. ✅ Manejo de Errores 429 en Frontend

**Estado:** ⚠️ Básico

**Problema:**
- El frontend puede no manejar bien los errores 429
- No muestra mensaje claro al usuario sobre rate limiting

**Solución:**
```javascript
// En TravelPlanner.jsx
if (!apiResponse.ok) {
  if (apiResponse.status === 429) {
    const errorData = await apiResponse.json();
    toast.error(errorData.detail || 'Has alcanzado el límite de consultas. Espera un momento.');
    setError('Has alcanzado el límite de consultas. Por favor, espera un minuto antes de intentar nuevamente.');
    return;
  }
  // ... otros errores
}
```

**Archivos a modificar:**
- `frontend/src/TravelPlanner.jsx`

**Impacto:** Mejor UX cuando se alcanza el rate limit

---

### 7. ✅ Logging de Intentos de Ataque

**Estado:** ⚠️ Básico

**Problema:**
- Los logs de intentos de prompt injection están en consola
- No hay alertas o métricas centralizadas
- Difícil monitorear ataques en producción

**Solución:**
```python
# En main.py, crear función de logging de seguridad
def log_security_event(event_type: str, details: dict, request: Request):
    """Registra eventos de seguridad para monitoreo."""
    logger.warning(
        f"🔒 SECURITY EVENT: {event_type}",
        extra={
            "event_type": event_type,
            "ip": get_remote_address(request),
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
    )
    # Opcional: Enviar a servicio de monitoreo (Sentry, etc.)

# Usar en sanitización
if not is_valid:
    log_security_event(
        "prompt_injection_attempt",
        {"input": text[:100], "pattern_matched": "..."},
        request
    )
```

**Archivos a modificar:**
- `main.py`
- `services/gemini_service.py`

**Impacto:** Mejor monitoreo y detección de ataques

---

### 8. ✅ Tests Automatizados de Seguridad

**Estado:** ⚠️ Script manual existe

**Problema:**
- `test_seguridad.py` es manual
- No está integrado en CI/CD
- No se ejecuta automáticamente

**Solución:**
- Integrar en GitHub Actions o CI/CD
- Ejecutar antes de cada deploy
- Falla el build si las pruebas de seguridad fallan

**Archivos a crear:**
- `.github/workflows/security-tests.yml`

**Impacto:** Detección temprana de problemas de seguridad

---

## 📊 RESUMEN DE PRIORIDADES

| Mejora | Prioridad | Esfuerzo | Impacto | Estado |
|--------|-----------|----------|---------|--------|
| Validación Email Regex | 🟡 Alta | Bajo | Medio | ⚠️ Pendiente |
| Política de Privacidad | 🟡 Alta | Medio | Alto | ❌ Pendiente |
| Validación Variables ENV | 🟡 Alta | Bajo | Medio | ⚠️ Pendiente |
| Sanitización XSS | 🟢 Media | Bajo | Medio | ⚠️ Pendiente |
| Rate Limiting por Usuario | 🟢 Media | Medio | Alto | ⚠️ Pendiente |
| Manejo Error 429 Frontend | 🟢 Media | Bajo | Bajo | ⚠️ Pendiente |
| Logging Seguridad | 🟢 Media | Medio | Medio | ⚠️ Pendiente |
| Tests Automatizados | 🟢 Media | Alto | Alto | ⚠️ Pendiente |

---

## 🎯 RECOMENDACIÓN DE IMPLEMENTACIÓN

### Fase 1 (Esta semana):
1. ✅ Validación de Email con Regex
2. ✅ Política de Privacidad
3. ✅ Validación Estricta de Variables ENV

### Fase 2 (Próximas 2 semanas):
4. ✅ Sanitización XSS
5. ✅ Manejo de Error 429 en Frontend
6. ✅ Logging de Seguridad

### Fase 3 (Futuro):
7. ✅ Rate Limiting por Usuario
8. ✅ Tests Automatizados en CI/CD

---

## 📝 NOTAS

- **Estado Actual:** Las correcciones críticas están implementadas y funcionando
- **Estas mejoras** son complementarias y mejoran la robustez y UX
- **No son bloqueantes** para producción, pero recomendadas
- **Priorizar** según necesidades del negocio y tiempo disponible

---

**Última actualización:** 2024

