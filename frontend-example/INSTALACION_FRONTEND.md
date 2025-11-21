# 🚀 Instalación y Configuración del Frontend - ViajeIA

## 📦 Instalación de Dependencias

### 1. Instalar dependencias adicionales

Si no tienes instaladas las siguientes librerías, ejecuta:

```bash
npm install lucide-react react-markdown
```

**O si prefieres instalar todo de una vez:**

```bash
npm install lucide-react react-markdown react react-dom
```

### 2. Verificar Tailwind CSS

Asegúrate de tener Tailwind CSS configurado en tu proyecto. Si no lo tienes:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Y configura tu `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Y en tu `index.css` o `main.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 📁 Estructura de Archivos

```
tu-proyecto-react/
├── src/
│   ├── App.jsx              # Componente raíz (usa el que proporcionamos)
│   ├── TravelPlanner.jsx     # Componente principal (copia el archivo)
│   └── main.jsx             # Punto de entrada
├── package.json
└── tailwind.config.js
```

---

## 🔧 Cómo Importar el Componente

### Opción 1: Reemplazar tu App.jsx actual

Simplemente copia el contenido de `App.jsx` que proporcionamos y reemplaza tu archivo actual.

### Opción 2: Importar en tu App existente

Si ya tienes un `App.jsx` con contenido, puedes importar el componente así:

```jsx
import React from 'react';
import TravelPlanner from './components/TravelPlanner'; // Ajusta la ruta según tu estructura

function App() {
  return (
    <div className="App">
      {/* Tu contenido existente */}
      <TravelPlanner />
    </div>
  );
}

export default App;
```

---

## ✅ Verificación

### 1. Verificar que el backend esté corriendo

```bash
# En otra terminal, verifica que el backend esté activo
curl http://localhost:8000/
```

Deberías ver:
```json
{
  "message": "🚀 ViajeIA API está funcionando correctamente",
  "status": "ok"
}
```

### 2. Iniciar el servidor de desarrollo

```bash
npm run dev
```

### 3. Probar la aplicación

1. Abre tu navegador en `http://localhost:5173` (o el puerto que Vite use)
2. Escribe una pregunta en el textarea: "Quiero viajar a París por 3 días"
3. Haz clic en "Planificar Aventura"
4. Deberías ver la respuesta renderizada con formato Markdown

---

## 🎨 Características de la UI

✅ **Diseño Moderno:**
- Card con sombras suaves (shadow-xl)
- Gradiente de fondo (slate-50 a slate-100)
- Bordes redondeados (rounded-xl, rounded-2xl)

✅ **Paleta de Colores:**
- Azul Real (blue-600, blue-700) para elementos principales
- Grises Pizarra (slate-50, slate-100, slate-600, slate-700, slate-800)
- Blancos para el card principal

✅ **Iconos (Lucide React):**
- ✈️ `Plane` - Icono principal
- 🔄 `Loader2` - Spinner de carga
- 📤 `Send` - Botón de enviar
- ⚠️ `AlertCircle` - Mensajes de error

✅ **Estados Interactivos:**
- Loading state con spinner animado
- Botón deshabilitado cuando está cargando
- Animaciones suaves (fade-in, slide-in)
- Hover effects en botones

✅ **Renderizado Markdown:**
- Negritas, listas, encabezados bien formateados
- Estilos prose de Tailwind para tipografía limpia

---

## 🐛 Solución de Problemas

### Error: "No pudimos conectar con el servidor"

**Causa:** El backend no está corriendo o hay un problema de CORS.

**Solución:**
1. Verifica que el backend esté corriendo: `python3 main.py`
2. Verifica que esté en `http://localhost:8000`
3. Revisa la consola del navegador para ver el error específico

### Error: "Module not found: lucide-react"

**Solución:**
```bash
npm install lucide-react
```

### Error: "Module not found: react-markdown"

**Solución:**
```bash
npm install react-markdown
```

### Los estilos de Tailwind no se aplican

**Solución:**
1. Verifica que `tailwind.config.js` tenga la ruta correcta en `content`
2. Verifica que importes Tailwind en tu CSS principal
3. Reinicia el servidor de desarrollo: `npm run dev`

---

## 📝 Notas Importantes

- El endpoint usa `query` no `prompt`: `{"query": "..."}`
- La respuesta viene en formato: `{"response": "texto markdown..."}`
- El componente maneja automáticamente errores de CORS y conexión
- Los estilos están optimizados para móvil y desktop (responsive)

---

## 🎯 Próximos Pasos

Una vez que todo funcione, puedes:
- Personalizar los colores en las clases de Tailwind
- Agregar más campos (presupuesto, fechas, etc.)
- Mejorar las animaciones
- Agregar historial de consultas
- Implementar guardado de planes favoritos

