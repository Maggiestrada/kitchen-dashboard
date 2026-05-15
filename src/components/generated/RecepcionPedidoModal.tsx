import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, AlertCircle, Camera, Package, Truck, Clock, CheckCircle2, MessageSquare, Banknote, Leaf, FileText, Receipt, Info } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReceptionStep = 1 | 2 | 3;
type ItemStatus = 'pending' | 'ok' | 'discrepancy';
interface OrderItem {
  id: string;
  name: string;
  requestedQty: number;
  unit: string;
  receivedQty: number;
  status: ItemStatus;
  alertMsg: string;
}
interface PendingOrder {
  id: string;
  provider: string;
  providerInitial: string;
  category: string;
  isOrganic?: boolean;
  requestedDate: string;
  items: OrderItem[];
}
interface GeneratedAlert {
  id: string;
  orderId: string;
  provider: string;
  itemName: string;
  message: string;
  resolved: boolean;
  timestamp: string;
}
interface BillingDiscrepancy {
  hasDifference: boolean;
  invoicedAmount: string;
  receivedAmount: string;
  notes: string;
}

// ─── Static Mock Data ─────────────────────────────────────────────────────────

const PENDING_ORDERS: PendingOrder[] = [];
const DISCREPANCY_REASONS = [{
  id: 'dr-1',
  label: 'Faltó cantidad'
}, {
  id: 'dr-2',
  label: 'Mal estado / calidad'
}, {
  id: 'dr-3',
  label: 'Producto incorrecto'
}, {
  id: 'dr-4',
  label: 'Vencido'
}, {
  id: 'dr-5',
  label: 'No llegó'
}] as any[];
const BILLING_DISCREPANCY_REASONS = [{
  id: 'bd-1',
  label: 'Facturado de más'
}, {
  id: 'bd-2',
  label: 'Facturado de menos'
}, {
  id: 'bd-3',
  label: 'Precio distinto al acordado'
}, {
  id: 'bd-4',
  label: 'Ítem no recibido facturado'
}, {
  id: 'bd-5',
  label: 'Error en cantidad facturada'
}] as any[];

// ─── Step Bar ─────────────────────────────────────────────────────────────────

const StepBar = ({
  step
}: {
  step: ReceptionStep;
}) => <div className="flex gap-1.5 items-center">
    {([1, 2, 3] as ReceptionStep[]).map(s => <div key={s} className="h-1 rounded-full transition-all duration-300" style={{
    width: step === s ? 28 : 10,
    backgroundColor: step >= s ? '#000' : '#E5E7EB'
  }} />)}
  </div>;

// ─── Qty Input ────────────────────────────────────────────────────────────────

const QtyInput = ({
  qty,
  unit,
  onQtyChange
}: {
  qty: number;
  unit: string;
  onQtyChange: (v: number) => void;
}) => {
  const [val, setVal] = useState(String(qty));
  const [focused, setFocused] = useState(false);
  React.useEffect(() => {
    if (!focused) setVal(String(qty));
  }, [qty, focused]);
  return <div className="flex items-center gap-1 shrink-0">
      <button onClick={() => onQtyChange(Math.max(0, qty - 1))} className="w-8 h-8 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 active:scale-90 transition-transform">
        <span className="text-base font-bold leading-none">−</span>
      </button>
      <div className="flex flex-col items-center">
        <input type="number" inputMode="decimal" value={val} onFocus={() => {
        setFocused(true);
        setVal('');
      }} onBlur={() => {
        setFocused(false);
        const parsed = parseFloat(val);
        if (!isNaN(parsed) && parsed >= 0) {
          onQtyChange(parsed);
          setVal(String(parsed));
        } else setVal(String(qty));
      }} onChange={e => setVal(e.target.value)} onKeyDown={e => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }} className="w-14 h-8 text-center text-sm font-black text-black border border-neutral-200 rounded-xl outline-none focus:border-black tabular-nums bg-white" style={{
        MozAppearance: 'textfield'
      } as React.CSSProperties} />
        <span className="text-[9px] font-bold text-neutral-400 mt-0.5 leading-none">{unit}</span>
      </div>
      <button onClick={() => onQtyChange(qty + 1)} className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center active:scale-90 transition-transform">
        <span className="text-base font-bold leading-none">+</span>
      </button>
    </div>;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecepcionPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderReceived: (orderId: string, hasCash: boolean, alerts?: GeneratedAlert[], receptionNote?: string, recepcionadoPor?: string) => void;
  initialOrderId?: string;
  recepcionadoPor?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const RecepcionPedidoModal = ({
  isOpen,
  onClose,
  onOrderReceived,
  initialOrderId,
  recepcionadoPor,
}: RecepcionPedidoModalProps) => {
  const [step, setStep] = useState<ReceptionStep>(1);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [generalNote, setGeneralNote] = useState('');
  const [paidCash, setPaidCash] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [done, setDone] = useState(false);
  const [openAlertId, setOpenAlertId] = useState<string | null>(null);
  const [billingDiscrepancy, setBillingDiscrepancy] = useState<BillingDiscrepancy>({
    hasDifference: false,
    invoicedAmount: '',
    receivedAmount: '',
    notes: ''
  });
  const [selectedBillingReason, setSelectedBillingReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When the modal opens with an initialOrderId, jump straight to step 2
  React.useEffect(() => {
    if (isOpen && initialOrderId) {
      const order = PENDING_ORDERS.find(o => o.id === initialOrderId);
      if (order) {
        setSelectedOrder(order);
        setItems(order.items.map(i => ({
          ...i
        })));
        setStep(2);
      }
    }
    if (!isOpen) {
      // reset is handled by resetAndClose, but also guard here
    }
  }, [isOpen, initialOrderId]);
  const resetAndClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setSelectedOrder(null);
      setItems([]);
      setGeneralNote('');
      setPaidCash(false);
      setPhotoTaken(false);
      setDone(false);
      setOpenAlertId(null);
      setBillingDiscrepancy({
        hasDifference: false,
        invoicedAmount: '',
        receivedAmount: '',
        notes: ''
      });
      setSelectedBillingReason('');
    }, 400);
  }, [onClose]);
  const selectOrder = (order: PendingOrder) => {
    setSelectedOrder(order);
    setItems(order.items.map(i => ({
      ...i
    })));
    setStep(2);
  };
  const setItemQty = useCallback((id: string, qty: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newStatus: ItemStatus = qty === item.requestedQty ? 'ok' : 'discrepancy';
      return {
        ...item,
        receivedQty: qty,
        status: newStatus
      };
    }));
  }, []);
  const setItemStatus = useCallback((id: string, status: ItemStatus) => {
    setItems(prev => prev.map(item => item.id !== id ? item : {
      ...item,
      status
    }));
  }, []);
  const setItemAlert = useCallback((id: string, msg: string) => {
    setItems(prev => prev.map(item => item.id !== id ? item : {
      ...item,
      alertMsg: msg
    }));
  }, []);
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const discrepancyCount = items.filter(i => i.status === 'discrepancy').length;
  const okCount = items.filter(i => i.status === 'ok').length;
  const canFinishChecklist = pendingCount === 0;
  const handleFinishChecklist = () => setStep(3);
  const handleConfirm = () => {
    if (!photoTaken) return;
    setDone(true);
    const generatedAlerts: GeneratedAlert[] = items.filter(i => i.status === 'discrepancy').map(i => ({
      id: `alert-${i.id}-${Date.now()}`,
      orderId: selectedOrder?.id ?? '',
      provider: selectedOrder?.provider ?? '',
      itemName: i.name,
      message: i.alertMsg || `Diferencia: pedido ${i.requestedQty} ${i.unit}, recibido ${i.receivedQty} ${i.unit}`,
      resolved: false,
      timestamp: new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
    setTimeout(() => {
      onOrderReceived(selectedOrder?.id ?? '', paidCash, generatedAlerts, generalNote.trim() || undefined, recepcionadoPor);
      resetAndClose();
    }, 1800);
  };
  const billingDelta = (() => {
    const inv = parseFloat(billingDiscrepancy.invoicedAmount);
    const rec = parseFloat(billingDiscrepancy.receivedAmount);
    if (isNaN(inv) || isNaN(rec)) return null;
    return inv - rec;
  })();
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
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="absolute inset-0 bg-black/50" onClick={resetAndClose} />

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
            <div className="px-5 pt-2 pb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {step > 1 && !done && <button onClick={() => setStep(s => s - 1 as ReceptionStep)} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 active:scale-90 transition-transform shrink-0">
                    <ChevronLeft size={19} strokeWidth={2} />
                  </button>}
                <div>
                  <h2 className="text-lg font-black text-black leading-tight">
                    {step === 1 && 'Recepcionar Pedido'}
                    {step === 2 && 'Verificar Items'}
                    {step === 3 && 'Cerrar Recepción'}
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">
                    {step === 1 && 'Elegí el pedido a recepcionar'}
                    {step === 2 && selectedOrder?.provider}
                    {step === 3 && 'Foto del remito y confirmación'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StepBar step={step} />
                <button onClick={resetAndClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                  <X size={17} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="h-px bg-neutral-100 mx-5 shrink-0" />

            {/* ── Steps ── */}
            <AnimatePresence mode="wait">

              {/* ── STEP 1 — Select Order ── */}
              {step === 1 && <motion.div key="step1" initial={{
            opacity: 0,
            x: 24
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -24
          }} transition={{
            duration: 0.2
          }} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8 space-y-3">
                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                      Pedidos pendientes de recepción
                    </p>
                    {PENDING_ORDERS.map(order => <button key={order.id} onClick={() => selectOrder(order)} className="w-full text-left bg-white border border-neutral-100 rounded-2xl overflow-hidden active:scale-[0.985] transition-transform">
                        <div className="flex">
                          <div className="w-1 shrink-0 rounded-l-2xl bg-yellow-400" />
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-black shrink-0">
                                  <span>{order.providerInitial}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                    <span className="font-black text-black text-sm leading-tight">{order.provider}</span>
                                    {order.isOrganic && <span className="inline-flex items-center gap-0.5 bg-neutral-100 text-neutral-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                                        <Leaf size={9} />
                                        <span>Org</span>
                                      </span>}
                                  </div>
                                  <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                                    {order.category}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 bg-yellow-100 text-yellow-800">
                                <Truck size={10} strokeWidth={2.5} />
                                <span>En camino</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                              <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                                <Clock size={11} />
                                <span>{order.requestedDate}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs font-bold text-neutral-700">
                                <Package size={11} strokeWidth={2} />
                                <span>{order.items.length} productos</span>
                                <ChevronRight size={14} strokeWidth={2.5} className="text-neutral-300 ml-1" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>)}
                    {PENDING_ORDERS.length === 0 && <div className="py-16 flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                          <CheckCircle2 size={24} className="text-neutral-300" />
                        </div>
                        <p className="text-sm font-bold text-neutral-400">Sin pedidos pendientes</p>
                        <p className="text-xs text-neutral-300">Todos los pedidos del día fueron recepcionados</p>
                      </div>}
                  </div>
                </motion.div>}

              {/* ── STEP 2 — Checklist ── */}
              {step === 2 && <motion.div key="step2" initial={{
            opacity: 0,
            x: 24
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -24
          }} transition={{
            duration: 0.2
          }} className="flex flex-col flex-1 overflow-hidden">
                  {/* Progress summary */}
                  <div className="px-5 pt-4 pb-3 shrink-0">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mb-1">Pendientes</p>
                        <p className="text-xl font-black text-yellow-500 tabular-nums leading-none">{pendingCount}</p>
                      </div>
                      <div className="flex-1 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mb-1">OK</p>
                        <p className="text-xl font-black text-green-500 tabular-nums leading-none">{okCount}</p>
                      </div>
                      <div className="flex-1 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mb-1">Alertas</p>
                        <p className="text-xl font-black text-red-500 tabular-nums leading-none">{discrepancyCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-neutral-100 mx-5 shrink-0" />

                  <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-3">
                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      Verificá cada producto
                    </p>
                    {items.map(item => {
                const isOk = item.status === 'ok';
                const isDiscrepancy = item.status === 'discrepancy';
                return <div key={item.id} className="bg-white border rounded-2xl overflow-hidden transition-all" style={{
                  borderColor: isOk ? '#BBF7D0' : isDiscrepancy ? '#FECACA' : '#F3F4F6'
                }}>
                          <div className="flex">
                            <div className="w-1 shrink-0" style={{
                      backgroundColor: isOk ? '#22C55E' : isDiscrepancy ? '#EF4444' : '#E5E7EB'
                    }} />
                            <div className="flex-1 p-4">
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-black text-sm leading-tight">{item.name}</p>
                                  <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">
                                    <span>Pedido: </span>
                                    <span className="font-black text-neutral-700">{item.requestedQty} {item.unit}</span>
                                  </p>
                                </div>
                                <QtyInput qty={item.receivedQty} unit={item.unit} onQtyChange={qty => setItemQty(item.id, qty)} />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => {
                          setItemStatus(item.id, 'ok');
                          setItemQty(item.id, item.requestedQty);
                          setOpenAlertId(null);
                        }} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-black transition-all active:scale-95 ${isOk ? 'bg-green-500 text-white border-green-500' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                                  <Check size={13} strokeWidth={3} />
                                  <span>Correcto</span>
                                </button>
                                <button onClick={() => {
                          setItemStatus(item.id, 'discrepancy');
                          setOpenAlertId(openAlertId === item.id ? null : item.id);
                        }} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-black transition-all active:scale-95 ${isDiscrepancy ? 'bg-red-500 text-white border-red-500' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                                  <AlertCircle size={13} strokeWidth={2.5} />
                                  <span>Diferencia</span>
                                </button>
                              </div>
                              <AnimatePresence>
                                {isDiscrepancy && openAlertId === item.id && <motion.div initial={{
                          height: 0,
                          opacity: 0
                        }} animate={{
                          height: 'auto',
                          opacity: 1
                        }} exit={{
                          height: 0,
                          opacity: 0
                        }} transition={{
                          duration: 0.18
                        }} className="overflow-hidden">
                                    <div className="pt-3 space-y-2">
                                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Motivo de la diferencia</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {DISCREPANCY_REASONS.map((r: any) => <button key={r.id} onClick={() => setItemAlert(item.id, r.label)} className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 ${item.alertMsg === r.label ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                                            {r.label}
                                          </button>)}
                                      </div>
                                      <input value={item.alertMsg} onChange={e => setItemAlert(item.id, e.target.value)} placeholder="O escribí el detalle..." className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 outline-none focus:border-black placeholder:text-neutral-300 font-medium text-neutral-700" />
                                    </div>
                                  </motion.div>}
                              </AnimatePresence>
                              {isDiscrepancy && openAlertId !== item.id && item.alertMsg && <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                  <AlertCircle size={11} className="text-red-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                                  <p className="text-[11px] text-red-600 font-medium leading-tight">{item.alertMsg}</p>
                                </div>}
                            </div>
                          </div>
                        </div>;
              })}
                  </div>

                  <div className="px-5 pt-0 pb-2 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={12} strokeWidth={2.5} className="text-neutral-400" />
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Nota al encargado (opcional)</p>
                    </div>
                    <textarea value={generalNote} onChange={e => setGeneralNote(e.target.value)} placeholder="Ej: llegó tarde, conductor difícil, faltó remito..." rows={2} className="w-full text-sm text-neutral-700 placeholder:text-neutral-300 bg-neutral-50 rounded-xl px-3 py-2.5 outline-none border border-neutral-100 focus:border-black resize-none" />
                  </div>

                  <div className="px-5 pb-8 pt-2 shrink-0 border-t border-neutral-100 bg-white">
                    {!canFinishChecklist && <p className="text-center text-[11px] font-bold text-yellow-600 mb-2">
                        <span>Verificá todos los productos antes de continuar</span>
                      </p>}
                    <button onClick={handleFinishChecklist} disabled={!canFinishChecklist} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                      {discrepancyCount > 0 ? <AlertCircle size={17} strokeWidth={2.5} /> : <Check size={17} strokeWidth={3} />}
                      <span>{discrepancyCount > 0 ? `Continuar con ${discrepancyCount} alerta${discrepancyCount > 1 ? 's' : ''}` : 'Todo correcto — Continuar'}</span>
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>}

              {/* ── STEP 3 — Confirm + Photo ── */}
              {step === 3 && <motion.div key="step3" initial={{
            opacity: 0,
            x: 24
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -24
          }} transition={{
            duration: 0.2
          }} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-3">

                    {/* Summary card */}
                    <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center text-base font-black shrink-0">
                          <span>{selectedOrder?.providerInitial}</span>
                        </div>
                        <div>
                          <p className="font-black text-black text-sm">{selectedOrder?.provider}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{selectedOrder?.category}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white border border-neutral-100 rounded-xl px-2 py-2.5 text-center">
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mb-1">Total</p>
                          <p className="text-lg font-black text-black tabular-nums leading-none">{items.length}</p>
                          <p className="text-[9px] text-neutral-400 mt-0.5">productos</p>
                        </div>
                        <div className="bg-white border rounded-xl px-2 py-2.5 text-center" style={{
                    borderColor: okCount === items.length ? '#BBF7D0' : '#F3F4F6'
                  }}>
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mb-1">OK</p>
                          <p className="text-lg font-black text-green-500 tabular-nums leading-none">{okCount}</p>
                          <p className="text-[9px] text-neutral-400 mt-0.5">correctos</p>
                        </div>
                        <div className="bg-white border rounded-xl px-2 py-2.5 text-center" style={{
                    borderColor: discrepancyCount > 0 ? '#FECACA' : '#F3F4F6'
                  }}>
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mb-1">Alertas</p>
                          <p className="text-lg font-black tabular-nums leading-none" style={{
                      color: discrepancyCount > 0 ? '#EF4444' : '#22C55E'
                    }}>
                            {discrepancyCount}
                          </p>
                          <p className="text-[9px] text-neutral-400 mt-0.5">diferencias</p>
                        </div>
                      </div>
                    </div>

                    {/* Kitchen discrepancy list */}
                    {discrepancyCount > 0 && <div className="bg-red-50 border border-red-100 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-red-100 flex items-center gap-2">
                          <AlertCircle size={13} strokeWidth={2.5} className="text-red-500" />
                          <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Diferencias detectadas</p>
                        </div>
                        {items.filter(i => i.status === 'discrepancy').map(item => <div key={item.id} className="px-4 py-3 border-b border-dashed border-red-100 last:border-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-red-900">{item.name}</p>
                              <div className="flex items-center gap-1 text-xs text-red-600 font-bold shrink-0">
                                <span className="line-through text-red-300">{item.requestedQty}</span>
                                <span>→</span>
                                <span>{item.receivedQty} {item.unit}</span>
                              </div>
                            </div>
                            {item.alertMsg && <p className="text-[11px] text-red-500 mt-1 font-medium">{item.alertMsg}</p>}
                          </div>)}
                      </div>}

                    {/* Note summary */}
                    {generalNote.trim().length > 0 && <div className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3 flex items-start gap-3">
                        <MessageSquare size={13} strokeWidth={2} className="text-neutral-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-neutral-700 font-medium leading-snug">{generalNote}</p>
                      </div>}

                    {/* Photo remito — OBLIGATORIO */}
                    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={13} strokeWidth={2.5} className="text-neutral-500" />
                          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Foto del remito</p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${photoTaken ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {photoTaken ? 'Listo' : 'Obligatorio'}
                        </span>
                      </div>
                      <div className="p-4">
                        <AnimatePresence mode="wait">
                          {!photoTaken ? <motion.div key="no-photo" exit={{
                      opacity: 0,
                      scale: 0.95
                    }}>
                              <p className="text-xs text-neutral-400 font-medium mb-3 leading-relaxed">
                                Sacá una foto al remito o factura para poder cerrar la recepción. Es obligatorio para el registro.
                              </p>
                              <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-neutral-300 rounded-xl py-6 flex flex-col items-center gap-2 active:bg-neutral-50 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
                                  <Camera size={22} className="text-white" strokeWidth={2} />
                                </div>
                                <p className="text-sm font-black text-black">Sacar foto al remito</p>
                                <p className="text-xs text-neutral-400 font-medium">Tocá para abrir la cámara</p>
                              </button>
                              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={() => setPhotoTaken(true)} />
                            </motion.div> : <motion.div key="photo-taken" initial={{
                      opacity: 0,
                      scale: 0.95
                    }} animate={{
                      opacity: 1,
                      scale: 1
                    }}>
                              <div className="w-full bg-green-50 border border-green-200 rounded-xl py-5 flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center">
                                  <Check size={22} className="text-white" strokeWidth={3} />
                                </div>
                                <p className="text-sm font-black text-green-700">Foto guardada</p>
                                <button onClick={() => setPhotoTaken(false)} className="text-xs font-bold text-neutral-400 underline underline-offset-2">
                                  Sacar otra foto
                                </button>
                              </div>
                            </motion.div>}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* ── DIFERENCIA FACTURA VS RECIBIDO (para admin/pagos) ── */}
                    <div className={`rounded-2xl border-2 overflow-hidden transition-colors ${billingDiscrepancy.hasDifference ? 'border-orange-400 bg-orange-50' : 'border-neutral-200 bg-white'}`}>
                      {/* Header toggle */}
                      <div className={`px-4 py-3 flex items-center justify-between ${billingDiscrepancy.hasDifference ? 'border-b border-orange-200' : 'border-b border-neutral-100'}`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${billingDiscrepancy.hasDifference ? 'bg-orange-500' : 'bg-neutral-100'}`}>
                            <Receipt size={14} strokeWidth={2.5} className={billingDiscrepancy.hasDifference ? 'text-white' : 'text-neutral-400'} />
                          </div>
                          <div>
                            <p className={`text-[11px] font-black uppercase tracking-widest leading-tight ${billingDiscrepancy.hasDifference ? 'text-orange-800' : 'text-neutral-700'}`}>
                              Diferencia factura vs recibido
                            </p>
                            <p className={`text-[9px] font-bold mt-0.5 ${billingDiscrepancy.hasDifference ? 'text-orange-500' : 'text-neutral-400'}`}>
                              Alerta solo para administración · Pagos
                            </p>
                          </div>
                        </div>
                        <button onClick={() => setBillingDiscrepancy(prev => ({
                    ...prev,
                    hasDifference: !prev.hasDifference
                  }))} className={`w-12 h-6 rounded-full transition-all duration-200 shrink-0 ${billingDiscrepancy.hasDifference ? 'bg-orange-500' : 'bg-neutral-200'}`}>
                          <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5" style={{
                      transform: billingDiscrepancy.hasDifference ? 'translateX(24px)' : 'translateX(0)'
                    }} />
                        </button>
                      </div>

                      {/* Collapsed hint */}
                      {!billingDiscrepancy.hasDifference && <div className="px-4 py-3">
                          <p className="text-xs text-neutral-400 font-medium">
                            ¿Lo facturado no coincide con lo recibido? Activá para notificar a admin.
                          </p>
                        </div>}

                      {/* Expanded form */}
                      <AnimatePresence>
                        {billingDiscrepancy.hasDifference && <motion.div initial={{
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
                            <div className="px-4 py-4 space-y-4">

                              {/* Info banner */}
                              <div className="flex items-start gap-2 bg-orange-100 border border-orange-200 rounded-xl px-3 py-2.5">
                                <Info size={12} className="text-orange-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                                <p className="text-[10px] font-bold text-orange-700 leading-snug">
                                  Esta alerta va directamente a administración y es visible en la sección de Pagos. No la ven los cocineros.
                                </p>
                              </div>

                              {/* Montos */}
                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-1.5">
                                    Monto facturado
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">$</span>
                                    <input type="number" inputMode="decimal" placeholder="0" value={billingDiscrepancy.invoicedAmount} onChange={e => setBillingDiscrepancy(prev => ({
                              ...prev,
                              invoicedAmount: e.target.value
                            }))} className="w-full pl-6 pr-3 py-2.5 text-sm font-black text-black bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-400 tabular-nums" />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-1.5">
                                    Monto recibido
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">$</span>
                                    <input type="number" inputMode="decimal" placeholder="0" value={billingDiscrepancy.receivedAmount} onChange={e => setBillingDiscrepancy(prev => ({
                              ...prev,
                              receivedAmount: e.target.value
                            }))} className="w-full pl-6 pr-3 py-2.5 text-sm font-black text-black bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-400 tabular-nums" />
                                  </div>
                                </div>
                              </div>

                              {/* Delta pill */}
                              {billingDelta !== null && <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${billingDelta > 0 ? 'bg-red-50 border-red-200' : billingDelta < 0 ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200'}`}>
                                  <p className={`text-xs font-bold ${billingDelta > 0 ? 'text-red-700' : billingDelta < 0 ? 'text-green-700' : 'text-neutral-500'}`}>
                                    {billingDelta > 0 ? 'Facturado de más' : billingDelta < 0 ? 'Facturado de menos' : 'Sin diferencia'}
                                  </p>
                                  <p className={`text-sm font-black tabular-nums ${billingDelta > 0 ? 'text-red-600' : billingDelta < 0 ? 'text-green-600' : 'text-neutral-400'}`}>
                                    {billingDelta !== 0 ? `${billingDelta > 0 ? '+' : ''}$${Math.abs(billingDelta).toLocaleString('es-AR', {
                            maximumFractionDigits: 2
                          })}` : '$0'}
                                  </p>
                                </div>}

                              {/* Motivo chips */}
                              <div>
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Motivo</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {BILLING_DISCREPANCY_REASONS.map((r: any) => <button key={r.id} onClick={() => setSelectedBillingReason(selectedBillingReason === r.label ? '' : r.label)} className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 ${selectedBillingReason === r.label ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                                      {r.label}
                                    </button>)}
                                </div>
                              </div>

                              {/* Nota */}
                              <div>
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Nota para admin (opcional)</p>
                                <textarea value={billingDiscrepancy.notes} onChange={e => setBillingDiscrepancy(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))} placeholder="Ej: el proveedor facturó 10kg pero entregó 8kg según remito..." rows={2} className="w-full text-xs text-neutral-700 placeholder:text-neutral-300 bg-white rounded-xl px-3 py-2.5 outline-none border border-neutral-200 focus:border-orange-400 resize-none" />
                              </div>

                            </div>
                          </motion.div>}
                      </AnimatePresence>
                    </div>

                    {/* Pago en efectivo */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paidCash ? 'bg-blue-500' : 'bg-neutral-100'}`}>
                            <Banknote size={18} strokeWidth={2} className={paidCash ? 'text-white' : 'text-neutral-400'} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-black leading-tight">Se pagó en efectivo</p>
                            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Quedará 🔵 pendiente de confirmación admin</p>
                          </div>
                        </div>
                        <button onClick={() => setPaidCash(p => !p)} className={`w-12 h-6 rounded-full transition-all shrink-0 ${paidCash ? 'bg-blue-500' : 'bg-neutral-200'}`}>
                          <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5" style={{
                      transform: paidCash ? 'translateX(24px)' : 'translateX(0)'
                    }} />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Confirm CTA */}
                  <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
                    {!photoTaken && <p className="text-center text-[11px] font-bold text-red-500 mb-2">
                        <span>Necesitás sacar la foto del remito para cerrar</span>
                      </p>}
                    {billingDiscrepancy.hasDifference && photoTaken && <div className="flex items-center gap-1.5 justify-center mb-2">
                        <Receipt size={11} className="text-orange-500" strokeWidth={2.5} />
                        <p className="text-center text-[11px] font-bold text-orange-600">
                          Se enviará alerta de factura a administración
                        </p>
                      </div>}
                    <AnimatePresence mode="wait">
                      {!done ? <motion.button key="confirm-btn" exit={{
                  opacity: 0,
                  scale: 0.96
                }} onClick={handleConfirm} disabled={!photoTaken} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed" style={{
                  backgroundColor: discrepancyCount > 0 ? '#EF4444' : '#22C55E',
                  color: '#fff',
                  boxShadow: discrepancyCount > 0 ? '0 6px 20px rgba(239,68,68,0.28)' : '0 6px 20px rgba(34,197,94,0.28)'
                }}>
                          {discrepancyCount > 0 ? <AlertCircle size={19} strokeWidth={2.5} /> : <CheckCircle2 size={19} strokeWidth={2.5} />}
                          <span>{discrepancyCount > 0 ? 'Cerrar con diferencias' : 'Cerrar recepción'}</span>
                        </motion.button> : <motion.div key="done-feedback" initial={{
                  opacity: 0,
                  scale: 0.9
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 bg-neutral-900 text-white">
                          <Check size={19} strokeWidth={3} />
                          <span>¡Recepción cerrada!</span>
                        </motion.div>}
                    </AnimatePresence>
                  </div>
                </motion.div>}

            </AnimatePresence>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};