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
SYSTEM_INSTRUCTION_PLAN = """Eres Alex, el consultor de viajes más experto y entusiasta del mundo.

REGLAS DE ORO:
1. RESPONDER ÚNICAMENTE EN ESPAÑOL. Nunca uses otros idiomas como Hindi, Inglés, Francés, etc. Todo el contenido debe estar en español.
2. Tu respuesta SIEMPRE debe usar formato Markdown.
3. Tu respuesta DEBE tener EXACTAMENTE estas 5 secciones (usa estos títulos con emojis):

## 🏨 ALOJAMIENTO IDEAL

## 🥘 GASTRONOMÍA IMPERDIBLE

## 💎 LUGARES CLAVE

## 💡 CONSEJOS DE ALEX

## 💰 ESTIMACIÓN DE COSTOS
   - Proporciona los costos principales en USD (dólares estadounidenses).
   - Si el usuario tiene una moneda diferente, incluye también la conversión aproximada en su moneda local.
   - Formato: "$100 USD (~400,000 COP)" o similar según la moneda del usuario.
   - Incluye desglose de costos: alojamiento, comida, transporte, actividades, etc.

4. Sé entusiasta, profesional y detallado en cada sección.
5. Usa emojis apropiados para hacer la información más atractiva.
6. Asegúrate de incluir TODAS las 5 secciones en tu respuesta.
7. Si detectas que estás escribiendo en otro idioma, DETENTE INMEDIATAMENTE y continúa en español."""

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
        
        # Inicializar el modelo usando gemini-2.0-flash (gemini-1.5-flash no está disponible)
        # Configuración del modelo usando os.getenv para la API Key (ya configurada arriba)
        try:
            self.model = genai.GenerativeModel(model_name='gemini-2.0-flash')
            logger.info("✅ Servicio de Gemini inicializado correctamente con gemini-2.0-flash")
        except Exception as e:
            logger.error(f"❌ Error al inicializar el modelo de Gemini: {e}")
            raise
    
    def generate_travel_recommendation(
        self, 
        destination: str,
        date: str = "",
        budget: str = "",
        style: str = "",
        user_currency: str = "USD"
    ) -> str:
        """
        Genera una recomendación de viaje usando Gemini con campos estructurados.
        
        Args:
            destination: El destino del viaje (obligatorio)
            date: La fecha del viaje (opcional)
            budget: El presupuesto del viaje (opcional)
            style: El estilo de viaje (opcional)
            user_currency: Moneda del usuario para conversión (opcional, default: USD)
            
        Returns:
            str: Recomendación de viaje formateada en Markdown con las 5 secciones estrictas
            
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
            user_currency = user_currency.strip() if user_currency else "USD"
            
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
            
            # Agregar instrucción sobre moneda si no es USD
            currency_instruction = ""
            if user_currency and user_currency.upper() != "USD":
                currency_instruction = f"\n\nIMPORTANTE: El usuario prefiere ver los costos en su moneda local ({user_currency}). En la sección '💰 ESTIMACIÓN DE COSTOS', proporciona los valores en USD y también incluye la conversión aproximada a {user_currency}. Ejemplo: '$100 USD (~400,000 {user_currency})'."
            
            # Construir el prompt completo incluyendo el system instruction para PLAN
            # La instrucción de sistema se inyecta antes de la pregunta del usuario
            full_prompt = f"{SYSTEM_INSTRUCTION_PLAN}{currency_instruction}\n\n---\n\nSolicitud del usuario: {user_request}"
            
            # Generar respuesta usando Gemini
            # Esta es la llamada a la API de Google Gemini que envía la pregunta del usuario
            logger.info(f"🔄 Enviando solicitud a Gemini: {user_request[:100]}...")
            logger.debug(f"📝 Longitud del prompt completo: {len(full_prompt)} caracteres")
            
            response = self.model.generate_content(full_prompt)
            
            # Extraer el texto de la respuesta
            if not response or not hasattr(response, 'text') or not response.text:
                raise ValueError("La respuesta de Gemini está vacía o no tiene texto")
            
            recommendation = response.text
            
            logger.info(f"✅ Recomendación generada exitosamente por Alex ({len(recommendation)} caracteres)")
            return recommendation
            
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
    ) -> str:
        """
        Genera una respuesta de chat usando Gemini con memoria conversacional.
        
        Esta función inyecta el contexto del viaje (destino, fecha, presupuesto, estilo) y
        la personalidad de Alex (consultor de viajes experto y entusiasta) mediante un
        system prompt especializado para conversaciones (SYSTEM_INSTRUCTION_CHAT).
        
        El historial de conversación se limita a los últimos 6 mensajes para optimizar
        el uso de tokens y mantener el contexto relevante. Si hay historial, se construye
        un prompt que incluye el contexto del viaje, el historial de conversación y el
        nuevo mensaje del usuario. Si no hay historial, se trata como una solicitud inicial
        y se usa SYSTEM_INSTRUCTION_PLAN.
        
        Args:
            destination: El destino del viaje
            date: La fecha del viaje (opcional)
            budget: El presupuesto del viaje (opcional)
            style: El estilo de viaje (opcional)
            message: El nuevo mensaje del usuario
            history: Lista de mensajes anteriores en formato [{"role": "user", "parts": "..."}, ...]
            
        Returns:
            str: Respuesta de Gemini formateada en Markdown
            
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
            if history:
                # Construir el historial como texto para el contexto
                history_text = "\n\n--- Historial de Conversación ---\n\n"
                for msg in history:
                    role_label = "Usuario" if msg.get("role") == "user" else "Alex"
                    history_text += f"{role_label}: {msg.get('parts', '')}\n\n"
                
                # Construir el prompt completo con historial usando SYSTEM_INSTRUCTION_CHAT
                # Para preguntas de seguimiento, usa la instrucción conversacional
                full_prompt = f"{SYSTEM_INSTRUCTION_CHAT}\n\n---\n\n{context_info}\n\n{history_text}---\n\nUsuario pregunta ahora: {message}"
                
                logger.info(f"Enviando mensaje de chat a Gemini con historial de {len(history)} mensajes")
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
            logger.info("✅ Respuesta generada exitosamente por Alex")
            return recommendation
            
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

