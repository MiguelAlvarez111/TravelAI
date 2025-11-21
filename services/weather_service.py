"""
Servicio de integración con WeatherAPI.com para obtener datos del clima.
"""
import os
import logging
from typing import Optional, Dict
from datetime import datetime
import httpx
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logger = logging.getLogger(__name__)


class WeatherService:
    """Servicio para interactuar con WeatherAPI.com."""
    
    def __init__(self):
        """Inicializa el servicio de Weather y valida la API key."""
        self.api_key = os.getenv("WEATHER_API_KEY")
        self.base_url = "https://api.weatherapi.com/v1/current.json"
        
        if not self.api_key:
            logger.warning(
                "⚠️  ADVERTENCIA: WEATHER_API_KEY no encontrada. "
                "El servicio de clima no funcionará."
            )
        else:
            logger.info("✅ Servicio de Weather (WeatherAPI.com) inicializado correctamente")
    
    async def get_weather(self, destination: str) -> Optional[Dict]:
        """
        Obtiene el clima actual de un destino usando WeatherAPI.com.
        
        Manejo de errores robusto:
        - Si la API key no está configurada, retorna None silenciosamente
        - Si la API falla (código de estado != 200), registra un warning y retorna None
        - Si hay una excepción de red o timeout (10s), captura la excepción, la registra
          y retorna None. Esto permite que la aplicación continúe funcionando incluso si
          el servicio de clima no está disponible.
        
        Args:
            destination: Nombre de la ciudad/destino
            
        Returns:
            Dict con información del clima o None si hay error
            Estructura: {
                "temp": float,  # Temperatura en Celsius
                "condition": str,  # Descripción del clima
                "feels_like": float,  # Sensación térmica
                "local_time": str,  # Hora local del destino (HH:MM)
                "timezone_offset": int  # Offset en segundos
            }
        """
        if not self.api_key:
            return None
        
        try:
            # Hacer llamada a la API de WeatherAPI.com
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "key": self.api_key,
                        "q": destination,
                        "lang": "es",  # Respuestas en español
                        "aqi": "no"  # No necesitamos calidad del aire
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extraer información relevante de WeatherAPI
                    current = data.get("current", {})
                    location = data.get("location", {})
                    
                    temp = current.get("temp_c", 0)  # Temperatura en Celsius
                    feels_like = current.get("feelslike_c", temp)  # Sensación térmica
                    condition = current.get("condition", {}).get("text", "Desconocido")
                    
                    # WeatherAPI ya proporciona la hora local directamente
                    local_time_str = location.get("localtime", "")
                    if local_time_str:
                        # Formato: "2024-01-15 14:30"
                        try:
                            local_time = local_time_str.split(" ")[1][:5]  # Extraer HH:MM
                        except:
                            local_time = "N/A"
                    else:
                        local_time = "N/A"
                    
                    logger.info(f"✅ Clima obtenido para {destination}: {temp}°C, {condition}")
                    
                    return {
                        "temp": round(temp, 1),
                        "condition": condition,
                        "feels_like": round(feels_like, 1),
                        "local_time": local_time,
                        "timezone_offset": 0  # No necesario con WeatherAPI
                    }
                else:
                    error_data = response.json() if response.content else {}
                    error_msg = error_data.get("error", {}).get("message", f"Status {response.status_code}")
                    logger.warning(f"⚠️  Error al obtener clima: {error_msg}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error al consultar WeatherAPI.com: {e}")
            return None
    


# Instancia global del servicio
_weather_service: Optional[WeatherService] = None


def get_weather_service() -> WeatherService:
    """
    Obtiene la instancia singleton del servicio de Weather.
    
    Returns:
        WeatherService: Instancia del servicio
    """
    global _weather_service
    
    if _weather_service is None:
        _weather_service = WeatherService()
    
    return _weather_service

