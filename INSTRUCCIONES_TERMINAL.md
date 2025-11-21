# 📋 Instrucciones para Terminal - Conectar Frontend y Backend

## 🚀 Pasos para Instalación y Configuración

### 1. Backend (Python/FastAPI)

#### Verificar/Instalar la librería google-generativeai

```bash
# Si estás en un entorno virtual, actívalo primero
# source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate      # Windows

# Instalar dependencias (incluye google-generativeai)
pip install -r requirements.txt
```

#### Verificar que la API Key esté configurada

Asegúrate de tener un archivo `.env` en la raíz del proyecto con:

```
GEMINI_API_KEY=tu_api_key_aqui
```

#### Iniciar el servidor backend

```bash
# Opción 1: Usando uvicorn directamente
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Opción 2: Ejecutar main.py
python main.py
```

El servidor estará disponible en: `http://localhost:8000`

---

### 2. Frontend (React)

#### Instalar react-markdown

```bash
# Navega a la carpeta de tu proyecto React
cd ruta/a/tu/proyecto-react

# Instala react-markdown
npm install react-markdown
```

#### Usar el componente TravelPlanner

El archivo `frontend-example/TravelPlanner.jsx` contiene un componente de ejemplo completo que:

- ✅ Tiene un input para la pregunta del usuario
- ✅ Tiene un botón "Planificar" que llama al backend
- ✅ Muestra un estado de loading mientras espera la respuesta
- ✅ Renderiza la respuesta usando react-markdown (para que se vea profesional)
- ✅ Maneja errores de forma amigable

**Importa y usa el componente en tu aplicación React:**

```jsx
import TravelPlanner from './components/TravelPlanner';

function App() {
  return (
    <div>
      <TravelPlanner />
    </div>
  );
}
```

---

## ✅ Verificación

### Probar el Backend

```bash
# En otra terminal, prueba el endpoint
curl -X POST "http://localhost:8000/api/plan" \
  -H "Content-Type: application/json" \
  -d '{"query": "Quiero viajar a París por 3 días"}'
```

Deberías recibir una respuesta JSON con el formato:
```json
{
  "response": "**Destino Principal**: París..."
}
```

### Probar el Frontend

1. Asegúrate de que el backend esté corriendo en `http://localhost:8000`
2. Inicia tu aplicación React
3. Escribe una pregunta en el input
4. Haz clic en "Planificar"
5. Deberías ver la respuesta renderizada con formato Markdown

---

## 🔧 Cambios Realizados

### Backend (`main.py` y `services/gemini_service.py`)

- ✅ Modelo cambiado a `gemini-1.5-flash`
- ✅ System instruction actualizado (breve, emocionante, con emojis)
- ✅ Formato de respuesta cambiado a `{"response": "texto..."}`
- ✅ Manejo de errores simplificado

### Frontend (`TravelPlanner.jsx`)

- ✅ Componente completo con estado de loading
- ✅ Integración con react-markdown para renderizar Markdown
- ✅ Manejo de errores
- ✅ Comentarios explicativos en el código

---

## 🐛 Solución de Problemas

### Error: "GEMINI_API_KEY no encontrada"
- Verifica que tengas un archivo `.env` en la raíz del proyecto
- Asegúrate de que contenga: `GEMINI_API_KEY=tu_api_key_aqui`

### Error: "Failed to fetch" en el frontend
- Verifica que el backend esté corriendo en `http://localhost:8000`
- Verifica que CORS esté configurado correctamente (ya está en el código)

### Error: "Module not found: react-markdown"
- Ejecuta: `npm install react-markdown`

