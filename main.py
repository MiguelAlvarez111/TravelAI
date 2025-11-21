"""
FastAPI Backend para ViajeIA - Integración con Google Gemini, OpenWeatherMap y Unsplash
"""
import os
import logging
import asyncio
import json
from typing import Optional, List, Dict
from collections import Counter
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from services.gemini_service import get_gemini_service
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

# Configurar CORS para permitir requests del frontend React
# En producción, permite todos los orígenes o lee desde variable de entorno
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
allowed_origins = ["*"] if FRONTEND_URL == "*" else [FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Permite todos en producción o específicos según configuración
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Modelos Pydantic para validación de requests
class TravelRequest(BaseModel):
    """Modelo para la solicitud de viaje del usuario con campos estructurados."""
    destination: str
    date: str
    budget: str
    style: str


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
async def create_travel_plan(request: TravelRequest):
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
        logger.info(f"📨 Nueva solicitud recibida: Destino={request.destination}, Fecha={request.date}, Presupuesto={request.budget}, Estilo={request.style}")
        
        # Validar que el destino no esté vacío
        if not request.destination or not request.destination.strip():
            raise HTTPException(
                status_code=400,
                detail="El destino no puede estar vacío. Por favor, proporciona un destino para tu viaje."
            )
        
        destination = request.destination.strip()
        
        # Obtener servicios
        gemini_service = get_gemini_service()
        weather_service = get_weather_service()
        unsplash_service = get_unsplash_service()
        
        # Ejecutar llamadas en paralelo para mejor rendimiento
        logger.info("🔄 Consultando Gemini, Weather y Unsplash en paralelo...")
        
        # Llamar a Gemini (síncrono pero lo ejecutamos en un executor para no bloquear)
        loop = asyncio.get_event_loop()
        gemini_task = loop.run_in_executor(
            None,
            lambda: gemini_service.generate_travel_recommendation(
                destination=destination,
                date=request.date,
                budget=request.budget,
                style=request.style
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
        
        # Manejar errores individuales sin fallar toda la respuesta
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
            # Opcional: agregar currency si se implementa en el futuro
        
        logger.info("✅ Recomendación generada con datos en tiempo real")
        
        # Incrementar contador de métricas
        increment_plan_counter(destination)
        
        # Devolver respuesta con nueva estructura
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
        # Re-lanzar HTTPExceptions sin modificar
        raise
    
    except ValueError as e:
        # Error de configuración (API key faltante, etc.)
        logger.error(f"❌ Error de configuración: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error de configuración del servidor. Por favor, contacta al administrador."
        )
    
    except Exception as e:
        # Bloque try/except simple: Si algo falla, devuelve un mensaje amigable
        error_message = str(e)
        logger.error(f"❌ Error al generar recomendación: {error_message}")
        
        # Mensaje genérico para errores
        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error consultando a la IA"
        )


@app.post("/api/chat")
async def chat_with_memory(request: ChatRequest):
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
        logger.info(f"💬 Nueva solicitud de chat: Destino={request.destination}, Mensaje={request.message[:50]}...")
        
        # Validar que el destino y mensaje no estén vacíos
        if not request.destination or not request.destination.strip():
            raise HTTPException(
                status_code=400,
                detail="El destino no puede estar vacío."
            )
        
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="El mensaje no puede estar vacío."
            )
        
        destination = request.destination.strip()
        message = request.message.strip()
        
        # Limitar el historial a los últimos 6 mensajes para optimizar tokens
        limited_history = request.history[-6:] if len(request.history) > 6 else request.history
        logger.info(f"📚 Historial limitado a {len(limited_history)} mensajes (de {len(request.history)} totales)")
        
        # Convertir objetos ChatMessage (Pydantic) a diccionarios para gemini_service
        # gemini_service espera List[Dict] y usa .get() en los mensajes
        # Compatible con Pydantic v1 (.dict()) y v2 (.model_dump())
        history_dicts = []
        for msg in limited_history:
            if isinstance(msg, dict):
                # Ya es un diccionario
                history_dicts.append(msg)
            elif hasattr(msg, 'model_dump'):
                # Pydantic v2
                history_dicts.append(msg.model_dump())
            elif hasattr(msg, 'dict'):
                # Pydantic v1
                history_dicts.append(msg.dict())
            else:
                # Fallback: convertir manualmente si es un objeto con atributos
                logger.warning(f"⚠️  Formato de mensaje inesperado: {type(msg)}, convirtiendo manualmente")
                history_dicts.append({
                    "role": getattr(msg, 'role', 'user'),
                    "parts": getattr(msg, 'parts', '')
                })
        
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
                date=request.date,
                budget=request.budget,
                style=request.style,
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

