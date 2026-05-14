# INSUMA — Kitchen Dashboard

App de gestión de cocina para restaurantes. Mobile-first, pensada para operaciones diarias: pedidos a proveedores, recepción de mercadería, pagos, recetas y food cost.

---

## Stack

| Tech | Versión |
|------|---------|
| React | 18.3 |
| TypeScript | 5.5 |
| Vite | 5.4 |
| Tailwind CSS | 4.0 |
| Framer Motion | 11 |
| Lucide React | 0.400 |
| Recharts | 3.8 |

---

## Estructura del proyecto

```
src/
├── App.tsx
├── main.tsx
├── settings/
│   └── types.ts
└── components/generated/
    ├── InsumaKitchenDashboard.tsx   # Root — estado global, nav, modales
    ├── ProveedorPerfilSheet.tsx     # Ficha completa del proveedor + historial
    ├── NuevoPedidoModal.tsx         # Crear pedido con mensaje WhatsApp editable
    ├── NuevoProveedorModal.tsx      # Alta de proveedor (CBU, alias, días entrega)
    ├── RecepcionPedidoModal.tsx     # Recepcionar pedido, registrar diferencias
    ├── ProgramarPedidoModal.tsx     # Pedidos programados (recurrentes)
    ├── PagosProveedorSheet.tsx      # Gestión de pagos, detalle de circuito de compra
    ├── RecetasTab.tsx               # Recetario, Sub-recetas, Food Cost
    └── MetricasTab.tsx              # Dashboard de métricas con Recharts
```

---

## Módulos

### Proveedores
- Ficha completa editable: CUIT, contacto ventas, repartidor, CBU/alias, días de entrega, plazo de pago
- Historial de pedidos con línea de ítems (pedido vs. recibido)
- Pedidos programados (recurrentes por día de semana)
- Acciones rápidas: nuevo pedido, repetir último, WhatsApp directo

### Pedidos
- Creación con selección de proveedor y mensaje de WhatsApp editable
- Recepción: confirmar ítems recibidos, registrar diferencias y alertas
- Estados: En espera → En camino → Recibido / Con diferencias / Pago efectivo

### Pagos
- Vista por proveedor con deuda pendiente y vencimientos
- Detalle del circuito de compra: ítems pedidos vs. recibidos
- Edición de circuito: corregir cantidades, cambiar total, re-adjuntar factura
- Acciones: pago digital (transferencia) o confirmar efectivo
- Configuración de tarifa hora (persiste en `localStorage`)

### Recetas
- **Recetario**: recetas con ingredientes (insumos + sub-recetas), merma%, mano de obra, insumos de apoyo
- **Sub-recetas**: preparaciones reutilizables con costo por gramo
- **Food Cost**: tabla con costo/porción, precio de venta y % food cost
- Búsqueda en las 3 tabs
- Escalado de receta: ×1 a ×5 o número personalizado
- Insumos de apoyo del catálogo "Descartables" (leña, film, bandeja, etc.)

### Perfiles de usuario
- **Admin**: acceso completo — costos, food cost, pagos. Requiere PIN (default `1234`, configurable via `localStorage('insuma_pin_admin')`)
- **Cocinero**: acceso básico — sin costos, sin food cost, sin pagos

---

## Estado global (InsumaKitchenDashboard)

```typescript
activeTab          // tab activo de la nav
activeUser         // perfil activo: Admin | Cocinero
todayOrders        // array de Order[]
providers          // array de Provider[]
showNuevoPedido    // modal de nuevo pedido
showRecepcion      // modal de recepción
recepcionOrderId   // para saltar al step 2 directo
```

### Claves de localStorage
| Clave | Contenido |
|-------|-----------|
| `insuma_tarifa_hora` | Tarifa por hora en pesos (para mano de obra en recetas) |
| `insuma_pin_admin` | PIN de 4 dígitos para perfil Admin (default: `1234`) |

---

## Cálculo de food cost

```
costoReceta =
  Σ(gramos × precioGramo × (1 + merma%/100))   ← ingredientes
  + Σ(qty × costoUnitario)                       ← insumos de apoyo
  + horasManoObra × tarifaHora                   ← mano de obra

costoPorPorcion = costoReceta / porciones
foodCost% = costoPorPorcion / precioVenta
```

---

## Correr en local

```bash
npm install
npm run dev -- --port 5173
```

---

## Convenciones de commits

```
feat: nueva funcionalidad
fix: corrección de bug
refactor: mejora sin cambio funcional
style: cambios visuales / CSS
chore: config, deps, otros
```
