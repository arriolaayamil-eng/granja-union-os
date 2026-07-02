# Plan — Panel de gestión Granja La Unión

Sistema operativo interno (no admin de web) para una pollajería multi-sucursal. Mobile-first, español, frontend puro con cliente HTTP cableado y fallback automático a mocks. Todo bajo `/admin`, `noindex,nofollow`.

## Decisiones de arquitectura

- **Router:** el proyecto usa TanStack Start (no react-router). Construyo las páginas como componentes router-agnósticos en `src/features/admin/**` y las monto en rutas TanStack bajo `src/routes/admin.*`. El swap a react-router luego es trivial porque la lógica no vive en las rutas.
- **Sin backend real, sin terceros.** Solo UI + estado local/mock. Formularios → éxito + toast, mutan cache de react-query, no persisten en servidor.
- **Cliente HTTP con fallback:** si `VITE_API_BASE_URL` está vacío o el fetch falla → devuelve mocks. Cambiar a API real = setear la env y apagar el fallback.

## Estructura de archivos

```text
.env                          VITE_API_BASE_URL= (vacío)
src/lib/api/
  client.ts                  wrapper fetch, Bearer desde localStorage, 401→logout, fallback a mocks
  types.ts                   todos los tipos del §5 EXACTOS
  auth.ts branches.ts users.ts products.ts sales.ts cash.ts
  stock.ts suppliers.ts expenses.ts invoices.ts integrations.ts
  reports.ts business.ts offer.ts notifications.ts customers.ts
src/mocks/data.ts            única fuente de datos de prueba (§9)
src/lib/format.ts            moneda es-AR, fechas legibles (Hoy 14:30/Ayer/01/07)
src/lib/auth-store.ts        token+rol+branchId en localStorage, sesión persistente
src/features/admin/
  AdminLayout.tsx            sidebar desktop / drawer+bottom-nav mobile, header
  components/                StatusBadge, PhaseBadge, KpiCard, EmptyState,
                             ListSkeleton, ErrorState, ImgSlot, ImageUpload(UI),
                             BranchSelector, WhatsAppButton, ConfirmDialog
  pages/                     una carpeta/archivo por sección
src/routes/admin.tsx         layout route (guard de sesión + robots noindex)
src/routes/admin.index.tsx   dashboard
src/routes/admin.<seccion>.tsx  resto de secciones
src/routes/admin.login.tsx   login (fuera del guard)
```

## Datos y estado

- **@tanstack/react-query** para todas las lecturas/mutaciones; invalidación de queries tras cada mutación.
- Ningún componente hace `fetch` directo: siempre vía `src/lib/api/*`.
- Tipos importados desde `types.ts`; cero lógica de negocio en las vistas.

## Roles y navegación (§4)

- Guard: sin token → `/admin/login`.
- `general`: ve todo + selector de sucursal en header ("Todas" + cada una) + secciones exclusivas (Sucursales/Usuarios, Integraciones/Config).
- `branch_admin`: solo su sucursal, sin selector, sin secciones exclusivas.
- Menú filtrado por rol según la tabla del §4. Badge visible de rol + sucursal activa.
- Layout: sidebar (desktop) / drawer + bottom-nav (mobile); header con marca, selector (solo general), campana de notificaciones, menú de usuario (salir, cambiar contraseña modal).

## Secciones (profundidad según §7)

**🟢 Funcionales (F1):**
- **Login** — email/contraseña + 2 botones de acceso rápido (Dueño / Encargado Ostende); guarda token+rol+branchId; modal cambiar contraseña.
- **Dashboard** — KPIs (ventas hoy/mes, ticket promedio, pagados sin entregar, próximos vencimientos, stock bajo), mini-comparativa entre sucursales (general), gráfico ventas 14 días.
- **Ventas / Pedidos web** — lista con filtros y StatusBadge, detalle con items/totales/cliente + botón WhatsApp, "Marcar entregado", columna sucursal (general); hueco `// FASE 2` deshabilitado "Ajustar total al pesar".
- **Catálogo** — grid con foto/precio/costo/margen calculado/categoría, toggle "Hoy hay/no hay", alta/edición + ImageUpload UI-only, override por sucursal, chip "sin precio".
- **Sucursales y Usuarios** (solo general) — CRUD sucursales (incluye punto de venta AFIP) y usuarios (rol, sucursal, activo, reset password).
- **Integraciones y Configuración** (solo general) — tarjetas Mercado Pago y AFIP con estado 🔴/🟡/🟢, toggle y "Probar conexión"; sub-config Envíos, Banner (con preview), Datos del negocio, Categorías de gasto; cada tarjeta explica qué desbloquea + mensaje global "ya está cableado".

**🟡 Estructura lista (UI+campos completos, badge "Próximamente / se activa por fase"):**
- **POS** (dentro de Ventas), **Caja** (abrir/cerrar/arqueo/movimientos), **Stock** (por producto/sucursal, alertas, merma), **Compras/Proveedores** (proveedores + órdenes con recepción), **Gastos y Vencimientos** (UI rica, vista "Próximos vencimientos" destacada, estados con color, adjuntar comprobante UI), **Facturación** (comprobantes + banner estado AFIP + emitir desde venta), **Contabilidad/Reportes** (ingresos/egresos, flujo, ventas por producto/zona/sucursal, exportar UI), **Clientes** (ficha + datos fiscales + historial).

## Transversales (§8)

- Mobile-first real, tap targets grandes.
- Estados de carga (skeleton), vacío y error en cada lista; toasts (sonner); confirmación en destructivas.
- Moneda es-AR, fechas legibles, badges de fase navegables.
- Estilos neutros centralizados en tokens Tailwind (la estética final se pega aparte).

## Mocks (§9)

3 sucursales, 2 usuarios, 18 productos con overrides, ~8 ventas mixtas, 4 clientes, 1 caja abierta con movimientos, 3 proveedores + órdenes, movimientos de stock con alertas, ~6 gastos (alguno vencido), ~4 comprobantes (con/ sin CAE), PaymentConfig y FiscalConfig en `not_configured`, Settings/Business/Offer y notificaciones.

## Detalles técnicos

- `types.ts` respeta EXACTO los shapes del §5 y las funciones de `api/*` reflejan el contrato del §6 → swap a API real sin reescribir.
- Imágenes: `<ImgSlot data-img-ref="#N — descripción" />` para decorativas; fotos de producto vía URL de mocks. No se generan imágenes.
- Ruta `/admin` con `robots: noindex,nofollow` en el `head()` de la route layout.
- Recharts (ya disponible vía shadcn chart) para los gráficos simples.

Al terminar quedará un mockup navegable completo: encender un módulo = cargar credenciales, sin rehacer pantallas.