# 📊 REPORTE DE BRECHA (GAP ANALYSIS) - FASE 2: ESPECIALIZACIÓN

**Fecha del Análisis:** Análisis realizado como Auditor de Calidad de Software (QA Lead)

**Objetivo:** Comparar el código actual (`TravelPlanner.jsx` y `main.py` + `gemini_service.py`) contra los requerimientos de la **Fase 2: Especialización**.

---

## ✅ LO QUE YA TENEMOS IMPLEMENTADO

### **Infraestructura y Conexiones**
- ✅ **Conexión con Google Gemini API** completamente funcional (`gemini_service.py`)
- ✅ **Backend FastAPI** operativo con endpoint `/api/plan` (`main.py`)
- ✅ **Frontend React** con Vite y Tailwind CSS configurados
- ✅ **Integración frontend-backend** funcionando correctamente
- ✅ **CORS configurado** para permitir comunicación entre frontend y backend
- ✅ **Manejo de errores básico** en ambos extremos
- ✅ **Visualización de respuestas** con ReactMarkdown para renderizar contenido formateado
- ✅ **UI moderna y responsive** con estilos profesionales (Tailwind CSS)

### **Funcionalidad Básica**
- ✅ **Textarea para entrada de datos** del usuario
- ✅ **Validación básica** (no permite enviar consultas vacías)
- ✅ **Estados de loading** mientras se procesa la solicitud
- ✅ **System prompt básico** en Gemini para dar contexto al modelo

---

## ❌ LO QUE FALTA IMPLEMENTAR

### **1. UI (Frontend) - Formulario Estructurado** ❌ **CRÍTICO**

**Requerimiento:** El formulario debe tener campos separados y específicos.

**Estado Actual:**
- ❌ Solo existe un **textarea genérico** que captura todo en un solo campo
- ❌ No hay campo específico para **"Destino"** (texto)
- ❌ No existe selector/campo para **"Fechas"** (selector de fecha o texto)
- ❌ No existe selector/campo para **"Presupuesto"** (selector o texto)
- ❌ No existe selector para **"Estilo de viaje"** (Aventura, Relajación, Cultura)

**Impacto:** La interfaz actual no cumple con los requerimientos de la Fase 2. El usuario debe poder ingresar estos datos de forma estructurada.

---

### **2. Personalidad del Sistema (Backend)** ❌ **IMPORTANTE**

**Requerimiento:** El sistema debe presentarse como "Alex".

**Estado Actual:**
- ❌ El system prompt actual (`SYSTEM_INSTRUCTION` en `gemini_service.py`) dice:
  ```
  "Eres un experto agente de viajes. Tus respuestas son breves, emocionantes y usan emojis."
  ```
- ❌ **NO menciona "Alex"** como identidad del asistente
- ❌ **NO presenta** al sistema con una personalidad específica llamada "Alex"

**Impacto:** Las respuestas del sistema no tienen una identidad consistente y personalizada.

**Ubicación:** `services/gemini_service.py` línea 18

---

### **3. Estructura de Salida (Backend)** ❌ **CRÍTICO**

**Requerimiento:** La respuesta debe tener secciones estrictas: **Alojamiento, Comida, Lugares, Consejos, Costos**.

**Estado Actual:**
- ❌ El system prompt solo pide "Estructura la respuesta con listas para que sea fácil de leer"
- ❌ **NO especifica** las secciones obligatorias:
  - ❌ Alojamiento
  - ❌ Comida
  - ❌ Lugares
  - ❌ Consejos
  - ❌ Costos
- ❌ **NO garantiza** que estas secciones aparezcan en cada respuesta

**Impacto:** Las respuestas no tienen una estructura predecible ni estandarizada, lo que dificulta la experiencia del usuario.

**Ubicación:** `services/gemini_service.py` línea 18

---

### **4. Envío de Datos Estructurados (Frontend → Backend)** ❌ **CRÍTICO**

**Requerimiento:** El frontend debe enviar los campos del formulario al backend de forma estructurada.

**Estado Actual:**
- ❌ El frontend solo envía `query` (string genérico) y `preferences: null`
- ❌ No existe lógica para **capturar y enviar**:
  - Destino
  - Fechas
  - Presupuesto
  - Estilo de viaje

**Impacto:** Incluso si se crea el formulario, los datos no se están enviando correctamente al backend.

**Ubicación:** `frontend/src/TravelPlanner.jsx` líneas 48-57

---

## 🔧 RECOMENDACIONES TÉCNICAS

### **Archivos que Necesitan Modificación:**

#### **1. Frontend - TravelPlanner.jsx** 🔴 **PRIORIDAD ALTA**
- **Agregar estados** para: `destino`, `fechas`, `presupuesto`, `estiloViaje`
- **Crear campos de formulario** separados con labels apropiados
- **Modificar `handlePlanificar`** para enviar los campos estructurados al backend
- **Actualizar el payload** de la petición POST a `/api/plan` para incluir todos los campos

#### **2. Backend - main.py** 🟡 **PRIORIDAD MEDIA**
- **Actualizar modelo `TravelRequest`** para aceptar los nuevos campos (destino, fechas, presupuesto, estilo_viaje)
- **Modificar endpoint `/api/plan`** para recibir y procesar estos campos estructurados
- **Pasar los campos individuales** al servicio de Gemini en lugar de solo un `query` genérico

#### **3. Backend - services/gemini_service.py** 🔴 **PRIORIDAD ALTA**
- **Modificar `SYSTEM_INSTRUCTION`** para:
  - Presentar el sistema como **"Alex"**
  - Especificar que la respuesta **DEBE incluir** las secciones estrictas: Alojamiento, Comida, Lugares, Consejos, Costos
- **Actualizar `generate_travel_recommendation`** para:
  - Construir el prompt usando los campos estructurados (destino, fechas, presupuesto, estilo de viaje)
  - Enfatizar en el prompt que la respuesta debe tener las 5 secciones obligatorias

---

## 📋 RESUMEN EJECUTIVO

| Componente | Estado Actual | Estado Requerido | Brecha |
|------------|---------------|------------------|--------|
| **Formulario UI** | ❌ Textarea único | ✅ Campos separados | **CRÍTICA** |
| **Personalidad "Alex"** | ❌ No implementado | ✅ Implementado | **IMPORTANTE** |
| **Secciones de salida** | ❌ No estructurado | ✅ 5 secciones estrictas | **CRÍTICA** |
| **Envío de datos** | ❌ Solo query genérica | ✅ Campos estructurados | **CRÍTICA** |

**Nivel de Cumplimiento:** ~30% de los requerimientos de Fase 2

**Prioridad de Implementación:**
1. 🔴 **CRÍTICO:** Formulario estructurado en frontend + Envío de datos estructurados
2. 🔴 **CRÍTICO:** Actualizar system prompt con secciones estrictas y personalidad "Alex"
3. 🟡 **IMPORTANTE:** Actualizar modelos y endpoints del backend para recibir campos estructurados

---

## ✅ CONCLUSIÓN

El proyecto tiene una **base sólida** con la infraestructura funcionando correctamente (conexión Gemini, FastAPI, React). Sin embargo, **falta implementar la especialización de la Fase 2**:

- El formulario actual es demasiado genérico
- El sistema no se presenta como "Alex"
- Las respuestas no tienen una estructura estandarizada con las 5 secciones requeridas

**Tiempo estimado de implementación:** 4-6 horas de desarrollo + pruebas

---

**Generado por:** Auditor de Calidad de Software (QA Lead)
