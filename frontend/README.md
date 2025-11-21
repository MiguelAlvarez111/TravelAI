# 🚀 ViajeIA Frontend

Frontend React + Vite para la aplicación ViajeIA - Planificador de viajes con IA.

## ✅ Estado del Proyecto

- ✅ Proyecto React creado con Vite
- ✅ Dependencias instaladas (lucide-react, react-markdown)
- ✅ Tailwind CSS v4 configurado
- ✅ Componente TravelPlanner implementado
- ✅ Conectado con backend FastAPI en http://localhost:8000

## 🚀 Iniciar la Aplicación

### 1. Asegúrate de que el backend esté corriendo

```bash
# En otra terminal, desde la raíz del proyecto
cd /Users/miguelalvarezavendano/ViajeIA
python3 main.py
```

### 2. Inicia el servidor de desarrollo

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` (o el puerto que Vite asigne).

## 📦 Dependencias Instaladas

- **react** ^19.2.0
- **react-dom** ^19.2.0
- **lucide-react** ^0.554.0 (iconos)
- **react-markdown** ^10.1.0 (renderizado de Markdown)
- **tailwindcss** ^4.1.17 (estilos)
- **vite** ^7.2.4 (build tool)

## 🎨 Características

- ✨ Interfaz moderna con Tailwind CSS
- 🎯 Diseño responsive (móvil y desktop)
- ⚡ Estados de carga con animaciones
- 🛡️ Manejo de errores (CORS, conexión)
- 📝 Renderizado de Markdown profesional
- 🎭 Iconos con Lucide React

## 📁 Estructura

```
frontend/
├── src/
│   ├── App.jsx              # Componente raíz
│   ├── TravelPlanner.jsx    # Componente principal
│   ├── index.css            # Estilos globales (Tailwind)
│   └── main.jsx             # Punto de entrada
├── package.json
└── vite.config.js
```

## 🔧 Configuración

### Tailwind CSS v4

Tailwind v4 usa una sintaxis simplificada. El archivo `src/index.css` contiene:

```css
@import "tailwindcss";
```

No se requiere archivo `tailwind.config.js` para la configuración básica.

## 🐛 Solución de Problemas

### El servidor no inicia

```bash
# Verifica que las dependencias estén instaladas
npm install
```

### Los estilos de Tailwind no se aplican

Verifica que `src/index.css` tenga:
```css
@import "tailwindcss";
```

Y que esté importado en `main.jsx`:
```js
import './index.css'
```

### Error de conexión con el backend

1. Verifica que el backend esté corriendo: `curl http://localhost:8000/`
2. Verifica que CORS esté configurado en el backend
3. Revisa la consola del navegador para ver el error específico

## 📝 Próximos Pasos

- [ ] Agregar más campos de entrada (presupuesto, fechas)
- [ ] Implementar historial de consultas
- [ ] Agregar guardado de planes favoritos
- [ ] Mejorar animaciones y transiciones
- [ ] Agregar modo oscuro
