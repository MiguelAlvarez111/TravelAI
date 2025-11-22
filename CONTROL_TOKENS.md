# Control de Tokens y Configuración Avanzada de Gemini

## ¿Qué son los Tokens?

Los **tokens** son unidades de procesamiento que utilizan los modelos de lenguaje como Google Gemini para entender y generar texto. Un token no es exactamente igual a una palabra o un carácter, sino que representa una porción de texto que el modelo puede procesar de manera eficiente.

### Conversión Aproximada
- **1 token** ≈ **4 caracteres** en español
- **1 token** ≈ **0.75 palabras** en español
- Ejemplo: "Planifica un viaje a París" ≈ 6-7 tokens

### Importancia de los Tokens
Los tokens son importantes porque:
1. **Costo**: Las APIs de IA cobran por tokens procesados (entrada y salida)
2. **Límites**: Cada modelo tiene límites máximos de tokens
3. **Rendimiento**: Más tokens = más tiempo de procesamiento y mayor costo

---

## Límites de Tokens en Gemini

### Límite de Entrada (Contexto)
El **límite de entrada** se refiere a la cantidad máxima de tokens que puedes enviar a la API en una sola solicitud. Esto incluye:
- El prompt del sistema (instrucciones)
- El historial de conversación
- El mensaje actual del usuario

**En ViajeIA:**
- Limitamos el historial a los **últimos 10 mensajes** para optimizar el uso de tokens de entrada
- Esto reduce significativamente el costo de cada llamada a la API
- Mantenemos solo el contexto más reciente necesario para la coherencia conversacional

### Límite de Salida (Generación)
El **límite de salida** controla la cantidad máxima de tokens que el modelo puede generar en su respuesta.

**En ViajeIA:**
- Configuramos `max_output_tokens: 2048`
- Esto permite respuestas de aproximadamente **8000 caracteres** (≈ 2000 palabras)
- Previene respuestas excesivamente largas y controla costos

---

## ¿Por qué Limitamos el Historial?

### Razones Técnicas

1. **Optimización de Costos**
   - Cada token enviado en el historial tiene un costo
   - Un historial largo puede duplicar o triplicar el costo de una llamada
   - Con 10 mensajes, mantenemos el contexto relevante sin excesos

2. **Rendimiento**
   - Menos tokens = respuesta más rápida
   - El modelo procesa más eficientemente contextos más cortos

3. **Límites de la API**
   - Gemini tiene límites máximos de tokens por solicitud
   - Un historial muy largo podría exceder estos límites

### Razones de Diseño

1. **Relevancia del Contexto**
   - Los mensajes más recientes son más relevantes para la conversación actual
   - Mensajes antiguos pueden ser menos útiles o incluso confusos

2. **Experiencia del Usuario**
   - Mantener solo el contexto necesario hace que las respuestas sean más precisas
   - Evita que el modelo se "distraiga" con información muy antigua

---

## Configuración de Temperature

### ¿Qué es Temperature?

La **temperature** es un parámetro que controla la creatividad vs precisión de las respuestas del modelo:

- **Rango**: 0.0 a 1.0 (o más en algunos modelos)
- **0.0**: Muy determinista, repetitivo, predecible
- **1.0**: Muy creativo, variado, impredecible

### Configuración en ViajeIA

**Temperature: 0.7**

Este valor proporciona un balance óptimo para consultoría de viajes:

✅ **Ventajas:**
- Respuestas creativas pero coherentes
- Variedad en las recomendaciones sin perder precisión
- Sugerencias únicas pero útiles
- Evita respuestas demasiado genéricas o repetitivas

❌ **Si fuera más bajo (0.3-0.5):**
- Respuestas muy similares entre usuarios
- Menos creatividad en las recomendaciones
- Puede parecer robótico

❌ **Si fuera más alto (0.9-1.0):**
- Respuestas muy variadas pero menos coherentes
- Puede generar información inconsistente
- Menos confiable para planificación de viajes

---

## Detección de Respuestas Cortadas

### ¿Qué es finish_reason?

El `finish_reason` indica por qué terminó la generación de la respuesta:

- **STOP**: La respuesta se completó normalmente
- **MAX_TOKENS**: La respuesta alcanzó el límite de tokens de salida
- **SAFETY**: La respuesta fue bloqueada por filtros de seguridad
- **RECITATION**: La respuesta fue bloqueada por recitación (contenido duplicado)

### Implementación en ViajeIA

Cuando la respuesta es cortada (`finish_reason != "STOP"`):
- El frontend muestra un **toast amarillo** de advertencia
- Mensaje: "Nota: La respuesta fue cortada por límite de longitud."
- Esto informa al usuario que la respuesta puede estar incompleta

---

## Resumen de Configuración

| Parámetro | Valor | Propósito |
|-----------|-------|-----------|
| `max_output_tokens` | 2048 | Limitar longitud de respuestas (~8000 caracteres) |
| `temperature` | 0.7 | Balance creatividad/precisión |
| Historial máximo | 10 mensajes | Optimizar tokens de entrada y costos |

---

## Mejores Prácticas

1. **Monitorear el uso de tokens**
   - Revisar logs del backend para ver cuántos tokens se están usando
   - Ajustar límites si es necesario

2. **Optimizar prompts**
   - Mantener instrucciones del sistema concisas pero completas
   - Evitar redundancias en el historial

3. **Balancear costo y calidad**
   - Más tokens = mejor contexto pero mayor costo
   - Menos tokens = menor costo pero posible pérdida de contexto
   - En ViajeIA, 10 mensajes es un buen balance

---

## Referencias

- [Documentación de Google Gemini API](https://ai.google.dev/docs)
- [Guía de Tokens en Modelos de Lenguaje](https://platform.openai.com/tokenizer) (concepto similar aplica a Gemini)

---

**Última actualización**: Implementado como parte del control avanzado de tokens y configuración de Gemini para el taller universitario.

