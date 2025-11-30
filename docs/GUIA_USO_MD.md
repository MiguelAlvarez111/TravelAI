# 📖 Guía de Uso de Documentación Markdown - ViajeIA

**Versión:** 1.0.0  
**Última actualización:** 2025-01-27

---

## 🎯 Propósito

Esta guía establece las mejores prácticas y convenciones para crear y mantener documentación en formato Markdown (`.md`) dentro del proyecto ViajeIA. El objetivo es mantener la documentación consistente, legible y fácil de mantener.

---

## 📁 Estructura de Documentación

### Ubicación
Toda la documentación del proyecto se encuentra en la carpeta `docs/` en la raíz del proyecto:

```
ViajeIA/
├── docs/
│   ├── API_DOCUMENTATION.md      # Documentación de endpoints
│   ├── ARQUITECTURA.md            # Arquitectura del sistema
│   ├── CONFIGURACION.md           # Guía de configuración
│   ├── FEATURE_HISTORIAL.md       # Especificación de features
│   ├── GUIA_USO_MD.md             # Esta guía
│   └── ...                        # Otros documentos
```

### Convenciones de Nomenclatura
- **Uso de mayúsculas:** Títulos principales en mayúsculas (ej: `API_DOCUMENTATION.md`)
- **Separación:** Usar guiones bajos (`_`) para separar palabras
- **Extensión:** Siempre usar `.md` como extensión

---

## 📝 Estructura de un Documento Markdown

### Plantilla Básica

```markdown
# Título Principal del Documento

**Versión:** 1.0.0  
**Última actualización:** YYYY-MM-DD

---

## Sección Principal

Contenido de la sección...

### Subsección

Contenido de la subsección...

---

## Otra Sección Principal

...

---

## 🔗 Referencias

- [Enlace relevante](https://ejemplo.com)

---

**Última actualización:** YYYY-MM-DD
```

### Elementos Recomendados

1. **Encabezado con metadatos:**
   ```markdown
   # Título
   
   **Versión:** X.Y.Z
   **Última actualización:** YYYY-MM-DD
   ```

2. **Separadores de sección:** Usar `---` entre secciones principales

3. **Emojis en títulos:** Opcional pero recomendado para mejor legibilidad
   - 📚 Documentación
   - 🏗️ Arquitectura
   - ⚙️ Configuración
   - 🔐 Seguridad
   - 🚀 Despliegue

4. **Referencias al final:** Incluir enlaces relevantes

---

## ✍️ Mejores Prácticas

### 1. Títulos y Jerarquía

```markdown
# Título Principal (H1) - Solo uno por documento
## Sección Principal (H2)
### Subsección (H3)
#### Sub-subsección (H4) - Usar con moderación
```

**Regla:** No saltar niveles (ej: no usar H3 después de H1 sin H2).

### 2. Listas

**Listas no ordenadas:**
```markdown
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
```

**Listas ordenadas:**
```markdown
1. Paso 1
2. Paso 2
3. Paso 3
```

**Listas de verificación:**
```markdown
- [x] Tarea completada
- [ ] Tarea pendiente
```

### 3. Código

**Código inline:**
```markdown
Usa `código` para referencias inline.
```

**Bloques de código:**
````markdown
```python
def ejemplo():
    return "código Python"
```

```javascript
function ejemplo() {
    return "código JavaScript";
}
```

```bash
# Comandos de terminal
python main.py
```
````

**Importante:** Siempre especificar el lenguaje para syntax highlighting.

### 4. Tablas

```markdown
| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Dato 1    | Dato 2    | Dato 3    |
| Dato 4    | Dato 5    | Dato 6    |
```

### 5. Enlaces

```markdown
[Texto del enlace](https://ejemplo.com)
[Enlace a otro documento](./OTRO_DOC.md)
[Enlace con título](https://ejemplo.com "Título del enlace")
```

### 6. Imágenes

```markdown
![Texto alternativo](./ruta/a/imagen.png)
![Texto alternativo](https://ejemplo.com/imagen.png)
```

### 7. Énfasis

```markdown
**Texto en negrita**
*Texto en cursiva*
***Texto en negrita y cursiva***
~~Texto tachado~~
```

### 8. Citas

```markdown
> Esta es una cita.
> Puede tener múltiples líneas.
```

### 9. Líneas horizontales

```markdown
---
```

Usar para separar secciones principales.

---

## 🎨 Convenciones Específicas del Proyecto

### Estados y Badges

Usar emojis para indicar estados:
- ✅ Completado
- ⚠️ Parcialmente completo / Advertencia
- ❌ No encontrado / Error
- 🔄 En progreso
- 📝 Nota
- 💡 Sugerencia

### Códigos de Ejemplo

**Python:**
```python
# Siempre incluir comentarios explicativos
def ejemplo():
    """Docstring descriptivo."""
    return resultado
```

**JavaScript:**
```javascript
// Comentarios claros
const ejemplo = () => {
    return resultado;
};
```

**Bash:**
```bash
# Comandos con explicación
python main.py  # Inicia el servidor backend
```

### Variables de Entorno

Siempre mostrar ejemplos con valores placeholder:
```bash
GEMINI_API_KEY=tu_api_key_aqui
```

Nunca incluir valores reales de API keys en la documentación.

---

## 📋 Checklist para Nuevos Documentos

Antes de crear un nuevo documento, verifica:

- [ ] Título claro y descriptivo
- [ ] Metadatos (versión, fecha) en el encabezado
- [ ] Estructura lógica con secciones bien organizadas
- [ ] Ejemplos de código con syntax highlighting
- [ ] Enlaces a referencias relevantes
- [ ] Tablas cuando sea apropiado
- [ ] Emojis para mejor legibilidad (opcional)
- [ ] Separadores (`---`) entre secciones principales
- [ ] Sin errores de ortografía o gramática
- [ ] Información actualizada y precisa

---

## 🔍 Uso en Cursor IDE

### Vista Previa

Cursor IDE tiene soporte nativo para Markdown:

1. **Abrir archivo .md:** Se muestra con formato
2. **Vista previa:** Clic derecho → "Open Preview" o `Cmd+Shift+V` (Mac) / `Ctrl+Shift+V` (Windows/Linux)
3. **Vista dividida:** `Cmd+K V` (Mac) / `Ctrl+K V` (Windows/Linux)

### Atajos Útiles

- **Bold:** `Cmd+B` / `Ctrl+B`
- **Italic:** `Cmd+I` / `Ctrl+I`
- **Insertar enlace:** `Cmd+K` / `Ctrl+K`
- **Insertar tabla:** Usar extensión Markdown Table

### Extensiones Recomendadas

1. **Markdown All in One:** Formato, tablas, preview
2. **Markdown Preview Enhanced:** Preview avanzado
3. **markdownlint:** Linter para Markdown

---

## 📚 Ejemplos de Documentos

### Documentación de API
Ver: `docs/API_DOCUMENTATION.md`

**Características:**
- Endpoints documentados con ejemplos
- Códigos de respuesta
- Estructura de requests/responses
- Autenticación explicada

### Documentación de Arquitectura
Ver: `docs/ARQUITECTURA.md`

**Características:**
- Diagramas ASCII
- Flujos de datos
- Stack tecnológico
- Referencias técnicas

### Guía de Configuración
Ver: `docs/CONFIGURACION.md`

**Características:**
- Variables de entorno documentadas
- Pasos de configuración
- Ejemplos prácticos
- Troubleshooting

---

## 🛠️ Herramientas Útiles

### Editores Online
- [StackEdit](https://stackedit.io/) - Editor Markdown online
- [Dillinger](https://dillinger.io/) - Editor Markdown con preview

### Validadores
- [markdownlint](https://github.com/DavidAnson/markdownlint) - Linter para Markdown
- [Markdown Preview](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced) - Extensión VS Code

### Convertidores
- [Pandoc](https://pandoc.org/) - Convertir Markdown a otros formatos
- [Markdown to PDF](https://www.markdowntopdf.com/) - Convertir a PDF online

---

## 🔄 Mantenimiento

### Actualización de Documentos

1. **Actualizar fecha:** Cambiar "Última actualización" en el encabezado
2. **Versionar cambios:** Incrementar versión si hay cambios significativos
3. **Revisar enlaces:** Verificar que los enlaces sigan funcionando
4. **Actualizar ejemplos:** Asegurar que los ejemplos de código sigan siendo válidos

### Revisión Periódica

- Revisar documentos cada 3-6 meses
- Actualizar información obsoleta
- Agregar nuevas secciones si es necesario
- Eliminar información redundante

---

## 📖 Recursos Adicionales

- [Markdown Guide](https://www.markdownguide.org/) - Guía completa de Markdown
- [GitHub Flavored Markdown](https://github.github.com/gfm/) - Especificación GFM
- [CommonMark](https://commonmark.org/) - Especificación estándar de Markdown

---

## 💡 Tips y Trucos

1. **Usar tablas para comparaciones:** Más legible que listas largas
2. **Incluir ejemplos reales:** Ayudan a entender mejor
3. **Mantener documentos concisos:** No más de 2000-3000 palabras por documento
4. **Usar enlaces internos:** Conectar documentos relacionados
5. **Agregar diagramas ASCII:** Útiles para explicar flujos

---

**Última actualización:** 2025-01-27

