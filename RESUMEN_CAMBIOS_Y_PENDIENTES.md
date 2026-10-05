# Resumen de Cambios y Tareas Pendientes — Rochi Accesorios

**Última actualización:** 4 de Octubre de 2026  
**Objetivos clave recientes:** 
1. **Notificaciones instantáneas por WhatsApp (CallMeBot):** Envío automático de alertas con el detalle de cada pedido al teléfono `+5492964495799`.
2. **Eliminación de pedidos en Admin:** Botón `🗑️` en la tabla de pedidos con confirmación, validación de filas eliminadas y actualización en tiempo real de estadísticas.
3. **Gestor visual de orden para "Nuestros Favoritos":** Nueva pestaña `⭐ Favoritos` con cuadrícula horizontal compacta ("uno al lado del otro"), controles `◀` / `▶`, adición desde catálogo y persistencia en Supabase.
4. **Precios diferenciados por transferencia bancaria:** Carga opcional con badge distintivo.
5. **Productos sin precio fijo / a cotizar:** Checkbox en admin y visualización de "Consultar" con enlace directo a WhatsApp.
6. **Navegación táctil optimizada:** Deslizamiento (swipe) en carruseles de fotos para móviles.

---

## 1. Lo que se implementó hoy

### A. Notificaciones Automáticas por WhatsApp (CallMeBot)
- **Número destino predeterminado:** `+5492964495799` (limpiado automáticamente a formato internacional `5492964495799`).
- **Lógica de Envío (`js/app.js`):**
  - Función `sendCallMeBotNotification(order)` integrada en `submitOrder()`.
  - Mensaje con formato enriquecido de WhatsApp (negritas con asteriscos, emojis, número de orden, cliente, teléfono, dirección, método de pago, notas opcionales, detalle ítem por ítem y total).
  - Petición HTTP directa vía `fetch` con `mode: 'no-cors'` para garantizar compatibilidad desde el navegador.
- **Panel de Administración (`index.html` > Ajustes):**
  - Bloque visual *"🔔 Notificaciones WhatsApp (CallMeBot)"*.
  - Checkbox para activar/desactivar el servicio, campo para teléfono y campo para API Key.
  - Botón interactivo *"📲 Probar Notificación"* (`testCallMeBot()`) para verificar la entrega del mensaje en WhatsApp sin crear pedidos ficticios.
  - Guía con enlace directo a WhatsApp para generar la clave en 30 segundos enviando `I allow callmebot to send me messages` al bot (+34 644 44 24 99).
- **Persistencia y SQL:**
  - Valores sincronizados con la tabla `site_settings` de Supabase (`callmebot_phone`, `callmebot_apikey`, `callmebot_enabled`).
  - Creado `callmebot-settings-update.sql` como script auxiliar.

---

### B. Eliminación de Pedidos en Panel de Administración
- **Botón `🗑️` en tabla de pedidos (`js/app.js`):**
  - Incorporado en la columna **Acciones** al lado del botón de estado (`✓ Confirmar` / `↩ Pendiente`).
- **Confirmación y seguridad (`deleteOrder(id)`):**
  - Cuadro de confirmación antes de borrar para prevenir clics accidentales.
  - Uso de `.delete().eq('id', id).select()` para verificar que la fila efectivamente se haya borrado en la base de datos.
  - Alerta explicativa en caso de que las políticas de seguridad Row Level Security (RLS) de Supabase requieran habilitar permisos de `DELETE`.
  - Recálculo inmediato de las tarjetas de estadísticas superiores (Total Pedidos, Pendientes y Facturación) y refresco automático de la tabla con los filtros vigentes.
- **Script SQL auxiliar:**
  - Creado `orders-delete-policy.sql` con la instrucción `CREATE POLICY "Public delete orders" ON orders FOR DELETE USING (true);`.

---

### C. Gestor de Orden para "Nuestros Favoritos"
- **Nueva Pestaña `⭐ Favoritos` (`index.html` & `js/app.js`):**
  - Accesible desde la barra superior del panel de administración (`switchAdminTab('featured', this)`).
- **Diseño en cuadrícula compacta ("uno al lado del otro"):**
  - Tarjetas de tamaño uniforme distribuidas en múltiples columnas (`grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))`).
  - Miniaturas cuadradas y contenidas (`max-height: 110px`, `object-fit: cover`) para permitir visualizar toda la selección de un solo vistazo.
  - Número de posición visible (`#1`, `#2`, `#3`, etc.), nombre, precio y badge.
- **Controles de reordenamiento:**
  - Botones de navegación horizontal **`◀` (Mover a la izquierda)** y **`▶` (Mover a la derecha)** para intercambiar posiciones.
  - Botón **`✕`** para quitar un producto de la sección de Favoritos sin borrarlo del catálogo.
  - Selector con botón **`+ Agregar a Favoritos`** para sumar cualquier producto del catálogo a la lista.
- **Sincronización:**
  - Auto-guardado en Supabase (`site_settings` bajo la clave `featured_products_order`) y botón manual *"💾 Guardar Orden"*.
  - La sección pública *"Nuestros Favoritos"* en la página principal (`renderFeaturedProducts()`) consume inmediatamente este orden prioritario.
- **Invalidación de caché:**
  - Versión de assets actualizada a `?v=11` en `index.html` para asegurar carga inmediata en navegadores.

---

## 2. Lo implementado en iteraciones previas

### A. Productos Sin Precio Fijo ("Consultar" / A Cotizar)
- Checkbox en formulario admin para deshabilitar campos de precio regular, transferencia y anterior.
- En tienda, reemplazo de `$0` por *"Consultar"* y botón directo *"💬 Consultar por WhatsApp"* con mensaje prearmado.

### B. Precios por Transferencia Bancaria
- Campo opcional `pTransferPrice` en formulario y columna en tabla admin.
- Pastilla verde distintiva `[Transf.] $X.XXX` alineada con el precio regular.

### C. Deslizamiento Táctil (Swipe) en Celulares
- Detección de gestos `touchstart`/`touchmove`/`touchend` con bloqueo inteligente de clics accidentales.

---

## 3. Checklist de Pruebas y Tareas Pendientes

### 🧪 Paso 1: Configurar la API Key de CallMeBot
- [ ] Abrir chat con CallMeBot (+34 644 44 24 99) o ingresar a https://wa.me/34644442499?text=I%20allow%20callmebot%20to%20send%20me%20messages
- [ ] Enviar el mensaje: `I allow callmebot to send me messages`.
- [ ] Copiar la clave recibida, pegarla en **Admin > ⚙️ Ajustes > Notificaciones WhatsApp (CallMeBot)** y tocar **📲 Probar Notificación**.
- [ ] Guardar los ajustes y realizar un pedido de prueba en la tienda para verificar que llegue la alerta completa.

### 🗑️ Paso 2: Probar la eliminación de pedidos
- [ ] Si al tocar el botón `🗑️` en un pedido aparece la alerta de RLS de Supabase:
  - Entrar a [Supabase SQL Editor](https://supabase.com/dashboard) y ejecutar `orders-delete-policy.sql`.
- [ ] Confirmar que el pedido se borre de la tabla y las estadísticas superiores se descuenten al instante.

### ⭐ Paso 3: Probar el gestor de Favoritos
- [ ] Ir a **Admin > ⭐ Favoritos**.
- [ ] Mover productos con `◀` y `▶` y comprobar que se reposicionen en la grilla.
- [ ] Volver a la página de Inicio y comprobar que la sección *"Nuestros Favoritos"* refleje el nuevo orden establecido.

---

---

## 4. Cómo Levantar el Servidor Localmente

> [!NOTE]
> Este proyecto es **Vanilla Web (HTML/CSS/JS estático puro)**, por lo que no requiere `package.json` ni compiladores. El comando `npm run dev` **no es necesario ni aplica** en este proyecto.

Para probar la tienda localmente en tu computadora:

* **Opción 1: Con Python (Recomendada y más rápida):**
  ```bash
  python -m http.server
  ```
  *(Abrí tu navegador en: [http://localhost:8000](http://localhost:8000))*

* **Opción 2: Con Node / npx (Sin instalar paquetes):**
  ```bash
  npx serve
  ```
  *(Abrí tu navegador en: [http://localhost:3000](http://localhost:3000))*

* **Opción 3: Live Server en VS Code / Cursor:**
  - Clic derecho sobre `index.html` en el explorador de archivos > **Open with Live Server**.

---

## 5. Cambios Recientes (5 de Octubre)

* **Eliminación del badge de Oferta:** Ahora solo se admiten las opciones *Nuevo*, *Destacado* y *Sin badge*.
* **Catálogo "Todos los productos" con Destacados primero:** Los productos marcados como Destacados (`hot`) aparecen en primera posición de forma automática al ingresar al catálogo.
* **Links individuales para compartir productos en redes:**
  - Cada producto tiene su URL directa limpia (`?p=ID`) que abre la ficha automáticamente.
  - El nombre de cada producto es un enlace semántico `<a>` (`clic derecho > Copiar dirección de enlace`).
  - Botón rápido `🔗` en cada tarjeta y botón *"Compartir Producto"* dentro del modal (utiliza la ventana nativa de compartir en celulares o copia al portapapeles en PC).

---

## 6. Despliegue a Producción (GitHub / Netlify)

Para publicar todos los cambios en la tienda online en vivo:
```bash
git add .
git commit -m "Agregar links compartibles de productos y destacados primero en catalogo"
git push origin main
```
*Netlify actualizará el sitio en vivo de forma automática en aproximadamente 1 minuto.*
