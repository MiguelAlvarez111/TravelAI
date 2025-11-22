"""
FastAPI Backend para ViajeIA - Integración con Google Gemini, OpenWeatherMap y Unsplash
"""
import os
import logging
import traceback
import asyncio
import json
from typing import Optional, List, Dict
from collections import Counter
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from services.gemini_service import get_gemini_service, sanitize_input
from services.weather_service import get_weather_service
from services.unsplash_service import get_unsplash_service

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Sistema de métricas simple (en memoria - se puede persistir en archivo si es necesario)
STATS_FILE = "stats.json"
stats = {
    "total_plans_generated": 0,
    "destinations_counter": {},
    "last_reset": datetime.now().isoformat()
}

# Cargar stats desde archivo si existe
def load_stats():
    """Carga estadísticas desde archivo si existe."""
    global stats
    try:
        if os.path.exists(STATS_FILE):
            with open(STATS_FILE, 'r') as f:
                loaded_stats = json.load(f)
                stats.update(loaded_stats)
            logger.info(f"📊 Estadísticas cargadas: {stats['total_plans_generated']} planes generados")
    except Exception as e:
        logger.warning(f"⚠️  No se pudo cargar stats.json: {e}. Iniciando con valores por defecto.")

def save_stats():
    """Guarda estadísticas en archivo."""
    try:
        with open(STATS_FILE, 'w') as f:
            json.dump(stats, f, indent=2)
    except Exception as e:
        logger.warning(f"⚠️  No se pudo guardar stats.json: {e}")

def increment_plan_counter(destination: str):
    """Incrementa el contador de planes y actualiza el ranking de destinos."""
    global stats
    stats["total_plans_generated"] += 1
    if destination:
        destination_lower = destination.strip().lower()
        stats["destinations_counter"][destination_lower] = stats["destinations_counter"].get(destination_lower, 0) + 1
    save_stats()

# Cargar stats al iniciar
load_stats()

# Validar API KEY al iniciar
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning(
        "⚠️  ADVERTENCIA: GEMINI_API_KEY no encontrada en variables de entorno. "
        "El servidor puede fallar al procesar solicitudes. "
        "Asegúrate de crear un archivo .env con tu API key."
    )
else:
    logger.info("✅ GEMINI_API_KEY encontrada y validada")

# Inicializar FastAPI
app = FastAPI(
    title="ViajeIA API",
    description="API para recomendaciones de viaje con Google Gemini",
    version="1.0.0"
)

# Configurar Rate Limiting con slowapi
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Personalizar el handler de rate limit exceeded con mensaje en español
def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handler personalizado para errores de rate limiting."""
    response = JSONResponse(
        status_code=429,
        content={"detail": "Has alcanzado el límite de consultas. Espera un momento."}
    )
    # Inyectar headers de rate limiting si están disponibles
    if hasattr(request.state, 'view_rate_limit'):
        try:
            response = request.app.state.limiter._inject_headers(
                response, request.state.view_rate_limit
            )
        except Exception:
            pass  # Si falla, continuar sin headers adicionales
    return response

app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# Configurar CORS para permitir requests del frontend React
# IMPORTANTE: Cuando allow_credentials=True, no puedes usar ["*"] - debes especificar orígenes explícitos
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
# Orígenes permitidos: incluir URLs comunes de desarrollo y producción
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Si FRONTEND_URL está configurada, agregarla a la lista
if FRONTEND_URL and FRONTEND_URL != "*":
    if FRONTEND_URL not in allowed_origins:
        allowed_origins.append(FRONTEND_URL)

# Agregar dominio de Railway del frontend - hardcodeado para garantizar funcionamiento
# Esto permite que funcione sin configurar FRONTEND_URL explícitamente
railway_frontend_urls = [
    "https://travelai-frontend-production.up.railway.app",
]
# También intentar leer de variable de entorno si existe
railway_env_url = os.getenv("RAILWAY_STATIC_URL", "")
if railway_env_url and railway_env_url not in railway_frontend_urls:
    railway_frontend_urls.append(railway_env_url)

# Agregar todas las URLs de Railway a la lista de orígenes permitidos
for url in railway_frontend_urls:
    if url and url not in allowed_origins:
        allowed_origins.append(url)

logger.info(f"🌐 CORS configurado para orígenes: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Modelos Pydantic para validación de requests
class TravelRequest(BaseModel):
    """Modelo para la solicitud de viaje del usuario con campos estructurados."""
    destination: str
    date: str
    budget: str
    style: str
    user_currency: str = "USD"  # Moneda del usuario (detectada automáticamente en frontend)


class TravelResponse(BaseModel):
    """Modelo para la respuesta de recomendación de viaje con datos en tiempo real."""
    gemini_response: str
    weather: Optional[Dict] = None
    images: List[str] = []
    info: Optional[Dict] = None


# Modelos para Chat con Memoria Conversacional
class ChatMessage(BaseModel):
    """Modelo para un mensaje individual en el historial de chat."""
    role: str  # "user" o "model"
    parts: str  # Contenido del mensaje


class ChatRequest(BaseModel):
    """Modelo para solicitud de chat con historial de conversación."""
    destination: str
    date: str
    budget: str
    style: str
    message: str  # Nuevo mensaje del usuario
    history: List[ChatMessage] = []  # Historial de mensajes anteriores


class ChatResponse(BaseModel):
    """Modelo para respuesta de chat con memoria."""
    gemini_response: str
    weather: Optional[Dict] = None
    images: List[str] = []
    info: Optional[Dict] = None


@app.get("/")
async def root():
    """Endpoint raíz para verificar que el servidor está funcionando."""
    return {
        "message": "🚀 ViajeIA API está funcionando correctamente",
        "status": "ok",
        "endpoints": {
            "plan": "/api/plan",
            "chat": "/api/chat",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Endpoint de health check."""
    try:
        # Intentar inicializar el servicio para verificar que todo está bien
        service = get_gemini_service()
        return {
            "status": "healthy",
            "gemini_service": "available"
        }
    except Exception as e:
        logger.error(f"Health check falló: {e}")
        return {
            "status": "unhealthy",
            "gemini_service": "unavailable",
            "error": str(e)
        }


@app.get("/api/stats")
async def get_stats():
    """
    Endpoint para obtener estadísticas de uso de la API.
    
    Returns:
        Dict con:
        - total_plans_generated: Número total de planes generados
        - top_destinations: Lista de los destinos más populares
    """
    try:
        # Obtener top 5 destinos
        destinations_counter = Counter(stats["destinations_counter"])
        top_destinations = [
            {"destination": dest.capitalize(), "count": count}
            for dest, count in destinations_counter.most_common(5)
        ]
        
        return {
            "total_plans_generated": stats["total_plans_generated"],
            "top_destinations": top_destinations,
            "last_reset": stats.get("last_reset", "N/A")
        }
    except Exception as e:
        logger.error(f"❌ Error al obtener estadísticas: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener estadísticas"
        )


@app.post("/api/plan")
@limiter.limit("5/minute")
async def create_travel_plan(request: Request, travel_request: TravelRequest):
    """
    Endpoint principal para generar recomendaciones de viaje con datos en tiempo real.
    
    Recibe una solicitud del usuario y consulta en paralelo:
    - Gemini para la recomendación de viaje
    - OpenWeatherMap para el clima actual
    - Unsplash para imágenes del destino
    
    Args:
        request: TravelRequest con la query del usuario y preferencias opcionales
        
    Returns:
        TravelResponse con la recomendación de Gemini, clima, imágenes e información adicional
        
    Raises:
        HTTPException: Si hay un error al procesar la solicitud
    """
    try:
        logger.info(f"📨 Nueva solicitud recibida: Destino={travel_request.destination}, Fecha={travel_request.date}, Presupuesto={travel_request.budget}, Estilo={travel_request.style}, Moneda={travel_request.user_currency}")
        
        # Validar que el destino no esté vacío
        if not travel_request.destination or not travel_request.destination.strip():
            raise HTTPException(
                status_code=400,
                detail="El destino no puede estar vacío. Por favor, proporciona un destino para tu viaje."
            )
        
        # Sanitizar y validar el destino (máximo 100 caracteres para destinos)
        destination_raw = travel_request.destination.strip()
        is_valid, error_msg = sanitize_input(destination_raw, max_length=100)
        if not is_valid:
            logger.warning(f"⚠️  Intento de prompt injection o input inválido en destino: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
        destination = destination_raw
        
        # Sanitizar otros campos opcionales si no están vacíos
        if travel_request.date:
            is_valid, error_msg = sanitize_input(travel_request.date, max_length=50)
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Campo 'fecha' inválido: {error_msg}")
        
        if travel_request.budget:
            is_valid, error_msg = sanitize_input(travel_request.budget, max_length=50)
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Campo 'presupuesto' inválido: {error_msg}")
        
        if travel_request.style:
            is_valid, error_msg = sanitize_input(travel_request.style, max_length=50)
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Campo 'estilo' inválido: {error_msg}")
        
        # Obtener servicios con manejo de errores
        try:
            gemini_service = get_gemini_service()
            logger.info("✅ Servicio Gemini inicializado")
        except Exception as e:
            logger.error(f"❌ Error al inicializar Gemini Service: {e}")
            logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail="Error de configuración del servidor. Por favor, contacta al administrador."
            )
        
        try:
            weather_service = get_weather_service()
            logger.info("✅ Servicio Weather inicializado")
        except Exception as e:
            logger.error(f"❌ Error al inicializar Weather Service: {e}")
            logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
            weather_service = None  # Continuar sin weather
        
        try:
            unsplash_service = get_unsplash_service()
            logger.info("✅ Servicio Unsplash inicializado")
        except Exception as e:
            logger.error(f"❌ Error al inicializar Unsplash Service: {e}")
            logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
            unsplash_service = None  # Continuar sin imágenes
        
        # Ejecutar llamadas en paralelo para mejor rendimiento
        logger.info("🔄 Consultando Gemini, Weather y Unsplash en paralelo...")
        
        # Llamar a Gemini (síncrono pero lo ejecutamos en un executor para no bloquear)
        # Verificar que los argumentos sean correctos antes de enviar
        logger.info(f"📤 Enviando a Gemini: destination='{destination}', date='{travel_request.date}', budget='{travel_request.budget}', style='{travel_request.style}', currency='{travel_request.user_currency}'")
        
        loop = asyncio.get_event_loop()
        gemini_task = loop.run_in_executor(
            None,
            lambda: gemini_service.generate_travel_recommendation(
                destination=destination,
                date=travel_request.date or "",
                budget=travel_request.budget or "",
                style=travel_request.style or "",
                user_currency=travel_request.user_currency or "USD"
            )
        )
        
        # Llamadas asíncronas a Weather y Unsplash (con fallback si los servicios no están disponibles)
        if weather_service:
            weather_task = weather_service.get_weather(destination)
        else:
            async def empty_weather():
                return None
            weather_task = empty_weather()
        
        if unsplash_service:
            images_task = unsplash_service.get_destination_images(destination, count=3)
        else:
            async def empty_images():
                return []
            images_task = empty_images()
        
        # Esperar todas las respuestas en paralelo
        gemini_response, weather_data, images = await asyncio.gather(
            gemini_task,
            weather_task,
            images_task,
            return_exceptions=True
        )
        
        # Manejar errores individuales sin fallar toda la respuesta
        if isinstance(gemini_response, Exception):
            error_type = type(gemini_response).__name__
            error_message = str(gemini_response)
            logger.error(f"❌ Error en Gemini: {error_type}: {error_message}")
            # Obtener traceback de la excepción capturada
            try:
                tb_lines = traceback.format_exception(type(gemini_response), gemini_response, gemini_response.__traceback__)
                logger.error(f"📋 Traceback completo del error de Gemini:\n{''.join(tb_lines)}")
            except Exception:
                logger.error(f"📋 No se pudo obtener traceback completo. Error: {error_message}")
            logger.error(f"🔍 Tipo de excepción: {error_type}")
            logger.error(f"🔍 Argumentos enviados a Gemini: destination='{destination}', date='{travel_request.date}', budget='{travel_request.budget}', style='{travel_request.style}'")
            raise HTTPException(
                status_code=500,
                detail="Ocurrió un error consultando a la IA"
            )
        
        # Fallo gracioso: Si weather o images fallan, continuar con valores por defecto
        if isinstance(weather_data, Exception):
            error_type = type(weather_data).__name__
            error_message = str(weather_data)
            logger.warning(f"⚠️  Error al obtener clima (continuando sin clima): {error_type}: {error_message}")
            try:
                tb_lines = traceback.format_exception(type(weather_data), weather_data, weather_data.__traceback__)
                logger.warning(f"📋 Traceback del error de Weather:\n{''.join(tb_lines)}")
            except Exception:
                logger.warning(f"📋 No se pudo obtener traceback completo. Error: {error_message}")
            weather_data = None
        
        if isinstance(images, Exception):
            error_type = type(images).__name__
            error_message = str(images)
            logger.warning(f"⚠️  Error al obtener imágenes (continuando sin imágenes): {error_type}: {error_message}")
            try:
                tb_lines = traceback.format_exception(type(images), images, images.__traceback__)
                logger.warning(f"📋 Traceback del error de Unsplash:\n{''.join(tb_lines)}")
            except Exception:
                logger.warning(f"📋 No se pudo obtener traceback completo. Error: {error_message}")
            images = []
        
        # Construir objeto info con datos adicionales
        info = {}
        if weather_data and isinstance(weather_data, dict):
            info["local_time"] = weather_data.get("local_time", "N/A")
            # Opcional: agregar currency si se implementa en el futuro
        
        logger.info("✅ Recomendación generada con datos en tiempo real")
        logger.info(f"📊 Resumen: Gemini={'✅' if gemini_response else '❌'}, Weather={'✅' if weather_data else '❌'}, Images={'✅' if images else '❌'}")
        
        # Incrementar contador de métricas
        increment_plan_counter(destination)
        
        # Devolver respuesta con nueva estructura (siempre incluir respuesta de Gemini)
        return {
            "gemini_response": gemini_response,
            "weather": {
                "temp": weather_data.get("temp") if weather_data and isinstance(weather_data, dict) else None,
                "condition": weather_data.get("condition") if weather_data and isinstance(weather_data, dict) else None,
                "feels_like": weather_data.get("feels_like") if weather_data and isinstance(weather_data, dict) else None
            } if weather_data else None,
            "images": images if isinstance(images, list) else [],
            "info": info if info else None
        }
        
    except HTTPException:
        # Re-lanzar HTTPExceptions sin modificar
        raise
    
    except ValueError as e:
        # Error de configuración (API key faltante, etc.)
        logger.error(f"❌ Error de configuración: {e}")
        logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="Error de configuración del servidor. Por favor, contacta al administrador."
        )
    
    except Exception as e:
        # Bloque try/except con logging detallado
        error_message = str(e)
        error_type = type(e).__name__
        logger.error(f"❌ Error inesperado al generar recomendación: {error_type}: {error_message}")
        logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
        
        # Mensaje genérico para errores
        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error consultando a la IA"
        )


@app.post("/api/chat")
@limiter.limit("10/minute")
async def chat_with_memory(request: Request, chat_request: ChatRequest):
    """
    Endpoint para chat continuo con memoria conversacional.
    
    Recibe un nuevo mensaje del usuario junto con el historial de conversación
    y genera una respuesta contextualizada usando Gemini.
    
    Args:
        request: ChatRequest con el nuevo mensaje y el historial de conversación
        
    Returns:
        ChatResponse con la respuesta de Gemini, clima, imágenes e información adicional
        
    Raises:
        HTTPException: Si hay un error al procesar la solicitud
    """
    try:
        logger.info(f"💬 Nueva solicitud de chat: Destino={chat_request.destination}, Mensaje={chat_request.message[:50]}...")
        
        # Validar que el destino y mensaje no estén vacíos
        if not chat_request.destination or not chat_request.destination.strip():
            raise HTTPException(
                status_code=400,
                detail="El destino no puede estar vacío."
            )
        
        if not chat_request.message or not chat_request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="El mensaje no puede estar vacío."
            )
        
        # Sanitizar y validar el destino (máximo 100 caracteres)
        destination_raw = chat_request.destination.strip()
        is_valid, error_msg = sanitize_input(destination_raw, max_length=100)
        if not is_valid:
            logger.warning(f"⚠️  Intento de prompt injection o input inválido en destino: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
        destination = destination_raw
        
        # Sanitizar y validar el mensaje (máximo 500 caracteres para chat)
        message_raw = chat_request.message.strip()
        is_valid, error_msg = sanitize_input(message_raw, max_length=500)
        if not is_valid:
            logger.warning(f"⚠️  Intento de prompt injection o input inválido en mensaje: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
        message = message_raw
        
        # Sanitizar historial de mensajes si existe
        sanitized_history = []
        for msg in chat_request.history:
            if isinstance(msg, dict):
                parts = msg.get('parts', '')
            elif hasattr(msg, 'model_dump'):
                parts = msg.model_dump().get('parts', '')
            elif hasattr(msg, 'dict'):
                parts = msg.dict().get('parts', '')
            else:
                parts = getattr(msg, 'parts', '')
            
            # Validar cada mensaje del historial
            if parts:
                is_valid, error_msg = sanitize_input(str(parts), max_length=500)
                if not is_valid:
                    logger.warning(f"⚠️  Mensaje del historial rechazado: {error_msg}")
                    continue  # Omitir mensajes maliciosos del historial
            
            # Mantener el formato original del mensaje
            if isinstance(msg, dict):
                sanitized_history.append(msg)
            elif hasattr(msg, 'model_dump'):
                sanitized_history.append(msg.model_dump())
            elif hasattr(msg, 'dict'):
                sanitized_history.append(msg.dict())
            else:
                sanitized_history.append({
                    "role": getattr(msg, 'role', 'user'),
                    "parts": str(parts)
                })
        
        # Limitar el historial a los últimos 6 mensajes para optimizar tokens
        limited_history = sanitized_history[-6:] if len(sanitized_history) > 6 else sanitized_history
        logger.info(f"📚 Historial limitado a {len(limited_history)} mensajes (de {len(sanitized_history)} totales)")
        
        # El historial ya está sanitizado y convertido a diccionarios
        history_dicts = limited_history
        
        # Obtener servicios
        gemini_service = get_gemini_service()
        weather_service = get_weather_service()
        unsplash_service = get_unsplash_service()
        
        # Ejecutar llamadas en paralelo
        logger.info("🔄 Consultando Gemini (con memoria), Weather y Unsplash en paralelo...")
        
        # Llamar a Gemini con historial
        loop = asyncio.get_event_loop()
        gemini_task = loop.run_in_executor(
            None,
            lambda: gemini_service.generate_chat_response(
                destination=destination,
                date=chat_request.date,
                budget=chat_request.budget,
                style=chat_request.style,
                message=message,
                history=history_dicts
            )
        )
        
        # Llamadas asíncronas a Weather y Unsplash
        weather_task = weather_service.get_weather(destination)
        images_task = unsplash_service.get_destination_images(destination, count=3)
        
        # Esperar todas las respuestas en paralelo
        gemini_response, weather_data, images = await asyncio.gather(
            gemini_task,
            weather_task,
            images_task,
            return_exceptions=True
        )
        
        # Manejar errores individuales
        if isinstance(gemini_response, Exception):
            logger.error(f"❌ Error en Gemini: {gemini_response}")
            raise HTTPException(
                status_code=500,
                detail="Ocurrió un error consultando a la IA"
            )
        
        if isinstance(weather_data, Exception):
            logger.warning(f"⚠️  Error al obtener clima: {weather_data}")
            weather_data = None
        
        if isinstance(images, Exception):
            logger.warning(f"⚠️  Error al obtener imágenes: {images}")
            images = []
        
        # Construir objeto info con datos adicionales
        info = {}
        if weather_data:
            info["local_time"] = weather_data.get("local_time", "N/A")
        
        logger.info("✅ Respuesta de chat generada con memoria conversacional")
        
        # Devolver respuesta
        return {
            "gemini_response": gemini_response,
            "weather": {
                "temp": weather_data.get("temp") if weather_data else None,
                "condition": weather_data.get("condition") if weather_data else None,
                "feels_like": weather_data.get("feels_like") if weather_data else None
            } if weather_data else None,
            "images": images,
            "info": info if info else None
        }
        
    except HTTPException:
        raise
    
    except ValueError as e:
        logger.error(f"❌ Error de configuración: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error de configuración del servidor. Por favor, contacta al administrador."
        )
    
    except Exception as e:
        error_message = str(e)
        logger.error(f"❌ Error al generar respuesta de chat: {error_message}")
        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error consultando a la IA"
        )


if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Iniciando servidor ViajeIA...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload en desarrollo
        log_level="info"
    )

