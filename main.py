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
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Firebase Admin SDK imports
import firebase_admin
from firebase_admin import credentials, auth

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

# Inicializar Firebase Admin SDK (Robusto - no bloquea el servidor si falla)
FIREBASE_INITIALIZED = False
firebase_app = None

try:
    # 1. Intentar cargar credenciales desde variable de entorno (mejor práctica para Railway)
    firebase_credentials_json = os.getenv("FIREBASE_CREDENTIALS")
    
    if firebase_credentials_json:
        try:
            logger.info("🔄 Cargando credenciales de Firebase desde variable de entorno...")
            # Limpiar el string: eliminar espacios en blanco y posibles caracteres de escape
            cleaned_json = firebase_credentials_json.strip()
            
            # Si el JSON está escapado (común en variables de entorno), intentar desescaparlo
            if cleaned_json.startswith('"') and cleaned_json.endswith('"'):
                cleaned_json = cleaned_json[1:-1]  # Remover comillas externas
                cleaned_json = cleaned_json.replace('\\n', '\n').replace('\\"', '"')
            
            # Parsear el JSON string de la variable de entorno
            cred_dict = json.loads(cleaned_json)
            cred = credentials.Certificate(cred_dict)
            firebase_app = firebase_admin.initialize_app(cred)
            FIREBASE_INITIALIZED = True
            logger.info("✅ Firebase Admin SDK inicializado desde FIREBASE_CREDENTIALS")
        except json.JSONDecodeError as e:
            logger.error(f"❌ Error al parsear FIREBASE_CREDENTIALS como JSON: {e}")
            logger.error(f"📋 Primeros 100 caracteres del JSON: {firebase_credentials_json[:100] if firebase_credentials_json else 'N/A'}")
            logger.error("💡 Sugerencia: Verifica que FIREBASE_CREDENTIALS sea un JSON válido sin caracteres extra")
        except ValueError as e:
            # Firebase ya inicializado (puede pasar si se recarga el módulo)
            if "already exists" in str(e).lower():
                logger.info("ℹ️  Firebase Admin SDK ya estaba inicializado")
                FIREBASE_INITIALIZED = True
            else:
                logger.error(f"❌ Error al inicializar Firebase desde FIREBASE_CREDENTIALS: {e}")
        except Exception as e:
            logger.error(f"❌ Error al inicializar Firebase desde FIREBASE_CREDENTIALS: {e}")
            logger.error(f"📋 Detalles: {type(e).__name__}: {str(e)}")
    
    # 2. Fallback: intentar cargar desde archivo local (para desarrollo)
    if not FIREBASE_INITIALIZED:
        service_account_path = "serviceAccountKey.json"
        if os.path.exists(service_account_path):
            try:
                logger.info("🔄 Cargando credenciales de Firebase desde archivo local...")
                cred = credentials.Certificate(service_account_path)
                firebase_app = firebase_admin.initialize_app(cred)
                FIREBASE_INITIALIZED = True
                logger.info("✅ Firebase Admin SDK inicializado desde serviceAccountKey.json")
            except ValueError as e:
                # Firebase ya inicializado (puede pasar si se recarga el módulo)
                if "already exists" in str(e).lower():
                    logger.info("ℹ️  Firebase Admin SDK ya estaba inicializado")
                    FIREBASE_INITIALIZED = True
                else:
                    logger.error(f"❌ Error al inicializar Firebase desde serviceAccountKey.json: {e}")
            except Exception as e:
                logger.error(f"❌ Error al inicializar Firebase desde serviceAccountKey.json: {e}")
                logger.error(f"📋 Detalles: {type(e).__name__}: {str(e)}")
        else:
            logger.warning(
                "⚠️  No se encontró serviceAccountKey.json y FIREBASE_CREDENTIALS no está configurada. "
                "Los endpoints protegidos (/api/plan, /api/chat) fallarán con error 503."
            )
    
    if not FIREBASE_INITIALIZED:
        logger.warning(
            "⚠️  ADVERTENCIA: Firebase Admin SDK no pudo ser inicializado. "
            "El servidor arrancará, pero los endpoints protegidos (/api/plan, /api/chat) "
            "devolverán error 503. Configura FIREBASE_CREDENTIALS o coloca serviceAccountKey.json "
            "en la raíz del proyecto."
        )
except Exception as e:
    # NO hacemos 'raise' aquí - permitimos que el servidor arranque
    logger.error(f"❌ Error crítico al inicializar Firebase Admin SDK: {e}")
    logger.error(f"📋 Traceback completo:\n{traceback.format_exc()}")
    logger.warning("⚠️  El servidor continuará arrancando, pero los endpoints protegidos fallarán.")
    FIREBASE_INITIALIZED = False

# Dependency para verificar tokens de Firebase
async def verify_token(
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """
    Verifica el token de Firebase ID Token del header Authorization.
    
    Args:
        request: Request object de FastAPI (para almacenar uid en state)
        authorization: Header Authorization con formato "Bearer <token>"
        
    Returns:
        str: El UID del usuario autenticado
        
    Raises:
        HTTPException: Si el token es inválido, está ausente, o Firebase no está inicializado
    """
    if not FIREBASE_INITIALIZED:
        logger.error("❌ Intento de autenticación pero Firebase no está inicializado")
        raise HTTPException(
            status_code=503,
            detail="Servicio de autenticación no disponible. Contacta al administrador."
        )
    
    if not authorization:
        logger.warning("⚠️  Intento de acceso sin token de autorización")
        raise HTTPException(
            status_code=401,
            detail="Token de autorización requerido. Por favor, inicia sesión."
        )
    
    # Extraer el token del formato "Bearer <token>"
    try:
        scheme, token = authorization.split(" ", 1)
        if scheme.lower() != "bearer":
            raise ValueError("Esquema de autorización inválido")
    except ValueError:
        logger.warning("⚠️  Formato de header Authorization inválido")
        raise HTTPException(
            status_code=401,
            detail="Formato de autorización inválido. Usa 'Bearer <token>'."
        )
    
    # Verificar el token con Firebase
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        if not uid:
            logger.warning("⚠️  Token válido pero sin UID")
            raise HTTPException(
                status_code=401,
                detail="Token inválido: UID no encontrado."
            )
        # Almacenar uid en request.state para uso en rate limiting
        request.state.uid = uid
        logger.info(f"✅ Token verificado para usuario: {uid}")
        return uid
    except firebase_admin.exceptions.InvalidArgumentError as e:
        logger.warning(f"⚠️  Token inválido (InvalidArgumentError): {e}")
        raise HTTPException(
            status_code=401,
            detail="Token de autorización inválido."
        )
    except Exception as e:
        logger.warning(f"⚠️  Error al verificar token: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=401,
            detail="Token de autorización inválido o expirado."
        )

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

# Validar API KEY al iniciar - Validación estricta (falla si no existe)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY or not GEMINI_API_KEY.strip():
    logger.error(
        "❌ ERROR CRÍTICO: GEMINI_API_KEY no encontrada en variables de entorno. "
        "El servidor no puede iniciar sin esta variable. "
        "Asegúrate de crear un archivo .env con tu API key de Google Gemini."
    )
    raise ValueError(
        "GEMINI_API_KEY es requerida para iniciar el servidor. "
        "Configúrala en variables de entorno antes de iniciar. "
        "Crea un archivo .env en la raíz del proyecto con: GEMINI_API_KEY=tu_api_key_aqui"
    )
else:
    logger.info("✅ GEMINI_API_KEY encontrada y validada")

# Inicializar FastAPI
app = FastAPI(
    title="ViajeIA API",
    description="API para recomendaciones de viaje con Google Gemini",
    version="1.0.0"
)

# Función personalizada para rate limiting por User ID
def get_rate_limit_key(request: Request):
    """
    Obtiene la clave para rate limiting basada en User ID desde token de Firebase.
    
    Estrategia:
    1. Intenta extraer y verificar el token de Firebase del header Authorization
    2. Si el token es válido, usa el UID del usuario (cada usuario tiene su propio contador)
    3. Si NO hay token o es inválido, usa get_remote_address (IP) como fallback
    
    Args:
        request: Request de FastAPI
        
    Returns:
        str: Clave única para rate limiting (User ID o IP)
    """
    # Intentar leer el header Authorization
    authorization = request.headers.get("Authorization")
    
    if authorization:
        try:
            # Extraer el token del formato "Bearer <token>"
            scheme, token = authorization.split(" ", 1)
            if scheme.lower() == "bearer" and FIREBASE_INITIALIZED:
                try:
                    # Verificar el token con Firebase
                    decoded_token = auth.verify_id_token(token)
                    uid = decoded_token.get("uid")
                    if uid:
                        return f"user:{uid}"
                except Exception:
                    # Si la verificación falla, continuar con IP fallback
                    pass
        except ValueError:
            # Si el formato es inválido, continuar con IP fallback
            pass
    
    # Fallback: usar IP si no hay token válido
    return get_remote_address(request)

# Configurar Rate Limiting con slowapi usando la función personalizada
limiter = Limiter(key_func=get_rate_limit_key)
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
async def create_travel_plan(request: Request, travel_request: TravelRequest, uid: str = Depends(verify_token)):
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
            images_task = unsplash_service.get_destination_images(destination, count=8)
        else:
            async def empty_images():
                return []
            images_task = empty_images()
        
        # Esperar todas las respuestas en paralelo
        gemini_result, weather_data, images = await asyncio.gather(
            gemini_task,
            weather_task,
            images_task,
            return_exceptions=True
        )
        
        # Manejar errores individuales sin fallar toda la respuesta
        if isinstance(gemini_result, Exception):
            error_type = type(gemini_result).__name__
            error_message = str(gemini_result)
            logger.error(f"❌ Error en Gemini: {error_type}: {error_message}")
            # Obtener traceback de la excepción capturada
            try:
                tb_lines = traceback.format_exception(type(gemini_result), gemini_result, gemini_result.__traceback__)
                logger.error(f"📋 Traceback completo del error de Gemini:\n{''.join(tb_lines)}")
            except Exception:
                logger.error(f"📋 No se pudo obtener traceback completo. Error: {error_message}")
            logger.error(f"🔍 Tipo de excepción: {error_type}")
            logger.error(f"🔍 Argumentos enviados a Gemini: destination='{destination}', date='{travel_request.date}', budget='{travel_request.budget}', style='{travel_request.style}'")
            raise HTTPException(
                status_code=500,
                detail="Ocurrió un error consultando a la IA"
            )
        
        # Desempaquetar la tupla (respuesta, finish_reason)
        gemini_response, finish_reason = gemini_result
        
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
        logger.info(f"📊 Resumen: Gemini={'✅' if gemini_response else '❌'}, Weather={'✅' if weather_data else '❌'}, Images={'✅' if images else '❌'}, FinishReason={finish_reason}")
        
        # Incrementar contador de métricas
        increment_plan_counter(destination)
        
        # Devolver respuesta con nueva estructura (siempre incluir respuesta de Gemini)
        return {
            "gemini_response": gemini_response,
            "finish_reason": finish_reason,  # Información sobre si la respuesta fue cortada
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
async def chat_with_memory(request: Request, chat_request: ChatRequest, uid: str = Depends(verify_token)):
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
        images_task = unsplash_service.get_destination_images(destination, count=8)
        
        # Esperar todas las respuestas en paralelo
        gemini_result, weather_data, images = await asyncio.gather(
            gemini_task,
            weather_task,
            images_task,
            return_exceptions=True
        )
        
        # Manejar errores individuales
        if isinstance(gemini_result, Exception):
            logger.error(f"❌ Error en Gemini: {gemini_result}")
            raise HTTPException(
                status_code=500,
                detail="Ocurrió un error consultando a la IA"
            )
        
        # Desempaquetar la tupla (respuesta, finish_reason)
        gemini_response, finish_reason = gemini_result
        
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
        
        logger.info(f"✅ Respuesta de chat generada con memoria conversacional (finish_reason={finish_reason})")
        
        # Devolver respuesta
        return {
            "gemini_response": gemini_response,
            "finish_reason": finish_reason,  # Información sobre si la respuesta fue cortada
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

