#!/usr/bin/env python3
"""
Script de configuración inicial para ViajeIA.
Crea el archivo .env desde .env.example si no existe.
"""
import os
from pathlib import Path

def setup_env_file():
    """Crea el archivo .env desde .env.example si no existe."""
    env_path = Path(".env")
    env_example_path = Path(".env.example")
    
    if env_path.exists():
        print("✅ El archivo .env ya existe.")
        return
    
    if not env_example_path.exists():
        print("❌ Error: No se encontró el archivo .env.example")
        print("   Por favor, crea un archivo .env.example con las variables necesarias.")
        return
    
    # Copiar .env.example a .env
    with open(env_example_path, "r") as example_file:
        content = example_file.read()
    
    with open(env_path, "w") as env_file:
        env_file.write(content)
    
    print("✅ Archivo .env creado desde .env.example")
    print("⚠️  IMPORTANTE: Edita el archivo .env y agrega tus API keys reales.")
    print("⚠️  Recuerda: El archivo .env está en .gitignore y no se subirá al repositorio.")

if __name__ == "__main__":
    print("🔧 Configurando ViajeIA...")
    setup_env_file()
    print("\n📦 Instalando dependencias...")
    print("Ejecuta: pip install -r requirements.txt")
    print("\n🚀 Para iniciar el servidor:")
    print("   python main.py")
    print("   o")
    print("   uvicorn main:app --reload")

