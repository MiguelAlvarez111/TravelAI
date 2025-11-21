"""
Servicio de integración con Unsplash API para obtener imágenes de destinos.
"""
import os
import logging
from typing import Optional, List
import httpx
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logger = logging.getLogger(__name__)


class UnsplashService:
    """Servicio para interactuar con Unsplash API."""
    
    def __init__(self):
        """Inicializa el servicio de Unsplash y valida la API key."""
        self.api_key = os.getenv("UNSPLASH_ACCESS_KEY")
        self.base_url = "https://api.unsplash.com/search/photos"
        
        if not self.api_key:
            logger.warning(
                "⚠️  ADVERTENCIA: UNSPLASH_ACCESS_KEY no encontrada. "
                "El servicio de imágenes no funcionará."
            )
        else:
            logger.info("✅ Servicio de Unsplash inicializado correctamente")
    
    async def get_destination_images(self, destination: str, count: int = 3) -> List[str]:
        """
        Obtiene imágenes de alta calidad de un destino usando Unsplash API.
        
        Manejo de errores robusto:
        - Si la API key no está configurada, retorna lista vacía silenciosamente
        - Si la API falla (código de estado != 200), registra un warning y retorna lista vacía
        - Si hay una excepción de red o timeout (10s), captura la excepción, la registra
          y retorna lista vacía. Esto permite que la aplicación continúe funcionando incluso
          si el servicio de imágenes no está disponible.
        
        La búsqueda se realiza con la query "{destination} travel landscape" para obtener
        imágenes orientadas horizontalmente relevantes para viajes.
        
        Args:
            destination: Nombre del destino
            count: Número de imágenes a obtener (default: 3)
            
        Returns:
            Lista de URLs de imágenes (hasta 'count' imágenes). Retorna lista vacía si hay error.
        """
        if not self.api_key:
            return []
        
        try:
            # Construir query para buscar imágenes
            query = f"{destination} travel landscape"
            
            # Hacer llamada a la API de Unsplash
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "query": query,
                        "per_page": count,
                        "orientation": "landscape"
                    },
                    headers={
                        "Authorization": f"Client-ID {self.api_key}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    
                    # Extraer URLs de las imágenes (usar regular size para buena calidad)
                    image_urls = [
                        result["urls"]["regular"] 
                        for result in results[:count]
                    ]
                    
                    logger.info(f"✅ {len(image_urls)} imágenes obtenidas para {destination}")
                    return image_urls
                else:
                    logger.warning(f"⚠️  Error al obtener imágenes: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"❌ Error al consultar Unsplash: {e}")
            return []


# Instancia global del servicio
_unsplash_service: Optional[UnsplashService] = None


def get_unsplash_service() -> UnsplashService:
    """
    Obtiene la instancia singleton del servicio de Unsplash.
    
    Returns:
        UnsplashService: Instancia del servicio
    """
    global _unsplash_service
    
    if _unsplash_service is None:
        _unsplash_service = UnsplashService()
    
    return _unsplash_service

