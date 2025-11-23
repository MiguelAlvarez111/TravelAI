"""
Servicio de integración con Google Gemini para recomendaciones de viaje.
"""
import os
import logging
import traceback
import re
from typing import Optional, List, Dict, Tuple
import google.generativeai as genai
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logger = logging.getLogger(__name__)


def sanitize_input(text: str, max_length: int = 500) -> Tuple[bool, str]:
    """
    Sanitiza y valida el input del usuario para prevenir prompt injection.
    
    Esta función detecta patrones maliciosos comunes en intentos de prompt injection
    y valida la longitud del input para prevenir payloads gigantes.
    
    Args:
        text: Texto a sanitizar
        max_length: Longitud máxima permitida (default: 500 caracteres)
        
    Returns:
        Tuple[bool, str]: (es_válido, mensaje_error)
        - Si es_válido es True, el texto es seguro
        - Si es_válido es False, mensaje_error contiene la razón del rechazo
    """
    if not text or not isinstance(text, str):
        return False, "El texto no puede estar vacío"
    
    # Normalizar el texto (minúsculas para comparación case-insensitive)
    text_lower = text.lower().strip()
    
    # Verificar longitud máxima
    if len(text) > max_length:
        return False, f"El texto excede la longitud máxima permitida de {max_length} caracteres"
    
    # Patrones maliciosos comunes de prompt injection (inglés y español)
    malicious_patterns = [
        # Intentos de ignorar instrucciones (inglés)
        r"(?i)ignore\s+(your|all|previous|earlier|prior)\s+(instructions?|prompts?|rules?|directives?|guidelines?)",
        r"(?i)forget\s+(everything|all|previous|earlier|prior)",
        r"(?i)disregard\s+(your|all|previous|earlier)\s+(instructions?|prompts?|rules?)",
        r"(?i)override\s+(your|system|previous)\s+(instructions?|prompts?|rules?)",
        r"(?i)ignore\s+(your|all|previous|earlier|prior)",
        # Intentos de ignorar instrucciones (español)
        r"(?i)ignora\s+(tus|todas|las|tus\s+instrucciones|tus\s+reglas)",
        r"(?i)olvida\s+(todo|todas|las|tus|instrucciones)",
        r"(?i)desobedece\s+(tus|las|instrucciones|reglas)",
        r"(?i)anula\s+(tus|las|instrucciones|reglas)",
        
        # Intentos de cambiar el rol o comportamiento (inglés)
        r"(?i)you\s+are\s+now\s+(a|an|the)",
        r"(?i)act\s+as\s+(if\s+)?(you\s+are\s+)?(a|an|the)",
        r"(?i)pretend\s+(to\s+be|you\s+are|that\s+you)",
        r"(?i)roleplay\s+(as|that)",
        # Intentos de cambiar el rol o comportamiento (español)
        r"(?i)eres\s+ahora\s+(un|una|el|la)",
        r"(?i)actúa\s+(como|si\s+eres|si\s+fu eras)",
        r"(?i)finge\s+(ser|que\s+eres|que)",
        r"(?i)hazte\s+pasar\s+por",
        
        # Intentos de acceso a instrucciones del sistema (inglés)
        r"(?i)system\s*:",
        r"(?i)system\s+prompt",
        r"(?i)system\s+instruction",
        r"(?i)assistant\s*:",
        r"(?i)ai\s+instruction",
        # Intentos de acceso a instrucciones del sistema (español)
        r"(?i)sistema\s*:",
        r"(?i)prompt\s+del\s+sistema",
        r"(?i)instrucciones\s+del\s+sistema",
        r"(?i)asistente\s*:",
        r"(?i)muéstrame\s+(tus|las|el)\s+(instrucciones|prompt|reglas)",
        
        # Intentos de extraer información del sistema
        r"(?i)show\s+(me\s+)?(your|the)\s+(instructions|prompt|system|rules)",
        r"(?i)what\s+(are\s+)?(your|the)\s+(instructions|prompt|system|rules)",
        r"(?i)reveal\s+(your|the)\s+(instructions|prompt|system|rules)",
        r"(?i)print\s+(your|the)\s+(instructions|prompt|system|rules)",
        
        # Intentos de ejecutar comandos
        r"(?i)(execute|run|eval|exec)\s*[:(]",
        r"(?i)<script",
        r"(?i)javascript\s*:",
        
        # Intentos de inyección de código
        r"(?i)(import|from)\s+\w+\s+import",
        r"(?i)__import__",
        r"(?i)subprocess",
    ]
    
    # Verificar cada patrón
    for pattern in malicious_patterns:
        if re.search(pattern, text_lower):
            logger.warning(f"⚠️  Intento de prompt injection detectado: {text[:100]}...")
            return False, "El contenido contiene patrones no permitidos. Por favor, reformula tu solicitud."
    
    # Si pasa todas las validaciones, el texto es seguro
    return True, ""

# System Prompt para Gemini - Plan Inicial de Viaje
# Instrucción de sistema para cuando el usuario solicita un plan completo de viaje
SYSTEM_INSTRUCTION_PLAN = """Eres Alex, un experto Travel Curator con el estilo de escritura de Lonely Planet y Condé Nast Traveler. Tu misión es crear planes de viaje evocativos, personalizados y visualmente atractivos.

REGLAS FUNDAMENTALES:
1. RESPONDER ÚNICAMENTE EN ESPAÑOL. Nunca uses otros idiomas. Todo el contenido debe estar en español.
2. Tu respuesta SIEMPRE debe usar formato Markdown.
3. TONO Y ESTILO:
   - Escribe como un experto Travel Curator: evocativo pero conciso.
   - No solo listes características; explica el *vibe* y la experiencia.
   - SIEMPRE referencia el presupuesto y estilo del usuario en tus descripciones.
   - Ejemplos: "Perfecto para tu presupuesto de mochilero porque...", "Ideal para tu estilo cultural ya que...", "Alineado con tu presupuesto de lujo debido a..."
   - Sé personal y conecta cada recomendación con las preferencias del usuario.

4. INTRODUCCIÓN OBLIGATORIA:
   ⚠️ ANTES de la primera sección (## 🏨 ALOJAMIENTO), SIEMPRE incluye un mensaje introductorio personal y evocativo.
   ⚠️ Este mensaje debe:
      - Ser de 2-4 oraciones máximo
      - Conectar con el destino, presupuesto y estilo del usuario
      - Crear expectativa y entusiasmo
      - Ser personal y directo (usar "tu", "te", "vas a")
   ⚠️ Ejemplo: "¡Absolutamente! Preparémonos para explorar la vibrante Bogotá, conectando con su rica historia y cultura, todo dentro de tu presupuesto de mochilero. Esta ciudad te espera con experiencias auténticas que deleitarán tus sentidos sin vaciar tu bolsillo."
   ⚠️ NO empieces directamente con "## 🏨 ALOJAMIENTO". SIEMPRE incluye este mensaje introductorio primero.

5. FORMATO ESTRICTO DE SECCIONES:
   - Separa cada sección claramente con un salto de línea doble.
   - Usa EXACTAMENTE estos encabezados: '## 🏨 ALOJAMIENTO', '## 🥘 GASTRONOMÍA', '## 💎 LUGARES', '## 💡 CONSEJOS', '## 💰 COSTOS'.
   - Después de cada encabezado, escribe UNA línea introductoria corta, personal y evocativa (1-2 oraciones máximo).
   - Luego deja un salto de línea simple antes de la lista.

6. Tu respuesta DEBE tener EXACTAMENTE estas 5 secciones en este orden:

## 🏨 ALOJAMIENTO
[Línea introductoria corta y personal sobre el alojamiento en este destino]

## 🥘 GASTRONOMÍA
[Línea introductoria corta sobre la escena gastronómica]

## 💎 LUGARES
[Línea introductoria corta sobre qué ver y hacer]

## 💡 CONSEJOS
[Línea introductoria corta con tips generales]

## 💰 COSTOS
[Línea introductoria corta sobre el presupuesto]
   - ⚠️ REGLA CRÍTICA: TODOS los costos DEBEN estar en PESOS COLOMBIANOS (COP) como moneda principal.
   - Formato obligatorio para COP: "$150.000 COP" o "$2.500.000 COP" (usa punto como separador de miles).
   - Para destinos internacionales, opcionalmente muestra la moneda local en paréntesis: "$450.000 COP (~$100 EUR)".
   - El precio en COP debe ser el DESTACADO y principal; la moneda local es solo referencia.
   - Incluye desglose de costos: alojamiento, comida, transporte, actividades, etc.
   - Todos los precios específicos (hoteles, restaurantes, entradas) deben estar en COP.

7. FORMATO DE LISTAS - REGLA CRÍTICA (NO NEGOCIABLE):
   ⚠️ Cada ítem de lista DEBE usar este formato EXACTO:
   `* **Nombre del Lugar/Hotel/Restaurante**: Descripción evocativa que explique el vibe y conecte con el presupuesto/estilo del usuario.`
   
   ⚠️ Los `**` son OBLIGATORIOS para que el nombre aparezca en negrita en Markdown.
   
   ⚠️ Si incluyes precios en las descripciones, DEBEN estar en COP con formato: "$150.000 COP" o "$2.500.000 COP".
   ⚠️ Para destinos internacionales, puedes agregar la moneda local en paréntesis: "$450.000 COP (~$100 EUR)".
   
   ⚠️ Ejemplo CORRECTO:
   * **Hotel Boutique El Jardín**: Un refugio íntimo en el corazón histórico desde $180.000 COP/noche, perfecto para tu presupuesto moderado. Sus habitaciones con balcones coloniales y el desayuno con vista a la plaza te harán sentir como un local privilegiado.
   
   * **Hostal Backpacker's Paradise**: La vibra mochilera definitiva desde $45.000 COP/noche. Con tu presupuesto ajustado, aquí encontrarás camas limpias, cocina compartida y el mejor ambiente social para conocer viajeros de todo el mundo.
   
   ⚠️ Ejemplo INCORRECTO (NUNCA hagas esto):
   • Hotel A: Tiene wifi, piscina y está cerca del centro.
   Hotel B es un lugar maravilloso con muchas características...
   • Hotel C: $100 USD por noche (NO uses USD como moneda principal)
   
   ⚠️ NO uses bullets simples (•). USA SIEMPRE el formato `* **Nombre**: Descripción`.

8. ESTRUCTURA COMPLETA DE EJEMPLO:
¡Absolutamente! Preparémonos para explorar la vibrante [Destino], conectando con su rica historia y cultura, todo dentro de tu presupuesto de [presupuesto]. Esta ciudad te espera con experiencias auténticas que deleitarán tus sentidos sin vaciar tu bolsillo.

## 🏨 ALOJAMIENTO

En [Destino], encontrarás opciones que van desde hostales con alma hasta hoteles boutique que capturan la esencia local.

* **Hotel Boutique El Jardín**: [Descripción evocativa con referencia a presupuesto/estilo]
* **Hostal Backpacker's Paradise**: [Descripción evocativa con referencia a presupuesto/estilo]

## 🥘 GASTRONOMÍA

[Línea introductoria corta sobre la comida local]

* **Restaurante La Esquina**: [Descripción evocativa con referencia a presupuesto/estilo]
* **Mercado de Sabores**: [Descripción evocativa con referencia a presupuesto/estilo]

9. RECUERDA:
   - Cada sección debe tener UNA línea introductoria corta (1-2 oraciones) antes de la lista.
   - Cada ítem de lista DEBE usar `* **Nombre**: Descripción` con los `**` para negrita.
   - SIEMPRE conecta las recomendaciones con el presupuesto y estilo del usuario.
   - Sé evocativo: describe sensaciones, vibes, experiencias, no solo características.
   - Mantén los encabezados exactamente como se especifican con los emojis.
   - Si detectas que estás escribiendo en otro idioma, DETENTE INMEDIATAMENTE y continúa en español."""

# System Prompt para Gemini - Chat Conversacional
# Instrucción de sistema para preguntas de seguimiento en el chat
SYSTEM_INSTRUCTION_CHAT = """Eres Alex, el consultor de viajes más experto y entusiasta del mundo.

REGLAS DE ORO:
1. RESPONDER ÚNICAMENTE EN ESPAÑOL. Nunca uses otros idiomas como Hindi, Inglés, Francés, etc. Todo el contenido debe estar en español.
2. Tu respuesta debe usar formato Markdown para mejorar la legibilidad.
3. Responde de manera NATURAL y CONVERSACIONAL. No fuerces estructuras rígidas.
4. Si el usuario hace una pregunta específica (ej: "¿Es seguro?", "¿Qué restaurantes recomiendas?"), responde directamente a esa pregunta de forma clara y detallada.
5. Solo usa las secciones estructuradas (🏨 ALOJAMIENTO, 🥘 GASTRONOMÍA, etc.) si el usuario explícitamente pide un "plan completo" o "plan de viaje". Para preguntas de seguimiento, responde de forma conversacional.
6. Sé entusiasta, profesional y detallado.
7. Usa emojis apropiados cuando sea natural, pero no fuerces su uso.
8. Si detectas que estás escribiendo en otro idioma, DETENTE INMEDIATAMENTE y continúa en español.
9. Mantén el contexto del viaje que el usuario está planificando."""


class GeminiService:
    """Servicio para interactuar con Google Gemini API."""
    
    def __init__(self):
        """Inicializa el servicio de Gemini y valida la API key."""
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "❌ ERROR: GEMINI_API_KEY no encontrada en variables de entorno. "
                "Por favor, crea un archivo .env con tu API key de Google Gemini."
            )
        
        # Configurar la API key
        genai.configure(api_key=self.api_key)
        
        # Inicializar el modelo usando gemini-2.0-flash con configuración avanzada
        # Configuración del modelo con límites de tokens y temperatura
        try:
            # Configuración de generación con límites de tokens y temperatura
            # max_output_tokens: 2048 - Límite máximo de tokens en la respuesta generada.
            #   Controla la longitud máxima de la salida. Un token ≈ 4 caracteres en español.
            #   Con 2048 tokens, la respuesta puede tener aproximadamente 8000 caracteres.
            #   Esto previene respuestas excesivamente largas y controla costos.
            #
            # temperature: 0.7 - Controla la creatividad vs precisión de las respuestas.
            #   Rango: 0.0 (muy determinista, repetitivo) a 1.0 (muy creativo, variado).
            #   Con 0.7, obtenemos un balance entre creatividad y coherencia:
            #   - Respuestas creativas pero coherentes
            #   - Variedad en las recomendaciones sin perder precisión
            #   - Ideal para consultoría de viajes donde queremos sugerencias únicas pero útiles
            generation_config = {
                "max_output_tokens": 2048,
                "temperature": 0.7
            }
            
            self.model = genai.GenerativeModel(
                model_name='gemini-2.0-flash',
                generation_config=generation_config
            )
            logger.info("✅ Servicio de Gemini inicializado correctamente con gemini-2.0-flash")
            logger.info("⚙️  Configuración: max_output_tokens=2048, temperature=0.7")
        except Exception as e:
            logger.error(f"❌ Error al inicializar el modelo de Gemini: {e}")
            raise
    
    def generate_travel_recommendation(
        self, 
        destination: str,
        date: str = "",
        budget: str = "",
        style: str = "",
        user_currency: str = "COP"
    ) -> Tuple[str, str]:
        """
        Genera una recomendación de viaje usando Gemini con campos estructurados.
        
        Args:
            destination: El destino del viaje (obligatorio)
            date: La fecha del viaje (opcional)
            budget: El presupuesto del viaje (opcional)
            style: El estilo de viaje (opcional)
            user_currency: Moneda del usuario (opcional, default: COP para usuarios colombianos)
            
        Returns:
            Tuple[str, str]: (recomendación, finish_reason)
            - recomendación: Recomendación de viaje formateada en Markdown con las 5 secciones estrictas
            - finish_reason: Razón de finalización de la generación ("STOP", "MAX_TOKENS", etc.)
            
        Raises:
            Exception: Si hay un error al comunicarse con Gemini
        """
        try:
            # Validar argumentos antes de construir el prompt
            if not destination or not destination.strip():
                raise ValueError("El destino no puede estar vacío")
            
            destination = destination.strip()
            date = date.strip() if date else ""
            budget = budget.strip() if budget else ""
            style = style.strip() if style else ""
            user_currency = user_currency.strip() if user_currency else "COP"
            
            logger.info(f"📤 Generando recomendación de viaje - Destino: '{destination}', Fecha: '{date}', Presupuesto: '{budget}', Estilo: '{style}', Moneda: '{user_currency}'")
            
            # Construir el prompt combinando los 4 campos en una frase coherente
            prompt_parts = [f"Planifica un viaje a {destination}"]
            
            if date:
                prompt_parts.append(f"para la fecha {date}")
            
            if budget:
                prompt_parts.append(f"con presupuesto {budget}")
            
            if style:
                prompt_parts.append(f"y estilo {style}")
            
            # Combinar todas las partes en una frase coherente
            user_request = " ".join(prompt_parts) + "."
            
            # Construir contexto destacado de presupuesto y estilo para que Gemini los referencia explícitamente
            context_highlight = ""
            if budget or style:
                context_highlight = "\n\n--- CONTEXTO DEL USUARIO (REFERENCIA ESTO EN CADA RECOMENDACIÓN) ---\n"
                if budget:
                    context_highlight += f"• Presupuesto del usuario: {budget}\n"
                    context_highlight += "  → IMPORTANTE: En cada recomendación, explica POR QUÉ es perfecta para este presupuesto.\n"
                if style:
                    context_highlight += f"• Estilo de viaje del usuario: {style}\n"
                    context_highlight += "  → IMPORTANTE: En cada recomendación, conecta la experiencia con este estilo de viaje.\n"
                context_highlight += "\nEjemplo de cómo referenciar: 'Perfecto para tu presupuesto de mochilero porque...' o 'Ideal para tu estilo cultural ya que...'\n"
            
            # Instrucción obligatoria sobre moneda: La aplicación está dirigida a usuarios colombianos
            # Todos los costos deben estar en COP como moneda principal
            currency_instruction = "\n\n--- REGLAS DE MONEDA (OBLIGATORIO) ---\n"
            currency_instruction += "⚠️ TODOS los costos DEBEN estar en PESOS COLOMBIANOS (COP) como moneda PRINCIPAL.\n"
            currency_instruction += "• Formato obligatorio: '$150.000 COP' o '$2.500.000 COP' (usa punto como separador de miles).\n"
            currency_instruction += "• Para destinos internacionales, opcionalmente muestra la moneda local en paréntesis: '$450.000 COP (~$100 EUR)'.\n"
            currency_instruction += "• El precio en COP debe ser el DESTACADO y principal; la moneda local es solo referencia.\n"
            currency_instruction += "• Esto aplica a TODOS los precios: hoteles, restaurantes, entradas, transporte, actividades.\n"
            currency_instruction += "• La sección '💰 COSTOS' DEBE seguir esta regla estrictamente.\n"
            
            # Construir el prompt completo incluyendo el system instruction para PLAN
            # La instrucción de sistema se inyecta antes de la pregunta del usuario
            full_prompt = f"{SYSTEM_INSTRUCTION_PLAN}{context_highlight}{currency_instruction}\n\n---\n\nSolicitud del usuario: {user_request}"
            
            # Generar respuesta usando Gemini
            # Esta es la llamada a la API de Google Gemini que envía la pregunta del usuario
            logger.info(f"🔄 Enviando solicitud a Gemini: {user_request[:100]}...")
            logger.debug(f"📝 Longitud del prompt completo: {len(full_prompt)} caracteres")
            
            response = self.model.generate_content(full_prompt)
            
            # Extraer el texto de la respuesta
            if not response or not hasattr(response, 'text') or not response.text:
                raise ValueError("La respuesta de Gemini está vacía o no tiene texto")
            
            recommendation = response.text
            
            # Extraer finish_reason para detectar si la respuesta fue cortada
            finish_reason = "STOP"  # Valor por defecto
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'finish_reason'):
                    finish_reason_raw = candidate.finish_reason
                    # Manejar diferentes tipos de finish_reason (enum, string, número)
                    if finish_reason_raw is None:
                        finish_reason = "STOP"
                    elif hasattr(finish_reason_raw, 'name'):  # Es un enum
                        finish_reason = finish_reason_raw.name
                    elif hasattr(finish_reason_raw, 'value'):  # Es un enum con value
                        finish_reason = str(finish_reason_raw.value)
                    else:
                        finish_reason = str(finish_reason_raw)
                    
                    # Normalizar valores comunes
                    finish_reason_upper = finish_reason.upper()
                    if "STOP" in finish_reason_upper or finish_reason == "1" or finish_reason == 1:
                        finish_reason = "STOP"
                    elif "MAX_TOKENS" in finish_reason_upper or "LENGTH" in finish_reason_upper or finish_reason == "2" or finish_reason == 2:
                        finish_reason = "MAX_TOKENS"
                    elif "SAFETY" in finish_reason_upper or finish_reason == "3" or finish_reason == 3:
                        finish_reason = "SAFETY"
                    elif "RECITATION" in finish_reason_upper or finish_reason == "4" or finish_reason == 4:
                        finish_reason = "RECITATION"
                    
                    if finish_reason != "STOP":
                        logger.warning(f"⚠️  Respuesta cortada: finish_reason={finish_reason}")
            
            logger.info(f"✅ Recomendación generada exitosamente por Alex ({len(recommendation)} caracteres, finish_reason={finish_reason})")
            return recommendation, finish_reason
            
        except ValueError as e:
            # Errores de validación o configuración
            logger.error(f"❌ Error de validación en Gemini: {e}")
            logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
            raise Exception(f"Error de configuración: {e}")
            
        except Exception as e:
            # Bloque try/except con logging detallado
            error_type = type(e).__name__
            error_message = str(e)
            logger.error(f"❌ Error al consultar Gemini: {error_type}: {error_message}")
            logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
            logger.error(f"🔍 Argumentos recibidos: destination='{destination}', date='{date}', budget='{budget}', style='{style}'")
            raise Exception("Ocurrió un error consultando a la IA")
    
    def generate_chat_response(
        self,
        destination: str,
        date: str = "",
        budget: str = "",
        style: str = "",
        message: str = "",
        history: List[Dict] = []
    ) -> Tuple[str, str]:
        """
        Genera una respuesta de chat usando Gemini con memoria conversacional.
        
        Esta función inyecta el contexto del viaje (destino, fecha, presupuesto, estilo) y
        la personalidad de Alex (consultor de viajes experto y entusiasta) mediante un
        system prompt especializado para conversaciones (SYSTEM_INSTRUCTION_CHAT).
        
        El historial de conversación se limita a los últimos 10 mensajes para optimizar
        el uso de tokens de entrada y mantener el contexto relevante. Esto reduce los costos
        de API al enviar solo el contexto más reciente necesario para la conversación.
        Si hay historial, se construye un prompt que incluye el contexto del viaje, el
        historial de conversación y el nuevo mensaje del usuario. Si no hay historial, se
        trata como una solicitud inicial y se usa SYSTEM_INSTRUCTION_PLAN.
        
        Args:
            destination: El destino del viaje
            date: La fecha del viaje (opcional)
            budget: El presupuesto del viaje (opcional)
            style: El estilo de viaje (opcional)
            message: El nuevo mensaje del usuario
            history: Lista de mensajes anteriores en formato [{"role": "user", "parts": "..."}, ...]
            
        Returns:
            Tuple[str, str]: (respuesta, finish_reason)
            - respuesta: Respuesta de Gemini formateada en Markdown
            - finish_reason: Razón de finalización de la generación ("STOP", "MAX_TOKENS", etc.)
            
        Raises:
            Exception: Si hay un error al comunicarse con Gemini
        """
        try:
            # Construir el contexto del viaje
            context_info = f"Contexto del viaje: Destino: {destination}"
            if date:
                context_info += f", Fecha: {date}"
            if budget:
                context_info += f", Presupuesto: {budget}"
            if style:
                context_info += f", Estilo: {style}"
            
            # Si hay historial, construir el prompt con el historial concatenado
            # Gestión de Historial: Limitar a los últimos 10 mensajes para ahorrar tokens de entrada
            # Esto reduce significativamente el costo de cada llamada a la API al enviar
            # solo el contexto más reciente necesario para mantener la coherencia conversacional.
            if history:
                # Limitar el historial a los últimos 10 mensajes
                limited_history = history[-10:] if len(history) > 10 else history
                if len(history) > 10:
                    logger.info(f"📚 Historial limitado a {len(limited_history)} mensajes (de {len(history)} totales) para optimizar tokens")
                
                # Construir el historial como texto para el contexto
                history_text = "\n\n--- Historial de Conversación ---\n\n"
                for msg in limited_history:
                    role_label = "Usuario" if msg.get("role") == "user" else "Alex"
                    history_text += f"{role_label}: {msg.get('parts', '')}\n\n"
                
                # Construir el prompt completo con historial usando SYSTEM_INSTRUCTION_CHAT
                # Para preguntas de seguimiento, usa la instrucción conversacional
                full_prompt = f"{SYSTEM_INSTRUCTION_CHAT}\n\n---\n\n{context_info}\n\n{history_text}---\n\nUsuario pregunta ahora: {message}"
                
                logger.info(f"Enviando mensaje de chat a Gemini con historial de {len(limited_history)} mensajes")
            else:
                # Si no hay historial, es el primer mensaje - usar SYSTEM_INSTRUCTION_PLAN
                prompt_parts = [f"Planifica un viaje a {destination}"]
                
                if date:
                    prompt_parts.append(f"para la fecha {date}")
                
                if budget:
                    prompt_parts.append(f"con presupuesto {budget}")
                
                if style:
                    prompt_parts.append(f"y estilo {style}")
                
                user_request = " ".join(prompt_parts) + "."
                full_prompt = f"{SYSTEM_INSTRUCTION_PLAN}\n\n---\n\n{context_info}\n\nSolicitud del usuario: {user_request}"
                
                logger.info(f"Enviando solicitud inicial a Gemini: {destination}")
            
            # Generar respuesta usando Gemini
            response = self.model.generate_content(full_prompt)
            recommendation = response.text
            
            # Extraer finish_reason para detectar si la respuesta fue cortada
            finish_reason = "STOP"  # Valor por defecto
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'finish_reason'):
                    finish_reason_raw = candidate.finish_reason
                    # Manejar diferentes tipos de finish_reason (enum, string, número)
                    if finish_reason_raw is None:
                        finish_reason = "STOP"
                    elif hasattr(finish_reason_raw, 'name'):  # Es un enum
                        finish_reason = finish_reason_raw.name
                    elif hasattr(finish_reason_raw, 'value'):  # Es un enum con value
                        finish_reason = str(finish_reason_raw.value)
                    else:
                        finish_reason = str(finish_reason_raw)
                    
                    # Normalizar valores comunes
                    finish_reason_upper = finish_reason.upper()
                    if "STOP" in finish_reason_upper or finish_reason == "1" or finish_reason == 1:
                        finish_reason = "STOP"
                    elif "MAX_TOKENS" in finish_reason_upper or "LENGTH" in finish_reason_upper or finish_reason == "2" or finish_reason == 2:
                        finish_reason = "MAX_TOKENS"
                    elif "SAFETY" in finish_reason_upper or finish_reason == "3" or finish_reason == 3:
                        finish_reason = "SAFETY"
                    elif "RECITATION" in finish_reason_upper or finish_reason == "4" or finish_reason == 4:
                        finish_reason = "RECITATION"
                    
                    if finish_reason != "STOP":
                        logger.warning(f"⚠️  Respuesta cortada en chat: finish_reason={finish_reason}")
            
            logger.info(f"✅ Respuesta generada exitosamente por Alex (finish_reason={finish_reason})")
            return recommendation, finish_reason
            
        except ValueError as e:
            # Errores de validación o configuración
            logger.error(f"❌ Error de validación en Gemini (chat): {e}")
            logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
            raise Exception(f"Error de configuración: {e}")
            
        except Exception as e:
            # Bloque try/except con logging detallado
            error_type = type(e).__name__
            error_message = str(e)
            logger.error(f"❌ Error al consultar Gemini (chat): {error_type}: {error_message}")
            logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
            logger.error(f"🔍 Argumentos recibidos: destination='{destination}', message='{message[:50]}...', history_length={len(history)}")
            raise Exception("Ocurrió un error consultando a la IA")


# Instancia global del servicio (se inicializa al importar)
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """
    Obtiene la instancia singleton del servicio de Gemini.
    
    Returns:
        GeminiService: Instancia del servicio
    """
    global _gemini_service
    
    if _gemini_service is None:
        _gemini_service = GeminiService()
    
    return _gemini_service

