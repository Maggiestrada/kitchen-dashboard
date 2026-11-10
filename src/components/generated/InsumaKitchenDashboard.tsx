import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, Truck, PackageCheck, Plus, Search, Bell, ChevronRight, Clock, AlertCircle, CheckCircle2, Wallet, Store, CreditCard, Leaf, X, ArrowRight, ChevronDown, Calendar, Banknote, Check, ExternalLink, History, Receipt, Send, MessageSquare, StickyNote, Edit3, Upload, Camera, Package, BarChart2, BookOpen, Lock, User, Trash2, MessageCircle } from 'lucide-react';
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
import { loadUsuarios as loadUsuariosDB, loadNegocio, loadInsumos, crearInsumo, guardarPedido, actualizarPedido, loadPedidos as loadPedidosDB, loadProveedores as loadProveedoresDB, type PedidoDB } from '../../lib/db';
import { PinResetSheet } from './PinResetSheet';
import { type ProveedorCompleto } from './NuevoProveedorModal';

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
  precioUnit?: number;
  ivaRate?: number;
}
interface Alert {
  id: string;
  orderId: string;
  provider: string;
  itemName: string;
  message: string;
  resolved: boolean;
  timestamp: string;
  orderProvider?: string;
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
  invoiceImageUrl?: string;
}
interface Provider {
  id: string;
  name: string;
  category: string;
  isOrganic?: boolean;
  lastOrderDate?: string;
  telefono?: string;
  telefonoAdmin?: string;
  nombreVentas?: string;
  email?: string;
  alias?: string;
  mpAlias?: string;
  cbu?: string;
  cuit?: string;
  diasEntrega?: string[];
  plazoPago?: string;
  emiteFactura?: boolean;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: 'demo-1', provider: 'Fura', providerPhone: '+5491156937934',
    category: 'Carnes', status: 'waiting', time: '08:30', items: 3, total: 0,
    paymentStatus: 'pending', weekLabel: 'Esta semana', paymentHistory: [],
    orderItems: [
      { id: 'oi-1a', name: 'Asado', requestedQty: 4, receivedQty: 0, unit: 'kg', status: 'pending', alertMsg: '' },
      { id: 'oi-1b', name: 'Pollo entero', requestedQty: 6, receivedQty: 0, unit: 'kg', status: 'pending', alertMsg: '' },
      { id: 'oi-1c', name: 'Lomo', requestedQty: 2, receivedQty: 0, unit: 'kg', status: 'pending', alertMsg: '' },
    ],
  },
  {
    id: 'demo-2', provider: '4 estaciones', providerPhone: '+5491150496176',
    category: 'Verduras', status: 'on_way', time: '09:15', items: 4, total: 0,
    paymentStatus: 'pending', weekLabel: 'Esta semana', paymentHistory: [],
    orderItems: [
      { id: 'oi-2a', name: 'Tomate perita', requestedQty: 5, receivedQty: 0, unit: 'kg', status: 'pending', alertMsg: '' },
      { id: 'oi-2b', name: 'Rúcula', requestedQty: 2, receivedQty: 0, unit: 'kg', status: 'pending', alertMsg: '' },
      { id: 'oi-2c', name: 'Cebolla morada', requestedQty: 3, receivedQty: 0, unit: 'kg', status: 'pending', alertMsg: '' },
      { id: 'oi-2d', name: 'Zucchini', requestedQty: 2, receivedQty: 0, unit: 'kg', status: 'pending', alertMsg: '' },
    ],
  },
  {
    id: 'demo-3', provider: 'Soleil', providerPhone: '+5491128324242',
    category: 'Almacén', status: 'received', time: '07:45', items: 3, total: 18400,
    paymentStatus: 'pending', weekLabel: 'Esta semana', paymentHistory: [],
    orderItems: [
      { id: 'oi-3a', name: 'Harina 000', requestedQty: 10, receivedQty: 10, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 980 },
      { id: 'oi-3b', name: 'Aceite de girasol', requestedQty: 5, receivedQty: 5, unit: 'lt', status: 'ok', alertMsg: '', precioUnit: 1200 },
      { id: 'oi-3c', name: 'Azúcar', requestedQty: 4, receivedQty: 4, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 850 },
    ],
  },
  {
    id: 'demo-4', provider: 'Zuccardi', providerPhone: '+5491165310391',
    category: 'Bebidas', status: 'discrepancy', time: '10:00', items: 2, total: 32000,
    paymentStatus: 'pending', weekLabel: 'Esta semana', paymentHistory: [],
    alerts: [
      { id: 'alt-1', orderId: 'demo-4', provider: 'Zuccardi', itemName: 'Vino Malbec 750ml', message: 'Faltan 4 botellas — pidieron 12, llegaron 8', resolved: false, timestamp: '10:05' }
    ],
    orderItems: [
      { id: 'oi-4a', name: 'Vino Malbec 750ml', requestedQty: 12, receivedQty: 8, unit: 'botellas', status: 'discrepancy', alertMsg: 'Faltan 4 botellas', precioUnit: 2800 },
      { id: 'oi-4b', name: 'Vino Cabernet 750ml', requestedQty: 6, receivedQty: 6, unit: 'botellas', status: 'ok', alertMsg: '', precioUnit: 2600 },
    ],
  },
  // ─── Órdenes pagas históricas (Archivo / Pagos) ────────────────────────────
  {
    id: 'paid-1', provider: 'Fura', providerPhone: '+5491156937934',
    category: 'Carnes', status: 'paid_cash', time: '08:00', items: 3, total: 42500,
    paymentStatus: 'confirmed', weekLabel: 'Octubre', paymentHistory: [
      { id: 'ph-1a', type: 'received', label: 'Recibido', timestamp: '2025-10-28T08:30:00Z' },
      { id: 'ph-1b', type: 'confirmed_cash', label: 'Pagado en efectivo', timestamp: '2025-10-28T09:00:00Z' },
    ],
    deliveryDate: '2025-10-28',
    orderItems: [
      { id: 'oi-p1a', name: 'Asado', requestedQty: 5, receivedQty: 5, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 8200 },
      { id: 'oi-p1b', name: 'Vacío', requestedQty: 2, receivedQty: 2, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 10200 },
      { id: 'oi-p1c', name: 'Pollo entero', requestedQty: 4, receivedQty: 4, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 5800 },
    ],
  },
  {
    id: 'paid-2', provider: 'Soleil', providerPhone: '+5491128324242',
    category: 'Almacén', status: 'received', time: '07:30', items: 4, total: 28600,
    paymentStatus: 'paid_digital', weekLabel: 'Octubre', paymentHistory: [
      { id: 'ph-2a', type: 'received', label: 'Recibido', timestamp: '2025-10-22T07:45:00Z' },
      { id: 'ph-2b', type: 'paid_digital', label: 'Transferencia enviada', timestamp: '2025-10-23T11:00:00Z' },
      { id: 'ph-2c', type: 'comprobante_sent', label: 'Comprobante enviado por WhatsApp', timestamp: '2025-10-23T11:05:00Z' },
    ],
    deliveryDate: '2025-10-22',
    orderItems: [
      { id: 'oi-p2a', name: 'Harina 000', requestedQty: 15, receivedQty: 15, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 980 },
      { id: 'oi-p2b', name: 'Aceite de girasol', requestedQty: 8, receivedQty: 8, unit: 'lt', status: 'ok', alertMsg: '', precioUnit: 1200 },
      { id: 'oi-p2c', name: 'Azúcar', requestedQty: 6, receivedQty: 6, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 850 },
      { id: 'oi-p2d', name: 'Sal gruesa', requestedQty: 4, receivedQty: 4, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 420 },
    ],
  },
  {
    id: 'paid-3', provider: 'Zuccardi', providerPhone: '+5491165310391',
    category: 'Bebidas', status: 'paid_cash', time: '11:00', items: 3, total: 68400,
    paymentStatus: 'confirmed', weekLabel: 'Octubre', paymentHistory: [
      { id: 'ph-3a', type: 'received', label: 'Recibido', timestamp: '2025-10-15T11:00:00Z' },
      { id: 'ph-3b', type: 'confirmed_cash', label: 'Pagado en efectivo', timestamp: '2025-10-16T10:00:00Z' },
    ],
    deliveryDate: '2025-10-15',
    orderItems: [
      { id: 'oi-p3a', name: 'Vino Malbec 750ml', requestedQty: 12, receivedQty: 12, unit: 'botellas', status: 'ok', alertMsg: '', precioUnit: 2800 },
      { id: 'oi-p3b', name: 'Vino Cabernet 750ml', requestedQty: 6, receivedQty: 6, unit: 'botellas', status: 'ok', alertMsg: '', precioUnit: 2600 },
      { id: 'oi-p3c', name: 'Espumante Brut', requestedQty: 4, receivedQty: 4, unit: 'botellas', status: 'ok', alertMsg: '', precioUnit: 3800 },
    ],
  },
  {
    id: 'paid-4', provider: '4 estaciones', providerPhone: '+5491150496176',
    category: 'Verduras', status: 'received', time: '08:00', items: 5, total: 19800,
    paymentStatus: 'paid_digital', weekLabel: 'Noviembre', paymentHistory: [
      { id: 'ph-4a', type: 'received', label: 'Recibido', timestamp: '2025-11-03T08:00:00Z' },
      { id: 'ph-4b', type: 'paid_digital', label: 'Transferencia enviada', timestamp: '2025-11-04T14:30:00Z' },
    ],
    deliveryDate: '2025-11-03',
    orderItems: [
      { id: 'oi-p4a', name: 'Tomate perita', requestedQty: 8, receivedQty: 8, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 1800 },
      { id: 'oi-p4b', name: 'Rúcula', requestedQty: 3, receivedQty: 3, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 3200 },
      { id: 'oi-p4c', name: 'Cebolla morada', requestedQty: 4, receivedQty: 4, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 1600 },
      { id: 'oi-p4d', name: 'Zucchini', requestedQty: 3, receivedQty: 3, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 2400 },
      { id: 'oi-p4e', name: 'Zapallito', requestedQty: 2, receivedQty: 2, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 1900 },
    ],
  },
  {
    id: 'paid-5', provider: 'Fura', providerPhone: '+5491156937934',
    category: 'Carnes', status: 'paid_cash', time: '08:30', items: 2, total: 55000,
    paymentStatus: 'confirmed', weekLabel: 'Noviembre', paymentHistory: [
      { id: 'ph-5a', type: 'received', label: 'Recibido', timestamp: '2025-11-06T08:30:00Z' },
      { id: 'ph-5b', type: 'alerted', label: 'Discrepancia registrada', timestamp: '2025-11-06T08:35:00Z' },
      { id: 'ph-5c', type: 'confirmed_cash', label: 'Pagado en efectivo', timestamp: '2025-11-07T09:00:00Z' },
    ],
    deliveryDate: '2025-11-06',
    orderItems: [
      { id: 'oi-p5a', name: 'Lomo', requestedQty: 2, receivedQty: 2, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 18500 },
      { id: 'oi-p5b', name: 'Asado', requestedQty: 4, receivedQty: 4, unit: 'kg', status: 'ok', alertMsg: '', precioUnit: 8200 },
    ],
  },
];
const INITIAL_PROVIDERS: Provider[] = [
  { id: 'e8ccfe93', name: 'Zuccardi', category: 'Bebidas', telefono: '+5491165310391', nombreVentas: 'Sergio / fernanda doll', email: 'sarregui@familiazuccardi.com', cuit: '30-51787491-0', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '15 días', emiteFactura: true },
  { id: 'prov1', name: 'Fura', category: 'Carnes', telefono: '+5491156937934', nombreVentas: 'Ariel', email: 'comprobantesfura@gmail.com', cuit: '3694464056', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días', emiteFactura: true },
  { id: 'prov2', name: 'Santo berraco', category: 'Carnes', telefono: '+5491122506002', nombreVentas: 'Santo berraco', email: 'santoberraco@gmail.com', cbu: '0070028320000009570717', cuit: '30716480719', diasEntrega: ['Lun', 'Mié'], plazoPago: '7 días', emiteFactura: false },
  { id: 'prov3', name: 'Cocorokeen', category: 'Bebidas', telefono: '+5491170040501', cuit: '30-71421721-2', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], emiteFactura: true },
  { id: 'prov4', name: 'Patricia Graffer', category: 'Verduras', telefono: '+5492226472711', nombreVentas: 'Patricia Graffer', diasEntrega: ['Mié'], emiteFactura: false },
  { id: 'prov5', name: 'The grocery', category: 'Verduras', telefono: '+5491167083458', nombreVentas: 'Daniel central', email: 'thegrocerypalermo@gmail.com', mpAlias: 'thegrocery-distribu', cbu: '000003100020299695455', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días', emiteFactura: false },
  { id: 'a4eb5955', name: '4 estaciones', category: 'Verduras', telefono: '+5491150496176', nombreVentas: 'Pablo bonano', email: 'bolsonorganicoentucasa@gmail.com', alias: '4estaciones.producto', cbu: '0720084788000002275404', cuit: '20-27282431-3', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días', emiteFactura: false },
  { id: 'prov6', name: 'Gabi verduleria', category: 'Verduras', telefono: '+5491136294534', emiteFactura: false },
  { id: 'prov7', name: 'Barrio chino', category: 'Verduras', telefono: '+5491140969494', nombreVentas: 'Mari', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], emiteFactura: false },
  { id: 'prov8', name: 'Kaiken', category: 'Bebidas', telefono: '+5491167073332', emiteFactura: true },
  { id: 'prov9', name: 'Adrian huevos', category: 'Lácteos', telefono: '+5491165461043', nombreVentas: 'Adrian Alejandro Cambón', alias: 'PERRO.TEATRO.GROSOR', cbu: '00702418 30004017164628', cuit: '20267604062', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días', emiteFactura: false },
  { id: 'prov10', name: 'Coppola', category: 'Bebidas', telefono: '+5491165462877', nombreVentas: 'Nadia', cbu: '19100506-55005000934546', cuit: '20-17367047-9', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], emiteFactura: true },
  { id: 'prov11', name: 'Soleil', category: 'Almacén', telefono: '+5491128324242', nombreVentas: 'Sol', alias: 'LE.SOLEIL', cbu: '0720476488000000166036', cuit: '2728 44 73 510', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días', emiteFactura: true },
  { id: 'prov12', name: 'Quilmes', category: 'Bebidas', telefono: '+5491135810054', nombreVentas: 'Gonzalo casco', emiteFactura: true },
  { id: 'prov13', name: 'Criollo', category: 'Carnes', telefono: '+5491163512001', nombreVentas: 'Juan Pablo', cbu: '1910057555005702004132', cuit: '30-70887901-7', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], plazoPago: '1 días', emiteFactura: true },
  { id: 'prov14', name: 'alyser', category: 'Otros', telefono: '+5491164872924', nombreVentas: 'Belen', emiteFactura: false },
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
  { id: 'prov33', name: 'Casa thames', category: 'Almacén', telefono: '+5491166541474', nombreVentas: 'Greta', mpAlias: 'CLPLimpieza1', cbu: '1910006355000606806332', cuit: '3069 45 92 526', diasEntrega: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], plazoPago: '7 días' },
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

// ─── DB → Order mapper ────────────────────────────────────────────────────────

const ESTADO_TO_STATUS: Record<string, OrderStatus> = {
  en_espera: 'waiting',
  en_camino: 'on_way',
  recibido: 'received',
  con_diferencias: 'discrepancy',
  pago_efectivo: 'paid_cash',
};

function pedidoDBToOrder(row: PedidoDB, providers: Provider[]): Order {
  const prov = providers.find(p => p.id === row.proveedor_id);
  const alertasObj =
    row.alertas && typeof row.alertas === 'object' && !Array.isArray(row.alertas)
      ? (row.alertas as Record<string, unknown>)
      : {};
  const alertsArr: Alert[] = Array.isArray(alertasObj.alerts)
    ? (alertasObj.alerts as Alert[])
    : Array.isArray(row.alertas)
    ? (row.alertas as Alert[])
    : [];

  const rawItems = Array.isArray(row.items) ? (row.items as Array<Record<string, unknown>>) : [];
  const orderItems: OrderItem[] = rawItems.map((i, idx) => ({
    id: String(i.id ?? `item-${idx}`),
    name: String(i.name ?? ''),
    requestedQty: Number(i.requestedQty ?? i.qty ?? 0),
    receivedQty: Number(i.receivedQty ?? 0),
    unit: String(i.unit ?? 'u'),
    status: (['ok', 'discrepancy', 'pending'].includes(String(i.status))
      ? i.status
      : 'pending') as 'ok' | 'discrepancy' | 'pending',
    alertMsg: String(i.alertMsg ?? ''),
    precioUnit: typeof i.precioUnit === 'number' ? i.precioUnit : undefined,
    ivaRate: typeof i.ivaRate === 'number' ? i.ivaRate : undefined,
  }));

  return {
    id: row.id,
    provider: row.proveedor_nombre,
    providerPhone: prov?.telefono,
    providerAlias: prov?.alias,
    providerCbu: prov?.cbu,
    category: 'Pedido',
    status: ESTADO_TO_STATUS[row.estado] ?? 'waiting',
    time: new Date(row.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    items: orderItems.length || 1,
    total: row.total ?? 0,
    orderItems,
    alerts: alertsArr,
    paymentStatus: 'pending' as PaymentStatus,
    paymentHistory: [],
    orderNote: row.nota ?? undefined,
    creadoPor: row.creado_por ?? undefined,
    recepcionadoPor: row.recepcionado_por ?? undefined,
    deliveryDate: typeof alertasObj.deliveryDate === 'string' ? alertasObj.deliveryDate : undefined,
    weekLabel: 'Esta semana',
  };
}

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

const todayStr = (() => { const d = new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })();
const isSameDayDelivery = (deliveryDate?: string) => {
  if (!deliveryDate) return false;
  const s = deliveryDate.trim().toLowerCase();
  if (s === 'hoy' || s === 'today') return true;
  // DD/MM/YYYY or DD/MM
  const parts = s.split('/');
  if (parts.length >= 2) { const d = new Date(); return parseInt(parts[0]) === d.getDate() && parseInt(parts[1]) === d.getMonth()+1; }
  // ISO YYYY-MM-DD
  if (s.length >= 10 && s[4] === '-') { const d2 = new Date(s); if (!isNaN(d2.getTime())) { const n = new Date(); return d2.getDate() === n.getDate() && d2.getMonth() === n.getMonth() && d2.getFullYear() === n.getFullYear(); } }
  return false;
};

const OrderCard = ({
  order,
  onAlertClick,
  onCancelClick,
  onDetailClick,
}: {
  order: Order;
  onAlertClick?: (orderId: string) => void;
  onCancelClick?: (order: Order) => void;
  onDetailClick?: (order: Order) => void;
}) => {
  const cfg = STATUS_CONFIG[order.status];
  const alertCount = order.alerts?.filter(a => !a.resolved).length ?? 0;
  const sameDayWarn = isSameDayDelivery(order.deliveryDate) && (order.status === 'waiting' || order.status === 'on_way');
  return <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-neutral-100 overflow-hidden active:scale-[0.99] transition-transform cursor-pointer" onClick={() => onDetailClick?.(order)}>
      {sameDayWarn && <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center gap-1.5"><span className="text-[10px] font-bold text-amber-700">🚨 Entrega programada para hoy — confirmá con el proveedor</span></div>}
      <div className="flex">
        <div className="w-1 shrink-0 rounded-l-xl" style={{ backgroundColor: cfg.dot }} />
        <div className="flex-1 px-3 py-2.5">
          <div className="flex justify-between items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-normal text-sm text-neutral-900 leading-tight truncate">{order.provider}</h3>
                {order.isOrganic && <span className="inline-flex items-center gap-0.5 bg-neutral-100 text-neutral-500 text-[9px] px-1 py-0.5 rounded font-normal uppercase shrink-0">
                    <Leaf size={8} /><span>Org</span>
                  </span>}
              </div>
              <p className="text-neutral-400 text-[11px] font-normal">{order.items} items{order.total ? ` · ${formatMoney(order.total)}` : ''}{order.deliveryDate ? ` · 🚚 ${order.deliveryDate}` : ''}</p>
              {order.creadoPor && <p className="text-neutral-300 text-[10px] font-normal mt-0.5">por {order.creadoPor}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={order.status} />
                {alertCount > 0 && <button onClick={e => { e.stopPropagation(); onAlertClick?.(order.id); }} className="flex items-center gap-0.5 text-[9px] font-normal text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full active:scale-95 transition-transform">
                    <AlertCircle size={8} strokeWidth={2} />
                    <span>{alertCount} alerta{alertCount > 1 ? 's' : ''}</span>
                  </button>}
              </div>
              <button onClick={e => { e.stopPropagation(); onCancelClick?.(order); }} className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-300 hover:text-red-400 hover:bg-red-50 active:scale-90 transition-all">
                <Trash2 size={13} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>;
};

// ─── OrderDetailSheet ─────────────────────────────────────────────────────────

const OrderDetailSheet = ({
  order, isOpen, onClose, onUpdateOrder, insumos = []
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrder?: (orderId: string, updates: { orderItems?: OrderItem[]; orderNote?: string; items?: number }) => void;
  insumos?: Array<{id: string; name: string; unit: string; category: string}>;
}) => {
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editNote, setEditNote] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen && order) {
      setEditItems(order.orderItems ? [...order.orderItems] : []);
      setEditNote(order.orderNote ?? '');
      setEditing(false);
      setSaved(false);
    }
  }, [isOpen, order?.id]);

  if (!order) return null;
  const cfg = STATUS_CONFIG[order.status];

  const handleSaveEdit = () => {
    onUpdateOrder?.(order.id, { orderItems: editItems, orderNote: editNote.trim() || undefined, items: editItems.length });
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(false); }, 1200);
  };

  const removeItem = (itemId: string) => setEditItems(prev => prev.filter(i => i.id !== itemId));
  const updateQty = (itemId: string, qty: number) => {
    if (qty <= 0) { removeItem(itemId); return; }
    setEditItems(prev => prev.map(i => i.id === itemId ? { ...i, requestedQty: qty } : i));
  };
  const addInsumo = (ins: {id: string; name: string; unit: string}) => {
    if (editItems.some(i => i.id === ins.id)) return;
    setEditItems(prev => [...prev, { id: ins.id, name: ins.name, requestedQty: 1, receivedQty: 0, unit: ins.unit, status: 'pending', alertMsg: '' }]);
    setAddSearch('');
  };

  const filteredInsumos = addSearch.trim().length > 1
    ? insumos.filter(i => i.name.toLowerCase().includes(addSearch.toLowerCase()) && !editItems.some(e => e.id === i.id)).slice(0, 6)
    : [];

  return <AnimatePresence>
    {isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 448, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }} className="relative bg-white rounded-t-3xl z-10 max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-9 h-1 rounded-full bg-neutral-200" /></div>
        <div className="px-5 pt-2 pb-4 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-black text-black">{order.provider}</h2>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">#{order.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {!editing && onUpdateOrder && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 active:scale-95 transition-transform">
                <Edit3 size={12} strokeWidth={2.5} />
                Editar
              </button>
            )}
            <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform"><X size={17} strokeWidth={2} /></button>
          </div>
        </div>
        <div className="h-px bg-neutral-100 mx-5 shrink-0" />
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Info rápida */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-50 rounded-2xl px-3 py-2.5">
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Estado</p>
              <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: cfg.text }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                {cfg.label}
              </div>
              {order.deliveryDate && <p className="text-[10px] font-medium text-neutral-400 mt-1">🚚 {order.deliveryDate}</p>}
            </div>
            <div className="bg-neutral-50 rounded-2xl px-3 py-2.5">
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Pedido por</p>
              <p className="text-[11px] font-bold text-neutral-700">{order.creadoPor ?? '—'}</p>
            </div>
            {order.time && <div className="bg-neutral-50 rounded-2xl px-3 py-2.5">
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Hora del pedido</p>
              <p className="text-[11px] font-bold text-neutral-700">{order.time}</p>
            </div>}
          </div>

          {/* Items — modo visualización */}
          {!editing && (order.orderItems ?? []).length > 0 && <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Productos ({order.orderItems!.length})</p>
            <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
              {order.orderItems!.map((item, idx) => <div key={item.id} className={`px-4 py-2.5 flex items-center justify-between gap-3 ${idx < order.orderItems!.length - 1 ? 'border-b border-neutral-50' : ''}`}>
                <p className="text-xs font-bold text-neutral-800 truncate">{item.name}</p>
                <p className="text-xs font-black text-neutral-500 tabular-nums shrink-0">{item.requestedQty} {item.unit}</p>
              </div>)}
            </div>
          </div>}

          {/* Items — modo edición */}
          {editing && <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Productos</p>
            <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden mb-2">
              {editItems.length === 0 && <p className="px-4 py-3 text-xs text-neutral-400">Sin productos. Agregá uno abajo.</p>}
              {editItems.map((item, idx) => <div key={item.id} className={`px-3 py-2.5 flex items-center gap-2 ${idx < editItems.length - 1 ? 'border-b border-neutral-50' : ''}`}>
                <p className="text-xs font-bold text-neutral-800 flex-1 truncate">{item.name}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => updateQty(item.id, item.requestedQty - 1)} className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 active:scale-90 transition-transform text-sm font-black">−</button>
                  <span className="text-xs font-black text-black tabular-nums w-8 text-center">{item.requestedQty} {item.unit}</span>
                  <button onClick={() => updateQty(item.id, item.requestedQty + 1)} className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 active:scale-90 transition-transform text-sm font-black">+</button>
                  <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-red-400 active:scale-90 transition-transform ml-1">
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </div>
              </div>)}
            </div>
            {/* Agregar insumo */}
            <div className="relative">
              <input
                value={addSearch}
                onChange={e => setAddSearch(e.target.value)}
                placeholder="Buscar insumo para agregar..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-medium text-black outline-none focus:border-black transition-colors"
              />
              {filteredInsumos.length > 0 && <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-lg z-10">
                {filteredInsumos.map(ins => <button key={ins.id} onClick={() => addInsumo(ins)} className="w-full px-3 py-2 text-left text-xs font-bold text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 border-b border-neutral-50 last:border-0">
                  {ins.name} <span className="text-neutral-400 font-medium">· {ins.unit}</span>
                </button>)}
              </div>}
            </div>
          </div>}

          {/* Nota — modo visualización */}
          {!editing && order.orderNote && <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Nota</p>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              <p className="text-xs text-amber-800 font-medium">"{order.orderNote}"</p>
            </div>
          </div>}

          {/* Nota — modo edición */}
          {editing && <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Nota del pedido</p>
            <textarea
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              placeholder="Agregar nota..."
              rows={2}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-medium text-black outline-none focus:border-black transition-colors resize-none"
            />
          </div>}
        </div>

        {/* Botones de edición */}
        {editing && <div className="shrink-0 px-5 py-3 bg-white border-t border-neutral-100 flex gap-2">
          <button onClick={() => { setEditing(false); setEditItems(order.orderItems ? [...order.orderItems] : []); setEditNote(order.orderNote ?? ''); }}
            className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 active:scale-95 transition-transform">
            Cancelar
          </button>
          <button onClick={handleSaveEdit}
            className={`flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all ${saved ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>
            {saved ? <><Check size={14} strokeWidth={3} /> Guardado</> : 'Guardar cambios'}
          </button>
        </div>}
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
};

// ─── CancelOrderSheet ─────────────────────────────────────────────────────────

const CancelOrderSheet = ({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: string) => void;
}) => {
  if (!order) return null;
  const phone = order.providerPhone?.replace(/[^0-9]/g, '') ?? '';
  const waMsg = encodeURIComponent(`Hola, quería avisarte que cancelamos el pedido que hicimos hoy. Disculpá las molestias.`);
  return <AnimatePresence>
    {isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 448, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 30 }} className="relative bg-white rounded-t-3xl px-4 pt-5 pb-8 z-10">
        <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-5" />
        <p className="text-xs text-neutral-400 uppercase tracking-widest font-normal mb-1">Pedido a</p>
        <h3 className="text-base font-normal text-neutral-900 mb-5">{order.provider}</h3>
        <div className="space-y-2">
          {phone && <button onClick={() => { window.open(`https://wa.me/${phone}?text=${waMsg}`, '_blank'); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#22C55E]/10 text-[#16a34a] active:scale-[0.98] transition-transform">
            <MessageCircle size={18} strokeWidth={1.75} />
            <span className="text-sm font-normal">Contactar proveedor por WhatsApp</span>
          </button>}
          <button onClick={() => { onConfirmCancel(order.id); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-50 text-red-600 active:scale-[0.98] transition-transform">
            <Trash2 size={18} strokeWidth={1.75} />
            <span className="text-sm font-normal">Cancelar pedido</span>
          </button>
          <button onClick={onClose} className="w-full py-3.5 text-sm font-normal text-neutral-400 active:scale-[0.98] transition-transform">
            Volver
          </button>
        </div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
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
  onResolve,
  onReorder
}: {
  orders: Order[];
  onResolve: (orderId: string, alertId: string) => void;
  onReorder: (orderId: string, itemName: string, providerName: string) => void;
}) => {
  const allAlerts = orders.flatMap(o => (o.alerts ?? []).map(a => ({
    ...a,
    orderId: o.id,
    orderProvider: o.provider,
    orderPhone: o.providerPhone ?? '',
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
                    <p className="text-sm font-bold text-red-900 leading-tight">{alert.itemName}</p>
                    <p className="text-xs font-normal text-red-600 mt-0.5 leading-snug">{alert.message}</p>
                    <p className="text-[10px] text-red-400 mt-1 font-normal">{alert.orderProvider} · {alert.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {alert.orderPhone && (
                    <a
                      href={`https://wa.me/${alert.orderPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Te escribo por el pedido. Faltó: ${alert.itemName}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-green-500 text-white text-[10px] font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform"
                    >
                      <WaIcon size={11} color="white" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    onClick={() => onReorder(alert.orderId, alert.itemName, alert.orderProvider)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl active:scale-95 transition-transform"
                  >
                    <Package size={10} strokeWidth={2.5} />
                    <span>Vuelve a traerlo</span>
                  </button>
                  <button
                    onClick={() => onResolve(alert.orderId, alert.id)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-xl active:scale-95 transition-transform"
                  >
                    <Check size={10} strokeWidth={3} />
                    <span>Ya está resuelto</span>
                  </button>
                </div>
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
                <p className="text-[10px] text-neutral-300 mt-1 font-normal">{alert.orderProvider}</p>
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
                    <p className="text-[9px] text-neutral-400 mt-1">{alert.orderProvider} · {alert.timestamp}</p>
                  </div>
                  <ArrowRight size={13} className="text-neutral-300 shrink-0 mt-0.5" strokeWidth={1.75} />
                </div>
              </button>)}
          </div>
        </motion.div>}
    </AnimatePresence>;
};

// ─── AllOrdersSheet ──────────────────────────────────────────────────────────

const STATUS_FILTERS: { id: OrderStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'waiting', label: 'En espera' },
  { id: 'on_way', label: 'En camino' },
  { id: 'received', label: 'Recibidos' },
  { id: 'discrepancy', label: 'Diferencias' },
  { id: 'paid_cash', label: 'Pago efectivo' },
];

const AllOrdersSheet = ({
  isOpen, onClose, orders, onDetailClick, onAlertClick, onCancelClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onDetailClick: (o: Order) => void;
  onAlertClick: (id: string) => void;
  onCancelClick: (o: Order) => void;
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.provider.toLowerCase().includes(q) ||
      (o.deliveryDate ?? '').toLowerCase().includes(q) ||
      (o.time ?? '').includes(q) ||
      (o.weekLabel ?? '').toLowerCase().includes(q) ||
      (o.creadoPor ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const groupedByDate: Record<string, Order[]> = {};
  filtered.forEach(o => {
    const key = o.deliveryDate ?? o.weekLabel ?? 'Sin fecha';
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(o);
  });

  return <AnimatePresence>
    {isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 448, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }} className="relative bg-white rounded-t-3xl z-10 flex flex-col" style={{ height: '92vh' }}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-9 h-1 rounded-full bg-neutral-200" /></div>
        {/* Header */}
        <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-black text-black">Todos los pedidos</h2>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{filtered.length} de {orders.length} pedidos</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform"><X size={17} strokeWidth={2} /></button>
        </div>
        {/* Search */}
        <div className="px-5 pb-2 shrink-0">
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3">
            <Search size={16} className="text-neutral-400 shrink-0" strokeWidth={2} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por proveedor, fecha, estado..." className="flex-1 bg-transparent text-sm text-black placeholder:text-neutral-400 outline-none font-medium" />
            {search && <button onClick={() => setSearch('')} className="text-neutral-400"><X size={14} /></button>}
          </div>
        </div>
        {/* Status filter chips */}
        <div className="px-5 pb-3 shrink-0 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {STATUS_FILTERS.map(f => {
              const active = statusFilter === f.id;
              const cfg = f.id !== 'all' ? STATUS_CONFIG[f.id] : null;
              return <button key={f.id} onClick={() => setStatusFilter(f.id)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${active ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'}`} style={active && cfg ? { backgroundColor: cfg.bg, color: cfg.text } : undefined}>
                {f.label}
                {f.id !== 'all' && orders.filter(o => o.status === f.id).length > 0 && <span className="ml-1 opacity-60">{orders.filter(o => o.status === f.id).length}</span>}
              </button>;
            })}
          </div>
        </div>
        <div className="h-px bg-neutral-100 mx-5 shrink-0" />
        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {filtered.length === 0 && <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center"><Package size={22} className="text-neutral-400" strokeWidth={1.5} /></div>
            <p className="text-sm font-bold text-neutral-400">Sin resultados</p>
            <p className="text-xs text-neutral-300">Probá otro filtro o búsqueda</p>
          </div>}
          {Object.entries(groupedByDate).map(([date, dateOrders]) => <div key={date}>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">{date}</p>
            <div className="space-y-1.5">
              {dateOrders.map(order => <OrderCard key={order.id} order={order} onAlertClick={onAlertClick} onCancelClick={onCancelClick} onDetailClick={onDetailClick} />)}
            </div>
          </div>)}
        </div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const InsumaKitchenDashboard = ({ authUserEmail, onSignOut }: { authUserEmail?: string; onSignOut?: () => void } = {}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showNuevoPedido, setShowNuevoPedido] = useState(false);
  const [nuevoPedidoInitial, setNuevoPedidoInitial] = useState<{providerName?: string; items?: Array<{id: string; name: string; qty: number; unit: string}>} | null>(null);
  const [showNuevoProveedor, setShowNuevoProveedor] = useState(false);
  const [showNuevoInsumo, setShowNuevoInsumo] = useState(false);
  const [customInsumos, setCustomInsumos] = useState<{ id: string; name: string; category: string; unit: string; pricePerKg: number; provider: string }[]>(() => {
    try {
      const saved = localStorage.getItem('insuma_insumos');
      if (saved) { const arr = JSON.parse(saved); if (Array.isArray(arr) && arr.length > 0) return arr; }
    } catch { /* ignore */ }
    return [
      { id: 'ci-asado', name: 'Asado', category: 'Carnes', unit: 'kg', pricePerKg: 8200, provider: 'Fura' },
      { id: 'ci-pollo', name: 'Pollo entero', category: 'Carnes', unit: 'kg', pricePerKg: 5800, provider: 'Fura' },
      { id: 'ci-lomo', name: 'Lomo', category: 'Carnes', unit: 'kg', pricePerKg: 18500, provider: 'Criollo' },
      { id: 'ci-vacio', name: 'Vacío', category: 'Carnes', unit: 'kg', pricePerKg: 10200, provider: 'Fura' },
      { id: 'ci-tomate', name: 'Tomate perita', category: 'Verduras', unit: 'kg', pricePerKg: 1800, provider: '4 estaciones' },
      { id: 'ci-rucula', name: 'Rúcula', category: 'Verduras', unit: 'kg', pricePerKg: 3200, provider: '4 estaciones' },
      { id: 'ci-cebolla', name: 'Cebolla morada', category: 'Verduras', unit: 'kg', pricePerKg: 1600, provider: '4 estaciones' },
      { id: 'ci-zucchini', name: 'Zucchini', category: 'Verduras', unit: 'kg', pricePerKg: 2400, provider: '4 estaciones' },
      { id: 'ci-harina', name: 'Harina 000', category: 'Almacén', unit: 'kg', pricePerKg: 980, provider: 'Soleil' },
      { id: 'ci-aceite', name: 'Aceite de girasol', category: 'Almacén', unit: 'lt', pricePerKg: 1200, provider: 'Soleil' },
      { id: 'ci-azucar', name: 'Azúcar', category: 'Almacén', unit: 'kg', pricePerKg: 850, provider: 'Soleil' },
      { id: 'ci-huevos', name: 'Huevos', category: 'Lácteos', unit: 'u', pricePerKg: 320, provider: 'Adrian huevos' },
      { id: 'ci-manteca', name: 'Manteca', category: 'Lácteos', unit: 'kg', pricePerKg: 4800, provider: 'Adrian huevos' },
      { id: 'ci-crema', name: 'Crema de leche', category: 'Lácteos', unit: 'lt', pricePerKg: 2800, provider: 'Adrian huevos' },
    ];
  });
  const [showRecepcion, setShowRecepcion] = useState(false);
  // Dynamic users & business (cargado desde Supabase)
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [negocioNombre, setNegocioNombre] = useState<string>('Cocina');
  const [recepcionOrderId, setRecepcionOrderId] = useState<string | undefined>(undefined);
  const [todayOrders, setTodayOrders] = useState<Order[]>(() => {
    try {
      const v = localStorage.getItem('insuma_data_v');
      if (v !== '2') { localStorage.removeItem('insuma_pedidos'); localStorage.removeItem('insuma_insumos'); localStorage.removeItem('insuma_recetas'); localStorage.setItem('insuma_data_v', '2'); }
      const saved = localStorage.getItem('insuma_pedidos');
      if (saved) return JSON.parse(saved) as Order[];
    } catch { /* ignore */ }
    return MOCK_ORDERS;
  });
  const [providers, setProviders] = useState<Provider[]>(() => {
    try {
      const saved = localStorage.getItem('insuma_proveedores');
      if (saved) { const arr = JSON.parse(saved); if (Array.isArray(arr) && arr.length > 0) return arr; }
    } catch { /* ignore */ }
    return INITIAL_PROVIDERS;
  });
  const [selectedProveedor, setSelectedProveedor] = useState<Provider | null>(null);
  const [alertOrderId, setAlertOrderId] = useState<string | null>(null);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showBellPanel, setShowBellPanel] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [activeUser, setActiveUser] = useState<UserProfile>({ id: 'chef', name: 'Operador', role: 'chef' });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [lastPriceUpdate, setLastPriceUpdate] = useState<number | undefined>(undefined);
  const [pinError, setPinError] = useState(false);
  const [pendingAdmin, setPendingAdmin] = useState<UserProfile | null>(null);
  const [showPinReset, setShowPinReset] = useState(false);
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
      const inicial = mapped.find(u => u.role === 'chef') ?? mapped[0];
      if (inicial) setActiveUser(inicial);
    });

    // Cargar insumos custom
    loadInsumos().then(insumos => setCustomInsumos(insumos));

    // Cargar pedidos desde Supabase — merge con localStorage
    loadPedidosDB().then(dbRows => {
      if (dbRows.length === 0) return;
      setTodayOrders(prev => {
        const localMap = new Map(prev.map(o => [o.id, o]));
        const dbIds = new Set(dbRows.map(r => r.id));
        // Para cada pedido en Supabase: preferir versión local (tiene paymentHistory completo)
        const merged = dbRows.map(row => localMap.get(row.id) ?? pedidoDBToOrder(row, INITIAL_PROVIDERS));
        // Agregar pedidos locales que aún no llegaron a Supabase (ej: creados offline)
        const localOnly = prev.filter(o => !dbIds.has(o.id));
        return [...merged, ...localOnly];
      });
    });

    // Cargar proveedores desde Supabase — solo agregar los que no están en local
    loadProveedoresDB().then(dbProvs => {
      if (dbProvs.length === 0) return;
      setProviders(prev => {
        const localIds = new Set(prev.map(p => p.id));
        const newFromDB = dbProvs.filter(dp => !localIds.has(dp.id));
        return newFromDB.length > 0 ? [...prev, ...newFromDB] : prev;
      });
    });
  }, []);

  // Persistir todo en localStorage cada vez que cambian
  useEffect(() => {
    try { localStorage.setItem('insuma_pedidos', JSON.stringify(todayOrders)); } catch { /* ignore */ }
  }, [todayOrders]);
  useEffect(() => {
    try { localStorage.setItem('insuma_proveedores', JSON.stringify(providers)); } catch { /* ignore */ }
  }, [providers]);
  useEffect(() => {
    try { localStorage.setItem('insuma_insumos', JSON.stringify(customInsumos)); } catch { /* ignore */ }
  }, [customInsumos]);

  const handleCancelOrder = useCallback((orderId: string) => {
    setTodayOrders(prev => prev.filter(o => o.id !== orderId));
    actualizarPedido(orderId, { estado: 'cancelado' });
  }, []);

  const handleRequestNotifications = useCallback(async () => {
    await requestNotificationPermission();
    if ('Notification' in window) setNotifPermission(Notification.permission);
    sendNotification('INSUMA', '¡Notificaciones activadas! Te avisaremos cuando haya alertas.');
  }, []);
  const handleOrderCreated = useCallback((providerName?: string, orderNote?: string, creadoPor?: string, cartItems?: Array<{id: string; name: string; qty: number; unit: string}>, providerPhone?: string, deliveryDate?: string) => {
    const prov = providers.find(p => p.name === providerName);
    const orderId = crypto.randomUUID();
    const orderItems: OrderItem[] = (cartItems ?? []).map(i => ({
      id: i.id,
      name: i.name,
      requestedQty: i.qty,
      receivedQty: 0,
      unit: i.unit,
      status: 'pending' as const,
      alertMsg: '',
    }));
    const newOrder: Order = {
      id: orderId,
      provider: providerName ?? 'Nuevo Pedido',
      providerPhone: providerPhone ?? prov?.telefono,
      providerAlias: prov?.alias,
      providerCbu: prov?.cbu,
      category: 'Pedido',
      status: 'waiting' as OrderStatus,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      items: orderItems.length || 1,
      total: 0,
      paymentStatus: 'pending',
      weekLabel: 'Esta semana',
      paymentHistory: [],
      orderItems,
      orderNote: orderNote && orderNote.trim().length > 0 ? orderNote : undefined,
      creadoPor: creadoPor ?? undefined,
      deliveryDate: deliveryDate ?? undefined,
    };
    setTodayOrders(prev => [newOrder, ...prev]);
    guardarPedido({
      id: orderId,
      proveedorNombre: providerName ?? 'Nuevo Pedido',
      proveedorId: prov?.id,
      estado: 'en_espera',
      nota: orderNote && orderNote.trim().length > 0 ? orderNote : undefined,
      creadoPor: creadoPor ?? undefined,
      items: orderItems,
      total: 0,
      alertas: deliveryDate ? { deliveryDate } : undefined,
    });
  }, [providers]);
  const handleOrderReceived = useCallback((orderId: string, hasCash: boolean, newAlerts?: Alert[], receptionNote?: string, recepcionadoPor?: string, totalFactura?: number) => {
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
        total: totalFactura ?? o.total,
      };
    }));
    // Sync to Supabase
    const nuevoEstado = hasCash ? 'pago_efectivo' : (newAlerts && newAlerts.length > 0 ? 'con_diferencias' : 'recibido');
    actualizarPedido(orderId, {
      estado: nuevoEstado,
      recepcionadoPor: recepcionadoPor ?? undefined,
      tieneEfectivo: hasCash,
      total: totalFactura,
      alertas: {
        alerts: newAlerts ?? [],
        receptionNote: receptionNote ?? '',
      },
    });
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
  const handleProveedorCreated = useCallback((data: ProveedorCompleto) => {
    setProviders(prev => [{
      id: crypto.randomUUID(),
      name: data.nombreEmpresa,
      category: data.rubro || 'Nuevo',
      telefono: data.telefonoVentas || undefined,
      telefonoAdmin: data.telefonoAdmin || undefined,
      nombreVentas: data.nombreVentas || undefined,
      email: data.email || undefined,
      alias: data.alias || undefined,
      cbu: data.cbu || undefined,
      diasEntrega: data.diasEntrega.length > 0 ? data.diasEntrega : undefined,
      plazoPago: data.plazoPago || undefined,
    }, ...prev]);
  }, []);
  const handleUpdateProveedor = useCallback((data: Provider) => {
    setProviders(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
  }, []);
  const handleUpdateOrder = useCallback((orderId: string, updates: { orderItems?: OrderItem[]; orderNote?: string; items?: number }) => {
    setTodayOrders(prev => prev.map(o => o.id !== orderId ? o : { ...o, ...updates }));
    setSelectedDetailOrder(prev => prev?.id === orderId ? { ...prev, ...updates } : prev);
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
  const handleReorderAlertItem = useCallback((orderId: string, itemName: string, providerName: string) => {
    const sourceOrder = todayOrders.find(o => o.id === orderId);
    const prov = providers.find(p => p.name === providerName);
    const newOrderId = crypto.randomUUID();
    const orderItem: OrderItem = {
      id: crypto.randomUUID(),
      name: itemName,
      requestedQty: 1,
      receivedQty: 0,
      unit: 'u',
      status: 'pending' as const,
      alertMsg: '',
    };
    const newOrder: Order = {
      id: newOrderId,
      provider: providerName,
      providerPhone: sourceOrder?.providerPhone ?? prov?.telefono,
      providerAlias: prov?.alias,
      providerCbu: prov?.cbu,
      category: 'Pedido',
      status: 'waiting' as OrderStatus,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      items: 1,
      total: 0,
      paymentStatus: 'pending',
      weekLabel: 'Esta semana',
      paymentHistory: [],
      orderItems: [orderItem],
    };
    setTodayOrders(prev => [newOrder, ...prev]);
  }, [todayOrders, providers]);

  const handleUpdateOrderDate = useCallback((orderId: string, newDate: string) => {
    setTodayOrders(prev => prev.map(o => o.id !== orderId ? o : { ...o, deliveryDate: newDate }));
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
    actualizarPedido(orderId, { estado: 'recibido', tieneEfectivo: true });
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
    actualizarPedido(orderId, { estado: 'recibido' });
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
      const prevHistory = o.paymentHistory ?? [];
      const lastIsBillingDisc = prevHistory.length > 0 && prevHistory[prevHistory.length - 1].type === 'billing_discrepancy';
      const newHistory = lastIsBillingDisc
        ? [...prevHistory.slice(0, -1), resolveEvent]
        : [...prevHistory, resolveEvent];
      return {
        ...o,
        total: newAmount !== undefined ? newAmount : o.total,
        hasBillingDiscrepancy: false,
        paymentHistory: newHistory
      };
    }));
  }, []);
  const handleSaveItemPrices = useCallback((items: { nombre: string; precioUnit: number; unit: string }[]) => {
    setCustomInsumos(prev => {
      const updated = [...prev];
      items.forEach(item => {
        const nombre = item.nombre.toLowerCase().trim();
        const existingCustomIdx = updated.findIndex(i => i.name.toLowerCase().trim() === nombre);
        if (existingCustomIdx >= 0) {
          updated[existingCustomIdx] = { ...updated[existingCustomIdx], pricePerKg: item.precioUnit };
        } else {
          const inCatalog = CATALOG_INSUMOS.find(i => i.name.toLowerCase().trim() === nombre);
          if (inCatalog) {
            updated.push({ ...inCatalog, pricePerKg: item.precioUnit });
          } else {
            updated.push({ id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: item.nombre, unit: item.unit, category: 'Almacén', pricePerKg: item.precioUnit, provider: '' });
          }
        }
      });
      return updated;
    });
    setLastPriceUpdate(Date.now());
  }, []);

  const handleSaveOrderPrices = useCallback((orderId: string, items: { id: string; precioUnit: number; ivaRate: number }[]) => {
    setTodayOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = (o.orderItems ?? []).map(oi => {
        const match = items.find(it => it.id === oi.id);
        return match ? { ...oi, precioUnit: match.precioUnit, ivaRate: match.ivaRate } : oi;
      });
      return { ...o, orderItems: updatedItems };
    }));
  }, []);

  const handleSaveInvoicePhoto = useCallback((orderId: string, dataUrl: string) => {
    setTodayOrders(prev => prev.map(o => o.id !== orderId ? o : { ...o, invoiceImageUrl: dataUrl }));
  }, []);

  const alertOrder = todayOrders.find(o => o.id === alertOrderId) ?? null;
  const allUnresolvedAlerts = todayOrders.flatMap(o => (o.alerts ?? []).filter(a => !a.resolved));
  const lastOrdersByProvider: Record<string, {date: string; items: Array<{productId: string; name: string; qty: number; unit: string; note: string}>}> = {};
  todayOrders.forEach(o => {
    if (!o.orderItems || o.orderItems.length === 0) return;
    const existing = lastOrdersByProvider[o.provider];
    if (!existing || o.time > existing.date) {
      lastOrdersByProvider[o.provider] = {
        date: o.time,
        items: o.orderItems.map(i => ({ productId: i.id, name: i.name, qty: i.requestedQty, unit: i.unit, note: '' })),
      };
    }
  });
  const pendingPayments = todayOrders.filter(o => (o.status === 'received' || o.status === 'discrepancy') && o.paymentStatus !== 'paid_digital' && o.paymentStatus !== 'confirmed').length;
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
                <button onClick={() => setShowAllOrders(true)} className="text-black text-[11px] font-bold uppercase tracking-wide active:opacity-60 transition-opacity">Ver todo</button>
              </div>
              <div className="space-y-1.5">
                {todayOrders.map(order => <OrderCard key={order.id} order={order} onAlertClick={id => setAlertOrderId(id)} onCancelClick={o => setCancelOrder(o)} onDetailClick={o => setSelectedDetailOrder(o)} />)}
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
              <input value={providerSearch} onChange={e => setProviderSearch(e.target.value)} placeholder="Buscar proveedor o rubro..." className="flex-1 bg-transparent text-sm text-black placeholder:text-neutral-400 outline-none font-medium" />
              {providerSearch && <button onClick={() => setProviderSearch('')} className="text-neutral-400"><X size={14} /></button>}
            </div>
            <div className="space-y-1.5">
              {providers.filter(p => !providerSearch || p.name.toLowerCase().includes(providerSearch.toLowerCase()) || p.category.toLowerCase().includes(providerSearch.toLowerCase())).map(prov => <button key={prov.id} onClick={() => setSelectedProveedor(prov)} className="w-full flex items-center justify-between px-3 py-3 bg-white rounded-xl border border-neutral-100 active:bg-neutral-50 transition-colors text-left">
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
              </div> : (() => {
                const hoy = pendingReceptionOrders.filter(o => !o.deliveryDate || isSameDayDelivery(o.deliveryDate));
                const programados = pendingReceptionOrders.filter(o => o.deliveryDate && !isSameDayDelivery(o.deliveryDate));
                const ReceptionRow = ({ order }: { order: Order }) => {
                  const cfg = STATUS_CONFIG[order.status];
                  return <button key={order.id} onClick={() => { setRecepcionOrderId(order.id); setShowRecepcion(true); }} className="w-full text-left bg-white border border-neutral-100 rounded-xl overflow-hidden active:scale-[0.985] transition-transform">
                    <div className="flex">
                      <div className="w-1 shrink-0 rounded-l-xl" style={{ backgroundColor: cfg.dot }} />
                      <div className="flex-1 px-3 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-normal text-sm text-neutral-900 leading-tight truncate">{order.provider}</p>
                          <p className="text-neutral-400 text-[11px] font-normal">{order.category} · {order.items} items{order.deliveryDate ? ` · 🚚 ${order.deliveryDate}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-normal uppercase tracking-wide shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                          <span>{cfg.label}</span>
                        </div>
                      </div>
                    </div>
                  </button>;
                };
                return <div className="space-y-3">
                  {hoy.length > 0 && <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Para hoy</p>
                    {hoy.map(o => <ReceptionRow key={o.id} order={o} />)}
                  </div>}
                  {programados.length > 0 && <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Programados</p>
                    {programados.map(o => <ReceptionRow key={o.id} order={o} />)}
                  </div>}
                </div>;
              })()}
          </motion.div>}

        {activeTab === 'alertas' && <AlertasTab orders={todayOrders} onResolve={handleResolveAlert} onReorder={handleReorderAlertItem} />}
        {activeTab === 'recibidos' && <RecibidosTab orders={todayOrders} />}
        {activeTab === 'pagos' && <PagosTabEnhanced orders={todayOrders} providers={providers} onConfirmCash={handleConfirmCash} onPayDigital={handlePayDigital} onUpdateBillingDiscrepancy={handleUpdateBillingDiscrepancy} onSaveItemPrices={handleSaveItemPrices} onSaveOrderPrices={handleSaveOrderPrices} onSaveInvoicePhoto={handleSaveInvoicePhoto} onResolveAlert={handleResolveAlert} onReorderAlertItem={handleReorderAlertItem} onUpdateOrderDate={handleUpdateOrderDate} canView={activeUser.role === 'admin'} />}
        {activeTab === 'recetas' && <RecetasTab canViewCosts={activeUser.role === 'admin'} customInsumos={customInsumos} lastPriceUpdate={lastPriceUpdate} />}
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
      <NuevoPedidoModal
        isOpen={showNuevoPedido}
        onClose={() => { setShowNuevoPedido(false); setNuevoPedidoInitial(null); }}
        initialProvider={nuevoPedidoInitial?.providerName}
        initialItems={nuevoPedidoInitial?.items}
        onOrderCreated={handleOrderCreated}
        onInsumoCreated={async insumo => {
          const newInsumo = { ...insumo, pricePerKg: 0, provider: '' };
          try {
            const saved = await crearInsumo(newInsumo, 'ingrediente');
            setCustomInsumos(prev => [...prev, saved]);
          } catch {
            setCustomInsumos(prev => [...prev, newInsumo]);
          }
        }}
        creadoPor={activeUser.name}
        providers={providers}
        negocioNombre={negocioNombre}
        insumos={[...customInsumos, ...CATALOG_INSUMOS.filter(i => !customInsumos.some(c => c.id === i.id))]}
        lastOrdersByProvider={lastOrdersByProvider}
      />
      <NuevoProveedorModal isOpen={showNuevoProveedor} onClose={() => setShowNuevoProveedor(false)} onProveedorCreated={handleProveedorCreated} />
      <ProveedorPerfilSheet proveedor={selectedProveedor} isOpen={selectedProveedor !== null} onClose={() => setSelectedProveedor(null)} orders={todayOrders} onUpdateProveedor={handleUpdateProveedor} onNuevoPedido={(_id, items) => {
      const provName = selectedProveedor?.name;
      setSelectedProveedor(null);
      setNuevoPedidoInitial(items && items.length > 0 ? { providerName: provName, items } : { providerName: provName });
      setShowNuevoPedido(true);
    }} />
      <RecepcionPedidoModal isOpen={showRecepcion} onClose={() => {
      setShowRecepcion(false);
      setRecepcionOrderId(undefined);
    }} onOrderReceived={handleOrderReceived} initialOrderId={recepcionOrderId} recepcionadoPor={activeUser.name} orders={pendingReceptionOrders} />
      <AllOrdersSheet isOpen={showAllOrders} onClose={() => setShowAllOrders(false)} orders={todayOrders} onDetailClick={o => { setShowAllOrders(false); setSelectedDetailOrder(o); }} onAlertClick={id => { setShowAllOrders(false); setAlertOrderId(id); }} onCancelClick={o => { setShowAllOrders(false); setCancelOrder(o); }} />
      <AlertDetailSheet order={alertOrder} isOpen={alertOrderId !== null} onClose={() => setAlertOrderId(null)} onResolve={handleResolveAlert} />
      <CancelOrderSheet order={cancelOrder} isOpen={cancelOrder !== null} onClose={() => setCancelOrder(null)} onConfirmCancel={handleCancelOrder} />
      <OrderDetailSheet order={selectedDetailOrder} isOpen={selectedDetailOrder !== null} onClose={() => setSelectedDetailOrder(null)} onUpdateOrder={handleUpdateOrder} insumos={[...customInsumos, ...CATALOG_INSUMOS.filter(i => !customInsumos.some(c => c.id === i.id))]} />

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
                setShowUserMenu(false);
                if (onSignOut) {
                  onSignOut();
                } else {
                  localStorage.removeItem('insuma_onboarding_ok');
                  localStorage.removeItem('insuma_negocio_id');
                  localStorage.removeItem('insuma_negocio');
                  localStorage.removeItem('insuma_usuarios');
                  window.location.reload();
                }
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
            <div className="flex items-center justify-between">
              <button onClick={() => setShowPinModal(false)} className="text-sm text-neutral-400 py-2">Cancelar</button>
              {authUserEmail && (
                <button
                  onClick={() => { setShowPinModal(false); setShowPinReset(true); }}
                  className="text-sm text-blue-500 py-2 font-medium"
                >
                  Olvidé el código
                </button>
              )}
            </div>
          </motion.div>
        </>}
      </AnimatePresence>

      <PinResetSheet
        isOpen={showPinReset}
        email={authUserEmail ?? ''}
        onClose={() => setShowPinReset(false)}
        onPinUpdated={(newPin) => {
          setUsuarios(prev => prev.map(u => u.role === 'admin' ? { ...u, pin: newPin } : u));
        }}
      />
    </div>;
};