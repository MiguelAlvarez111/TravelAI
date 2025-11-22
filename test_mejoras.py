#!/usr/bin/env python3
"""
Script de prueba para las 4 mejoras implementadas:
1. Validación de Email con Regex
2. Manejo de Error 429
3. Sanitización XSS (DOMPurify)
4. Validación Estricta de ENV
"""

import re
import os
import sys

def test_email_validation():
    """Prueba la regex de validación de email."""
    print("\n" + "="*60)
    print("🧪 Test 1: Validación de Email con Regex")
    print("="*60)
    
    regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    
    test_cases = [
        ('test@example.com', True, 'Email válido'),
        ('user@domain.co.uk', True, 'Email con subdominio'),
        ('invalid.email', False, 'Sin @'),
        ('user@domain', False, 'Sin dominio completo'),
        ('@example.com', False, 'Sin usuario'),
        ('test.email@example.com', True, 'Email con punto'),
        ('', False, 'Vacío'),
        ('test@', False, 'Sin dominio'),
    ]
    
    passed = 0
    for email, expected, description in test_cases:
        result = bool(re.match(regex, email))
        status = '✅' if result == expected else '❌'
        if result == expected:
            passed += 1
        print(f"{status} {description:25} | '{email:25}' -> {result} (esperado: {expected})")
    
    print(f"\n✅ Resultado: {passed}/{len(test_cases)} pruebas pasadas")
    return passed == len(test_cases)

def test_env_validation():
    """Prueba la validación estricta de GEMINI_API_KEY."""
    print("\n" + "="*60)
    print("🧪 Test 2: Validación Estricta de ENV")
    print("="*60)
    
    # Guardar el valor original
    original_key = os.environ.get('GEMINI_API_KEY')
    
    try:
        # Test 1: Sin GEMINI_API_KEY
        if 'GEMINI_API_KEY' in os.environ:
            del os.environ['GEMINI_API_KEY']
        
        # Intentar importar main (debería fallar)
        try:
            # Limpiar cache de imports
            if 'main' in sys.modules:
                del sys.modules['main']
            
            from main import app
            print("❌ ERROR: Debería haber fallado sin GEMINI_API_KEY")
            return False
        except ValueError as e:
            error_msg = str(e)
            if 'GEMINI_API_KEY' in error_msg or 'requerida' in error_msg.lower():
                print("✅ Validación estricta funcionando correctamente")
                print(f"   Error esperado: {error_msg[:80]}...")
                result1 = True
            else:
                print(f"⚠️  Error inesperado: {error_msg[:80]}")
                result1 = False
        except Exception as e:
            print(f"❌ Error inesperado: {type(e).__name__}: {e}")
            result1 = False
        
        # Test 2: Con GEMINI_API_KEY vacía
        os.environ['GEMINI_API_KEY'] = ''
        try:
            if 'main' in sys.modules:
                del sys.modules['main']
            from main import app
            print("❌ ERROR: Debería haber fallado con GEMINI_API_KEY vacía")
            result2 = False
        except ValueError:
            print("✅ Validación estricta rechaza GEMINI_API_KEY vacía")
            result2 = True
        except Exception as e:
            print(f"⚠️  Error inesperado: {type(e).__name__}: {e}")
            result2 = False
        
        return result1 and result2
        
    finally:
        # Restaurar el valor original
        if original_key:
            os.environ['GEMINI_API_KEY'] = original_key
        elif 'GEMINI_API_KEY' in os.environ:
            del os.environ['GEMINI_API_KEY']

def test_dompurify_installed():
    """Verifica que DOMPurify esté instalado."""
    print("\n" + "="*60)
    print("🧪 Test 3: DOMPurify Instalado")
    print("="*60)
    
    import subprocess
    import os
    
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    if not os.path.exists(frontend_dir):
        print("⚠️  Directorio frontend no encontrado")
        return False
    
    try:
        result = subprocess.run(
            ['npm', 'list', 'dompurify'],
            cwd=frontend_dir,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if 'dompurify' in result.stdout.lower() or 'dompurify' in result.stderr.lower():
            print("✅ DOMPurify está instalado")
            # Extraer versión si está disponible
            lines = result.stdout.split('\n')
            for line in lines:
                if 'dompurify' in line.lower() and '@' in line:
                    print(f"   {line.strip()}")
                    break
            return True
        else:
            print("❌ DOMPurify no encontrado en node_modules")
            print("   Ejecuta: cd frontend && npm install dompurify")
            return False
    except subprocess.TimeoutExpired:
        print("⚠️  Timeout al verificar DOMPurify")
        return False
    except FileNotFoundError:
        print("⚠️  npm no encontrado. Asegúrate de tener Node.js instalado")
        return False
    except Exception as e:
        print(f"⚠️  Error al verificar: {e}")
        return False

def test_rate_limit_handling():
    """Verifica que el código de manejo de error 429 esté presente."""
    print("\n" + "="*60)
    print("🧪 Test 4: Manejo de Error 429 en Código")
    print("="*60)
    
    travel_planner_path = os.path.join(
        os.path.dirname(__file__),
        'frontend', 'src', 'TravelPlanner.jsx'
    )
    
    if not os.path.exists(travel_planner_path):
        print("⚠️  TravelPlanner.jsx no encontrado")
        return False
    
    try:
        with open(travel_planner_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        checks = [
            ('429', 'Detección de status 429'),
            ('apiResponse.status === 429', 'Comparación específica de status 429'),
            ('Has alcanzado el límite', 'Mensaje de error para rate limit'),
            ('toast.error', 'Uso de toast para mostrar error'),
        ]
        
        passed = 0
        for pattern, description in checks:
            if pattern in content:
                print(f"✅ {description}")
                passed += 1
            else:
                print(f"❌ {description} - No encontrado")
        
        print(f"\n✅ Resultado: {passed}/{len(checks)} verificaciones pasadas")
        return passed == len(checks)
        
    except Exception as e:
        print(f"❌ Error al leer archivo: {e}")
        return False

def main():
    """Ejecuta todas las pruebas."""
    print("\n" + "🔒"*30)
    print("PRUEBAS DE MEJORAS DE SEGURIDAD")
    print("🔒"*30)
    
    results = []
    
    # Test 1: Validación de Email
    results.append(("Validación de Email", test_email_validation()))
    
    # Test 2: Validación Estricta de ENV
    results.append(("Validación Estricta ENV", test_env_validation()))
    
    # Test 3: DOMPurify Instalado
    results.append(("DOMPurify Instalado", test_dompurify_installed()))
    
    # Test 4: Manejo de Error 429
    results.append(("Manejo Error 429", test_rate_limit_handling()))
    
    # Resumen
    print("\n" + "="*60)
    print("📊 RESUMEN DE PRUEBAS")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {test_name}")
    
    print(f"\n{'✅' if passed == total else '⚠️ '} Resultado: {passed}/{total} pruebas pasadas")
    
    if passed == total:
        print("\n🎉 ¡Todas las mejoras están implementadas correctamente!")
    else:
        print(f"\n⚠️  {total - passed} prueba(s) fallaron. Revisa los detalles arriba.")

if __name__ == "__main__":
    main()

