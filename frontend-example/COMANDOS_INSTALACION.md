# 📋 Comandos de Instalación - Frontend ViajeIA

## 🚀 Instalación Rápida

### Paso 1: Instalar dependencias adicionales

```bash
npm install lucide-react react-markdown
```

### Paso 2: Verificar Tailwind CSS (si no está instalado)

```bash
# Instalar Tailwind
npm install -D tailwindcss postcss autoprefixer

# Inicializar configuración
npx tailwindcss init -p
```

### Paso 3: Configurar Tailwind

Edita `tailwind.config.js`:

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

Y en tu `src/index.css` o `src/main.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 📁 Copiar Archivos

Copia estos archivos a tu proyecto React:

1. **TravelPlanner.jsx** → `src/TravelPlanner.jsx` (o `src/components/TravelPlanner.jsx`)
2. **App.jsx** → `src/App.jsx` (reemplaza el existente o importa el componente)

---

## ▶️ Ejecutar

```bash
# Asegúrate de que el backend esté corriendo primero
# En otra terminal: python3 main.py

# Inicia el frontend
npm run dev
```

---

## ✅ Verificación

1. Abre `http://localhost:5173` (o el puerto que Vite use)
2. Deberías ver la interfaz de ViajeIA
3. Escribe una pregunta y haz clic en "Planificar Aventura"
4. Deberías ver la respuesta renderizada

