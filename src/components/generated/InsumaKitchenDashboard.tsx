import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, Truck, PackageCheck, Plus, Search, Bell, ChevronRight, Clock, AlertCircle, CheckCircle2, Wallet, Store, CreditCard, Leaf, X, ArrowRight, ChevronDown, Calendar, Banknote, Check, ExternalLink, History, Receipt, Send, MessageSquare, StickyNote, Edit3, Upload, Camera, Package, BarChart2, BookOpen, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NuevoPedidoModal } from './NuevoPedidoModal';
import { NuevoProveedorModal } from './NuevoProveedorModal';
import { ProveedorPerfilSheet } from './ProveedorPerfilSheet';
import { RecepcionPedidoModal } from './RecepcionPedidoModal';
import { PagosTabEnhanced } from './PagosProveedorSheet';
import { MetricasTab } from './MetricasTab';
import { RecetasTab, CATALOG_INSUMOS } from './RecetasTab';
import { NuevoInsumoModal } from './NuevoInsumoModal';
import { InsumaLogo } from './InsumaLogo';
import { loadUsuarios as loadUsuariosDB, loadNegocio, loadInsumos, crearInsumo } from '../../lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile { id: string; name: string; role: 'admin' | 'chef'; pin?: string; }

type OrderStatus = 'waiting' | 'on_way' | 'received' | 'discrepancy' | 'paid_cash';
type PaymentStatus = 'pending' | 'confirmed' | 'paid_digital';
interface OrderItem {
  id: string;
  name: string;
  requestedQty: number;
  receivedQty: number;
  unit: string;
  status: 'ok' | 'discrepancy' | 'pending';
  alertMsg: string;
}
interface Alert {
  id: string;
  orderId: string;
  provider: string;
  itemName: string;
  message: string;
  resolved: boolean;
  timestamp: string;
}
interface PaymentHistoryEvent {
  id: string;
  type: 'received' | 'alerted' | 'paid_digital' | 'confirmed_cash' | 'comprobante_sent' | 'billing_discrepancy';
  label: string;
  timestamp: string;
  detail?: string;
}
interface Order {
  id: string;
  provider: string;
  providerPhone?: string;
  providerAlias?: string;
  providerCbu?: string;
  category: string;
  status: OrderStatus;
  time: string;
  items: number;
  isOrganic?: boolean;
  total?: number;
  deliveryDate?: string;
  orderItems?: OrderItem[];
  alerts?: Alert[];
  paymentStatus?: PaymentStatus;
  receivedAt?: string;
  weekLabel?: string;
  paymentHistory?: PaymentHistoryEvent[];
  hasBillingDiscrepancy?: boolean;
  orderNote?: string;
  receptionNote?: string;
  creadoPor?: string;
  recepcionadoPor?: string;
}
interface Provider {
  id: string;
  name: string;
  category: string;
  isOrganic?: boolean;
  lastOrderDate?: string;
  telefono?: string;
  nombreVentas?: string;
  email?: string;
  alias?: string;
  cbu?: string;
  cuit?: string;
  diasEntrega?: string[];
  plazoPago?: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [];
const INITIAL_PROVIDERS: Provider[] = [
  { id: 'e8ccfe93', name: 'Zuccardi', category: 'Bebidas', telefono: '+5491165310391', nombreVentas: 'Sergio / fernanda doll', email: 'sarregui@familiazuccardi.com', cuit: '30-51787491-0', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '15 días' },
  { id: 'prov1', name: 'Fura', category: 'Carnes', telefono: '+5491156937934', nombreVentas: 'Ariel', email: 'comprobantesfura@gmail.com', cuit: '3694464056', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días' },
  { id: 'prov2', name: 'Santo berraco', category: 'Carnes', telefono: '+5491122506002', nombreVentas: 'Santo berraco', email: 'santoberraco@gmail.com', cbu: '0070028320000009570717', cuit: '30716480719', diasEntrega: ['Lun', 'Mié'], plazoPago: '7 días' },
  { id: 'prov3', name: 'Cocorokeen', category: 'Bebidas', telefono: '+5491170040501', cuit: '30-71421721-2', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
  { id: 'prov4', name: 'Patricia Graffer', category: 'Verduras', telefono: '+5492226472711', nombreVentas: 'Patricia Graffer', diasEntrega: ['Mié'] },
  { id: 'prov5', name: 'The grocery', category: 'Verduras', telefono: '+5491167083458', nombreVentas: 'Daniel central', email: 'thegrocerypalermo@gmail.com', alias: 'thegrocery-distribu', cbu: '000003100020299695455', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días' },
  { id: 'a4eb5955', name: '4 estaciones', category: 'Verduras', telefono: '+5491150496176', nombreVentas: 'Pablo bonano', email: 'bolsonorganicoentucasa@gmail.com', alias: '4estaciones.producto', cbu: '0720084788000002275404', cuit: '20-27282431-3', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días' },
  { id: 'prov6', name: 'Gabi verduleria', category: 'Verduras', telefono: '+5491136294534' },
  { id: 'prov7', name: 'Barrio chino', category: 'Verduras', telefono: '+5491140969494', nombreVentas: 'Mari', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
  { id: 'prov8', name: 'Kaiken', category: 'Bebidas', telefono: '+5491167073332' },
  { id: 'prov9', name: 'Adrian huevos', category: 'Lácteos', telefono: '+5491165461043', nombreVentas: 'Adrian Alejandro Cambón', alias: 'PERRO.TEATRO.GROSOR', cbu: '00702418 30004017164628', cuit: '20267604062', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días' },
  { id: 'prov10', name: 'Coppola', category: 'Bebidas', telefono: '+5491165462877', nombreVentas: 'Nadia', cbu: '19100506-55005000934546', cuit: '20-17367047-9', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
  { id: 'prov11', name: 'Soleil', category: 'Almacén', telefono: '+5491128324242', nombreVentas: 'Sol', alias: 'LE.SOLEIL', cbu: '0720476488000000166036', cuit: '2728 44 73 510', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días' },
  { id: 'prov12', name: 'Quilmes', category: 'Bebidas', telefono: '+5491135810054', nombreVentas: 'Gonzalo casco' },
  { id: 'prov13', name: 'Criollo', category: 'Carnes', telefono: '+5491163512001', nombreVentas: 'Juan Pablo', cbu: '1910057555005702004132', cuit: '30-70887901-7', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], plazoPago: '1 días' },
  { id: 'prov14', name: 'alyser', category: 'Otros', telefono: '+5491164872924', nombreVentas: 'Belen' },
  { id: 'prov15', name: 'La chacrita', category: 'Carnes', telefono: '+5493468524428', nombreVentas: 'La chacrita', alias: 'alcaparra.pecan', cbu: '0150501601000201164397', cuit: '20-25537629-3', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días' },
  { id: 'prov16', name: 'Juan grande', category: 'Otros', telefono: '+5491160211545', nombreVentas: 'Ignacio grande', diasEntrega: ['Jue'], plazoPago: '10 días' },
  { id: 'prov17', name: 'la meson', category: 'Otros', telefono: '+5491155608565', nombreVentas: 'La meson', alias: 'LOMO.MARCO.PIOLA', cbu: '00700221-20000004018937', cuit: '3070 82 48 238', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '1 días' },
  { id: 'prov18', name: 'arrivata', category: 'Verduras', diasEntrega: ['Mar'] },
  { id: 'prov19', name: 'ventigmilia', category: 'Otros', telefono: '+5492995573637', nombreVentas: 'kiara', email: 'ventas@queseriaventimiglia.com.ar', cbu: '2590103810349036610070', cuit: '30-71038353-3', diasEntrega: ['Vie', 'Sáb'] },
  { id: 'prov20', name: 'molino cerillo', category: 'Almacén', telefono: '+5493875161190', nombreVentas: 'Facundo', alias: 'MOLINO.CERRILLOS.DP', cbu: '2850121130094198134361', cuit: '30-71126903-3', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '3 días' },
  { id: 'prov21', name: 'miguel simone', category: 'Carnes', nombreVentas: 'casa grippo' },
  { id: 'prov22', name: 'Fer hara', category: 'Otros', nombreVentas: 'Fernando hara' },
  { id: 'prov23', name: 'bapan', category: 'Almacén', telefono: '+5491132347280', nombreVentas: 'Jose Ambuchástegui', alias: 'Bapan.Harina.Organic', cbu: '0720210288000037121886', cuit: '20-22503650-1', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días' },
  { id: 'prov24', name: 'Pampas rice', category: 'Almacén', telefono: '+5491132440055', nombreVentas: 'Federico Fernandez', alias: 'CELDA.FINCA.METRO', cbu: '0070058020000006647937', cuit: '30-71799558-5', diasEntrega: ['Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '10 días' },
  { id: 'prov25', name: 'Cuervo', category: 'Carnes', telefono: '+5491140869149', nombreVentas: 'Agustin chino', cuit: '30-71548552-0', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
  { id: 'prov26', name: 'J.D fish art', category: 'Pescados', telefono: '+5491135484954', nombreVentas: 'Jorge Dominguez' },
  { id: 'prov27', name: 'Pulpo patagonico', category: 'Pescados', telefono: '+5492804597670', nombreVentas: 'Gonzalo Colipi' },
  { id: 'prov28', name: 'Hernan viva', category: 'Otros', telefono: '+5492234567446', nombreVentas: 'Hernan' },
  { id: 'prov29', name: 'Gaby Leña', category: 'Otros', telefono: '+5491151340157', nombreVentas: 'Gaby', alias: 'escudo.soga.cal', cbu: '0340142808710047584015', cuit: '2011 27 98 251', plazoPago: '2 días' },
  { id: 'prov30', name: 'kamado', category: 'Otros', telefono: '+5491158539717', nombreVentas: 'luciana', cuit: '30-70959917-4', plazoPago: '30 días' },
  { id: 'prov31', name: 'JMS', category: 'Almacén', telefono: '+5491166797241', nombreVentas: 'JMS', alias: 'ARROYO.MUSA.CENTRO', cbu: '0070007820000014273188', cuit: '30-70298442-0', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
  { id: 'prov32', name: 'Moop', category: 'Almacén', telefono: '+5491169703452', nombreVentas: 'Ann', cuit: '20-23678865-3', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '15 días' },
  { id: 'prov33', name: 'Casa thames', category: 'Almacén', telefono: '+5491166541474', nombreVentas: 'Greta', alias: 'CLPLimpieza1', cbu: '1910006355000606806332', cuit: '3069 45 92 526', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días' },
  { id: 'prov34', name: 'Morgade', category: 'Bebidas', diasEntrega: ['Lun'] },
  { id: 'prov35', name: 'Coca cola', category: 'Bebidas' },
  { id: 'prov36', name: 'AQA', category: 'Bebidas', telefono: '+5491133972317', nombreVentas: 'Nicolas Portillo' },
  { id: 'prov37', name: 'Elephant Wines', category: 'Bebidas', telefono: '+5491140426066', nombreVentas: 'Sebastián López' },
  { id: 'prov38', name: 'Jarilla Wines', category: 'Bebidas', telefono: '+5491141988049', nombreVentas: 'Juan Ferrarotti', cuit: '30-71688148-9', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov39', name: 'Verum Patagonia', category: 'Bebidas', telefono: '+5491150951600', nombreVentas: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com', cuit: '30-71645252-9', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov40', name: 'San Pedro de Yacochuya', category: 'Bebidas', telefono: '+5491150951600', nombreVentas: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov41', name: 'Establecimiento Humberto Canale', category: 'Bebidas', telefono: '+5491150951600', nombreVentas: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com', cuit: '33-50210468-9', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov42', name: 'El Garage de Aldo', category: 'Bebidas', telefono: '+5491125537053', nombreVentas: 'Carolina Lopez Bueno', cuit: '33-71275220-9', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov43', name: 'Rocamadre Wines', category: 'Bebidas', nombreVentas: 'Juanfa Suares', email: 'vinosrocamadre@gmail.com', cuit: '30-71775285-2' },
  { id: 'prov44', name: 'Casa de Uco', category: 'Bebidas', telefono: '+5491150951600', nombreVentas: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com' },
  { id: 'prov45', name: 'El Porvenir', category: 'Bebidas', telefono: '+5491130391384', nombreVentas: 'Daniel Davila', cuit: '3070043629', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov46', name: 'Catena Zapata', category: 'Bebidas', telefono: '+5491168840990', nombreVentas: 'Patricia Haux', cuit: '30-50258442-8', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov47', name: 'Grupo Avinea', category: 'Bebidas', telefono: '+5491156605268', nombreVentas: 'Andrea Techera', email: 'andrea.techera@grupoavinea.com', cuit: '30-56065543-2', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '60 días' },
  { id: 'prov48', name: 'Chacra', category: 'Bebidas', telefono: '+5492984415032', nombreVentas: 'Rocio Morales', cuit: '30-71859831-8', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
  { id: 'prov49', name: 'El Gallo Wines', category: 'Bebidas', telefono: '+5491150951600', nombreVentas: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov50', name: 'Vinandina', category: 'Bebidas', nombreVentas: 'Vinandina', cuit: '30-71705674-0' },
  { id: 'prov51', name: 'Punto', category: 'Otros', telefono: '+5491133578389', nombreVentas: 'Alma Cabral', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov52', name: 'Grand Cru', category: 'Bebidas', telefono: '+5491152499975', nombreVentas: 'Alberto Levi', cuit: '30-70202681-0', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
  { id: 'prov53', name: 'Aurea', category: 'Bebidas', telefono: '+5491133578389', nombreVentas: 'Alma Cabral', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov54', name: 'Vinicult', category: 'Bebidas', telefono: '+5491169012375', nombreVentas: 'Rodrigo Calderon', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov55', name: 'Finca Sophenia', category: 'Bebidas', telefono: '+5491160479400', nombreVentas: 'Eugenia Luka', cuit: '30-69439267-5', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '30 días' },
  { id: 'prov56', name: 'Achaval Ferrer', category: 'Bebidas', telefono: '+5491150951600', nombreVentas: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com', cuit: '30-70086601-3', plazoPago: '45 días' },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, {
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
const PAYMENT_HISTORY_CONFIG: Record<PaymentHistoryEvent['type'], {
  color: string;
  icon: React.ElementType;
}> = {
  received: {
    color: '#22C55E',
    icon: CheckCircle2
  },
  alerted: {
    color: '#EF4444',
    icon: AlertCircle
  },
  paid_digital: {
    color: '#6366F1',
    icon: CreditCard
  },
  confirmed_cash: {
    color: '#3B82F6',
    icon: Banknote
  },
  comprobante_sent: {
    color: '#22C55E',
    icon: Send
  },
  billing_discrepancy: {
    color: '#F97316',
    icon: Receipt
  }
};
const formatMoney = (n: number) => '$' + n.toLocaleString('es-AR', {
  maximumFractionDigits: 0
});

// ─── Notification helpers ─────────────────────────────────────────────────────

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};
const sendNotification = (title: string, body: string, onClick?: () => void) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `insuma-${Date.now()}`
  });
  if (onClick) n.onclick = onClick;
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const StatusBadge = ({
  status
}: {
  status: OrderStatus;
}) => {
  const cfg = STATUS_CONFIG[status];
  return <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-normal uppercase tracking-wide shrink-0" style={{
    backgroundColor: cfg.bg,
    color: cfg.text
  }}>
      <span>{cfg.label}</span>
    </div>;
};

// ─── WaIcon ──────────────────────────────────────────────────────────────────

const WaIcon = ({
  size = 15,
  color = 'white'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.198.497.099.198.01.371-.01.297-.149.767.966.94 1.164-.173.195-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.198.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.541 4.07 1.489 5.789L0 24l6.378-1.674A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.651-.51-5.168-1.402l-.371-.22-3.787.994.993-3.688-.24-.381A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
  </svg>;

// ─── OrderCard ────────────────────────────────────────────────────────────────

const OrderCard = ({
  order,
  onAlertClick
}: {
  order: Order;
  onAlertClick?: (orderId: string) => void;
}) => {
  const cfg = STATUS_CONFIG[order.status];
  const alertCount = order.alerts?.filter(a => !a.resolved).length ?? 0;
  return <motion.article initial={{
    opacity: 0,
    y: 6
  }} animate={{
    opacity: 1,
    y: 0
  }} className="bg-white rounded-xl border border-neutral-100 active:scale-[0.985] transition-transform cursor-pointer overflow-hidden">
      <div className="flex">
        <div className="w-1 shrink-0 rounded-l-xl" style={{
        backgroundColor: cfg.dot
      }} />
        <div className="flex-1 px-3 py-2.5">
          <div className="flex justify-between items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-normal text-sm text-neutral-900 leading-tight truncate">{order.provider}</h3>
                {order.isOrganic && <span className="inline-flex items-center gap-0.5 bg-neutral-100 text-neutral-500 text-[9px] px-1 py-0.5 rounded font-normal uppercase shrink-0">
                    <Leaf size={8} /><span>Org</span>
                  </span>}
              </div>
              <p className="text-neutral-400 text-[11px] font-normal">{order.category} · {order.items} items{order.total ? ` · ${formatMoney(order.total)}` : ''}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <StatusBadge status={order.status} />
              {alertCount > 0 && <button onClick={e => {
              e.stopPropagation();
              onAlertClick?.(order.id);
            }} className="flex items-center gap-0.5 text-[9px] font-normal text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full active:scale-95 transition-transform">
                  <AlertCircle size={8} strokeWidth={2} />
                  <span>{alertCount} alerta{alertCount > 1 ? 's' : ''}</span>
                </button>}
            </div>
          </div>
        </div>
      </div>
    </motion.article>;
};

// ─── AlertDetailSheet ─────────────────────────────────────────────────────────

const AlertDetailSheet = ({
  order,
  isOpen,
  onClose,
  onResolve
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (orderId: string, alertId: string) => void;
}) => {
  if (!order) return null;
  const alerts = order.alerts ?? [];
  return <AnimatePresence>
      {isOpen && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} className="fixed inset-0 z-50 flex flex-col justify-end" style={{
      maxWidth: 448,
      margin: '0 auto'
    }}>
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="absolute inset-0 bg-black/50" onClick={onClose} />
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
      }} className="relative flex flex-col bg-white rounded-t-3xl overflow-hidden max-h-[80vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-9 h-1 rounded-full bg-neutral-200" /></div>
            <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-black text-black leading-tight">Alertas del pedido</h2>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">{order.provider} · Pedido #{order.id}</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform"><X size={17} strokeWidth={2} /></button>
            </div>
            <div className="h-px bg-neutral-100 mx-5 shrink-0" />
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-3">
              {alerts.map(alert => <div key={alert.id} className={`rounded-2xl border overflow-hidden ${alert.resolved ? 'bg-neutral-50 border-neutral-100' : 'bg-red-50 border-red-200'}`}>
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle size={12} strokeWidth={2.5} className={alert.resolved ? 'text-neutral-400' : 'text-red-500'} />
                          <p className={`text-xs font-black ${alert.resolved ? 'text-neutral-400 line-through' : 'text-red-900'}`}>{alert.itemName}</p>
                          {alert.resolved && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full uppercase">Resuelto</span>}
                        </div>
                        <p className={`text-xs font-medium ${alert.resolved ? 'text-neutral-400' : 'text-red-700'}`}>{alert.message}</p>
                        <p className="text-[10px] text-neutral-300 mt-1 font-medium">{alert.timestamp}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-neutral-200 space-y-1">
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Historial</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <p className="text-[10px] text-neutral-500 font-medium">Alerta generada en recepción · {alert.timestamp}</p>
                      </div>
                      {alert.resolved && <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                          <p className="text-[10px] text-neutral-500 font-medium">Resuelto por encargado</p>
                        </div>}
                    </div>
                    {!alert.resolved && <button onClick={() => onResolve(order.id, alert.id)} className="mt-3 w-full py-2.5 rounded-xl bg-black text-white text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <Check size={13} strokeWidth={3} /><span>Marcar como resuelto</span>
                      </button>}
                  </div>
                </div>)}
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};

// ─── OrderSummarySheet ────────────────────────────────────────────────────────

const MOCK_DISPLAY_ITEMS = [{
  id: 'oi1',
  name: 'Producto A',
  requestedQty: 10,
  receivedQty: 10,
  unit: 'kg',
  status: 'ok' as const
}, {
  id: 'oi2',
  name: 'Producto B',
  requestedQty: 5,
  receivedQty: 4,
  unit: 'lt',
  status: 'discrepancy' as const
}, {
  id: 'oi3',
  name: 'Producto C',
  requestedQty: 20,
  receivedQty: 20,
  unit: 'u',
  status: 'ok' as const
}] as any[];
const OrderSummarySheet = ({
  order,
  isOpen,
  onClose
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!order) return null;
  const fullTimeline = [{
    id: 'tl-created',
    label: 'Pedido creado',
    timestamp: order.time,
    detail: `${order.items} productos · ${order.category}`,
    color: '#000000',
    icon: Package
  }, ...(order.orderNote ? [{
    id: 'tl-note',
    label: 'Nota del pedido',
    timestamp: order.time,
    detail: `"${order.orderNote}"`,
    color: '#6B7280',
    icon: StickyNote
  }] : []), ...(order.paymentHistory ?? []).map(ev => ({
    id: ev.id,
    label: ev.label,
    timestamp: ev.timestamp,
    detail: ev.detail,
    color: PAYMENT_HISTORY_CONFIG[ev.type]?.color ?? '#6B7280',
    icon: PAYMENT_HISTORY_CONFIG[ev.type]?.icon ?? CheckCircle2
  })), ...(order.receptionNote ? [{
    id: 'tl-recnote',
    label: 'Nota del receptor',
    timestamp: order.receivedAt ?? order.time,
    detail: `"${order.receptionNote}"`,
    color: '#F59E0B',
    icon: MessageSquare
  }] : [])];
  const displayItems = order.orderItems ?? MOCK_DISPLAY_ITEMS;
  const hasRemito = order.status === 'received' || order.status === 'discrepancy' || order.status === 'paid_cash';
  return <AnimatePresence>
      {isOpen && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} className="fixed inset-0 z-[60] flex flex-col justify-end" style={{
      maxWidth: 448,
      margin: '0 auto'
    }}>
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="absolute inset-0 bg-black/60" onClick={onClose} />
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
      }} className="relative flex flex-col bg-white rounded-t-3xl overflow-hidden max-h-[92vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-9 h-1 rounded-full bg-neutral-200" /></div>
            <div className="px-5 pt-2 pb-4 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center text-base font-black shrink-0"><span>{order.provider.charAt(0)}</span></div>
                <div>
                  <h2 className="text-base font-black text-black leading-tight">{order.provider}</h2>
                  <p className="text-[11px] text-neutral-400 font-medium mt-0.5"><span>Pedido #{order.id}</span><span> · </span><span>{order.category}</span></p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform"><X size={17} strokeWidth={2} /></button>
            </div>
            <div className="h-px bg-neutral-100 mx-5 shrink-0" />
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-5">
              <div className="flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Estado actual</p>
                  <StatusBadge status={order.status} />
                </div>
                {order.total != null && order.total > 0 && <div className="text-right">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Total</p>
                    <p className="text-2xl font-black text-black tabular-nums leading-none">{formatMoney(order.total)}</p>
                  </div>}
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Productos pedidos</p>
                <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                  {displayItems.map((item: any, idx: number) => <div key={item.id} className={`px-4 py-2.5 flex items-center justify-between gap-3 ${idx < displayItems.length - 1 ? 'border-b border-neutral-50' : ''}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{
                    backgroundColor: item.status === 'ok' ? '#22C55E' : item.status === 'discrepancy' ? '#EF4444' : '#EAB308'
                  }} />
                        <p className="text-xs font-bold text-neutral-800 truncate">{item.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-xs font-black text-neutral-500 tabular-nums">{item.receivedQty ?? item.requestedQty}/{item.requestedQty} {item.unit}</p>
                        {item.status === 'discrepancy' && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full uppercase">Dif.</span>}
                      </div>
                    </div>)}
                </div>
              </div>
              {hasRemito && <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Foto del remito</p>
                  <div className="bg-neutral-50 border border-neutral-100 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-14 h-14 rounded-xl bg-neutral-200 flex items-center justify-center shrink-0"><Camera size={20} className="text-neutral-400" strokeWidth={1.5} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-neutral-700">remito_{order.id}.jpg</p>
                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Capturado en recepción · {order.receivedAt ?? order.time}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <CheckCircle2 size={10} className="text-green-500" strokeWidth={2.5} />
                          <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide">Verificado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>}
              {order.alerts && order.alerts.length > 0 && <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Alertas de recepción</p>
                  <div className="space-y-2">
                    {order.alerts.map(alert => <div key={alert.id} className={`rounded-xl border px-3 py-2.5 flex items-start gap-2 ${alert.resolved ? 'bg-neutral-50 border-neutral-100' : 'bg-red-50 border-red-200'}`}>
                        <AlertCircle size={12} strokeWidth={2.5} className={`mt-0.5 shrink-0 ${alert.resolved ? 'text-neutral-400' : 'text-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${alert.resolved ? 'text-neutral-400 line-through' : 'text-red-900'}`}>{alert.itemName}</p>
                          <p className={`text-[10px] font-medium mt-0.5 ${alert.resolved ? 'text-neutral-400' : 'text-red-600'}`}>{alert.message}</p>
                        </div>
                        {alert.resolved && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full uppercase shrink-0">OK</span>}
                      </div>)}
                  </div>
                </div>}
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Historial completo</p>
                <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                  {fullTimeline.map((event, idx) => {
                const HIcon = event.icon;
                return <div key={event.id} className="px-4 py-3 flex items-start gap-3 border-b border-neutral-50 last:border-0">
                        <div className="flex flex-col items-center shrink-0 mt-0.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{
                      backgroundColor: event.color + '18'
                    }}>
                            <HIcon size={12} strokeWidth={2.5} style={{
                        color: event.color
                      }} />
                          </div>
                          {idx < fullTimeline.length - 1 && <div className="w-px flex-1 min-h-3 bg-neutral-100 mt-1.5" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-xs font-bold text-black leading-tight">{event.label}</p>
                          {event.detail && <p className="text-[11px] text-neutral-500 font-medium mt-0.5 leading-snug">{event.detail}</p>}
                          <p className="text-[10px] text-neutral-300 mt-1 font-medium">{event.timestamp}</p>
                        </div>
                      </div>;
              })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};

// ─── AlertasTab ───────────────────────────────────────────────────────────────

const AlertasTab = ({
  orders,
  onResolve
}: {
  orders: Order[];
  onResolve: (orderId: string, alertId: string) => void;
}) => {
  const allAlerts = orders.flatMap(o => (o.alerts ?? []).map(a => ({
    ...a,
    orderProvider: o.provider
  })));
  const unresolved = allAlerts.filter(a => !a.resolved);
  const resolved = allAlerts.filter(a => a.resolved);
  return <motion.div key="tab-alertas" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="px-4 pt-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light text-black leading-tight tracking-wide">Alertas</h2>
          <p className="text-[10px] text-neutral-400 font-normal mt-0.5">{unresolved.length} activa{unresolved.length !== 1 ? 's' : ''}</p>
        </div>
        {unresolved.length > 0 && <span className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-[10px] font-normal px-2.5 py-1.5 rounded-full uppercase tracking-wide">
            <AlertCircle size={10} strokeWidth={2} /><span>{unresolved.length} sin resolver</span>
          </span>}
      </div>
      {unresolved.length === 0 && <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center"><CheckCircle2 size={22} className="text-green-400" strokeWidth={1.5} /></div>
          <p className="text-sm font-normal text-neutral-400">Sin alertas activas</p>
        </div>}
      {unresolved.length > 0 && <div className="space-y-2">
          {unresolved.map(alert => <div key={alert.id} className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle size={14} strokeWidth={2} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-red-900 leading-tight">{alert.itemName}</p>
                    <p className="text-xs font-normal text-red-600 mt-0.5 leading-snug">{alert.message}</p>
                    <p className="text-[10px] text-red-400 mt-1 font-normal">{(alert as any).orderProvider} · {alert.timestamp}</p>
                  </div>
                </div>
                <button onClick={() => onResolve(alert.orderId, alert.id)} className="w-full py-2.5 rounded-xl bg-black text-white text-xs font-normal flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <Check size={13} strokeWidth={2} /><span>Marcar como resuelto</span>
                </button>
              </div>
            </div>)}
        </div>}
      {resolved.length > 0 && <div className="space-y-2 pt-2">
          <div className="h-px bg-neutral-100" />
          {resolved.map(alert => <div key={alert.id} className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3 flex items-start gap-2">
              <CheckCircle2 size={13} strokeWidth={2} className="text-green-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-normal text-neutral-400 line-through leading-tight">{alert.itemName}</p>
                <p className="text-[10px] font-normal text-neutral-400 mt-0.5 line-through">{alert.message}</p>
                <p className="text-[10px] text-neutral-300 mt-1 font-normal">{(alert as any).orderProvider}</p>
              </div>
              <span className="text-[9px] font-normal text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full uppercase shrink-0">OK</span>
            </div>)}
        </div>}
    </motion.div>;
};

// ─── RecibidosTab ─────────────────────────────────────────────────────────────

const RecibidosTab = ({
  orders
}: {
  orders: Order[];
}) => {
  const received = orders.filter(o => o.status === 'received' || o.status === 'discrepancy' || o.status === 'paid_cash');
  const byWeek = received.reduce<Record<string, Order[]>>((acc, o) => {
    const week = o.weekLabel ?? 'Sin fecha';
    if (!acc[week]) acc[week] = [];
    acc[week].push(o);
    return acc;
  }, {});
  const weekOrder = ['Esta semana', 'Semana pasada', 'Sin fecha'];
  const sortedWeeks = Object.keys(byWeek).sort((a, b) => {
    const ia = weekOrder.indexOf(a);
    const ib = weekOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return <motion.div key="tab-recibidos" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="px-4 pt-4 pb-24 space-y-4">
      <div>
        <h2 className="text-lg font-light text-black leading-tight tracking-wide">Recibidos</h2>
        <p className="text-[10px] text-neutral-400 font-normal mt-0.5">{received.length} pedido{received.length !== 1 ? 's' : ''}</p>
      </div>
      {received.length === 0 && <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center"><PackageCheck size={22} className="text-neutral-300" strokeWidth={1.5} /></div>
          <p className="text-sm font-normal text-neutral-400">Sin pedidos recibidos</p>
        </div>}
      {sortedWeeks.map(week => <div key={week} className="space-y-2">
          <p className="text-[9px] font-normal text-neutral-400 uppercase tracking-widest">{week}</p>
          {byWeek[week].map(order => {
        const cfg = STATUS_CONFIG[order.status];
        return <div key={order.id} className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
                <div className="flex">
                  <div className="w-1 shrink-0 rounded-l-xl" style={{
              backgroundColor: cfg.dot
            }} />
                  <div className="flex-1 px-3 py-2.5">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-normal text-sm text-neutral-900 leading-tight truncate">{order.provider}</p>
                        <p className="text-neutral-400 text-[11px] font-normal">{order.category} · {order.items} items</p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-normal uppercase tracking-wide shrink-0" style={{
                  backgroundColor: cfg.bg,
                  color: cfg.text
                }}>
                        <span>{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>;
      })}
        </div>)}
    </motion.div>;
};

// ─── NotificationPanel ────────────────────────────────────────────────────────

const NotificationPanel = ({
  isOpen,
  orders,
  onClose,
  onAlertClick
}: {
  isOpen: boolean;
  orders: Order[];
  onClose: () => void;
  onAlertClick: (orderId: string) => void;
}) => {
  const allAlerts = orders.flatMap(o => (o.alerts ?? []).map(a => ({
    ...a,
    orderProvider: o.provider
  })));
  const unresolvedAlerts = allAlerts.filter(a => !a.resolved);
  return <AnimatePresence>
      {isOpen && <motion.div initial={{
      opacity: 0,
      y: -8,
      scale: 0.96
    }} animate={{
      opacity: 1,
      y: 0,
      scale: 1
    }} exit={{
      opacity: 0,
      y: -8,
      scale: 0.96
    }} transition={{
      duration: 0.15
    }} className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl border border-neutral-200 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-black text-black">Notificaciones</p>
            <button onClick={onClose} className="text-neutral-400"><X size={15} strokeWidth={2} /></button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {unresolvedAlerts.length === 0 ? <div className="py-8 flex flex-col items-center gap-2 text-center px-4">
                <CheckCircle2 size={24} className="text-neutral-300" />
                <p className="text-xs font-bold text-neutral-400">Sin alertas activas</p>
              </div> : unresolvedAlerts.map(alert => <button key={alert.id} onClick={() => {
          onAlertClick(alert.orderId);
          onClose();
        }} className="w-full text-left px-4 py-3 border-b border-neutral-50 last:border-0 active:bg-neutral-50 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black truncate">{alert.itemName}</p>
                    <p className="text-[10px] text-neutral-500 font-medium leading-snug">{alert.message}</p>
                    <p className="text-[9px] text-neutral-400 mt-1">{(alert as any).orderProvider} · {alert.timestamp}</p>
                  </div>
                  <ArrowRight size={13} className="text-neutral-300 shrink-0 mt-0.5" strokeWidth={1.75} />
                </div>
              </button>)}
          </div>
        </motion.div>}
    </AnimatePresence>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const InsumaKitchenDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showNuevoPedido, setShowNuevoPedido] = useState(false);
  const [showNuevoProveedor, setShowNuevoProveedor] = useState(false);
  const [showNuevoInsumo, setShowNuevoInsumo] = useState(false);
  const [customInsumos, setCustomInsumos] = useState<{ id: string; name: string; category: string; unit: string; pricePerKg: number; provider: string }[]>([]);
  const [showRecepcion, setShowRecepcion] = useState(false);
  // Dynamic users & business (cargado desde Supabase)
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [negocioNombre, setNegocioNombre] = useState<string>('Cocina');
  const [recepcionOrderId, setRecepcionOrderId] = useState<string | undefined>(undefined);
  const [todayOrders, setTodayOrders] = useState<Order[]>(MOCK_ORDERS);
  const [providers, setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);
  const [selectedProveedor, setSelectedProveedor] = useState<Provider | null>(null);
  const [alertOrderId, setAlertOrderId] = useState<string | null>(null);
  const [showBellPanel, setShowBellPanel] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [activeUser, setActiveUser] = useState<UserProfile>({ id: 'chef', name: 'Operador', role: 'chef' });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingAdmin, setPendingAdmin] = useState<UserProfile | null>(null);
  const swipeStartX = React.useRef<number | null>(null);
  const swipeStartY = React.useRef<number | null>(null);

  // Cargar datos desde Supabase al montar
  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission);

    // Cargar negocio — Supabase primero, fallback a localStorage
    loadNegocio().then(negocio => {
      if (negocio) {
        setNegocioNombre(negocio.nombre);
      } else {
        try {
          const local = JSON.parse(localStorage.getItem('insuma_negocio') ?? 'null');
          if (local?.nombre) setNegocioNombre(local.nombre);
        } catch { /* ignore */ }
      }
    });

    // Cargar usuarios — Supabase primero, fallback a localStorage
    loadUsuariosDB().then(rawUsuarios => {
      let source = rawUsuarios;
      // Fallback: si Supabase no devuelve usuarios, leer de localStorage
      if (source.length === 0) {
        try {
          const local = JSON.parse(localStorage.getItem('insuma_usuarios') ?? '[]');
          if (Array.isArray(local) && local.length > 0) source = local;
        } catch { /* ignore */ }
      }
      const mapped: UserProfile[] = source.map((u: { id: string; nombre: string; rol: string; pin?: string }) => ({
        id: u.id,
        name: u.nombre,
        role: u.rol === 'admin' ? 'admin' : 'chef',
        pin: u.pin,
      }));
      setUsuarios(mapped);
      // Usuario activo inicial = primer cocinero, o primero si no hay
      const inicial = mapped.find(u => u.role === 'chef') ?? mapped[0];
      if (inicial) setActiveUser(inicial);
    });

    // Cargar insumos custom
    loadInsumos().then(insumos => setCustomInsumos(insumos));
  }, []);
  const handleRequestNotifications = useCallback(async () => {
    await requestNotificationPermission();
    if ('Notification' in window) setNotifPermission(Notification.permission);
    sendNotification('INSUMA', '¡Notificaciones activadas! Te avisaremos cuando haya alertas.');
  }, []);
  const handleOrderCreated = useCallback((providerName?: string, orderNote?: string, creadoPor?: string) => {
    setTodayOrders(prev => [{
      id: String(Date.now()),
      provider: providerName ?? 'Nuevo Pedido',
      category: 'Pedido',
      status: 'waiting' as OrderStatus,
      time: new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      items: 1,
      total: 0,
      paymentStatus: 'pending',
      weekLabel: 'Esta semana',
      paymentHistory: [],
      orderNote: orderNote && orderNote.trim().length > 0 ? orderNote : undefined,
      creadoPor: creadoPor ?? undefined,
    }, ...prev]);
  }, []);
  const handleOrderReceived = useCallback((orderId: string, hasCash: boolean, newAlerts?: Alert[], receptionNote?: string, recepcionadoPor?: string) => {
    setTodayOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const now = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const newHistoryEvent: PaymentHistoryEvent = {
        id: `ph-recv-${Date.now()}`,
        type: 'received',
        label: 'Pedido recibido',
        timestamp: `Hoy, ${now}`,
        detail: `${o.items} productos${newAlerts && newAlerts.length > 0 ? `, ${newAlerts.length} diferencia(s)` : ''}${receptionNote && receptionNote.trim().length > 0 ? ` · Nota: "${receptionNote}"` : ''}`
      };
      return {
        ...o,
        status: (hasCash ? 'paid_cash' : newAlerts && newAlerts.length > 0 ? 'discrepancy' : 'received') as OrderStatus,
        receivedAt: now,
        paymentStatus: 'pending' as PaymentStatus,
        weekLabel: 'Esta semana',
        alerts: newAlerts && newAlerts.length > 0 ? newAlerts : o.alerts,
        paymentHistory: [...(o.paymentHistory ?? []), newHistoryEvent],
        receptionNote: receptionNote && receptionNote.trim().length > 0 ? receptionNote : o.receptionNote,
        recepcionadoPor: recepcionadoPor ?? o.recepcionadoPor,
      };
    }));
    if (newAlerts && newAlerts.length > 0) {
      newAlerts.forEach(alert => {
        sendNotification(`⚠️ Alerta — ${alert.provider}`, `${alert.itemName}: ${alert.message}`, () => {
          setAlertOrderId(alert.orderId);
          setActiveTab('home');
        });
      });
    }
    setTimeout(() => setActiveTab('pagos'), 300);
  }, []);
  const handleProveedorCreated = useCallback((nombre: string) => {
    setProviders(prev => [{
      id: `pv-${Date.now()}`,
      name: nombre,
      category: 'Nuevo',
      lastOrderDate: undefined
    }, ...prev]);
  }, []);
  const handleResolveAlert = useCallback((orderId: string, alertId: string) => {
    setTodayOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedAlerts = (o.alerts ?? []).map(a => a.id === alertId ? {
        ...a,
        resolved: true
      } : a);
      const stillHasAlerts = updatedAlerts.some(a => !a.resolved);
      return {
        ...o,
        alerts: updatedAlerts,
        status: !stillHasAlerts && o.status === 'discrepancy' ? 'received' as OrderStatus : o.status
      };
    }));
  }, []);
  const handleConfirmCash = useCallback((orderId: string) => {
    setTodayOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const now = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const confirmEvent: PaymentHistoryEvent = {
        id: `ph-cash-${Date.now()}`,
        type: 'confirmed_cash',
        label: 'Efectivo confirmado por admin',
        timestamp: `Hoy, ${now}`
      };
      const sendEvent: PaymentHistoryEvent = {
        id: `ph-send2-${Date.now()}`,
        type: 'comprobante_sent',
        label: 'Comprobante enviado por WhatsApp',
        timestamp: `Hoy, ${now}`,
        detail: `Al proveedor ${o.providerAlias ?? 'alias desconocido'}`
      };
      return {
        ...o,
        paymentStatus: 'confirmed' as PaymentStatus,
        status: 'received' as OrderStatus,
        paymentHistory: [...(o.paymentHistory ?? []), confirmEvent, sendEvent]
      };
    }));
    sendNotification('INSUMA — Pago confirmado', 'Pago en efectivo confirmado correctamente.');
  }, []);
  const handlePayDigital = useCallback((orderId: string) => {
    setTodayOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const now = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const payEvent: PaymentHistoryEvent = {
        id: `ph-dig-${Date.now()}`,
        type: 'paid_digital',
        label: 'Pago digital procesado',
        timestamp: `Hoy, ${now}`,
        detail: `Transferencia a ${o.providerAlias ?? 'alias desconocido'}`
      };
      const sendEvent: PaymentHistoryEvent = {
        id: `ph-send2-${Date.now()}`,
        type: 'comprobante_sent',
        label: 'Comprobante enviado por WhatsApp',
        timestamp: `Hoy, ${now}`,
        detail: `Al proveedor ${o.provider}`
      };
      return {
        ...o,
        paymentStatus: 'paid_digital' as PaymentStatus,
        paymentHistory: [...(o.paymentHistory ?? []), payEvent, sendEvent]
      };
    }));
    sendNotification('INSUMA — Pago digital', 'El pago digital fue procesado y el comprobante enviado por WhatsApp.');
  }, []);
  const handleUpdateBillingDiscrepancy = useCallback((orderId: string, resolution: string, newAmount?: number) => {
    setTodayOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const now = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const resolveEvent: PaymentHistoryEvent = {
        id: `ph-disc-${Date.now()}`,
        type: 'billing_discrepancy',
        label: 'Diferencia de factura resuelta',
        timestamp: `Hoy, ${now}`,
        detail: resolution
      };
      return {
        ...o,
        total: newAmount !== undefined ? newAmount : o.total,
        hasBillingDiscrepancy: false,
        paymentHistory: [...(o.paymentHistory ?? []), resolveEvent]
      };
    }));
  }, []);
  const alertOrder = todayOrders.find(o => o.id === alertOrderId) ?? null;
  const allUnresolvedAlerts = todayOrders.flatMap(o => (o.alerts ?? []).filter(a => !a.resolved));
  const pendingPayments = todayOrders.filter(o => (o.status === 'received' || o.status === 'discrepancy' || o.status === 'paid_cash') && o.paymentStatus !== 'paid_digital' && o.paymentStatus !== 'confirmed').length;
  const pendingReceptionOrders = todayOrders.filter(o => o.status === 'on_way' || o.status === 'waiting');
  const statCards = [{
    id: 'stat-act',
    label: 'Activos',
    value: todayOrders.filter(o => o.status === 'waiting' || o.status === 'on_way').length,
    color: '#EAB308',
    onClick: () => setActiveTab('orders')
  }, {
    id: 'stat-alr',
    label: 'Alertas',
    value: allUnresolvedAlerts.length,
    color: '#EF4444',
    onClick: () => setActiveTab('alertas')
  }, {
    id: 'stat-rec',
    label: 'Recibidos',
    value: todayOrders.filter(o => o.status === 'received' || o.status === 'discrepancy' || o.status === 'paid_cash').length,
    color: '#22C55E',
    onClick: () => setActiveTab('recibidos')
  }] as any[];
  const NAV_ITEMS = [{
    id: 'providers',
    label: 'Proveedores',
    Icon: Store,
    badge: 0
  }, {
    id: 'orders',
    label: 'Recibir',
    Icon: PackageCheck,
    badge: pendingReceptionOrders.length
  }, {
    id: 'pagos',
    label: 'Pagos',
    Icon: CreditCard,
    badge: pendingPayments
  }, {
    id: 'recetas',
    label: 'Recetas',
    Icon: BookOpen,
    badge: 0
  }, {
    id: 'metricas',
    label: 'Métricas',
    Icon: BarChart2,
    badge: 0
  }] as any[];
  return <div className="flex flex-col h-screen w-full max-w-md mx-auto overflow-hidden bg-white select-none" style={{
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
  }}>
      {/* Header */}
      <header className="px-4 pt-10 pb-3 bg-white border-b border-neutral-100 shrink-0">
        <div className="flex justify-between items-center mb-3">
          {/* INSUMA Logo — tapping returns to home */}
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-2.5 active:opacity-70 transition-opacity">
            <InsumaLogo color="#72BDE8" size="sm" />
            <span className="text-[9px] font-normal text-neutral-400 uppercase tracking-[0.18em] mt-1">{negocioNombre}</span>
          </button>
          <div className="flex gap-2">
            {/* User profile switcher */}
            <button onClick={() => setShowUserMenu(v => !v)} className="relative h-9 px-2.5 rounded-full bg-neutral-100 flex items-center gap-1.5 text-neutral-600 active:bg-neutral-200 transition-colors">
              <User size={14} strokeWidth={1.75} />
              <span className="text-[11px] font-medium">{activeUser.name}</span>
              {activeUser.role === 'admin' && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />}
            </button>
            <div className="relative">
              <button aria-label="Notificaciones" onClick={() => {
              if (notifPermission !== 'granted') handleRequestNotifications();else setShowBellPanel(p => !p);
            }} className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 active:bg-neutral-200 transition-colors">
                <Bell size={16} strokeWidth={1.75} />
              </button>
              {allUnresolvedAlerts.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{allUnresolvedAlerts.length}</span>
                </span>}
              <NotificationPanel isOpen={showBellPanel} orders={todayOrders} onClose={() => setShowBellPanel(false)} onAlertClick={id => {
              setAlertOrderId(id);
              setShowBellPanel(false);
            }} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {statCards.map((card: any) => <button key={card.id} onClick={card.onClick} className="flex-1 bg-neutral-50 rounded-xl px-2.5 py-2 border border-neutral-100 text-left active:scale-95 transition-transform active:bg-neutral-100">
              <p className="text-[9px] font-normal text-neutral-400 uppercase tracking-widest mb-0.5">{card.label}</p>
              <p className="text-xl font-light tabular-nums leading-none" style={{
            color: card.color
          }}>{String(card.value).padStart(2, '0')}</p>
            </button>)}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20" onTouchStart={e => {
      swipeStartX.current = e.touches[0].clientX;
      swipeStartY.current = e.touches[0].clientY;
    }} onTouchEnd={e => {
      if (swipeStartX.current === null || swipeStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - swipeStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY.current);
      if (dx > 60 && dy < 60 && activeTab !== 'home') {
        setActiveTab('home');
      }
      swipeStartX.current = null;
      swipeStartY.current = null;
    }}>

        {activeTab === 'home' && <motion.div key="tab-home" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="px-4 pt-4 space-y-4">
            <section>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.16em] mb-2">Accesos rápidos</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setShowNuevoPedido(true)} className="bg-black text-white p-4 rounded-2xl flex flex-col items-start gap-3 active:scale-95 transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><Plus size={18} strokeWidth={1.75} /></div>
                  <span className="font-light text-sm leading-tight tracking-wide">Nuevo<br />Pedido</span>
                </button>
                <button onClick={() => setShowRecepcion(true)} className="bg-neutral-50 border border-neutral-100 text-neutral-800 p-4 rounded-2xl flex flex-col items-start gap-3 active:scale-95 transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-neutral-200 flex items-center justify-center"><Truck size={18} strokeWidth={1.75} className="text-neutral-600" /></div>
                  <span className="font-light text-sm leading-tight tracking-wide text-neutral-800">Recepcionar</span>
                </button>
                <button onClick={() => setShowNuevoInsumo(true)} className="bg-neutral-50 border border-neutral-100 text-neutral-800 p-4 rounded-2xl flex flex-col items-start gap-3 active:scale-95 transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-neutral-200 flex items-center justify-center"><Package size={18} strokeWidth={1.75} className="text-neutral-600" /></div>
                  <span className="font-light text-sm leading-tight tracking-wide text-neutral-800">Insumo<br />Nuevo</span>
                </button>
              </div>
            </section>
            {allUnresolvedAlerts.length > 0 && <section>
                <p className="text-[9px] font-normal text-neutral-400 uppercase tracking-[0.18em] mb-2">Alertas activas</p>
                <div className="space-y-1.5">
                  {allUnresolvedAlerts.map(alert => <button key={alert.id} onClick={() => setAlertOrderId(alert.orderId)} className="w-full text-left flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 active:scale-[0.99] transition-transform">
                      <AlertCircle size={13} className="text-red-500 shrink-0" strokeWidth={2} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-red-900 truncate">{alert.itemName}</p>
                        <p className="text-[10px] text-red-500 font-medium truncate">{alert.message}</p>
                      </div>
                      <ArrowRight size={13} className="text-red-300 shrink-0" strokeWidth={1.75} />
                    </button>)}
                </div>
              </section>}
            <section>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] font-normal text-neutral-400 uppercase tracking-[0.18em]">Pedidos de hoy</p>
                <button className="text-black text-[11px] font-bold uppercase tracking-wide">Ver todo</button>
              </div>
              <div className="space-y-1.5">
                {todayOrders.map(order => <OrderCard key={order.id} order={order} onAlertClick={id => setAlertOrderId(id)} />)}
              </div>
            </section>
          </motion.div>}

        {activeTab === 'providers' && <motion.div key="tab-providers" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="px-4 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-light text-black leading-tight tracking-wide">Proveedores</h2>
                <p className="text-[10px] text-neutral-400 font-normal mt-0.5">{providers.length} registrados</p>
              </div>
              <button onClick={() => setShowNuevoProveedor(true)} className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center active:scale-90 transition-transform" aria-label="Agregar proveedor">
                <Plus size={17} strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
              <Search size={15} className="text-neutral-400 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-sm text-neutral-300 font-medium">Buscar proveedor o rubro...</span>
            </div>
            <div className="space-y-1.5">
              {providers.map(prov => <button key={prov.id} onClick={() => setSelectedProveedor(prov)} className="w-full flex items-center justify-between px-3 py-3 bg-white rounded-xl border border-neutral-100 active:bg-neutral-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-sm font-light shrink-0"><span>{prov.name.charAt(0)}</span></div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-normal text-black text-sm leading-tight">{prov.name}</span>
                        {prov.isOrganic && <span className="inline-flex items-center gap-0.5 bg-neutral-100 text-neutral-500 text-[9px] px-1 py-0.5 rounded font-normal uppercase"><Leaf size={8} /><span>Org</span></span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-normal text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">{prov.category}</span>
                        {prov.lastOrderDate && <span className="text-[10px] text-neutral-400 flex items-center gap-0.5"><Clock size={9} /><span>{prov.lastOrderDate}</span></span>}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={15} strokeWidth={1.5} className="text-neutral-300 shrink-0" />
                </button>)}
            </div>
          </motion.div>}

        {activeTab === 'orders' && <motion.div key="tab-orders" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="px-4 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-light text-black leading-tight tracking-wide">Recepcionar</h2>
                <p className="text-[10px] text-neutral-400 font-normal mt-0.5">{pendingReceptionOrders.length} pendiente{pendingReceptionOrders.length !== 1 ? 's' : ''} hoy</p>
              </div>
              <button onClick={() => setShowRecepcion(true)} className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center active:scale-90 transition-transform" aria-label="Recepcionar pedido">
                <PackageCheck size={17} strokeWidth={1.75} />
              </button>
            </div>
            {pendingReceptionOrders.length === 0 ? <div className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center"><CheckCircle2 size={22} className="text-green-400" strokeWidth={1.5} /></div>
                <p className="text-sm font-normal text-neutral-400">Todo recepcionado</p>
                <p className="text-xs text-neutral-300">No hay pedidos pendientes de recepción</p>
              </div> : <div className="space-y-1.5">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Por recepcionar</p>
                {pendingReceptionOrders.map(order => {
            const cfg = STATUS_CONFIG[order.status];
            return <button key={order.id} onClick={() => {
              setRecepcionOrderId(order.id);
              setShowRecepcion(true);
            }} className="w-full text-left bg-white border border-neutral-100 rounded-xl overflow-hidden active:scale-[0.985] transition-transform">
                      <div className="flex">
                        <div className="w-1 shrink-0 rounded-l-xl" style={{
                  backgroundColor: cfg.dot
                }} />
                        <div className="flex-1 px-3 py-2.5 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-normal text-sm text-neutral-900 leading-tight truncate">{order.provider}</p>
                            <p className="text-neutral-400 text-[11px] font-normal">{order.category} · {order.items} items</p>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-normal uppercase tracking-wide shrink-0" style={{
                    backgroundColor: cfg.bg,
                    color: cfg.text
                  }}>
                            <span>{cfg.label}</span>
                          </div>
                        </div>
                      </div>
                    </button>;
          })}
              </div>}
          </motion.div>}

        {activeTab === 'alertas' && <AlertasTab orders={todayOrders} onResolve={handleResolveAlert} />}
        {activeTab === 'recibidos' && <RecibidosTab orders={todayOrders} />}
        {activeTab === 'pagos' && <PagosTabEnhanced orders={todayOrders} onConfirmCash={handleConfirmCash} onPayDigital={handlePayDigital} onUpdateBillingDiscrepancy={handleUpdateBillingDiscrepancy} canView={activeUser.role === 'admin'} />}
        {activeTab === 'recetas' && <RecetasTab canViewCosts={activeUser.role === 'admin'} customInsumos={customInsumos} />}
        {activeTab === 'metricas' && <MetricasTab />}

      </main>

      {/* FABs */}
      <AnimatePresence>
        {activeTab === 'home' && <motion.button initial={{
        scale: 0,
        rotate: -45
      }} animate={{
        scale: 1,
        rotate: 0
      }} exit={{
        scale: 0
      }} onClick={() => setShowNuevoPedido(true)} aria-label="Nuevo pedido" className="fixed bottom-20 right-4 bg-black text-white rounded-full flex items-center justify-center z-20 active:scale-90 transition-transform shadow-lg" style={{
        width: 50,
        height: 50
      }}>
            <Plus size={22} strokeWidth={1.75} />
          </motion.button>}
      </AnimatePresence>
      <AnimatePresence>
        {activeTab === 'orders' && <motion.button initial={{
        scale: 0,
        rotate: -45
      }} animate={{
        scale: 1,
        rotate: 0
      }} exit={{
        scale: 0
      }} onClick={() => setShowRecepcion(true)} aria-label="Recepcionar pedido" className="fixed bottom-20 right-4 bg-black text-white rounded-full flex items-center justify-center z-20 active:scale-90 transition-transform shadow-lg" style={{
        width: 50,
        height: 50
      }}>
            <PackageCheck size={20} strokeWidth={1.75} />
          </motion.button>}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-neutral-100 px-0.5 py-2 fixed bottom-0 left-0 right-0 max-w-md mx-auto flex justify-between items-center z-30">
        {NAV_ITEMS.map(({
        id,
        label,
        Icon,
        badge
      }: any) => {
        const isActive = activeTab === id;
        return <button key={id} onClick={() => setActiveTab(id)} className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-colors ${isActive ? 'text-black' : 'text-neutral-400'}`}>
              <Icon size={19} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[8px] font-normal uppercase tracking-wide">{label}</span>
              {badge > 0 && <span className="absolute -top-0.5 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <span className="text-[8px] font-normal text-white">{badge}</span>
                </span>}
            </button>;
      })}
      </nav>

      {/* Modals */}
      <NuevoInsumoModal
        isOpen={showNuevoInsumo}
        onClose={() => setShowNuevoInsumo(false)}
        onInsumoCreated={async insumo => {
          try {
            const saved = await crearInsumo(insumo, insumo.category === 'Descartables' ? 'apoyo' : 'ingrediente');
            setCustomInsumos(prev => [...prev, saved]);
          } catch (err) {
            console.error('Error guardando insumo:', err);
            // Fallback optimista en caso de error de red
            setCustomInsumos(prev => [...prev, insumo]);
          }
        }}
        catalogInsumos={CATALOG_INSUMOS}
        customInsumos={customInsumos}
        proveedores={providers.map(p => p.name)}
      />
      <NuevoPedidoModal isOpen={showNuevoPedido} onClose={() => setShowNuevoPedido(false)} onOrderCreated={handleOrderCreated} creadoPor={activeUser.name} providers={providers} />
      <NuevoProveedorModal isOpen={showNuevoProveedor} onClose={() => setShowNuevoProveedor(false)} onProveedorCreated={handleProveedorCreated} />
      <ProveedorPerfilSheet proveedor={selectedProveedor} isOpen={selectedProveedor !== null} onClose={() => setSelectedProveedor(null)} onNuevoPedido={() => {
      setSelectedProveedor(null);
      setShowNuevoPedido(true);
    }} />
      <RecepcionPedidoModal isOpen={showRecepcion} onClose={() => {
      setShowRecepcion(false);
      setRecepcionOrderId(undefined);
    }} onOrderReceived={handleOrderReceived} initialOrderId={recepcionOrderId} recepcionadoPor={activeUser.name} />
      <AlertDetailSheet order={alertOrder} isOpen={alertOrderId !== null} onClose={() => setAlertOrderId(null)} onResolve={handleResolveAlert} />

      {/* User menu sheet */}
      <AnimatePresence>
        {showUserMenu && <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-50" onClick={() => setShowUserMenu(false)} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-5 pt-5 pb-10 shadow-2xl">
            <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-5" />
            <div className="mb-4 px-1">
              <p className="text-base font-bold text-black">{negocioNombre}</p>
            </div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Cambiar perfil</p>
            <div className="space-y-2">
              {usuarios.map(profile => {
                const isActive = activeUser.id === profile.id;
                return (
                  <button key={profile.id} onClick={() => {
                    if (profile.role === 'admin') {
                      setShowUserMenu(false);
                      setPinInput('');
                      setPinError(false);
                      setPendingAdmin(profile);
                      setShowPinModal(true);
                    } else {
                      setActiveUser(profile);
                      setShowUserMenu(false);
                    }
                  }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] ${isActive ? 'bg-black border-black' : 'bg-white border-neutral-200'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-neutral-100'}`}>
                      {profile.role === 'admin' ? <Lock size={16} strokeWidth={1.75} className={isActive ? 'text-white' : 'text-neutral-500'} /> : <User size={16} strokeWidth={1.75} className={isActive ? 'text-white' : 'text-neutral-500'} />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-black'}`}>{profile.name}</p>
                      <p className={`text-[10px] ${isActive ? 'text-white/60' : 'text-neutral-400'}`}>{profile.role === 'admin' ? 'Admin · requiere PIN' : 'Operador'}</p>
                    </div>
                    {isActive && <span className="w-2 h-2 bg-emerald-400 rounded-full" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('insuma_onboarding_ok');
                localStorage.removeItem('insuma_negocio_id');
                localStorage.removeItem('insuma_negocio');
                localStorage.removeItem('insuma_usuarios');
                window.location.reload();
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-100 text-red-500 text-sm font-medium active:bg-red-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </motion.div>
        </>}
      </AnimatePresence>

      {/* PIN modal */}
      <AnimatePresence>
        {showPinModal && <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowPinModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', damping: 25, stiffness: 320 }} className="fixed inset-x-6 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white rounded-3xl z-50 px-6 py-8 shadow-2xl">
            <div className="flex flex-col items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-1">
                <Lock size={20} strokeWidth={1.75} className="text-white" />
              </div>
              <p className="text-base font-medium text-black">{pendingAdmin?.name ?? 'Admin'}</p>
              <p className="text-xs text-neutral-400 text-center">Ingresá el PIN para continuar</p>
            </div>
            <div className="flex justify-center gap-3 mb-4">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${pinInput.length > i ? 'bg-black border-black' : 'bg-transparent border-neutral-300'}`} />
              ))}
            </div>
            {pinError && <p className="text-center text-xs text-red-500 mb-3">PIN incorrecto</p>}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key, i) => (
                <button key={i} disabled={key === ''} onClick={() => {
                  if (key === '⌫') {
                    setPinInput(p => p.slice(0, -1));
                    setPinError(false);
                  } else if (typeof key === 'number' && pinInput.length < 4) {
                    const next = pinInput + String(key);
                    setPinInput(next);
                    setPinError(false);
                    if (next.length === 4) {
                      const expectedPin = pendingAdmin?.pin ?? '1234';
                      if (next === expectedPin) {
                        if (pendingAdmin) setActiveUser(pendingAdmin);
                        setShowPinModal(false);
                        setPinInput('');
                        setPendingAdmin(null);
                      } else {
                        setPinError(true);
                        setTimeout(() => setPinInput(''), 400);
                      }
                    }
                  }
                }} className={`h-14 rounded-2xl text-lg font-light flex items-center justify-center transition-all active:scale-90 ${key === '' ? 'pointer-events-none' : 'bg-neutral-100 active:bg-neutral-200 text-black'}`}>
                  {key}
                </button>
              ))}
            </div>
            <button onClick={() => setShowPinModal(false)} className="w-full text-center text-sm text-neutral-400 py-2">Cancelar</button>
          </motion.div>
        </>}
      </AnimatePresence>
    </div>;
};