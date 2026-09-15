# Resumen de Cambios y Tareas Pendientes — Rochi Accesorios

**Fecha:** 14 de Septiembre de 2026  
**Objetivo:** Agregar a cada producto la posibilidad de cargar un precio manual por transferencia bancaria. Si el administrador carga dicho precio, se muestra al lado del precio regular; si no se carga nada, no aparece nada.

---

## 1. Lo que se realizó hoy

### A. Formulario y Tabla de Administración (`index.html`)
- Se organizó la grilla del formulario de productos en pares alineados de dos columnas.
- Se agregó el campo:
  ```html
  <div class="form-group">
    <label class="form-label">Precio transferencia (opcional)</label>
    <input class="form-input" type="number" id="pTransferPrice" placeholder="2200">
  </div>
  ```
- Se renombró la etiqueta del precio principal a `"Precio regular *"` para que la distinción sea clara para el administrador.

### B. Estilos y Diseño Visual (`css/style.css`)
- Se crearon las clases `.product-price-transfer` y `.product-detail-price-transfer` con un diseño estilo pastilla/badge e-commerce (`[Transf.] $X.XXX`), con tono verde suave acorde a la estética elegante de la tienda.
- Se modificó `.product-price-wrap` y `.product-detail-price-row` con `display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.5rem 0.8rem;` para asegurar que ambos precios se muestren lado a lado sin desbordes en celulares ni computadoras.

### C. Lógica de Negocio en JavaScript (`js/app.js`)
- **Carga de datos (`loadProdsFromDB`):** Se mapea el campo `transfer_price` traído de Supabase como número o `null`.
- **Tarjetas de productos (`productCard`):** Se implementó renderizado condicional: si `p.transfer_price` existe y es mayor a 0, se muestra junto al precio regular; de lo contrario no se renderiza nada adicional.
- **Modal de Detalle (`openProductDetail`):** Se agregó la misma lógica condicional para el modal que se abre al tocar un producto.
- **Formulario de edición (`openProductForm`):** Carga automáticamente el `transfer_price` del producto al editarlo, o lo vacía al crear uno nuevo.
- **Guardado (`saveProduct`):** Lee `pTransferPrice`, lo envía en el payload a Supabase (`transfer_price`) y actualiza el estado local en memoria.
- **Tabla de Gestión (`renderAdminProducts`):** Se agregó la columna `"Precio transf."` con ordenamiento numérico ascendente y descendente al hacer clic en el encabezado.

### E. Deslizamiento Táctil (Swipe) en Carrusel de Fotos para Celulares (`js/app.js` y `css/style.css`)
- **Controladores de eventos táctiles (`js/app.js`):**
  - Se implementaron las funciones `handleCarouselTouchStart`, `handleCarouselTouchMove` y `handleCarouselTouchEnd` para capturar gestos de deslizamiento en pantallas táctiles.
  - **Deslizar hacia la izquierda:** Avanza a la siguiente foto del producto.
  - **Deslizar hacia la derecha:** Retrocede a la foto anterior.
  - **Detección inteligente de tap vs. swipe:** Si el usuario desliza con el pulgar para mirar fotos, el sistema bloquea temporalmente el evento de clic para evitar que se abra por error el modal de detalle del producto. Si hace un toque normal (tap), el producto se abre con total normalidad.
  - Se habilitó tanto en las tarjetas del catálogo (`productCard`) como en el visor ampliado dentro del modal de producto (`openProductDetail`).
- **Optimización y suavidad en CSS (`css/style.css`):**
  - Se agregó `touch-action: pan-y;` en `.carousel-container` y `.carousel-inner` para que el scroll vertical de la página no se bloquee ni tironee mientras el usuario desliza horizontalmente.
  - Se aplicaron las reglas `user-select: none;` y `-webkit-user-drag: none;` para prevenir que el navegador intente arrastrar la imagen como elemento fantasma.

### F. Textos y Personalización Editable desde Panel de Ajustes
- Se configuró el párrafo principal de historia de la sección **"Nosotros"** (`id="aboutStoryText"`) para que pueda ser modificado directamente desde **Admin > ⚙️ Ajustes** (`setAboutStory`) y se guarde en Supabase (`about_story`).
- Actualización de textos del Hero a *"Nueva Temporada 2026"* y enfoque en productos personalizados (Sublimación, Láser, 3D).

### G. Productos Sin Precio Fijo ("Consultar" / A Cotizar)
- **Checkbox en Formulario Admin (`index.html`):** Se añadió el checkbox `☑️ Producto sin precio fijo (Mostrar "Consultar")` que permite crear productos cuyo precio se acuerda de forma personalizada con el cliente.
- **Lógica dinámica en Admin (`js/app.js`):** Al tildar el checkbox, los campos `Precio regular`, `Precio transferencia` y `Precio anterior` se deshabilitan, se vacían automáticamente y la etiqueta cambia a `(No aplica)`. La validación de guardado permite guardar sin precio regular (asigna `price: 0`, `transfer_price: null`, `old_price: null`, compatible con las restricciones de PostgreSQL sin requerir migraciones).
- **Renderizado en Tienda (`js/app.js` y `css/style.css`):**
  - **Catálogo y Destacados (`productCard`):** En lugar de mostrar un precio monetario o `$0`, se muestra elegantemente en cursiva **"Consultar"**. El botón de acción muestra **"Consultar"** y abre directamente el modal de detalle del producto.
  - **Modal de Detalle (`openProductDetail`):** Se muestra **"Consultar"** en el precio y se habilita un botón destacado verde: **"💬 Consultar por WhatsApp"**, que abre una conversación con mensaje prearmado: *"¡Hola! Quisiera consultar el precio y disponibilidad del producto: '[Nombre]'."* Además se permite sumar a la lista de pedido.
  - **Carrito y Checkout:** Los productos sin precio fijo se visualizan como `"Consultar"` en el desglose de productos, y el total estimado aclara `(+ a cotizar)`.
  - **Buscador y Tabla Admin:** El buscador muestra `"Consultar"` en vez de `$0`, y la tabla de administración muestra una pastilla distintiva `"Consultar"`.


---

## 2. Lo que quedó pendiente de hacer y probar

###  Paso 1: Migración en Supabase (Transfer Price)
- [x] Ejecutar en el SQL Editor de Supabase:
  ```sql
  ALTER TABLE products ADD COLUMN IF NOT EXISTS transfer_price NUMERIC;
  ```
  *(Resuelve el error `Could not find the 'transfer_price' column of 'products' in the schema cache`).*

---

### 📱 Paso 2: Probar el carrusel táctil en celular
- [ ] Entrar desde un teléfono móvil (o modo responsive del navegador con `F12`) a la tienda.
- [ ] En un producto con varias fotos, deslizar el dedo hacia la izquierda y derecha para verificar el cambio fluido de imágenes.
- [ ] Comprobar que deslizar no abra accidentalmente el modal de detalle.
- [ ] Abrir el modal de detalle y probar el deslizamiento táctil en la foto ampliada.

---

### 🚀 Paso 3: Subir los últimos cambios a Netlify
Cuando estés listo para desplegar las últimas mejoras de carrusel y estilos:
```bash
git add .
git commit -m "Agregar soporte swipe táctil en carrusel móvil y ajustes generales"
git push origin main
```
Netlify detectará el push y publicará la web actualizada en 1 minuto.

---

### 💌 Paso 4: Tarea futura a definir (Administración de Suscriptores)
- [ ] **Pestaña "Suscriptores" en Panel Admin:** Actualmente los suscriptores de *"Unite a nuestro Club"* se guardan en la tabla `newsletter` de Supabase. Evaluar si se desea agregar una pestaña visual en el panel de administrador para:
  - Ver la lista completa de emails y fecha de registro.
  - Botón de 1 clic para copiar todos los correos (para pegar en CCO de Gmail/Outlook).
  - Botón para exportar lista a CSV / Excel.
  - Opción de eliminar suscriptores.

---

### 💡 Paso 5: Definición futura opcional (Checkout / Carrito)
- [ ] Actualmente, el checkout mantiene el precio regular y la nota informativa de coordinar el pago por WhatsApp. Evaluar si a futuro se desea que cuando el cliente elija *"Transferencia"* como método de pago en el checkout, el total del pedido se recalcule automáticamente con los precios de transferencia cargados.
