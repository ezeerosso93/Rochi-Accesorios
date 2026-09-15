# Guía Maestra de Desarrollo Web y Lecciones Aprendidas

Este documento recopila la arquitectura, tecnologías, patrones de diseño, soluciones técnicas y lecciones aprendidas durante el desarrollo y optimización de la plataforma **Rochi**. Está diseñado como un manual de referencia práctica para guiar futuros proyectos web modernos, rápidos y sin sobrecarga técnica.

---

## 1. Filosofía y Stack Tecnológico

### A. Arquitectura Jamstack / Vanilla Moderna
En lugar de depender de frameworks complejos (React, Next.js, Vue) para sitios comerciales o tiendas ligeras, se optó por un enfoque **Vanilla Moderno**:
* **Estructura:** HTML5 semántico puro.
* **Estilos:** CSS3 puro con variables (`Custom Properties`), animaciones CSS y diseño responsivo sin librerías externas ni utilidades preprocesadas (cero dependencias de Tailwind, Bootstrap o Sass).
* **Lógica:** JavaScript nativo (ES6+) estructurado de forma modular (`app.js`).
* **Ventajas del enfoque:**
  - Cero dependencias de compiladores, bundlers (Webpack, Vite) ni `node_modules`.
  - Carga instantánea en el navegador (Score 95+ en PageSpeed).
  - Facilidad de mantenimiento: cualquier archivo se edita y se refleja en el navegador de inmediato.

### B. Backend as a Service (BaaS) — Supabase
* **Base de datos:** PostgreSQL administrada en la nube con API automática (PostgREST).
* **Autenticación:** Supabase Auth (email/password y recuperación de sesiones persistentes con JWT).
* **Almacenamiento de archivos (Storage):** Buckets públicos para imágenes de productos subidas en tiempo real.
* **Seguridad:** Row Level Security (RLS) para proteger lecturas, inserciones y actualizaciones.

### C. Servicios Complementarios
* **Notificaciones por Email:** EmailJS para envíos de correos transaccionales (confirmaciones de compra) directo desde el navegador mediante API, sin necesidad de mantener un servidor Node/Python activo.
* **Despliegues Continuos (CI/CD):** Netlify sincronizado directamente con la rama `main` de GitHub.

---

## 2. Herramientas y Entorno de Trabajo

| Propósito | Herramienta | Modo de Uso / Comandos |
| :--- | :--- | :--- |
| **Servidor Local** | Python HTTP Server | `python -m http.server` (Corre en `localhost:8000`) |
| **Servidor Alternativo** | VS Code Live Server | Clic derecho en `index.html` > *Open with Live Server* |
| **Control de Versiones** | Git | `git add .` -> `git commit -m "..."` -> `git push origin main` |
| **Base de Datos & Storage**| Supabase SQL Editor | Ejecución de scripts DDL (`ALTER TABLE`, `CREATE TABLE`) |
| **Hosting & SSL** | Netlify | Conexión con GitHub con `Build Command` y `Publish directory` en blanco |

---

## 3. Patrones de Diseño Visual y Estética (UI/UX)

### A. Sistema de Diseño con CSS Variables
Centralizar la identidad visual en `:root` permite cambios globales inmediatos sin tocar selectores específicos:
```css
:root {
  --pink-deep: #c8748a;
  --pink-mid: #e8a0b0;
  --pink-pale: #fdf0f3;
  --cream: #fdf8f5;
  --black: #1a1014;
  --font-display: 'Playfair Display', serif;
  --font-body: 'Cormorant Garamond', serif;
  --font-ui: 'Josefin Sans', sans-serif;
  --transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### B. Fondos Sutiles y Logos Flotantes Orgánicos
Para lograr fondos vivos sin interferir con la legibilidad ni la usabilidad:
1. **Marca de agua sobre fondos sólidos:**
   - Usar `z-index: 1;`, `opacity: 0.08;` y `mix-blend-mode: multiply;`.
   - **Fundamental:** `pointer-events: none;` para que los clics atraviesen la capa sin bloquear botones ni enlaces.
2. **Animaciones desfasadas:**
   - Aplicar duraciones distintas (ej. 12s en la izquierda y 15s en la derecha) y movimientos asimétricos (`translate` + leve `rotate`) para que el movimiento se sienta orgánico y no mecánico.
3. **Optimización Responsive:**
   - Ocultar o reducir la opacidad en pantallas chicas (`@media (max-width: 768px) { display: none; }`) para priorizar la limpieza visual en celulares.

---

## 4. Soluciones Técnicas y Funcionalidades Reutilizables

### A. Panel de Ajustes Dinámico y Resiliente (`site_settings`)
En vez de crear una tabla por cada configuración, se utiliza el patrón **clave-valor**:
* **Estructura:** Tabla `site_settings` con columnas `key TEXT PRIMARY KEY` y `value TEXT`.
* **Guardado atómico:**
  ```javascript
  const settings = [
    { key: 'announcement_banner', value: bannerVal },
    { key: 'contact_phone', value: phoneVal },
    { key: 'about_story', value: aboutVal }
  ];
  await db.from('site_settings').upsert(settings, { onConflict: 'key' });
  ```
* **Carga Resiliente (Patrón Fallback):**
  Al cargar la página o el formulario de administración, si una clave aún no fue guardada en la base de datos, el script toma automáticamente el valor del HTML actual. Esto evita que los inputs queden vacíos o borren información accidentalmente.

### B. Precios Diferenciados (Precio Regular vs. Precio Transferencia)
* **Principio:** Carga opcional. Si se define `transfer_price`, se renderiza una pastilla/badge distintivo (`[Transf.] $X.XXX`). Si está vacío (`null`), no ocupa espacio ni deja marcas residuales.
* **Ordenamiento en tablas Admin:** Permitir ordenar numéricamente tanto por precio regular como por precio de transferencia contemplando valores nulos para evitar inconsistencias alfabéticas.

### C. Carrusel Táctil para Dispositivos Móviles (Swipe con Detección de Gestos)
Los carruseles tradicionales con flechas resultan poco prácticos en celulares. La solución implementada:
1. **Eventos táctiles nativos:**
   - `touchstart`: Registra las coordenadas iniciales (`X`, `Y`).
   - `touchmove`: Mide el desplazamiento horizontal vs. vertical. Si el movimiento en `X` supera a `Y` en más de 10px, activa la bandera `_isSwiping = true`.
   - `touchend`: Si el desplazamiento supera el umbral (35px), avanza o retrocede el slide.
2. **Prevención de falsos clics (Critical Fix):**
   - Cuando el usuario desliza con el pulgar sobre la imagen de un producto, el navegador suele disparar un evento `click` al levantar el dedo.
   - Para evitar que se abra involuntariamente el modal de detalle del producto, se bloquea la propagación del clic mientras `_isSwiping` está activo (reseteado con un timeout de 200ms).
3. **CSS Touch-Action:**
   - `.carousel-container { touch-action: pan-y; }`: Permite que el usuario siga haciendo scroll vertical fluido en la página con el dedo sin que el carrusel lo frene, pero capturando el desplazamiento horizontal.
   - `-webkit-user-drag: none; user-select: none;`: Evita el arrastre fantasma de imágenes en iOS y Android.

---

## 5. Lecciones Aprendidas y Errores Corregidos (Troubleshooting)

### Error 1: PostgREST Schema Cache Error
* **Síntoma:**
  `Error: Could not find the 'transfer_price' column of 'products' in the schema cache`
* **Causa:**
  El frontend intentó enviar un campo en el payload de `insert` o `update` que no existía en la tabla física de Supabase (PostgreSQL).
* **Solución y Regla de Oro:**
  Siempre que se agregue un nuevo campo a un formulario en JavaScript, debe crearse la columna en la base de datos antes de probar el guardado:
  ```sql
  ALTER TABLE products ADD COLUMN IF NOT EXISTS transfer_price NUMERIC;
  ```

### Error 2: Fondos que tapan elementos con `z-index: -1`
* **Síntoma:**
  Un elemento con `position: fixed` y `z-index: -1` no se ve en secciones que tienen color de fondo (ej. fondo blanco o degradé rosa).
* **Causa:**
  Cualquier elemento hijo en el DOM con una propiedad `background` no transparente cubre el fondo del `body`.
* **Solución:**
  Subir el pseudoelemento a un nivel bajo positivo (`z-index: 1`), aplicar `mix-blend-mode: multiply` para fusionar con el color de fondo, y mantener los componentes interactivos (header, modales) con `z-index >= 1000`.

### Error 3: Despliegue en Netlify con Proyectos Estáticos
* **Síntoma:**
  Errores 404 o pérdida de estilos al desplegar.
* **Causa:**
  Arrastrar únicamente archivos sueltos (`index.html`) en lugar de la carpeta completa contenedora, o configurar comandos de build innecesarios.
* **Solución:**
  En proyectos estáticos puros vinculados a GitHub, en los ajustes de Netlify se debe dejar **todo en blanco**:
  - `Base directory`: *(Vacío)*
  - `Build command`: *(Vacío)*
  - `Publish directory`: *(Vacío)*
  Netlify simplemente servirá la raíz del repositorio de forma directa.

### Error 4: Flujo de Commits en Git
* **Lección:**
  Los comandos `git commit` son locales y se pueden acumular tantas veces como sea necesario durante el día. Solo se debe ejecutar `git push origin main` cuando el conjunto de cambios esté probado y listo para producción, disparando así un único despliegue limpio en Netlify.

---

## 6. Checklist para Nuevos Proyectos

- [ ] **Estructura:** Crear carpetas `css/`, `js/` y `assets/` separadas desde el inicio.
- [ ] **Diseño:** Definir paleta y fuentes en `:root` de `style.css`.
- [ ] **BaaS:** Configurar proyecto en Supabase, tablas (`categories`, `products`, `orders`, `site_settings`) y políticas RLS.
- [ ] **Gestión:** Mantener un archivo `migrations.sql` con cada comando `ALTER TABLE` o `CREATE TABLE` ejecutado.
- [ ] **Móviles:** Probar siempre carruseles con gestos táctiles y verificar que `touch-action` esté bien configurado.
- [ ] **Git:** Inicializar repositorio con rama `main` y conectar con Netlify para despliegues continuos automáticos.
