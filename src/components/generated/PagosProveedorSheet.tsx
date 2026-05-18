import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ArrowRight, Check, CheckCircle2, AlertCircle, ExternalLink, CreditCard, Banknote, Receipt, Send, Package, History, Camera, Edit3, Upload, Clock, MessageSquare, StickyNote, ChevronDown, Sparkles, FileText, Eye, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  invoiceImageUrl?: string;
  aiInvoiceScan?: AiInvoiceScan;
}
interface AiInvoiceScan {
  scannedAt: string;
  total: number;
  items: AiScannedItem[];
  vendor: string;
  invoiceNumber?: string;
  date?: string;
}
interface AiScannedItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}
interface ProviderPaymentGroup {
  providerName: string;
  providerPhone?: string;
  providerAlias?: string;
  providerCbu?: string;
  orders: Order[];
  totalPending: number;
  daysUntilDue: number;
  paymentTermLabel: string;
  isOverdue: boolean;
}

// ─── Order line items ─────────────────────────────────────────────────────────

interface OrderLineItem {
  id: string;
  nombre: string;
  cantPedida: number;
  cantRecibida: number;
  unit: string;
  precioUnit: number;
  ivaRate: number; // 0 | 10.5 | 21 | 27
}

const MOCK_ORDER_ITEMS: OrderLineItem[] = [];

// ─── Mock AI Scan Data ────────────────────────────────────────────────────────

const MOCK_AI_SCANS: Record<string, AiInvoiceScan> = {};

// ─── Payment term configs ─────────────────────────────────────────────────────

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
    icon: Clock
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
    icon: Banknote
  }
};
const formatMoney = (n: number) => '$' + n.toLocaleString('es-AR', {
  maximumFractionDigits: 0
});
const WaIcon = ({
  size = 15,
  color = 'white'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.198.497.099.198.05.15.01.371-.01.297-.149.767.966.94 1.164-.173.195-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.541 4.07 1.489 5.789L0 24l6.378-1.674A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.651-.51-5.168-1.402l-.371-.22-3.787.994.993-3.688-.24-.381A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
  </svg>;

// ─── AI Invoice Detail Sheet ──────────────────────────────────────────────────

const AiInvoiceDetailSheet = ({
  order,
  isOpen,
  onClose,
  onUpdateBillingDiscrepancy,
  onSaveItemPrices,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBillingDiscrepancy?: (orderId: string, resolution: string, newAmount?: number) => void;
  onSaveItemPrices?: (items: { nombre: string; precioUnit: number; unit: string }[]) => void;
}) => {
  const [aiScanLoading, setAiScanLoading] = useState(false);
  const [aiScanDone, setAiScanDone] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);
  const [manualTotalInput, setManualTotalInput] = useState('');
  const [pricesSaved, setPricesSaved] = useState(false);
  const [manualTotalSaved, setManualTotalSaved] = useState(false);
  // Editar circuito de compra state
  const [editingCircuito, setEditingCircuito] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderLineItem[]>(MOCK_ORDER_ITEMS);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [fotoAdjuntada, setFotoAdjuntada] = useState(false);

  React.useEffect(() => {
    if (isOpen && order) {
      setEditTotal(order.total ?? 0);
      // Inicializar ítems desde los orderItems reales del pedido
      const realItems: OrderLineItem[] = (order.orderItems ?? []).map(i => ({
        id: i.id,
        nombre: i.name,
        cantPedida: i.requestedQty,
        cantRecibida: i.receivedQty ?? i.requestedQty,
        unit: i.unit,
        precioUnit: 0,
        ivaRate: 21,
      }));
      setOrderItems(realItems.length > 0 ? realItems : MOCK_ORDER_ITEMS);
      setEditingCircuito(false);
      setFotoAdjuntada(false);
      setManualTotalInput(order.total ? String(order.total) : '');
      setManualTotalSaved(!!order.total);
    }
  }, [isOpen, order?.id]);
  const scan = order ? order.aiInvoiceScan ?? MOCK_AI_SCANS[order.id] ?? null : null;
  const hasPhoto = order && (order.status === 'received' || order.status === 'discrepancy' || order.status === 'paid_cash');
  useEffect(() => {
    if (isOpen && hasPhoto && !scan) {
      setAiScanLoading(true);
      const t = setTimeout(() => {
        setAiScanLoading(false);
        setAiScanDone(true);
      }, 1800);
      return () => clearTimeout(t);
    } else if (isOpen && scan) {
      setAiScanDone(true);
    }
  }, [isOpen, hasPhoto, scan]);
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setAiScanLoading(false);
        setAiScanDone(false);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);
  if (!order) return null;
  const activeScan = scan;
  const displayItems = order.orderItems ?? [];
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
  return <AnimatePresence>
      {isOpen && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} className="fixed inset-0 z-[80] flex flex-col justify-end" style={{
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
      }} className="relative flex flex-col bg-white rounded-t-3xl overflow-hidden max-h-[94vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="px-5 pt-2 pb-4 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-base font-black text-black leading-tight">Detalle del pedido</h2>
                <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                  <span>#{order.id}</span>
                  <span> · </span>
                  <span>{order.provider}</span>
                </p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                <X size={17} strokeWidth={2} />
              </button>
            </div>
            <div className="h-px bg-neutral-100 mx-5 shrink-0" />

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-5">
              {/* Status + amount */}
              <div className="flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Estado</p>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide" style={{
                backgroundColor: STATUS_CONFIG[order.status].bg,
                color: STATUS_CONFIG[order.status].text
              }}>
                    <span>{STATUS_CONFIG[order.status].label}</span>
                  </div>
                </div>
                {order.total != null && <div className="text-right">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Total</p>
                    <p className="text-2xl font-black text-black tabular-nums leading-none">{formatMoney(order.total)}</p>
                  </div>}
              </div>

              {/* Detalle del pedido con costos */}
              {(() => {
                // precioUnit = precio neto UNITARIO. El input muestra subtotal neto (precioUnit × cant)
                // y divide por cant al guardar. unitConIva = precioUnit × (1 + ivaRate/100)
                const totalNeto = orderItems.reduce((s, it) => s + it.cantRecibida * it.precioUnit, 0);
                const totalIvaSum = orderItems.reduce((s, it) => s + it.cantRecibida * it.precioUnit * (it.ivaRate / 100), 0);
                const totalFactura = totalNeto + totalIvaSum;
                const IVA_OPTIONS = [0, 10.5, 21, 27];
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Detalle del pedido</p>
                      <div className="flex items-center gap-2">
                        {totalFactura > 0 && (
                          <button
                            onClick={() => { onUpdateBillingDiscrepancy?.(order.id, 'manual_detail', totalFactura); }}
                            className="flex items-center gap-1 text-[10px] font-black text-white bg-black px-2.5 py-1 rounded-lg active:scale-95 transition-transform"
                          >
                            <Check size={10} strokeWidth={3} />
                            <span>Guardar total</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const priced = orderItems.filter(it => it.precioUnit > 0);
                            onSaveItemPrices?.(priced.map(it => ({ nombre: it.nombre, precioUnit: it.precioUnit, unit: it.unit })));
                            setPricesSaved(true);
                            setTimeout(() => setPricesSaved(false), 3000);
                          }}
                          className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg active:scale-95 transition-all ${pricesSaved ? 'bg-green-500 text-white' : 'bg-neutral-900 text-white'}`}
                        >
                          {pricesSaved ? <Check size={10} strokeWidth={3} /> : <Package size={10} strokeWidth={2.5} />}
                          <span>{pricesSaved ? 'Guardado' : 'Guardar precios'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {orderItems.map((item, idx) => {
                        const cant = item.cantRecibida || item.cantPedida || 1;
                        const unitConIva = item.precioUnit * (1 + item.ivaRate / 100);
                        const subtotal = cant * unitConIva;
                        const hasDiff = item.cantRecibida < item.cantPedida;
                        return (
                          <div key={item.id} className={`bg-white border rounded-2xl overflow-hidden ${hasDiff ? 'border-red-200' : 'border-neutral-100'}`}>
                            {/* Header */}
                            <div className={`px-3 py-2.5 flex items-center justify-between ${hasDiff ? 'bg-red-50' : 'bg-neutral-50'} border-b ${hasDiff ? 'border-red-100' : 'border-neutral-100'}`}>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-black truncate ${hasDiff ? 'text-red-700' : 'text-neutral-900'}`}>{item.nombre}</p>
                                <p className="text-[10px] font-medium mt-0.5">
                                  {hasDiff
                                    ? <span className="text-red-500">Pedido {item.cantPedida}, recibido {item.cantRecibida} {item.unit}</span>
                                    : <span className="text-neutral-400">{cant} {item.unit}</span>
                                  }
                                </p>
                              </div>
                              {item.precioUnit > 0 && <p className="text-sm font-black text-black tabular-nums ml-3">{formatMoney(subtotal)}</p>}
                            </div>

                            <div className="px-3 py-3 space-y-2.5">
                              {/* Subtotal neto (usuario ingresa total del renglón, se divide por cant para obtener unitario) */}
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-neutral-400 w-24 shrink-0">Subtotal neto</p>
                                <div className="relative flex-1">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">$</span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={item.precioUnit > 0 ? Math.round(item.precioUnit * cant * 100) / 100 : ''}
                                    onChange={e => {
                                      const totalNeto = parseFloat(e.target.value) || 0;
                                      setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, precioUnit: cant > 0 ? totalNeto / cant : totalNeto } : it));
                                    }}
                                    className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-black text-black text-right outline-none focus:border-black transition-colors tabular-nums"
                                    style={{ MozAppearance: 'textfield' } as React.CSSProperties}
                                  />
                                </div>
                              </div>

                              {/* IVA selector */}
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-neutral-400 w-24 shrink-0">Alícuota IVA</p>
                                <div className="flex gap-1.5 flex-1">
                                  {IVA_OPTIONS.map(rate => (
                                    <button
                                      key={rate}
                                      onClick={() => setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, ivaRate: rate } : it))}
                                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 ${item.ivaRate === rate ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'}`}
                                    >
                                      {rate === 0 ? 'Exento' : `${rate}%`}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Resultados calculados */}
                              {item.precioUnit > 0 && (
                                <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-neutral-400 font-bold">P. neto unit.</p>
                                    <p className="text-[11px] font-black text-neutral-700 tabular-nums">{formatMoney(item.precioUnit)}</p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-neutral-400 font-bold">P. unit. c/IVA</p>
                                    <p className="text-[11px] font-black text-neutral-700 tabular-nums">{formatMoney(unitConIva)}</p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-neutral-400 font-bold">Subtotal c/IVA ({cant} {item.unit})</p>
                                    <p className="text-[11px] font-black text-neutral-700 tabular-nums">{formatMoney(subtotal)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Resumen */}
                    {totalNeto > 0 && (
                      <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-100">
                          <p className="text-xs text-neutral-500 font-bold">Subtotal neto</p>
                          <p className="text-xs font-black text-neutral-700 tabular-nums">{formatMoney(totalNeto)}</p>
                        </div>
                        <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-100">
                          <p className="text-xs text-neutral-500 font-bold">IVA</p>
                          <p className="text-xs font-black text-neutral-700 tabular-nums">{formatMoney(totalIvaSum)}</p>
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between bg-white">
                          <p className="text-sm font-black text-black">Total factura c/IVA</p>
                          <p className="text-lg font-black text-black tabular-nums">{formatMoney(totalFactura)}</p>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}

              {/* What was ordered */}
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Lo que se pidió</p>
                <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                  {displayItems.length > 0 ? displayItems.map((item, idx) => <div key={item.id} className={`px-4 py-2.5 flex items-center justify-between gap-3 ${idx < displayItems.length - 1 ? 'border-b border-neutral-50' : ''}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{
                    backgroundColor: item.status === 'ok' ? '#22C55E' : item.status === 'discrepancy' ? '#EF4444' : '#EAB308'
                  }} />
                        <p className="text-xs font-bold text-neutral-800 truncate">{item.name}</p>
                      </div>
                      <p className="text-xs font-black text-neutral-500 tabular-nums shrink-0">
                        {item.receivedQty}/{item.requestedQty} {item.unit}
                      </p>
                    </div>) : <div className="px-4 py-3">
                      <p className="text-xs font-bold text-neutral-800">{order.items} productos</p>
                      <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Sin detalle por producto disponible</p>
                    </div>}
                </div>
              </div>

              {/* What was received */}
              {(order.status === 'received' || order.status === 'discrepancy' || order.status === 'paid_cash') && <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Lo que se recibió</p>
                  <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                    {displayItems.length > 0 ? displayItems.map((item, idx) => <div key={item.id} className={`px-4 py-2.5 flex items-center justify-between gap-3 ${idx < displayItems.length - 1 ? 'border-b border-neutral-50' : ''}`}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{
                    backgroundColor: item.status === 'ok' ? '#22C55E' : '#EF4444'
                  }} />
                          <p className={`text-xs font-bold truncate ${item.status === 'discrepancy' ? 'text-red-700' : 'text-neutral-800'}`}>{item.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <p className={`text-xs font-black tabular-nums ${item.status === 'discrepancy' ? 'text-red-600' : 'text-neutral-500'}`}>
                            {item.receivedQty} {item.unit}
                          </p>
                          {item.status === 'discrepancy' && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full uppercase">Dif.</span>}
                        </div>
                      </div>) : <div className="px-4 py-3">
                        <p className="text-xs font-bold text-neutral-800">{order.items} productos recibidos</p>
                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Recibido a las {order.receivedAt}</p>
                      </div>}
                  </div>
                </div>}

              {/* Invoice photo */}
              {hasPhoto && <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Foto de la factura / remito</p>
                  <div className="bg-neutral-50 border border-neutral-100 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
                      <div className="w-14 h-14 rounded-xl bg-neutral-200 flex items-center justify-center shrink-0">
                        <Camera size={20} className="text-neutral-400" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-neutral-700">factura_{order.id}.jpg</p>
                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Capturado en recepción · {order.receivedAt ?? order.time}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <CheckCircle2 size={10} className="text-green-500" strokeWidth={2.5} />
                          <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide">Verificado</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Scan Section — collapsible */}
                    <div className="px-4 py-3">
                      <button
                        onClick={() => setShowAiSection(v => !v)}
                        className="flex items-center gap-2 w-full mb-3 active:opacity-70 transition-opacity"
                      >
                        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                          <Sparkles size={12} strokeWidth={2.5} className="text-violet-600" />
                        </div>
                        <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest flex-1 text-left">Análisis de factura con IA</p>
                        <ChevronDown size={14} strokeWidth={2.5} className={`text-violet-400 transition-transform ${showAiSection ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                      {showAiSection && <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >

                      {aiScanLoading && <motion.div initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} className="flex items-center gap-3 py-2">
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400" animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.5, 1, 0.5]
                    }} transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2
                    }} />)}
                          </div>
                          <p className="text-xs text-violet-500 font-medium">Analizando imagen con IA...</p>
                        </motion.div>}

                      {!aiScanLoading && !aiScanDone && !activeScan && <div className="flex flex-col items-center gap-2 py-4 text-center">
                          <Sparkles size={20} className="text-neutral-300" strokeWidth={1.5} />
                          <p className="text-xs text-neutral-400 font-medium">Sin escaneo disponible</p>
                        </div>}

                      {/* Scan terminó pero sin total detectado → alerta + ingreso manual */}
                      {aiScanDone && !activeScan && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                            <AlertCircle size={15} strokeWidth={2} className="text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[11px] font-black text-amber-800 leading-tight">No se pudo detectar el total</p>
                              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Ingresalo manualmente para que quede registrado en el circuito de pagos.</p>
                            </div>
                          </div>
                          {/* Ítems con precio editable */}
                          {orderItems.length > 0 && (
                            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                              <div className="px-3 py-2 border-b border-neutral-100 grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                                <p className="text-[9px] font-bold text-neutral-400 uppercase">Producto</p>
                                <p className="text-[9px] font-bold text-neutral-400 uppercase text-right">Cant.</p>
                                <p className="text-[9px] font-bold text-neutral-400 uppercase text-right">Precio unit.</p>
                                <p className="text-[9px] font-bold text-neutral-400 uppercase text-right">Subtotal</p>
                              </div>
                              {orderItems.map((item, idx) => {
                                const cantAI = item.cantRecibida || item.cantPedida || 1;
                                return (
                                  <div key={item.id} className={`px-3 py-2.5 grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center ${idx < orderItems.length - 1 ? 'border-b border-neutral-50' : ''}`}>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-neutral-800 truncate">{item.nombre}</p>
                                      <p className="text-[10px] text-neutral-400">{cantAI} {item.unit}</p>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 tabular-nums text-right">{cantAI}</p>
                                    <div className="relative">
                                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px]">$</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={item.precioUnit || ''}
                                        onChange={e => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setOrderItems(prev => {
                                            const updated = prev.map((it, i) => i === idx ? { ...it, precioUnit: val } : it);
                                            const newTotal = updated.reduce((s, it) => {
                                              const c = it.cantRecibida || it.cantPedida || 1;
                                              return s + c * it.precioUnit;
                                            }, 0);
                                            if (newTotal > 0) setManualTotalInput(String(Math.round(newTotal * 100) / 100));
                                            return updated;
                                          });
                                        }}
                                        className="w-20 pl-5 pr-1.5 py-1 rounded-lg border border-neutral-200 bg-neutral-50 text-[11px] font-black text-black text-right outline-none focus:border-black transition-colors tabular-nums"
                                        style={{ MozAppearance: 'textfield' } as React.CSSProperties}
                                      />
                                    </div>
                                    <p className="text-[11px] font-black text-neutral-800 tabular-nums text-right">{formatMoney(cantAI * item.precioUnit)}</p>
                                  </div>
                                );
                              })}
                              <div className="px-3 py-2.5 flex items-center justify-between border-t border-neutral-100 bg-neutral-50">
                                <p className="text-xs font-bold text-neutral-600">Total calculado</p>
                                <p className="text-sm font-black text-black tabular-nums">
                                  {formatMoney(orderItems.reduce((s, it) => s + (it.cantRecibida || it.cantPedida || 1) * it.precioUnit, 0))}
                                </p>
                              </div>
                              {/* Guardar precios en insumos desde la tabla AI */}
                              <div className="px-3 py-2.5 border-t border-neutral-100">
                                <button
                                  onClick={() => {
                                    const priced = orderItems.filter(it => it.precioUnit > 0);
                                    onSaveItemPrices?.(priced.map(it => ({ nombre: it.nombre, precioUnit: it.precioUnit, unit: it.unit })));
                                    setPricesSaved(true);
                                    setTimeout(() => setPricesSaved(false), 3000);
                                  }}
                                  className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${pricesSaved ? 'bg-green-500 text-white' : 'bg-black text-white'}`}
                                >
                                  {pricesSaved ? <Check size={12} strokeWidth={3} /> : <Package size={12} strokeWidth={2.5} />}
                                  <span>{pricesSaved ? 'Guardado en insumos ✓' : 'Guardar precios en insumos'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="bg-white border border-neutral-200 rounded-xl px-3 py-3">
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Total de factura</p>
                            {manualTotalSaved ? (
                              <div className="flex items-center justify-between">
                                <span className="text-xl font-black text-black tabular-nums">{formatMoney(parseFloat(manualTotalInput) || 0)}</span>
                                <button onClick={() => setManualTotalSaved(false)} className="text-[10px] font-bold text-neutral-400 underline underline-offset-2">Editar</button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-black text-sm">$</span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={manualTotalInput}
                                    onChange={e => setManualTotalInput(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-black text-black placeholder-neutral-300 focus:outline-none focus:border-black transition-colors"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    if (parseFloat(manualTotalInput) > 0) {
                                      setManualTotalSaved(true);
                                      onUpdateBillingDiscrepancy?.(order.id, 'manual_total', parseFloat(manualTotalInput));
                                    }
                                  }}
                                  disabled={!manualTotalInput || parseFloat(manualTotalInput) <= 0}
                                  className="px-4 py-2.5 rounded-xl bg-black text-white text-xs font-black active:scale-95 transition-transform disabled:opacity-30"
                                >
                                  Guardar
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>}

                      {(activeScan) && <motion.div initial={{
                  opacity: 0,
                  y: 6
                }} animate={{
                  opacity: 1,
                  y: 0
                }} className="space-y-3">
                          {/* Scan meta */}
                          <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5 space-y-1.5">
                            {activeScan?.invoiceNumber && <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">N° Factura</span>
                                <span className="text-[10px] font-black text-violet-900 tracking-widest">{activeScan.invoiceNumber}</span>
                              </div>}
                            {activeScan?.date && <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">Fecha</span>
                                <span className="text-[10px] font-black text-violet-900">{activeScan.date}</span>
                              </div>}
                            <div className="flex items-center justify-between border-t border-violet-100 pt-1.5">
                              <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">Total detectado</span>
                              <span className="text-sm font-black text-violet-900">{formatMoney(activeScan?.total ?? order.total ?? 0)}</span>
                            </div>
                          </div>

                          {/* Scanned items */}
                          {activeScan && activeScan.items.length > 0 && <div>
                              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Ítems detectados por IA</p>
                              <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
                                {activeScan.items.map((item, idx) => <div key={item.id} className={`px-3 py-2 flex items-center justify-between gap-2 ${idx < activeScan.items.length - 1 ? 'border-b border-neutral-50' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-bold text-neutral-800 truncate">{item.name}</p>
                                      <p className="text-[10px] text-neutral-400 font-medium">{item.qty} {item.unit} × {formatMoney(item.unitPrice)}</p>
                                    </div>
                                    <p className="text-xs font-black text-neutral-700 tabular-nums shrink-0">{formatMoney(item.total)}</p>
                                  </div>)}
                              </div>
                            </div>}

                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={10} className="text-violet-500" strokeWidth={2.5} />
                            <p className="text-[10px] text-violet-500 font-medium">Escaneado el {activeScan?.scannedAt ?? 'recientemente'}</p>
                          </div>
                        </motion.div>}
                      </motion.div>}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>}

              {/* Alerts */}
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

              {/* Full Timeline */}
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

// ─── Provider Orders Sheet ────────────────────────────────────────────────────

const ProviderOrdersSheet = ({
  group,
  isOpen,
  onClose,
  onConfirmCash,
  onPayDigital,
  onUpdateBillingDiscrepancy,
  onSaveItemPrices,
}: {
  group: ProviderPaymentGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCash: (orderId: string) => void;
  onPayDigital: (orderId: string) => void;
  onUpdateBillingDiscrepancy: (orderId: string, resolution: string, newAmount?: number) => void;
  onSaveItemPrices?: (items: { nombre: string; precioUnit: number; unit: string }[]) => void;
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setSelectedOrder(null);
        setPaying(false);
        setPaid(false);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);
  if (!group) return null;
  const allPaid = group.orders.every(o => o.paymentStatus === 'paid_digital' || o.paymentStatus === 'confirmed');
  const pendingOrders = group.orders.filter(o => o.paymentStatus !== 'paid_digital' && o.paymentStatus !== 'confirmed');
  const handlePayAll = () => {
    setPaying(true);
    const mpAlias = group.providerAlias ?? 'sin-alias';
    const amount = group.totalPending;
    const mpUrl = `https://link.mercadopago.com.ar/pay?alias=${mpAlias}&amount=${amount}&description=Pedidos+INSUMA`;
    setTimeout(() => {
      window.open(mpUrl, '_blank');
      setPaying(false);
      pendingOrders.forEach(o => onPayDigital(o.id));
      setPaid(true);
    }, 800);
  };
  const handleWhatsApp = () => {
    if (!group.providerPhone) return;
    const msg = encodeURIComponent(`Hola! Te enviamos el comprobante de pago por ${formatMoney(group.totalPending)} correspondiente a ${pendingOrders.length} pedido(s). Gracias!`);
    window.open(`https://wa.me/${group.providerPhone}?text=${msg}`, '_blank');
  };
  return <AnimatePresence>
      {isOpen && <motion.div initial={{
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
      }} className="absolute inset-0 bg-black/55" onClick={onClose} />
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
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-neutral-200" />
            </div>

            <div className="px-5 pt-2 pb-4 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center text-base font-black shrink-0">
                  <span>{group.providerName.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-base font-black text-black leading-tight">{group.providerName}</h2>
                  <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                    <span>{group.orders.length} pedido{group.orders.length !== 1 ? 's' : ''}</span>
                    <span> · </span>
                    <span>{group.paymentTermLabel}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {group.providerPhone && <a href={`https://wa.me/${group.providerPhone}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center active:scale-90 transition-transform" aria-label="WhatsApp proveedor">
                    <WaIcon size={17} />
                  </a>}
                <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                  <X size={17} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="h-px bg-neutral-100 mx-5 shrink-0" />

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-5">
              {/* Total card */}
              <div className={`rounded-2xl px-4 py-4 ${group.isOverdue ? 'bg-red-50 border border-red-200' : 'bg-neutral-50 border border-neutral-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${group.isOverdue ? 'text-red-400' : 'text-neutral-400'}`}>
                      Total acumulado
                    </p>
                    <p className={`text-3xl font-black tabular-nums leading-none ${group.isOverdue ? 'text-red-700' : 'text-black'}`}>
                      {formatMoney(group.totalPending)}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-center ${group.isOverdue ? 'bg-red-100' : 'bg-white border border-neutral-200'}`}>
                    <p className={`text-[9px] font-bold uppercase tracking-wide ${group.isOverdue ? 'text-red-500' : 'text-neutral-400'}`}>
                      {group.isOverdue ? 'Vencido' : 'Vence en'}
                    </p>
                    <p className={`text-lg font-black tabular-nums leading-none ${group.isOverdue ? 'text-red-700' : 'text-black'}`}>
                      {group.isOverdue ? `${Math.abs(group.daysUntilDue)}d` : `${group.daysUntilDue}d`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment data */}
              {(group.providerAlias || group.providerCbu) && <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Datos de pago</p>
                  </div>
                  {group.providerAlias && <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-50">
                      <p className="text-xs font-bold text-neutral-500">Alias MP</p>
                      <p className="text-xs font-black text-black tracking-wide">{group.providerAlias}</p>
                    </div>}
                  {group.providerCbu && <div className="px-4 py-2.5 flex items-center justify-between">
                      <p className="text-xs font-bold text-neutral-500">CBU</p>
                      <p className="text-[10px] font-black text-black tracking-widest tabular-nums">
                        {group.providerCbu.slice(0, 6)}···{group.providerCbu.slice(-4)}
                      </p>
                    </div>}
                </div>}

              {/* Orders list */}
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                  Pedidos acumulados ({group.orders.length})
                </p>
                <div className="space-y-2">
                  {group.orders.map(order => {
                const isPaid = order.paymentStatus === 'paid_digital' || order.paymentStatus === 'confirmed';
                const cfg = STATUS_CONFIG[order.status];
                const hasScan = !!(order.aiInvoiceScan ?? MOCK_AI_SCANS[order.id]);
                const hasPhoto = order.status === 'received' || order.status === 'discrepancy' || order.status === 'paid_cash';
                return <button key={order.id} onClick={() => setSelectedOrder(order)} className={`w-full text-left rounded-2xl border overflow-hidden active:scale-[0.985] transition-transform ${isPaid ? 'bg-neutral-50 border-neutral-100' : 'bg-white border-neutral-200'}`}>
                        <div className="flex">
                          <div className="w-1 shrink-0 rounded-l-xl" style={{
                      backgroundColor: isPaid ? '#22C55E' : cfg.dot
                    }} />
                          <div className="flex-1 px-3 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <p className="text-xs font-black text-neutral-900">Pedido #{order.id}</p>
                                  {isPaid && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full uppercase">Pagado</span>}
                                </div>
                                <p className="text-[10px] text-neutral-400 font-medium">{order.category} · {order.items} items</p>
                                <p className="text-[10px] text-neutral-300 font-medium mt-0.5">{order.weekLabel} · {order.receivedAt ?? order.time}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                {order.total != null && <p className={`text-sm font-black tabular-nums ${isPaid ? 'text-neutral-400' : 'text-black'}`}>
                                    {formatMoney(order.total)}
                                  </p>}
                                <div className="flex items-center gap-1">
                                  {hasPhoto && <div className="flex items-center gap-0.5 bg-neutral-100 rounded-md px-1.5 py-0.5">
                                      <Camera size={8} className="text-neutral-500" strokeWidth={2.5} />
                                      <span className="text-[9px] font-bold text-neutral-500">Foto</span>
                                    </div>}
                                  {hasScan && <div className="flex items-center gap-0.5 bg-violet-50 border border-violet-100 rounded-md px-1.5 py-0.5">
                                      <Sparkles size={8} className="text-violet-500" strokeWidth={2.5} />
                                      <span className="text-[9px] font-bold text-violet-600">IA</span>
                                    </div>}
                                  <ChevronRight size={12} className="text-neutral-300" strokeWidth={2} />
                                </div>
                              </div>
                            </div>
                            {order.hasBillingDiscrepancy && <div className="mt-2 flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1">
                                <Receipt size={9} className="text-orange-500 shrink-0" strokeWidth={2.5} />
                                <span className="text-[9px] font-bold text-orange-700 uppercase">Diferencia de factura</span>
                              </div>}
                          </div>
                        </div>
                      </button>;
              })}
                </div>
              </div>

              {/* Pay actions */}
              {!allPaid && !paid && pendingOrders.length > 0 && <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Pagar todo</p>
                  <button onClick={handlePayAll} disabled={paying} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60">
                    {paying ? <motion.div animate={{
                rotate: 360
              }} transition={{
                repeat: Infinity,
                duration: 0.8,
                ease: 'linear'
              }}>
                        <ExternalLink size={17} strokeWidth={2.5} />
                      </motion.div> : <ExternalLink size={17} strokeWidth={2.5} />}
                    <span>{paying ? 'Abriendo Mercado Pago...' : `Pagar ${formatMoney(group.totalPending)} por MP`}</span>
                  </button>
                  <button onClick={handleWhatsApp} className="w-full py-3 rounded-2xl font-bold text-sm bg-green-500 text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                    <WaIcon size={15} />
                    <span>Enviar comprobante por WhatsApp</span>
                  </button>
                </div>}

              {(allPaid || paid) && <motion.div initial={{
            opacity: 0,
            y: 8
          }} animate={{
            opacity: 1,
            y: 0
          }} className="space-y-2">
                  <div className="w-full py-4 rounded-2xl bg-green-500 text-white flex flex-col items-center gap-1.5">
                    <CheckCircle2 size={22} strokeWidth={2.5} />
                    <p className="text-sm font-black">¡Pagos registrados!</p>
                    <p className="text-[11px] font-medium text-green-100">Todos los pedidos fueron pagados</p>
                  </div>
                  <button onClick={handleWhatsApp} className="w-full py-3 rounded-2xl font-bold text-sm bg-green-500 text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                    <WaIcon size={15} />
                    <span>Enviar comprobante al proveedor</span>
                  </button>
                </motion.div>}
            </div>
          </motion.div>

          {/* Order detail sheet */}
          <AiInvoiceDetailSheet order={selectedOrder} isOpen={selectedOrder !== null} onClose={() => setSelectedOrder(null)} onUpdateBillingDiscrepancy={onUpdateBillingDiscrepancy} onSaveItemPrices={onSaveItemPrices} />
        </motion.div>}
    </AnimatePresence>;
};

// ─── Main PagosTab with Provider Groups ──────────────────────────────────────

export const PagosTabEnhanced = ({
  orders,
  onConfirmCash,
  onPayDigital,
  onUpdateBillingDiscrepancy,
  onSaveItemPrices,
  canView = true,
}: {
  orders: Order[];
  onConfirmCash: (orderId: string) => void;
  onPayDigital: (orderId: string) => void;
  onUpdateBillingDiscrepancy: (orderId: string, resolution: string, newAmount?: number) => void;
  onSaveItemPrices?: (items: { nombre: string; precioUnit: number; unit: string }[]) => void;
  canView?: boolean;
}) => {
  const [selectedGroup, setSelectedGroup] = useState<ProviderPaymentGroup | null>(null);
  const [showTarifaConfig, setShowTarifaConfig] = useState(false);
  const [tarifaInput, setTarifaInput] = useState(() => localStorage.getItem('insuma_tarifa_hora') ?? '');
  const payableOrders = orders.filter(o => (o.status === 'received' || o.status === 'discrepancy' || o.status === 'paid_cash') && o.paymentStatus !== 'paid_digital' && o.paymentStatus !== 'confirmed');
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid_digital' || o.paymentStatus === 'confirmed');

  // Mock payment terms per provider
  const PAYMENT_TERMS: Record<string, {
    days: number;
    label: string;
  }> = {
    'Lácteos La Fé': {
      days: 3,
      label: 'Vence en 3 días'
    },
    'Distribuidora Almacén': {
      days: -1,
      label: 'Vencido ayer'
    },
    'Bebidas Express': {
      days: 7,
      label: 'Vence en 7 días'
    },
    'Pescadería del Puerto': {
      days: 1,
      label: 'Vence mañana'
    },
    'Frigorífico Central': {
      days: 5,
      label: 'Vence en 5 días'
    },
    'Huerta Orgánica': {
      days: 10,
      label: 'Vence en 10 días'
    }
  };

  // Group payable orders by provider
  const providerGroupMap = payableOrders.reduce<Record<string, ProviderPaymentGroup>>((acc, o) => {
    if (!acc[o.provider]) {
      const terms = PAYMENT_TERMS[o.provider] ?? {
        days: 7,
        label: 'Vence en 7 días'
      };
      acc[o.provider] = {
        providerName: o.provider,
        providerPhone: o.providerPhone,
        providerAlias: o.providerAlias,
        providerCbu: o.providerCbu,
        orders: [],
        totalPending: 0,
        daysUntilDue: terms.days,
        paymentTermLabel: terms.label,
        isOverdue: terms.days < 0
      };
    }
    acc[o.provider].orders.push(o);
    acc[o.provider].totalPending += o.total ?? 0;
    return acc;
  }, {});
  const providerGroups = Object.values(providerGroupMap).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  const totalPendiente = payableOrders.reduce((s, o) => s + (o.total ?? 0), 0);

  // Group paid orders by provider
  const paidGroupMap = paidOrders.reduce<Record<string, {
    providerName: string;
    orders: Order[];
    total: number;
  }>>((acc, o) => {
    if (!acc[o.provider]) {
      acc[o.provider] = {
        providerName: o.provider,
        orders: [],
        total: 0
      };
    }
    acc[o.provider].orders.push(o);
    acc[o.provider].total += o.total ?? 0;
    return acc;
  }, {});
  const paidGroups = Object.values(paidGroupMap);
  const syncedSelectedGroup = selectedGroup ? (() => {
    const currentOrders = orders.filter(o => o.provider === selectedGroup.providerName);
    const terms = PAYMENT_TERMS[selectedGroup.providerName] ?? {
      days: 7,
      label: 'Vence en 7 días'
    };
    return {
      ...selectedGroup,
      orders: currentOrders,
      totalPending: currentOrders.filter(o => o.paymentStatus !== 'paid_digital' && o.paymentStatus !== 'confirmed').reduce((s, o) => s + (o.total ?? 0), 0),
      daysUntilDue: terms.days,
      paymentTermLabel: terms.label,
      isOverdue: terms.days < 0
    };
  })() : null;
  if (!canView) {
    return (
      <motion.div key="tab-pagos-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center">
          <Lock size={28} strokeWidth={1.5} className="text-neutral-400" />
        </div>
        <div>
          <p className="text-base font-medium text-neutral-700">Acceso restringido</p>
          <p className="text-sm text-neutral-400 mt-1">Solo los administradores pueden ver y gestionar los pagos</p>
        </div>
        <p className="text-xs text-neutral-300">Cambiá de perfil desde el encabezado</p>
      </motion.div>
    );
  }
  return <motion.div key="tab-pagos-enhanced" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="px-4 pt-4 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-black leading-tight">Pagos</h2>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
            {providerGroups.length} proveedor{providerGroups.length !== 1 ? 'es' : ''} pendiente{providerGroups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTarifaConfig(true)}
            className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-[11px] font-bold text-neutral-600 active:scale-95 transition-transform"
          >
            <Clock size={11} strokeWidth={2.5} />
            <span>{localStorage.getItem('insuma_tarifa_hora') ? `$${localStorage.getItem('insuma_tarifa_hora')}/h` : 'Tarifa'}</span>
          </button>
          <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 text-right">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-base font-black text-black tabular-nums">{formatMoney(totalPendiente)}</p>
          </div>
        </div>
      </div>

      {/* Tarifa hora config modal */}
      <AnimatePresence>
        {showTarifaConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ maxWidth: 448, margin: '0 auto' }}
            onClick={() => setShowTarifaConfig(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white rounded-2xl p-6 w-full shadow-xl"
            >
              <h3 className="text-base font-black text-black mb-1">Tarifa hora trabajada</h3>
              <p className="text-xs text-neutral-400 mb-4">Se usa para calcular el costo de mano de obra en las recetas.</p>
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 mb-4">
                <span className="text-sm font-bold text-neutral-400">$</span>
                <input
                  autoFocus
                  type="number"
                  inputMode="numeric"
                  value={tarifaInput}
                  onChange={e => setTarifaInput(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-sm font-black text-black outline-none tabular-nums"
                  style={{ MozAppearance: 'textfield' } as React.CSSProperties}
                />
                <span className="text-xs text-neutral-400">/hora</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTarifaConfig(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 active:scale-95 transition-transform"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const val = parseFloat(tarifaInput) || 0;
                    localStorage.setItem('insuma_tarifa_hora', String(val));
                    setShowTarifaConfig(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-black active:scale-95 transition-transform"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overdue warning */}
      {providerGroups.some(g => g.isOverdue) && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" strokeWidth={2.5} />
          <div className="flex-1">
            <p className="text-xs font-black text-red-800">Pagos vencidos</p>
            <p className="text-[10px] text-red-600 font-medium mt-0.5">
              {providerGroups.filter(g => g.isOverdue).length} proveedor{providerGroups.filter(g => g.isOverdue).length !== 1 ? 'es' : ''} con vencimiento superado
            </p>
          </div>
        </div>}

      {/* Provider groups sorted by due date */}
      {providerGroups.length > 0 && <div className="space-y-2">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Por vencimiento</p>
          {providerGroups.map(group => <button key={group.providerName} onClick={() => setSelectedGroup(group)} className={`w-full text-left rounded-2xl border overflow-hidden active:scale-[0.985] transition-transform ${group.isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-100'}`}>
              <div className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${group.isOverdue ? 'bg-red-500 text-white' : 'bg-black text-white'}`}>
                      <span>{group.providerName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-neutral-900 leading-tight truncate">{group.providerName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${group.isOverdue ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500'}`}>
                          {group.paymentTermLabel}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {group.orders.length} pedido{group.orders.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className={`text-base font-black tabular-nums ${group.isOverdue ? 'text-red-700' : 'text-black'}`}>
                      {formatMoney(group.totalPending)}
                    </p>
                    <ChevronRight size={16} strokeWidth={2} className={group.isOverdue ? 'text-red-300' : 'text-neutral-300'} />
                  </div>
                </div>
                {group.orders.some(o => o.hasBillingDiscrepancy) && <div className="mt-2 flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1">
                    <Receipt size={9} className="text-orange-500 shrink-0" strokeWidth={2.5} />
                    <span className="text-[9px] font-bold text-orange-700 uppercase">Diferencia de factura pendiente</span>
                  </div>}
              </div>
            </button>)}
        </div>}

      {/* Paid providers */}
      {paidGroups.length > 0 && <div className="space-y-2 pt-2">
          <div className="h-px bg-neutral-100" />
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pt-1">Pagados</p>
          {paidGroups.map(group => <div key={group.providerName} className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3 flex items-center justify-between opacity-70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-sm font-black shrink-0 text-green-700">
                  <span>{group.providerName.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-neutral-700 leading-tight">{group.providerName}</p>
                  <p className="text-[10px] text-neutral-400 font-medium">{group.orders.length} pedido{group.orders.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <p className="text-sm font-black text-neutral-400 tabular-nums">{formatMoney(group.total)}</p>
                <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-100">
                  <CheckCircle2 size={9} className="text-green-600" strokeWidth={2.5} />
                  <span className="text-[9px] font-bold text-green-700 uppercase">Pagado</span>
                </div>
              </div>
            </div>)}
        </div>}

      {providerGroups.length === 0 && paidGroups.length === 0 && <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <CreditCard size={24} className="text-neutral-300" />
          </div>
          <p className="text-sm font-bold text-neutral-400">Sin pagos pendientes</p>
          <p className="text-xs text-neutral-300">Los pedidos recibidos aparecerán aquí</p>
        </div>}

      <ProviderOrdersSheet group={syncedSelectedGroup} isOpen={selectedGroup !== null} onClose={() => setSelectedGroup(null)} onConfirmCash={onConfirmCash} onPayDigital={onPayDigital} onUpdateBillingDiscrepancy={onUpdateBillingDiscrepancy} onSaveItemPrices={onSaveItemPrices} />
    </motion.div>;
};