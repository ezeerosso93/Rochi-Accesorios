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

### D. Archivos SQL para Base de Datos
- Se creó `transfer-price-update.sql` con el comando necesario para la base de datos:
  ```sql
  ALTER TABLE products ADD COLUMN IF NOT EXISTS transfer_price NUMERIC;
  ```
- Se actualizó también `supabase-update.sql` para mantener sincronizado el historial de migraciones.

---

## 2. Lo que quedó pendiente de hacer y probar

###  Paso 1: Ejecutar la migración en Supabase (Indispensable)
> [!IMPORTANT]
> Para que Supabase acepte guardar y leer el precio de transferencia, es necesario ejecutar la consulta SQL en el panel de Supabase:
1. Entrar a [Supabase Dashboard](https://supabase.com/dashboard).
2. Seleccionar el proyecto de Rochi Accesorios.
3. Ir a **SQL Editor** > **New Query**.
4. Pegar y ejecutar el contenido de `transfer-price-update.sql`:
   ```sql
   ALTER TABLE products ADD COLUMN IF NOT EXISTS transfer_price NUMERIC;
   ```

---

### 🧪 Paso 2: Pruebas en el Panel de Administración
Una vez ejecutado el script en Supabase:
- [ ] Ingresar a la tienda y hacer clic en **Admin ⚙** (al pie de página).
- [ ] Iniciar sesión con:
  - **Email:** `rochiregaleria@gmail.com`
  - **Contraseña:** `Rochi2026!`
- [ ] Ir a la pestaña **Gestión de Productos**.
- [ ] Verificar que la columna **Precio transf.** aparezca en la tabla.
- [ ] Editar un producto (botón ✏️):
  - Cargar un valor en **Precio transferencia (opcional)** (ej: `2500`).
  - Clic en **Guardar Producto** y verificar que guarde sin errores.
- [ ] Editar otro producto dejando el campo vacío y guardar (para verificar que se guarde `null` y muestre `—` en la tabla).

---

### 🛍️ Paso 3: Verificación visual en la tienda pública
- [ ] Ir al catálogo de productos (`Productos` o `Inicio`).
- [ ] **Producto con precio de transferencia:** Verificar que muestre el precio regular al lado del precio de transferencia con su etiqueta distintiva `[Transf.] $...`.
- [ ] **Producto sin precio de transferencia:** Verificar que solo muestre su precio normal, sin espacios en blanco ni etiquetas sobrantes.
- [ ] Tocar un producto con precio de transferencia para abrir el **Modal de detalle** y comprobar que ambos precios se vean claros y prolijos tanto en pantalla grande como en celular.

---

### 💡 Paso 4: Definición futura opcional (Checkout / Carrito)
- [ ] Actualmente, el checkout mantiene el precio regular y la nota informativa de coordinar el pago por WhatsApp. Evaluar si a futuro se desea que cuando el cliente elija *"Transferencia"* como método de pago en el checkout, el total del pedido se recalcule automáticamente con los precios de transferencia cargados.
