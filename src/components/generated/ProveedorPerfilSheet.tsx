import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Clock, Truck, Wallet, TrendingUp, Package, ArrowRight, Leaf, Phone, MessageCircle, RotateCcw, Tag, Calendar, CalendarClock, Check, Repeat2, ChevronRight, Plus, Package2, Info, CreditCard, User, ArrowLeft, Edit3, Search, Camera, Banknote, Receipt } from 'lucide-react';
import { ProgramarPedidoModal } from './ProgramarPedidoModal';
import type { ScheduledOrderPayload, ScheduledCartItem } from './ProgramarPedidoModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'waiting' | 'on_way' | 'received' | 'discrepancy' | 'paid_cash';

interface OrderLineItem {
  id: string;
  nombre: string;
  cantPedida: number;
  cantRecibida: number;
  unit: string;
  precioUnit: number;
}

// Shape of real orders passed from the dashboard
interface DashboardOrder {
  id: string;
  provider: string;
  status: OrderStatus;
  time: string;
  items: number;
  total?: number;
  orderItems?: Array<{
    id: string;
    name: string;
    requestedQty: number;
    receivedQty: number;
    unit: string;
    precioUnit?: number;
    status: 'ok' | 'discrepancy' | 'pending';
    alertMsg: string;
  }>;
  alerts?: Array<{ id: string; itemName: string; message: string; resolved: boolean; timestamp: string }>;
  paymentStatus?: string;
  receivedAt?: string;
  orderNote?: string;
  receptionNote?: string;
  creadoPor?: string;
  deliveryDate?: string;
  hasBillingDiscrepancy?: boolean;
}

interface HistoryOrder {
  id: string;
  date: string;
  items: number;
  status: OrderStatus;
  total: number;
  hasAlert?: boolean;
  alertMsg?: string;
  receptionNote?: string;
  lineItems?: OrderLineItem[];
  hasRemito?: boolean;
  paymentStatus?: 'paid' | 'pending';
  paymentDate?: string;
  paymentMethod?: 'cash' | 'transfer' | 'check';
  // real order fields preserved for detail view
  orderNote?: string;
  creadoPor?: string;
  deliveryDate?: string;
  alertResolved?: boolean;
  rawAlerts?: Array<{ id: string; itemName: string; message: string; resolved: boolean; timestamp: string }>;
}
interface MonthStat {
  id: string;
  month: string;
  amount: number;
  orders: number;
  alerts: number;
}
interface ProveedorPerfil {
  id: string;
  name: string;
  category: string;
  isOrganic?: boolean;
  lastOrderDate?: string;
  telefono?: string;
  diasEntrega?: string[];
  plazoPago?: string;
  cbu?: string;
  alias?: string;
  nombreVentas?: string;
  createdAt?: string;
  cuit?: string;
  telefonoRepartidor?: string;
  contactoRepartidor?: string;
}
interface ScheduledOrder {
  id: string;
  providerId: string;
  providerName: string;
  dayOfWeek: number;
  active: boolean;
  createdAt: string;
  items: ScheduledCartItem[];
}

// ─── Static Mock Data per provider ───────────────────────────────────────────

const MOCK_HISTORY: Record<string, HistoryOrder[]> = {
  pv1: [{
    id: 'h1',
    date: 'Hoy, 10:30',
    items: 6,
    status: 'on_way',
    total: 8400,
    hasAlert: false
  }, {
    id: 'h2',
    date: 'Hace 2 días',
    items: 5,
    status: 'received',
    total: 7200
  }, {
    id: 'h3',
    date: 'Hace 5 días',
    items: 8,
    status: 'received',
    total: 9100
  }, {
    id: 'h4',
    date: 'Hace 1 semana',
    items: 4,
    status: 'discrepancy',
    total: 5300,
    hasAlert: true,
    alertMsg: 'Faltaron 2kg de tomate perita'
  }, {
    id: 'h5',
    date: 'Hace 10 días',
    items: 7,
    status: 'received',
    total: 8800
  }, {
    id: 'h6',
    date: 'Hace 15 días',
    items: 5,
    status: 'paid_cash',
    total: 6200
  }],
  pv2: [{
    id: 'h1',
    date: 'Hace 1 semana',
    items: 3,
    status: 'received',
    total: 24000
  }, {
    id: 'h2',
    date: 'Hace 2 semanas',
    items: 4,
    status: 'discrepancy',
    total: 18500,
    hasAlert: true,
    alertMsg: 'Entraña con mal corte, se devolvió 1kg'
  }, {
    id: 'h3',
    date: 'Hace 3 semanas',
    items: 2,
    status: 'received',
    total: 16000
  }],
  pv3: [{
    id: 'h1',
    date: 'Hace 3 días',
    items: 4,
    status: 'received',
    total: 11200
  }, {
    id: 'h2',
    date: 'Hace 10 días',
    items: 3,
    status: 'received',
    total: 9800
  }, {
    id: 'h3',
    date: 'Hace 17 días',
    items: 4,
    status: 'paid_cash',
    total: 10500
  }],
  pv4: [{
    id: 'h1',
    date: 'Hace 5 días',
    items: 12,
    status: 'received',
    total: 15600
  }, {
    id: 'h2',
    date: 'Hace 12 días',
    items: 10,
    status: 'discrepancy',
    total: 13200,
    hasAlert: true,
    alertMsg: 'Harina vencida, se rechazó lote'
  }, {
    id: 'h3',
    date: 'Hace 20 días',
    items: 8,
    status: 'received',
    total: 11800
  }],
  pv5: [{
    id: 'h1',
    date: 'Hace 1 día',
    items: 2,
    status: 'waiting',
    total: 4800
  }, {
    id: 'h2',
    date: 'Hace 8 días',
    items: 3,
    status: 'received',
    total: 5200
  }],
  pv6: [{
    id: 'h1',
    date: 'Hace 4 días',
    items: 3,
    status: 'received',
    total: 22000
  }, {
    id: 'h2',
    date: 'Hace 11 días',
    items: 2,
    status: 'received',
    total: 18400
  }, {
    id: 'h3',
    date: 'Hace 18 días',
    items: 3,
    status: 'discrepancy',
    total: 19600,
    hasAlert: true,
    alertMsg: 'Salmón no llegó fresco, se devolvió'
  }]
};

// ─── Mock line items per order ────────────────────────────────────────────────

const MOCK_LINE_ITEMS: Record<string, Record<string, OrderLineItem[]>> = {
  pv1: {
    h1: [
      { id: 'li-1', nombre: 'Tomate redondo', cantPedida: 10, cantRecibida: 10, unit: 'kg', precioUnit: 280 },
      { id: 'li-2', nombre: 'Cebolla morada', cantPedida: 5, cantRecibida: 5, unit: 'kg', precioUnit: 190 },
      { id: 'li-3', nombre: 'Ajo', cantPedida: 2, cantRecibida: 2, unit: 'kg', precioUnit: 650 },
      { id: 'li-4', nombre: 'Albahaca fresca', cantPedida: 3, cantRecibida: 3, unit: 'kg', precioUnit: 1200 },
    ],
    h2: [
      { id: 'li-5', nombre: 'Zanahoria', cantPedida: 8, cantRecibida: 8, unit: 'kg', precioUnit: 150 },
      { id: 'li-6', nombre: 'Papas', cantPedida: 15, cantRecibida: 15, unit: 'kg', precioUnit: 180 },
      { id: 'li-7', nombre: 'Perejil fresco', cantPedida: 2, cantRecibida: 2, unit: 'kg', precioUnit: 980 },
    ],
    h4: [
      { id: 'li-8', nombre: 'Tomate perita', cantPedida: 10, cantRecibida: 8, unit: 'kg', precioUnit: 300 },
      { id: 'li-9', nombre: 'Verdeo', cantPedida: 4, cantRecibida: 4, unit: 'atado', precioUnit: 420 },
      { id: 'li-10', nombre: 'Limón', cantPedida: 3, cantRecibida: 3, unit: 'kg', precioUnit: 260 },
      { id: 'li-11', nombre: 'Albahaca fresca', cantPedida: 2, cantRecibida: 2, unit: 'kg', precioUnit: 1200 },
    ],
  },
  pv2: {
    h1: [
      { id: 'li-20', nombre: 'Lomo vacuno', cantPedida: 5, cantRecibida: 5, unit: 'kg', precioUnit: 3800 },
      { id: 'li-21', nombre: 'Bife de chorizo', cantPedida: 3, cantRecibida: 3, unit: 'kg', precioUnit: 3200 },
      { id: 'li-22', nombre: 'Molleja de corazón', cantPedida: 2, cantRecibida: 2, unit: 'kg', precioUnit: 2200 },
    ],
    h2: [
      { id: 'li-23', nombre: 'Entraña', cantPedida: 4, cantRecibida: 3, unit: 'kg', precioUnit: 3500 },
      { id: 'li-24', nombre: 'Costeleta de cerdo', cantPedida: 3, cantRecibida: 3, unit: 'kg', precioUnit: 1800 },
      { id: 'li-25', nombre: 'Pollo entero', cantPedida: 5, cantRecibida: 5, unit: 'kg', precioUnit: 1200 },
    ],
  },
  pv4: {
    h1: [
      { id: 'li-40', nombre: 'Harina 000', cantPedida: 20, cantRecibida: 20, unit: 'kg', precioUnit: 280 },
      { id: 'li-41', nombre: 'Aceite de girasol', cantPedida: 6, cantRecibida: 6, unit: 'lt', precioUnit: 430 },
      { id: 'li-42', nombre: 'Azúcar blanca', cantPedida: 10, cantRecibida: 10, unit: 'kg', precioUnit: 220 },
      { id: 'li-43', nombre: 'Sal fina', cantPedida: 5, cantRecibida: 5, unit: 'kg', precioUnit: 95 },
    ],
    h2: [
      { id: 'li-44', nombre: 'Harina 000', cantPedida: 15, cantRecibida: 15, unit: 'kg', precioUnit: 280 },
      { id: 'li-45', nombre: 'Harina vencida (rechazada)', cantPedida: 5, cantRecibida: 0, unit: 'kg', precioUnit: 280 },
      { id: 'li-46', nombre: 'Aceite de oliva', cantPedida: 3, cantRecibida: 3, unit: 'lt', precioUnit: 1800 },
    ],
  },
};

// ─── Mock provider extras ─────────────────────────────────────────────────────

const MOCK_PROVIDER_EXTRAS: Record<string, Partial<ProveedorPerfil>> = {
  pv1: {
    cuit: '30-71234567-8',
    telefonoRepartidor: '+5491155667788',
    contactoRepartidor: 'Ramón Ortiz',
    telefono: '+5491144556677',
    nombreVentas: 'Lucía Fernández',
    cbu: '0070999020000012345678',
    alias: 'huerta.organica.mp',
    diasEntrega: ['Lun', 'Mié', 'Vie'],
    plazoPago: '7 días',
    createdAt: 'Enero 2024',
  },
  pv2: {
    cuit: '30-69876543-2',
    telefonoRepartidor: '+5491166778899',
    contactoRepartidor: 'Miguel Torres',
    telefono: '+5491133445566',
    nombreVentas: 'Carlos Mendoza',
    cbu: '0070888020000098765432',
    alias: 'frigorifico.central.mp',
    diasEntrega: ['Mar', 'Jue'],
    plazoPago: '15 días',
    createdAt: 'Marzo 2023',
  },
  pv3: {
    cuit: '30-72345678-9',
    telefonoRepartidor: '+5491177889900',
    contactoRepartidor: 'Juan Pérez',
    telefono: '+5491122334455',
    nombreVentas: 'Ana Gómez',
    cbu: '0070777020000034567890',
    alias: 'lacteos.lafe.mp',
    diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    plazoPago: '30 días',
    createdAt: 'Junio 2023',
  },
  pv4: {
    cuit: '30-68765432-1',
    telefonoRepartidor: '+5491188990011',
    contactoRepartidor: 'Roberto Silva',
    telefono: '+5491111223344',
    nombreVentas: 'Patricia Ruiz',
    cbu: '0070666020000056789012',
    alias: 'distrib.almacen.mp',
    diasEntrega: ['Lun', 'Jue'],
    plazoPago: '10 días',
    createdAt: 'Febrero 2024',
  },
  pv5: {
    cuit: '30-73456789-0',
    telefonoRepartidor: '+5491199001122',
    contactoRepartidor: 'Diego Martínez',
    telefono: '+5491100112233',
    nombreVentas: 'Sofía López',
    cbu: '0070555020000078901234',
    alias: 'pescaderia.puerto.mp',
    diasEntrega: ['Mar', 'Vie'],
    plazoPago: '30 días',
    createdAt: 'Octubre 2023',
  },
  pv6: {
    cuit: '30-67654321-0',
    telefonoRepartidor: '+5491100112244',
    contactoRepartidor: 'Héctor Vega',
    telefono: '+5491188997766',
    nombreVentas: 'Valentina Cruz',
    cbu: '0070444020000090123456',
    alias: 'bebidas.express.mp',
    diasEntrega: ['Mié', 'Sáb'],
    plazoPago: '20 días',
    createdAt: 'Agosto 2023',
  },
};
const MOCK_MONTH_STATS: Record<string, MonthStat[]> = {
  pv1: [{
    id: 'ms1',
    month: 'Nov',
    amount: 38900,
    orders: 8,
    alerts: 1
  }, {
    id: 'ms2',
    month: 'Oct',
    amount: 44200,
    orders: 9,
    alerts: 0
  }, {
    id: 'ms3',
    month: 'Sep',
    amount: 41600,
    orders: 8,
    alerts: 2
  }],
  pv2: [{
    id: 'ms1',
    month: 'Nov',
    amount: 58500,
    orders: 3,
    alerts: 1
  }, {
    id: 'ms2',
    month: 'Oct',
    amount: 72000,
    orders: 4,
    alerts: 0
  }, {
    id: 'ms3',
    month: 'Sep',
    amount: 65000,
    orders: 3,
    alerts: 1
  }],
  pv3: [{
    id: 'ms1',
    month: 'Nov',
    amount: 31500,
    orders: 3,
    alerts: 0
  }, {
    id: 'ms2',
    month: 'Oct',
    amount: 38000,
    orders: 4,
    alerts: 1
  }, {
    id: 'ms3',
    month: 'Sep',
    amount: 29800,
    orders: 3,
    alerts: 0
  }],
  pv4: [{
    id: 'ms1',
    month: 'Nov',
    amount: 40600,
    orders: 3,
    alerts: 1
  }, {
    id: 'ms2',
    month: 'Oct',
    amount: 52000,
    orders: 4,
    alerts: 0
  }, {
    id: 'ms3',
    month: 'Sep',
    amount: 47500,
    orders: 4,
    alerts: 0
  }],
  pv5: [{
    id: 'ms1',
    month: 'Nov',
    amount: 10000,
    orders: 2,
    alerts: 0
  }, {
    id: 'ms2',
    month: 'Oct',
    amount: 14400,
    orders: 3,
    alerts: 0
  }, {
    id: 'ms3',
    month: 'Sep',
    amount: 12800,
    orders: 3,
    alerts: 0
  }],
  pv6: [{
    id: 'ms1',
    month: 'Nov',
    amount: 59600,
    orders: 3,
    alerts: 1
  }, {
    id: 'ms2',
    month: 'Oct',
    amount: 68000,
    orders: 4,
    alerts: 0
  }, {
    id: 'ms3',
    month: 'Sep',
    amount: 61200,
    orders: 3,
    alerts: 2
  }]
};
const FALLBACK_HISTORY: HistoryOrder[] = [{
  id: 'fh1',
  date: 'Hace 3 días',
  items: 4,
  status: 'received',
  total: 8000
}, {
  id: 'fh2',
  date: 'Hace 1 semana',
  items: 3,
  status: 'received',
  total: 6500
}];
const FALLBACK_STATS: MonthStat[] = [{
  id: 'fs1',
  month: 'Nov',
  amount: 14500,
  orders: 2,
  alerts: 0
}, {
  id: 'fs2',
  month: 'Oct',
  amount: 18000,
  orders: 3,
  alerts: 0
}, {
  id: 'fs3',
  month: 'Sep',
  amount: 16200,
  orders: 3,
  alerts: 1
}];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<OrderStatus, {
  label: string;
  dot: string;
  text: string;
  bg: string;
  icon: React.ElementType;
}> = {
  waiting: {
    label: 'En espera',
    dot: '#EAB308',
    text: '#854D0E',
    bg: '#FEF9C3',
    icon: Clock
  },
  on_way: {
    label: 'En camino',
    dot: '#EAB308',
    text: '#854D0E',
    bg: '#FEF9C3',
    icon: Truck
  },
  received: {
    label: 'Recibido',
    dot: '#22C55E',
    text: '#14532D',
    bg: '#DCFCE7',
    icon: CheckCircle2
  },
  discrepancy: {
    label: 'Con diferencias',
    dot: '#EF4444',
    text: '#7F1D1D',
    bg: '#FEE2E2',
    icon: AlertCircle
  },
  paid_cash: {
    label: 'Pago efectivo',
    dot: '#3B82F6',
    text: '#1E3A5F',
    bg: '#DBEAFE',
    icon: Wallet
  }
};
const formatMoney = (n: number) => '$' + n.toLocaleString('es-AR', {
  maximumFractionDigits: 0
});
const PROVEEDOR_CATEGORIAS = ['Carnicería', 'Verdulería', 'Pescadería', 'Lácteos', 'Almacén', 'Panadería', 'Descartables', 'Otros'] as const;
const DIAS_CHIPS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

const DAYS_OF_WEEK_DATA = [{
  id: 'dow-0',
  label: 'Dom',
  fullLabel: 'Domingo',
  value: 0
}, {
  id: 'dow-1',
  label: 'Lun',
  fullLabel: 'Lunes',
  value: 1
}, {
  id: 'dow-2',
  label: 'Mar',
  fullLabel: 'Martes',
  value: 2
}, {
  id: 'dow-3',
  label: 'Mié',
  fullLabel: 'Miércoles',
  value: 3
}, {
  id: 'dow-4',
  label: 'Jue',
  fullLabel: 'Jueves',
  value: 4
}, {
  id: 'dow-5',
  label: 'Vie',
  fullLabel: 'Viernes',
  value: 5
}, {
  id: 'dow-6',
  label: 'Sáb',
  fullLabel: 'Sábado',
  value: 6
}] as any[];
const SECTION_TABS = [{
  id: 'historial' as const,
  label: 'Historial'
}, {
  id: 'stats' as const,
  label: 'Métricas'
}, {
  id: 'programados' as const,
  label: 'Programados'
}] as any[];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProveedorPerfilSheetProps {
  proveedor: ProveedorPerfil | null;
  isOpen: boolean;
  onClose: () => void;
  onNuevoPedido?: (providerId: string) => void;
  orders?: DashboardOrder[];
}

// ─── Ficha Overlay ────────────────────────────────────────────────────────────

const FichaOverlay = ({
  proveedorFull,
  fichaEditing,
  setFichaEditing,
  onClose,
  onSave,
}: {
  proveedorFull: ProveedorPerfil;
  fichaEditing: boolean;
  setFichaEditing: (v: boolean) => void;
  onClose: () => void;
  onSave: (data: ProveedorPerfil) => void;
}) => {
  const [fichaTemp, setFichaTemp] = useState<ProveedorPerfil>({ ...proveedorFull });
  React.useEffect(() => { setFichaTemp({ ...proveedorFull }); }, [proveedorFull.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col"
      style={{ maxWidth: 448, margin: '0 auto' }}
    >
      <div className="flex items-center justify-between px-5 pt-12 pb-4 shrink-0 border-b border-neutral-100">
        <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform shrink-0">
          <ArrowLeft size={17} strokeWidth={1.75} />
        </button>
        <h2 className="text-base font-black text-black">Ficha del proveedor</h2>
        {fichaEditing ? (
          <div className="flex items-center gap-2">
            <button onClick={() => { setFichaTemp({ ...proveedorFull }); setFichaEditing(false); }} className="text-xs font-bold text-neutral-500 px-3 py-1.5 rounded-xl border border-neutral-200 active:scale-95 transition-transform">Cancelar</button>
            <button onClick={() => onSave(fichaTemp)} className="text-xs font-black text-white bg-black px-3 py-1.5 rounded-xl active:scale-95 transition-transform">Guardar</button>
          </div>
        ) : (
          <button onClick={() => { setFichaTemp({ ...proveedorFull }); setFichaEditing(true); }} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform shrink-0">
            <Edit3 size={15} strokeWidth={1.75} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-4">
        {/* Nombre */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Nombre del proveedor</label>
          {fichaEditing
            ? <input value={fichaTemp.name} onChange={e => setFichaTemp(p => ({ ...p, name: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none" />
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl">{proveedorFull.name}</p>}
        </div>

        {/* Categoría */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Categoría</label>
          {fichaEditing
            ? <select value={fichaTemp.category} onChange={e => setFichaTemp(p => ({ ...p, category: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none appearance-none">
                {PROVEEDOR_CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl">{proveedorFull.category}</p>}
        </div>

        {/* CUIT */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">CUIT</label>
          {fichaEditing
            ? <input value={fichaTemp.cuit ?? ''} onChange={e => setFichaTemp(p => ({ ...p, cuit: e.target.value }))} placeholder="30-00000000-0" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none" />
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl tabular-nums">{proveedorFull.cuit ?? '—'}</p>}
        </div>

        {/* Contacto ventas */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Nombre contacto ventas</label>
          {fichaEditing
            ? <input value={fichaTemp.nombreVentas ?? ''} onChange={e => setFichaTemp(p => ({ ...p, nombreVentas: e.target.value }))} placeholder="Nombre del vendedor" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none" />
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl">{proveedorFull.nombreVentas ?? '—'}</p>}
        </div>

        {/* Teléfono ventas */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Teléfono contacto ventas</label>
          {fichaEditing
            ? <input value={fichaTemp.telefono ?? ''} onChange={e => setFichaTemp(p => ({ ...p, telefono: e.target.value }))} placeholder="+54911..." className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none" />
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl">{proveedorFull.telefono ?? '—'}</p>}
        </div>

        {/* Repartidor nombre */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Nombre del repartidor</label>
          {fichaEditing
            ? <input value={fichaTemp.contactoRepartidor ?? ''} onChange={e => setFichaTemp(p => ({ ...p, contactoRepartidor: e.target.value }))} placeholder="Nombre del repartidor" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none" />
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl">{proveedorFull.contactoRepartidor ?? '—'}</p>}
        </div>

        {/* Repartidor teléfono */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Teléfono repartidor</label>
          {fichaEditing
            ? <input value={fichaTemp.telefonoRepartidor ?? ''} onChange={e => setFichaTemp(p => ({ ...p, telefonoRepartidor: e.target.value }))} placeholder="+54911..." className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none" />
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl">{proveedorFull.telefonoRepartidor ?? '—'}</p>}
        </div>

        {/* CBU */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">CBU</label>
          {fichaEditing
            ? <input value={fichaTemp.cbu ?? ''} onChange={e => setFichaTemp(p => ({ ...p, cbu: e.target.value }))} placeholder="CBU de 22 dígitos" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none tabular-nums" />
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl tabular-nums">{proveedorFull.cbu ?? '—'}</p>}
        </div>

        {/* Alias */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Alias de pago</label>
          {fichaEditing
            ? <input value={fichaTemp.alias ?? ''} onChange={e => setFichaTemp(p => ({ ...p, alias: e.target.value }))} placeholder="alias.pago.mp" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none" />
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl">{proveedorFull.alias ?? '—'}</p>}
        </div>

        {/* Días de entrega */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Días de entrega</label>
          {fichaEditing ? (
            <div className="flex flex-wrap gap-2">
              {DIAS_CHIPS.map(dia => {
                const selected = (fichaTemp.diasEntrega ?? []).includes(dia);
                return (
                  <button
                    key={dia}
                    onClick={() => setFichaTemp(p => ({
                      ...p,
                      diasEntrega: selected
                        ? (p.diasEntrega ?? []).filter(d => d !== dia)
                        : [...(p.diasEntrega ?? []), dia],
                    }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${selected ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'}`}
                  >{dia}</button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(proveedorFull.diasEntrega ?? []).length > 0
                ? (proveedorFull.diasEntrega ?? []).map(d => (
                  <span key={d} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-100 text-neutral-700">{d}</span>
                ))
                : <span className="text-sm text-neutral-400">—</span>
              }
            </div>
          )}
        </div>

        {/* Plazo de pago */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Plazo de pago</label>
          {fichaEditing
            ? <input value={fichaTemp.plazoPago ?? ''} onChange={e => setFichaTemp(p => ({ ...p, plazoPago: e.target.value }))} placeholder="Ej: 30 días" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none" />
            : <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl">{proveedorFull.plazoPago ?? '—'}</p>}
        </div>

        {/* Fecha de alta */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Fecha de alta</label>
          <p className="text-sm font-bold text-black px-3 py-2.5 bg-neutral-50 rounded-xl">{proveedorFull.createdAt ?? '—'}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Expanded scheduled order detail ─────────────────────────────────────────

const ScheduledOrderDetail = ({
  schedule,
  dayLabel,
  onEdit,
  onToggle,
  onDelete
}: {
  schedule: ScheduledOrder;
  dayLabel: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  return <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
      {/* Header row */}
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-3 px-4 py-3 active:bg-neutral-50 transition-colors text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
        backgroundColor: schedule.active ? '#EEF2FF' : '#F9FAFB'
      }}>
          <Repeat2 size={17} strokeWidth={2.5} style={{
          color: schedule.active ? '#6366F1' : '#9CA3AF'
        }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-black leading-tight">
            Todos los {dayLabel}s
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
            backgroundColor: schedule.active ? '#EEF2FF' : '#F3F4F6',
            color: schedule.active ? '#6366F1' : '#9CA3AF'
          }}>
              {schedule.active ? '● Activo' : '○ Pausado'}
            </span>
            <span className="text-[10px] text-neutral-300 font-medium">
              {schedule.items.length} {schedule.items.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        </div>
        <ChevronRight size={15} strokeWidth={2.5} className="text-neutral-300 transition-transform shrink-0" style={{
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
      }} />
      </button>

      {/* Expandable items */}
      <AnimatePresence>
        {expanded && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: 'auto',
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} transition={{
        duration: 0.2
      }} className="overflow-hidden">
            <div className="border-t border-neutral-100 px-4 py-3 space-y-2">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                Productos del pedido
              </p>
              {schedule.items.map(item => <div key={item.productId} className="flex items-center justify-between py-1.5 border-b border-dashed border-neutral-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black leading-tight">{item.name}</p>
                    {item.note && <p className="text-[10px] text-neutral-400 mt-0.5">{item.note}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <span className="text-sm font-black text-black tabular-nums">{item.qty}</span>
                    <span className="text-[11px] font-bold text-neutral-400">{item.unit}</span>
                  </div>
                </div>)}

              {/* Action row */}
              <div className="flex items-center gap-2 pt-2">
                <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] font-black text-neutral-700 active:scale-95 transition-transform">
                  <Package size={12} strokeWidth={2.5} />
                  <span>Editar pedido</span>
                </button>
                <button onClick={onToggle} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black border active:scale-95 transition-all" style={{
              backgroundColor: schedule.active ? '#F9FAFB' : '#EEF2FF',
              borderColor: schedule.active ? '#E5E7EB' : '#C7D2FE',
              color: schedule.active ? '#6B7280' : '#6366F1'
            }}>
                  {schedule.active ? 'Pausar' : 'Activar'}
                </button>
                <button onClick={onDelete} className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 active:bg-red-50 active:text-red-500 active:border-red-200 transition-all shrink-0">
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Next occurrence */}
            <div className="border-t border-neutral-50 px-4 py-2 flex items-center gap-2">
              <Calendar size={10} strokeWidth={2} className="text-neutral-300 shrink-0" />
              <p className="text-[10px] text-neutral-400 font-medium">
                Próximo pedido: el {dayLabel} que viene
              </p>
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ProveedorPerfilSheet = ({
  proveedor,
  isOpen,
  onClose,
  onNuevoPedido,
  orders = []
}: ProveedorPerfilSheetProps) => {
  const [activeSection, setActiveSection] = useState<'historial' | 'stats' | 'programados'>('historial');
  const [showProgramarModal, setShowProgramarModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduledOrders, setScheduledOrders] = useState<ScheduledOrder[]>([]);
  const [repeatConfirmed, setRepeatConfirmed] = useState(false);
  const [showAlertSheet, setShowAlertSheet] = useState(false);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<HistoryOrder | null>(null);
  const [showProveedorInfo, setShowProveedorInfo] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [historialSearch, setHistorialSearch] = useState('');

  // Ficha editable state
  const [showFicha, setShowFicha] = useState(false);
  const [fichaEditing, setFichaEditing] = useState(false);
  const [proveedorData, setProveedorData] = useState<ProveedorPerfil | null>(null);

  if (!proveedor) return null;

  const proveedorFull: ProveedorPerfil = proveedorData ?? { ...proveedor };

  const providerRealOrders = orders.filter(o => o.provider === proveedor.name);
  const history: HistoryOrder[] = providerRealOrders.length > 0
    ? providerRealOrders.map(o => {
        const lineItems = (o.orderItems ?? []).map(it => ({
          id: it.id,
          nombre: it.name,
          cantPedida: it.requestedQty,
          cantRecibida: it.receivedQty > 0 ? it.receivedQty : it.requestedQty,
          unit: it.unit,
          precioUnit: it.precioUnit ?? 0,
        }));
        // Total = suma de (cantidad recibida × precio unitario)
        const computedTotal = lineItems.some(li => li.precioUnit > 0)
          ? lineItems.reduce((s, li) => s + li.cantRecibida * li.precioUnit, 0)
          : (o.total ?? 0);
        return {
          id: o.id,
          date: o.receivedAt ?? o.time,
          items: o.items,
          status: o.status,
          total: computedTotal,
          hasAlert: (o.alerts ?? []).length > 0,
          alertMsg: (o.alerts ?? []).find(a => !a.resolved)?.message ?? (o.alerts ?? [])[0]?.message,
          receptionNote: o.receptionNote,
          hasRemito: o.status === 'received' || o.status === 'discrepancy' || o.status === 'paid_cash',
          paymentStatus: (o.status === 'paid_cash' || o.paymentStatus === 'paid_digital' || o.paymentStatus === 'confirmed') ? 'paid' : 'pending',
          orderNote: o.orderNote,
          creadoPor: o.creadoPor,
          deliveryDate: o.deliveryDate,
          alertResolved: (o.alerts ?? []).length > 0 && (o.alerts ?? []).every(a => a.resolved),
          rawAlerts: o.alerts,
          lineItems,
        };
      })
    : [];
  const monthStats: MonthStat[] = [];
  const totalAlertsActive = history.filter(o => o.hasAlert && !o.alertResolved).length;
  const totalAlertsAll = history.filter(o => o.hasAlert).length;
  const totalAlerts = totalAlertsActive; // used for showing alert sheet (only active)

  // Real stats derived from actual orders
  const realThisMonthAmount = history.reduce((s, o) => s + (o.total ?? 0), 0);
  const realThisMonthOrders = history.length;
  const thisMonthStat = providerRealOrders.length > 0
    ? { amount: realThisMonthAmount, orders: realThisMonthOrders }
    : (monthStats[0] ?? { amount: 0, orders: 0 });
  const lastMonthStat = providerRealOrders.length > 0 ? null : (monthStats[1] ?? null);
  const monthDelta = lastMonthStat ? Math.round((thisMonthStat.amount - lastMonthStat.amount) / lastMonthStat.amount * 100) : 0;
  const maxAmount = providerRealOrders.length > 0
    ? Math.max(realThisMonthAmount, 1)
    : Math.max(...monthStats.map(m => m.amount));
  const lastOrder = history[0] ?? null;
  const providerSchedules = scheduledOrders.filter(s => s.providerId === proveedor.id);
  const takenDays = providerSchedules.map(s => s.dayOfWeek);
  const handleRepeatLastOrder = () => {
    if (!lastOrder) return;
    setRepeatConfirmed(true);
    setTimeout(() => {
      onNuevoPedido?.(proveedor.id);
      setRepeatConfirmed(false);
    }, 700);
  };
  const handleScheduleConfirm = (payload: ScheduledOrderPayload) => {
    const dayLabel = DAYS_OF_WEEK_DATA.find(d => d.value === payload.dayOfWeek)?.fullLabel ?? '';
    if (editingScheduleId) {
      // editing existing
      setScheduledOrders(prev => prev.map(s => s.id === editingScheduleId ? {
        ...s,
        dayOfWeek: payload.dayOfWeek,
        items: payload.items,
        createdAt: `Todos los ${dayLabel}s`
      } : s));
      setEditingScheduleId(null);
    } else {
      const newSchedule: ScheduledOrder = {
        id: `sched-${Date.now()}`,
        providerId: proveedor.id,
        providerName: proveedor.name,
        dayOfWeek: payload.dayOfWeek,
        active: true,
        createdAt: `Todos los ${dayLabel}s`,
        items: payload.items
      };
      setScheduledOrders(prev => [...prev, newSchedule]);
    }
    setShowProgramarModal(false);
    setActiveSection('programados');
  };
  const handleToggleSchedule = (scheduleId: string) => {
    setScheduledOrders(prev => prev.map(s => s.id === scheduleId ? {
      ...s,
      active: !s.active
    } : s));
  };
  const handleDeleteSchedule = (scheduleId: string) => {
    setScheduledOrders(prev => prev.filter(s => s.id !== scheduleId));
  };
  const handleEditSchedule = (scheduleId: string) => {
    setEditingScheduleId(scheduleId);
    setShowProgramarModal(true);
  };
  return <AnimatePresence>
      {isOpen && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.18
    }} className="fixed inset-0 z-50 flex flex-col justify-end" style={{
      maxWidth: 448,
      margin: '0 auto'
    }}>
          {/* Backdrop */}
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="absolute inset-0 bg-black/50" onClick={onClose} />

          {/* Sheet */}
          <motion.div initial={{
        y: '100%'
      }} animate={{
        y: 0
      }} exit={{
        y: '100%'
      }} transition={{
        type: 'spring',
        damping: 30,
        stiffness: 320
      }} className="relative flex flex-col bg-white rounded-t-3xl overflow-hidden" style={{
        height: '92vh'
      }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-neutral-200" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 pb-4 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl font-black shrink-0">
                    <span>{proveedor.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-black leading-tight">{proveedor.name}</h2>
                      {proveedor.isOrganic && <span className="inline-flex items-center gap-0.5 bg-neutral-100 text-neutral-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                          <Leaf size={9} />
                          <span>Org</span>
                        </span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Tag size={9} />
                        <span>{proveedor.category}</span>
                      </span>
                      <button
                        onClick={() => { setShowFicha(true); setFichaEditing(false); }}
                        className="text-[11px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Info size={9} />
                        <span>ficha</span>
                      </button>
                      {proveedor.lastOrderDate && <span className="text-[11px] text-neutral-400 flex items-center gap-0.5">
                          <Clock size={9} />
                          <span>{proveedor.lastOrderDate}</span>
                        </span>}
                      {providerSchedules.filter(s => s.active).length > 0 && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Repeat2 size={8} strokeWidth={2.5} />
                          <span>{providerSchedules.filter(s => s.active).length} prog.</span>
                        </span>}
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform shrink-0">
                  <X size={17} strokeWidth={2} />
                </button>
              </div>

              {/* Info panel placeholder — ficha opens as overlay */}

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mb-1">Este mes</p>
                  <p className="text-base font-black text-black leading-none tabular-nums">
                    {formatMoney(thisMonthStat?.amount ?? 0)}
                  </p>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mb-1">Pedidos</p>
                  <p className="text-base font-black text-black leading-none tabular-nums">
                    {thisMonthStat?.orders ?? 0}
                  </p>
                </div>
                <button onClick={() => {
              if (totalAlertsAll > 0) setShowAlertSheet(true);
            }} className={`rounded-xl px-3 py-2.5 border text-left transition-all ${totalAlertsAll > 0 ? 'active:scale-95' : ''}`} style={{
              backgroundColor: totalAlertsAll > 0 ? '#FEE2E2' : '#DCFCE7',
              borderColor: totalAlertsAll > 0 ? '#FECACA' : '#BBF7D0'
            }}>
                  <p className="text-[9px] font-bold uppercase tracking-wide mb-1" style={{
                color: totalAlertsAll > 0 ? '#991B1B' : '#14532D'
              }}>
                    Alertas
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-black leading-none tabular-nums" style={{
                  color: totalAlertsAll > 0 ? '#EF4444' : '#22C55E'
                }}>
                      {totalAlertsAll}
                    </p>
                    {totalAlertsAll > 0 && <ArrowRight size={12} strokeWidth={2.5} style={{ color: '#EF4444' }} />}
                  </div>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                {/* Nuevo pedido */}
                <button onClick={() => onNuevoPedido?.(proveedor.id)} className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-black text-xs active:scale-95 transition-transform">
                  <Package size={14} strokeWidth={2.5} />
                  <span>Nuevo pedido</span>
                </button>

                {/* Repetir último */}
                {lastOrder && <button onClick={handleRepeatLastOrder} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs active:scale-95 transition-all border" style={{
              backgroundColor: repeatConfirmed ? '#F0FDF4' : '#F9FAFB',
              borderColor: repeatConfirmed ? '#BBF7D0' : '#E5E7EB',
              color: repeatConfirmed ? '#15803D' : '#111827'
            }}>
                    {repeatConfirmed ? <Check size={14} strokeWidth={3} /> : <RotateCcw size={14} strokeWidth={2.5} />}
                    <span>{repeatConfirmed ? 'Creando...' : 'Repetir último'}</span>
                  </button>}

                {/* Programar */}
                <button onClick={() => {
              setEditingScheduleId(null);
              setShowProgramarModal(true);
            }} className="w-11 h-11 flex items-center justify-center bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 active:scale-95 transition-transform shrink-0" aria-label="Programar pedido">
                  <CalendarClock size={16} strokeWidth={2} />
                </button>

                {/* WhatsApp */}
                {proveedor.telefono && <button className="w-11 h-11 flex items-center justify-center bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600 active:scale-95 transition-transform shrink-0">
                    <MessageCircle size={16} strokeWidth={2} />
                  </button>}
              </div>

              {/* Scheduled orders banner */}
              {providerSchedules.filter(s => s.active).length > 0 && <motion.button initial={{
            opacity: 0,
            y: 4
          }} animate={{
            opacity: 1,
            y: 0
          }} onClick={() => setActiveSection('programados')} className="w-full mt-3 flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 active:bg-indigo-100 transition-colors">
                  <Repeat2 size={13} strokeWidth={2.5} className="text-indigo-500 shrink-0" />
                  <p className="text-[11px] font-bold text-indigo-700 flex-1 text-left">
                    {providerSchedules.filter(s => s.active).length === 1 ? `Pedido programado: ${DAYS_OF_WEEK_DATA.find(d => d.value === providerSchedules.filter(s => s.active)[0].dayOfWeek)?.fullLabel}s` : `${providerSchedules.filter(s => s.active).length} pedidos programados activos`}
                  </p>
                  <ChevronRight size={13} strokeWidth={2.5} className="text-indigo-400 shrink-0" />
                </motion.button>}
            </div>

            <div className="h-px bg-neutral-100 mx-5 shrink-0" />

            {/* Section tabs */}
            <div className="px-5 pt-3 pb-0 shrink-0">
              <div className="flex gap-0 bg-neutral-100 rounded-xl p-1">
                {SECTION_TABS.map(tab => <button key={tab.id} onClick={() => setActiveSection(tab.id)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all relative ${activeSection === tab.id ? 'bg-white text-black shadow-sm' : 'text-neutral-400'}`}>
                    <span>{tab.label}</span>
                    {tab.id === 'programados' && providerSchedules.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center ring-2 ring-neutral-100">
                        <span className="text-[8px] font-black text-white">{providerSchedules.length}</span>
                      </span>}
                  </button>)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10">
              <AnimatePresence mode="wait">

                {/* ── HISTORIAL ── */}
                {activeSection === 'historial' && <motion.div key="historial" initial={{
              opacity: 0,
              x: 12
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -12
            }} transition={{
              duration: 0.18
            }} className="space-y-3">
                    {/* Search bar */}
                    <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
                      <Search size={14} className="text-neutral-400 shrink-0" strokeWidth={2} />
                      <input
                        type="text"
                        value={historialSearch}
                        onChange={e => setHistorialSearch(e.target.value)}
                        placeholder="Buscar por fecha (ej: semana, hoy...)"
                        className="flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-300 outline-none font-medium"
                      />
                      {historialSearch && <button onClick={() => setHistorialSearch('')} className="text-neutral-300 active:text-neutral-500"><X size={13} strokeWidth={2.5} /></button>}
                    </div>
                    {history.length === 0 && (
                      <div className="py-12 flex flex-col items-center gap-2 text-center">
                        <Package size={24} className="text-neutral-300" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-neutral-400">Todavía no hay pedidos realizados</p>
                        <p className="text-xs text-neutral-300">Los pedidos aparecerán aquí una vez que los hagas</p>
                      </div>
                    )}
                    {history.length > 0 && history.filter(o => !historialSearch || o.date.toLowerCase().includes(historialSearch.toLowerCase())).length === 0 && (
                      <div className="py-10 flex flex-col items-center gap-2 text-center">
                        <Calendar size={22} className="text-neutral-300" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-neutral-400">Sin resultados para "{historialSearch}"</p>
                      </div>
                    )}
                    {history.filter(o => !historialSearch || o.date.toLowerCase().includes(historialSearch.toLowerCase())).map(order => {
                const cfg = STATUS_CFG[order.status];
                const Icon = cfg.icon;
                return <div key={order.id} className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                          <div className="flex">
                            <div className="w-1 shrink-0" style={{
                      backgroundColor: cfg.dot
                    }} />
                            <div className="flex-1 px-4 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                                      <Calendar size={9} />
                                      <span>{order.date}</span>
                                    </span>
                                    <span className="text-[10px] text-neutral-300">·</span>
                                    <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                                      <Package size={9} />
                                      <span>{order.items} items</span>
                                    </span>
                                  </div>
                                  <p className="font-black text-black text-sm">{formatMoney(order.total)}</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0" style={{
                          backgroundColor: cfg.bg,
                          color: cfg.text
                        }}>
                                  <Icon size={10} strokeWidth={2.5} />
                                  <span>{cfg.label}</span>
                                </div>
                              </div>

                              {order.hasAlert && order.alertMsg && (
                                order.alertResolved
                                  ? <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                                      <CheckCircle2 size={12} className="text-green-500 shrink-0" strokeWidth={2.5} />
                                      <p className="text-[11px] text-green-700 font-medium leading-tight line-through opacity-70">{order.alertMsg}</p>
                                      <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide shrink-0">Resuelta</span>
                                    </div>
                                  : <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                      <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                                      <p className="text-[11px] text-red-600 font-medium leading-tight">{order.alertMsg}</p>
                                    </div>
                              )}

                              <div className="flex justify-end mt-2">
                                <button onClick={() => { setSelectedHistoryOrder(order); setShowOrderDetail(true); }} className="text-[11px] font-bold text-neutral-400 flex items-center gap-0.5 active:text-black transition-colors">
                                  <span>Ver detalle</span>
                                  <ArrowRight size={11} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>;
              })}
                  </motion.div>}

                {/* ── MÉTRICAS ── */}
                {activeSection === 'stats' && <motion.div key="stats" initial={{
              opacity: 0,
              x: 12
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -12
            }} transition={{
              duration: 0.18
            }} className="space-y-4">
                    <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={13} strokeWidth={2.5} className="text-neutral-400" />
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Gasto mensual
                        </p>
                      </div>
                      <div className="flex items-end gap-3">
                        <p className="text-3xl font-black text-black tabular-nums leading-none">
                          {formatMoney(thisMonthStat?.amount ?? 0)}
                        </p>
                        {lastMonthStat && <span className="text-xs font-black mb-1 px-2 py-0.5 rounded-full" style={{
                    backgroundColor: monthDelta >= 0 ? '#FEF9C3' : '#DCFCE7',
                    color: monthDelta >= 0 ? '#854D0E' : '#14532D'
                  }}>
                            {monthDelta >= 0 ? '+' : ''}{monthDelta}% vs mes ant.
                          </span>}
                      </div>
                    </div>

                    <div className="bg-white border border-neutral-100 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                        Últimos 3 meses
                      </p>
                      <div className="flex items-end gap-3 h-28">
                        {monthStats.map((m, idx) => {
                    const barHeight = maxAmount > 0 ? Math.round(m.amount / maxAmount * 100) : 0;
                    const isFirst = idx === 0;
                    return <div key={m.id} className="flex-1 flex flex-col items-center gap-2">
                              <p className="text-[10px] font-black text-black tabular-nums">
                                {formatMoney(m.amount)}
                              </p>
                              <div className="w-full flex items-end" style={{
                        height: 72
                      }}>
                                <div className="w-full rounded-t-lg transition-all" style={{
                          height: `${barHeight}%`,
                          minHeight: 8,
                          backgroundColor: isFirst ? '#000' : '#E5E7EB'
                        }} />
                              </div>
                              <p className="text-[10px] font-bold text-neutral-400">{m.month}</p>
                            </div>;
                  })}
                      </div>
                    </div>

                    <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-neutral-100">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Detalle por mes
                        </p>
                      </div>
                      {monthStats.map(m => <div key={m.id} className="flex items-center justify-between px-4 py-3 border-b border-dashed border-neutral-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                              <p className="text-[10px] font-black text-neutral-600">{m.month}</p>
                            </div>
                            <div>
                              <p className="text-sm font-black text-black">{formatMoney(m.amount)}</p>
                              <p className="text-[11px] text-neutral-400 font-medium">{m.orders} pedidos</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.alerts > 0 ? <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                <AlertCircle size={9} strokeWidth={2.5} />
                                <span>{m.alerts} {m.alerts === 1 ? 'alerta' : 'alertas'}</span>
                              </span> : <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={9} strokeWidth={2.5} />
                                <span>Sin alertas</span>
                              </span>}
                          </div>
                        </div>)}
                    </div>

                    {(proveedor.diasEntrega || proveedor.plazoPago) && <div className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3 space-y-2.5">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                          Info del proveedor
                        </p>
                        {proveedor.diasEntrega && <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                              <Truck size={11} strokeWidth={2} />
                              <span>Días de entrega</span>
                            </span>
                            <span className="text-xs font-black text-black">{proveedor.diasEntrega.join(', ')}</span>
                          </div>}
                        {proveedor.plazoPago && <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                              <Wallet size={11} strokeWidth={2} />
                              <span>Plazo de pago</span>
                            </span>
                            <span className="text-xs font-black text-black">{proveedor.plazoPago}</span>
                          </div>}
                        {proveedor.telefono && <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                              <Phone size={11} strokeWidth={2} />
                              <span>Teléfono</span>
                            </span>
                            <span className="text-xs font-black text-black">{proveedor.telefono}</span>
                          </div>}
                      </div>}
                  </motion.div>}

                {/* ── PROGRAMADOS ── */}
                {activeSection === 'programados' && <motion.div key="programados" initial={{
              opacity: 0,
              x: 12
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -12
            }} transition={{
              duration: 0.18
            }} className="space-y-3">
                    {providerSchedules.length === 0 ? <div className="py-14 flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                          <CalendarClock size={24} className="text-neutral-300" />
                        </div>
                        <p className="text-sm font-bold text-neutral-400">Sin pedidos programados</p>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          Programá un pedido semanal con los productos que querés y se creará automáticamente cada semana
                        </p>
                        <button onClick={() => {
                  setEditingScheduleId(null);
                  setShowProgramarModal(true);
                }} className="mt-2 flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs active:scale-95 transition-transform">
                          <CalendarClock size={13} strokeWidth={2.5} />
                          <span>Programar pedido</span>
                        </button>
                      </div> : <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                            Pedidos recurrentes
                          </p>
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {providerSchedules.filter(s => s.active).length} activos
                          </span>
                        </div>
                        {providerSchedules.map(schedule => {
                  const dayLabel = DAYS_OF_WEEK_DATA.find(d => d.value === schedule.dayOfWeek)?.fullLabel ?? '';
                  return <ScheduledOrderDetail key={schedule.id} schedule={schedule} dayLabel={dayLabel} onEdit={() => handleEditSchedule(schedule.id)} onToggle={() => handleToggleSchedule(schedule.id)} onDelete={() => handleDeleteSchedule(schedule.id)} />;
                })}

                        <button onClick={() => {
                  setEditingScheduleId(null);
                  setShowProgramarModal(true);
                }} className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-400 text-xs font-black active:bg-neutral-50 transition-colors">
                          <Plus size={13} strokeWidth={2.5} />
                          <span>Agregar otro día programado</span>
                        </button>
                      </div>}
                  </motion.div>}

              </AnimatePresence>
            </div>
          </motion.div>

          {/* Programar Pedido Modal */}
          <ProgramarPedidoModal isOpen={showProgramarModal} proveedor={proveedor} takenDays={editingScheduleId ? takenDays.filter(d => d !== scheduledOrders.find(s => s.id === editingScheduleId)?.dayOfWeek) : takenDays} onClose={() => {
        setShowProgramarModal(false);
        setEditingScheduleId(null);
      }} onConfirm={handleScheduleConfirm} />

          {/* Alert History Sheet */}
          <AnimatePresence>
            {showAlertSheet && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="fixed inset-0 z-[70] flex flex-col justify-end" style={{
          maxWidth: 448,
          margin: '0 auto'
        }}>
                <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="absolute inset-0 bg-black/50" onClick={() => setShowAlertSheet(false)} />
                <motion.div initial={{
            y: '100%'
          }} animate={{
            y: 0
          }} exit={{
            y: '100%'
          }} transition={{
            type: 'spring',
            damping: 30,
            stiffness: 320
          }} className="relative flex flex-col bg-white rounded-t-3xl overflow-hidden max-h-[75vh]">
                  <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-9 h-1 rounded-full bg-neutral-200" /></div>
                  <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
                    <div>
                      <h2 className="text-base font-black text-black leading-tight">Alertas del proveedor</h2>
                      <p className="text-xs text-neutral-400 font-medium mt-0.5">{proveedor.name} · {totalAlerts} alerta{totalAlerts !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => setShowAlertSheet(false)} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform"><X size={17} strokeWidth={2} /></button>
                  </div>
                  <div className="h-px bg-neutral-100 mx-5 shrink-0" />
                  <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-3">
                    {history.filter(o => o.hasAlert).map(order => <div key={order.id} className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3">
                          <div className="flex items-start gap-2 mb-2">
                            <AlertCircle size={13} strokeWidth={2} className="text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-red-900 leading-tight">{order.alertMsg}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                                  <Calendar size={9} />
                                  <span>{order.date}</span>
                                </span>
                                <span className="text-[10px] text-red-300">·</span>
                                <span className="text-[10px] font-bold text-red-400">{formatMoney(order.total)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-red-100">
                            <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1">Estado del pedido</p>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide w-fit" style={{
                      backgroundColor: STATUS_CFG[order.status].bg,
                      color: STATUS_CFG[order.status].text
                    }}>
                              <span>{STATUS_CFG[order.status].label}</span>
                            </div>
                          </div>
                        </div>
                      </div>)}
                  </div>
                </motion.div>
              </motion.div>}
          </AnimatePresence>

          {/* Order Detail Overlay */}
          <AnimatePresence>
            {showOrderDetail && selectedHistoryOrder && (
              <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                className="fixed inset-0 z-[60] bg-white flex flex-col"
                style={{ maxWidth: 448, margin: '0 auto' }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0 border-b border-neutral-100">
                  <button onClick={() => { setShowOrderDetail(false); setSelectedHistoryOrder(null); }} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform shrink-0">
                    <ArrowLeft size={17} strokeWidth={1.75} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-black text-black leading-tight truncate">{proveedor.name}</h2>
                    <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{selectedHistoryOrder.date}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0" style={{ backgroundColor: STATUS_CFG[selectedHistoryOrder.status].bg, color: STATUS_CFG[selectedHistoryOrder.status].text }}>
                    <span>{STATUS_CFG[selectedHistoryOrder.status].label}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-5">
                  {/* Total + meta */}
                  <div className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Fecha</p>
                        <p className="text-sm font-bold text-black">{selectedHistoryOrder.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Total</p>
                        <p className="text-2xl font-black text-black tabular-nums leading-none">{formatMoney(selectedHistoryOrder.total)}</p>
                      </div>
                    </div>
                    {(selectedHistoryOrder.creadoPor || selectedHistoryOrder.deliveryDate) && (
                      <div className="flex gap-3 pt-2 border-t border-neutral-200">
                        {selectedHistoryOrder.creadoPor && (
                          <div className="flex-1">
                            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Pedido por</p>
                            <p className="text-xs font-bold text-neutral-700">{selectedHistoryOrder.creadoPor}</p>
                          </div>
                        )}
                        {selectedHistoryOrder.deliveryDate && (
                          <div className="flex-1">
                            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Entrega</p>
                            <p className="text-xs font-bold text-neutral-700">🚚 {selectedHistoryOrder.deliveryDate}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedHistoryOrder.orderNote && (
                      <div className="pt-2 border-t border-neutral-200">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Nota del pedido</p>
                        <p className="text-xs text-neutral-600 font-medium">"{selectedHistoryOrder.orderNote}"</p>
                      </div>
                    )}
                  </div>

                  {/* Line items table */}
                  {(selectedHistoryOrder.lineItems ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Detalle del pedido</p>
                      {/* Difference alert */}
                      {selectedHistoryOrder.lineItems!.some(li => li.cantRecibida < li.cantPedida) && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3">
                          <AlertCircle size={13} className="text-red-500 shrink-0" strokeWidth={2.5} />
                          <p className="text-xs font-bold text-red-800">Diferencia de recepción detectada</p>
                        </div>
                      )}
                      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                        {/* Table header */}
                        <div className="px-3 py-2 border-b border-neutral-100 grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Producto</p>
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide text-right">Ped.</p>
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide text-right">Rec.</p>
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide text-right">P.unit</p>
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide text-right">Total</p>
                        </div>
                        {selectedHistoryOrder.lineItems!.map((li, idx) => {
                          const hasDiscrepancy = li.cantRecibida < li.cantPedida;
                          return (
                            <div key={li.id} className={`px-3 py-2.5 grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center border-b border-neutral-50 last:border-0 ${hasDiscrepancy ? 'bg-red-50' : ''}`}>
                              <p className={`text-xs font-bold truncate ${hasDiscrepancy ? 'text-red-700' : 'text-neutral-800'}`}>{li.nombre}</p>
                              <p className="text-[11px] font-bold text-neutral-500 tabular-nums text-right">{li.cantPedida}{li.unit}</p>
                              <p className={`text-[11px] font-black tabular-nums text-right ${hasDiscrepancy ? 'text-red-600' : 'text-neutral-700'}`}>{li.cantRecibida}{li.unit}</p>
                              <p className="text-[11px] text-neutral-500 tabular-nums text-right">{formatMoney(li.precioUnit)}</p>
                              <p className="text-[11px] font-black text-neutral-800 tabular-nums text-right">{formatMoney(li.cantRecibida * li.precioUnit)}</p>
                            </div>
                          );
                        })}
                        {/* Subtotal row — calculated from received qty × price */}
                        <div className="px-3 py-2.5 flex items-center justify-between border-t border-neutral-100 bg-neutral-50">
                          <p className="text-xs font-bold text-neutral-600">Total recibido</p>
                          <p className="text-sm font-black text-black tabular-nums">
                            {formatMoney(selectedHistoryOrder.lineItems!.reduce((s, li) => s + li.cantRecibida * li.precioUnit, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── RECEPCIÓN ── */}
                  {(selectedHistoryOrder.status === 'received' || selectedHistoryOrder.status === 'discrepancy' || selectedHistoryOrder.status === 'paid_cash') && (
                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Recepción</p>
                      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden divide-y divide-neutral-50">
                        {/* Remito */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                            <Camera size={16} className="text-neutral-400" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-neutral-700">{selectedHistoryOrder.hasRemito !== false ? `remito_${selectedHistoryOrder.id}.jpg` : 'Sin remito adjunto'}</p>
                            {selectedHistoryOrder.hasRemito !== false && (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle2 size={9} className="text-green-500" strokeWidth={2.5} />
                                <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide">Verificado · {selectedHistoryOrder.date}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Alerts — all, with resolved state */}
                        {(selectedHistoryOrder.rawAlerts ?? []).map(alert => (
                          <div key={alert.id} className={`px-4 py-3 flex items-start gap-2 ${alert.resolved ? 'bg-green-50' : 'bg-red-50'}`}>
                            {alert.resolved
                              ? <CheckCircle2 size={12} strokeWidth={2} className="text-green-500 shrink-0 mt-0.5" />
                              : <AlertCircle size={12} strokeWidth={2} className="text-red-500 shrink-0 mt-0.5" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-xs font-black leading-tight ${alert.resolved ? 'text-green-800 line-through opacity-60' : 'text-red-900'}`}>{alert.message}</p>
                                {alert.resolved && <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide shrink-0">Resuelta</span>}
                              </div>
                              <p className={`text-[10px] mt-0.5 font-medium ${alert.resolved ? 'text-green-500' : 'text-red-400'}`}>
                                {alert.resolved ? `Resuelta · ${alert.timestamp}` : `Diferencia detectada · ${alert.timestamp}`}
                              </p>
                            </div>
                          </div>
                        ))}
                        {/* Reception note */}
                        {selectedHistoryOrder.receptionNote && (
                          <div className="px-4 py-3 bg-amber-50">
                            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Nota del receptor</p>
                            <p className="text-xs text-amber-900 font-medium">{selectedHistoryOrder.receptionNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── PAGOS ── */}
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Pagos</p>
                    <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                      {selectedHistoryOrder.paymentStatus === 'paid' || selectedHistoryOrder.status === 'paid_cash' ? (
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} className="text-green-500" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-green-700">Pagado</p>
                            {selectedHistoryOrder.paymentDate && <p className="text-[10px] text-neutral-400 font-medium mt-0.5">{selectedHistoryOrder.paymentDate}</p>}
                            {selectedHistoryOrder.paymentMethod && (
                              <div className="flex items-center gap-1 mt-1">
                                {selectedHistoryOrder.paymentMethod === 'cash' ? <Banknote size={9} strokeWidth={2.5} className="text-neutral-400" /> : selectedHistoryOrder.paymentMethod === 'transfer' ? <CreditCard size={9} strokeWidth={2.5} className="text-neutral-400" /> : <Receipt size={9} strokeWidth={2.5} className="text-neutral-400" />}
                                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">{selectedHistoryOrder.paymentMethod === 'cash' ? 'Efectivo' : selectedHistoryOrder.paymentMethod === 'transfer' ? 'Transferencia' : 'Cheque'}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-base font-black text-black tabular-nums">{formatMoney(selectedHistoryOrder.total)}</p>
                        </div>
                      ) : (
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                            <Clock size={16} className="text-orange-400" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-orange-700">Pago pendiente</p>
                            <p className="text-[10px] text-neutral-400 font-medium mt-0.5">{formatMoney(selectedHistoryOrder.total)} por pagar</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ficha Overlay */}
          <AnimatePresence>
            {showFicha && (
              <FichaOverlay
                proveedorFull={proveedorFull}
                fichaEditing={fichaEditing}
                setFichaEditing={setFichaEditing}
                onClose={() => { setShowFicha(false); setFichaEditing(false); }}
                onSave={(data) => { setProveedorData(data); setFichaEditing(false); }}
              />
            )}
          </AnimatePresence>
        </motion.div>}
    </AnimatePresence>;
};