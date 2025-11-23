# 🚀 Guía para Subir ViajeIA a GitHub

Esta guía te ayudará a subir tu proyecto a GitHub de forma segura, sin exponer tus API keys.

## ✅ Checklist de Seguridad

Antes de subir, verifica que:

- [x] El archivo `.env` está en `.gitignore`
- [x] No hay API keys hardcodeadas en el código
- [x] Existe un archivo `.env.example` como plantilla
- [x] `node_modules/` está en `.gitignore`
- [x] `__pycache__/` está en `.gitignore`

## 📋 Pasos para Subir a GitHub

### 1. Verificar que `.env` no se subirá

```bash
# Verifica que .env está en .gitignore
cat .gitignore | grep .env
```

Deberías ver `.env` en la lista.

### 2. Verificar el estado de Git

```bash
# Ver qué archivos están siendo rastreados
git status
```

**IMPORTANTE**: Si ves `.env` en la lista, NO hagas commit. Primero elimínalo del tracking:

```bash
# Si .env ya fue agregado antes, elimínalo del tracking (pero no del disco)
git rm --cached .env
```

### 3. Crear el repositorio en GitHub

1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio
2. **NO** inicialices con README, .gitignore o licencia (ya los tienes)
3. Copia la URL del repositorio (ej: `https://github.com/tu-usuario/ViajeIA.git`)

### 4. Inicializar Git (si no lo has hecho)

```bash
# Desde la raíz del proyecto
git init
```

### 5. Agregar todos los archivos (excepto los ignorados)

```bash
# Ver qué se va a agregar (debería mostrar .env.example pero NO .env)
git add .

# Verificar que .env NO está en la lista
git status
```

### 6. Hacer el primer commit

```bash
git commit -m "Initial commit: ViajeIA - Asistente Inteligente de Viajes"
```

### 7. Conectar con GitHub y subir

```bash
# Reemplaza con tu URL de GitHub
git remote add origin https://github.com/tu-usuario/ViajeIA.git

# Cambiar a la rama main (si estás en master)
git branch -M main

# Subir el código
git push -u origin main
```

## 🔒 Verificación Final

Después de subir, verifica en GitHub:

1. Ve a tu repositorio en GitHub
2. Busca el archivo `.env` - **NO debería existir**
3. Verifica que `.env.example` sí existe
4. Revisa el `.gitignore` para confirmar que está completo

## ⚠️ Si accidentalmente subiste `.env` con keys

Si por error subiste el `.env` con tus API keys reales:

1. **INMEDIATAMENTE** revoca/regenera todas tus API keys en:
   - Google Gemini: https://makersuite.google.com/app/apikey
   - WeatherAPI: https://www.weatherapi.com/
   - Unsplash: https://unsplash.com/developers

2. Elimina el archivo del historial de Git:

```bash
# Eliminar .env del historial completo
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Forzar push (CUIDADO: esto reescribe el historial)
git push origin --force --all
```

3. Considera hacer el repositorio privado temporalmente mientras regeneras las keys.

## 📝 Para otros desarrolladores

Cuando alguien clone tu repositorio:

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env` y agregar sus propias API keys

3. Instalar dependencias y ejecutar como se indica en el README

## ✅ Todo Listo

Tu proyecto está ahora en GitHub de forma segura. Las API keys están protegidas y otros desarrolladores pueden clonar y configurar el proyecto fácilmente usando `.env.example`.

