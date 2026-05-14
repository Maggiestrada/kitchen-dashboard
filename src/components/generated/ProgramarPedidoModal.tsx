import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Minus, Trash2, CalendarClock, Check, ChevronLeft, Package, Repeat2, RotateCcw, CheckCircle2, Leaf, Clock } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledCartItem {
  productId: string;
  name: string;
  unit: string;
  qty: number;
  note: string;
  isCustom?: boolean;
}
interface ScheduledOrderPayload {
  dayOfWeek: number;
  items: ScheduledCartItem[];
}
interface Product {
  id: string;
  name: string;
  unit: string;
  lastQty?: number;
}
interface ProveedorInfo {
  id: string;
  name: string;
  category: string;
  isOrganic?: boolean;
  lastOrderDate?: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const PRODUCTS_BY_PROVIDER: Record<string, Product[]> = {
  pv1: [{
    id: 'pv1-pr1',
    name: 'Lechuga criolla',
    unit: 'kg',
    lastQty: 3
  }, {
    id: 'pv1-pr2',
    name: 'Tomate perita',
    unit: 'kg',
    lastQty: 5
  }, {
    id: 'pv1-pr3',
    name: 'Zanahoria',
    unit: 'kg',
    lastQty: 2
  }, {
    id: 'pv1-pr4',
    name: 'Cebolla morada',
    unit: 'kg',
    lastQty: 2
  }, {
    id: 'pv1-pr5',
    name: 'Espinaca',
    unit: 'atado',
    lastQty: 4
  }, {
    id: 'pv1-pr6',
    name: 'Berenjena',
    unit: 'kg',
    lastQty: 1
  }],
  pv2: [{
    id: 'pv2-pr1',
    name: 'Lomo',
    unit: 'kg',
    lastQty: 4
  }, {
    id: 'pv2-pr2',
    name: 'Entraña',
    unit: 'kg',
    lastQty: 3
  }, {
    id: 'pv2-pr3',
    name: 'Pollo entero',
    unit: 'unid.',
    lastQty: 6
  }, {
    id: 'pv2-pr4',
    name: 'Pata muslo',
    unit: 'kg',
    lastQty: 4
  }, {
    id: 'pv2-pr5',
    name: 'Chorizo',
    unit: 'kg',
    lastQty: 2
  }, {
    id: 'pv2-pr6',
    name: 'Vacío',
    unit: 'kg',
    lastQty: 3
  }],
  pv3: [{
    id: 'pv3-pr1',
    name: 'Queso cremoso',
    unit: 'kg',
    lastQty: 2
  }, {
    id: 'pv3-pr2',
    name: 'Crema de leche',
    unit: 'lt',
    lastQty: 3
  }, {
    id: 'pv3-pr3',
    name: 'Manteca',
    unit: 'kg',
    lastQty: 1
  }, {
    id: 'pv3-pr4',
    name: 'Leche entera',
    unit: 'lt',
    lastQty: 5
  }],
  pv4: [{
    id: 'pv4-pr1',
    name: 'Aceite de girasol',
    unit: 'lt',
    lastQty: 4
  }, {
    id: 'pv4-pr2',
    name: 'Harina 000',
    unit: 'kg',
    lastQty: 10
  }, {
    id: 'pv4-pr3',
    name: 'Azúcar',
    unit: 'kg',
    lastQty: 5
  }, {
    id: 'pv4-pr4',
    name: 'Sal gruesa',
    unit: 'kg',
    lastQty: 3
  }],
  pv5: [{
    id: 'pv5-pr1',
    name: 'Agua mineral 500ml',
    unit: 'caja',
    lastQty: 2
  }, {
    id: 'pv5-pr2',
    name: 'Gaseosa 1.5lt',
    unit: 'caja',
    lastQty: 1
  }, {
    id: 'pv5-pr3',
    name: 'Cerveza artesanal',
    unit: 'caja',
    lastQty: 1
  }],
  pv6: [{
    id: 'pv6-pr1',
    name: 'Salmón entero',
    unit: 'kg',
    lastQty: 3
  }, {
    id: 'pv6-pr2',
    name: 'Merluza filet',
    unit: 'kg',
    lastQty: 4
  }, {
    id: 'pv6-pr3',
    name: 'Langostinos',
    unit: 'kg',
    lastQty: 2
  }]
};
const DAYS_OF_WEEK_DATA = [{
  id: 'sched-day-0',
  label: 'Dom',
  fullLabel: 'Domingo',
  value: 0
}, {
  id: 'sched-day-1',
  label: 'Lun',
  fullLabel: 'Lunes',
  value: 1
}, {
  id: 'sched-day-2',
  label: 'Mar',
  fullLabel: 'Martes',
  value: 2
}, {
  id: 'sched-day-3',
  label: 'Mié',
  fullLabel: 'Miércoles',
  value: 3
}, {
  id: 'sched-day-4',
  label: 'Jue',
  fullLabel: 'Jueves',
  value: 4
}, {
  id: 'sched-day-5',
  label: 'Vie',
  fullLabel: 'Viernes',
  value: 5
}, {
  id: 'sched-day-6',
  label: 'Sáb',
  fullLabel: 'Sábado',
  value: 6
}] as any[];

// ─── QtyInput ─────────────────────────────────────────────────────────────────

const QtyInput = ({
  qty,
  unit,
  onQtyChange
}: {
  qty: number;
  unit: string;
  onQtyChange: (val: number) => void;
}) => {
  const [inputVal, setInputVal] = useState(String(qty));
  const [focused, setFocused] = useState(false);
  const commit = useCallback((raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onQtyChange(parsed);
      setInputVal(String(parsed));
    } else {
      setInputVal(String(qty));
    }
  }, [qty, onQtyChange]);
  React.useEffect(() => {
    if (!focused) setInputVal(String(qty));
  }, [qty, focused]);
  return <div className="flex items-center gap-1 shrink-0">
      <button onClick={() => onQtyChange(Math.max(1, qty - 1))} className="w-8 h-8 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 active:scale-90 transition-transform">
        <Minus size={13} strokeWidth={2.5} />
      </button>
      <div className="flex flex-col items-center">
        <input type="number" inputMode="numeric" value={inputVal} onFocus={() => {
        setFocused(true);
        setInputVal('');
      }} onBlur={() => {
        setFocused(false);
        commit(inputVal || String(qty));
      }} onChange={e => setInputVal(e.target.value)} onKeyDown={e => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }} className="w-14 h-8 text-center text-sm font-black text-black border border-neutral-200 rounded-xl outline-none focus:border-black tabular-nums bg-white" style={{
        MozAppearance: 'textfield'
      } as React.CSSProperties} />
        <span className="text-[9px] font-bold text-neutral-400 mt-0.5 leading-none">{unit}</span>
      </div>
      <button onClick={() => onQtyChange(qty + 1)} className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center active:scale-90 transition-transform">
        <Plus size={13} strokeWidth={2.5} />
      </button>
    </div>;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProgramarPedidoModalProps {
  isOpen: boolean;
  proveedor: ProveedorInfo | null;
  takenDays: number[];
  onClose: () => void;
  onConfirm: (payload: ScheduledOrderPayload) => void;
}
type WizardStep = 'day' | 'items' | 'confirm';

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProgramarPedidoModal = ({
  isOpen,
  proveedor,
  takenDays,
  onClose,
  onConfirm
}: ProgramarPedidoModalProps) => {
  const [step, setStep] = useState<WizardStep>('day');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<string, ScheduledCartItem>>({});
  const [productSearch, setProductSearch] = useState('');
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [customProductText, setCustomProductText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStep('day');
      setSelectedDay(null);
      setCart({});
      setProductSearch('');
      setOpenNoteId(null);
      setCustomProductText('');
      setConfirmed(false);
    }, 400);
  };
  const products: Product[] = proveedor ? PRODUCTS_BY_PROVIDER[proveedor.id] ?? [] : [];
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  const cartItems = Object.values(cart);
  const setQty = useCallback((productId: string, name: string, unit: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => {
        const next = {
          ...prev
        };
        delete next[productId];
        return next;
      });
    } else {
      setCart(prev => ({
        ...prev,
        [productId]: {
          productId,
          name,
          unit,
          qty,
          note: prev[productId]?.note ?? ''
        }
      }));
    }
  }, []);
  const updateNote = (productId: string, note: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        note
      }
    }));
  };
  const removeItem = (productId: string) => {
    setCart(prev => {
      const n = {
        ...prev
      };
      delete n[productId];
      return n;
    });
  };
  const addCustomProduct = () => {
    const trimmed = (customProductText || productSearch).trim();
    if (!trimmed) return;
    const customId = `custom-sched-${Date.now()}`;
    setCart(prev => ({
      ...prev,
      [customId]: {
        productId: customId,
        name: trimmed,
        unit: 'unid.',
        qty: 1,
        note: '',
        isCustom: true
      }
    }));
    setCustomProductText('');
    setProductSearch('');
  };
  const selectedDayLabel = DAYS_OF_WEEK_DATA.find(d => d.value === selectedDay)?.fullLabel ?? '';
  const handleConfirm = () => {
    if (selectedDay === null || cartItems.length === 0) return;
    setConfirmed(true);
    setTimeout(() => {
      onConfirm({
        dayOfWeek: selectedDay,
        items: cartItems
      });
      resetAndClose();
    }, 900);
  };
  const stepIndex = step === 'day' ? 0 : step === 'items' ? 1 : 2;
  return <AnimatePresence>
      {isOpen && proveedor && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.18
    }} className="fixed inset-0 z-[70] flex flex-col justify-end" style={{
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
      }} className="absolute inset-0 bg-black/50" onClick={resetAndClose} />

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
            <div className="px-5 pt-2 pb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {step !== 'day' && !confirmed && <button onClick={() => setStep(step === 'confirm' ? 'items' : 'day')} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 active:scale-90 transition-transform shrink-0">
                    <ChevronLeft size={19} strokeWidth={2} />
                  </button>}
                <div>
                  <h2 className="text-lg font-black text-black leading-tight">
                    {step === 'day' && 'Programar Pedido'}
                    {step === 'items' && 'Armar el Pedido'}
                    {step === 'confirm' && 'Confirmar'}
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">
                    {step === 'day' && `Repetirá cada semana · ${proveedor.name}`}
                    {step === 'items' && `${proveedor.name} · ${selectedDayLabel}s`}
                    {step === 'confirm' && `Revisá y guardá la programación`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Step dots */}
                <div className="flex gap-1.5 items-center">
                  {(['day', 'items', 'confirm'] as WizardStep[]).map((s, i) => <div key={s} className="h-1 rounded-full transition-all duration-300" style={{
                width: step === s ? 28 : 10,
                backgroundColor: i <= stepIndex ? '#000' : '#E5E7EB'
              }} />)}
                </div>
                <button onClick={resetAndClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                  <X size={17} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="h-px bg-neutral-100 mx-5 shrink-0" />

            {/* ── Steps ── */}
            <AnimatePresence mode="wait">

              {/* ── STEP 1 — Elegir día ── */}
              {step === 'day' && <motion.div key="step-day" initial={{
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
                  <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
                    {/* Provider card */}
                    <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-base font-black shrink-0">
                        <span>{proveedor.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-black text-sm leading-tight">{proveedor.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-neutral-500 bg-neutral-200 px-1.5 py-0.5 rounded">
                            {proveedor.category}
                          </span>
                          {proveedor.isOrganic && <span className="inline-flex items-center gap-0.5 text-neutral-500 text-[10px] font-bold">
                              <Leaf size={9} />
                              <span>Orgánico</span>
                            </span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-2 py-1 rounded-xl">
                        <Repeat2 size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-black">Semanal</span>
                      </div>
                    </div>

                    {/* Day picker */}
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">
                      ¿Qué día de la semana?
                    </p>
                    <div className="grid grid-cols-7 gap-1.5 mb-4">
                      {DAYS_OF_WEEK_DATA.map(day => {
                  const isTaken = takenDays.includes(day.value);
                  const isSelected = selectedDay === day.value;
                  return <button key={day.id} disabled={isTaken} onClick={() => setSelectedDay(day.value)} className={`
                              flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all active:scale-95
                              ${isTaken ? 'bg-neutral-50 border-neutral-100 opacity-35 cursor-not-allowed' : isSelected ? 'bg-black border-black shadow-lg' : 'bg-white border-neutral-200 hover:border-neutral-300'}
                            `}>
                            <span className={`text-[11px] font-black ${isSelected ? 'text-white' : 'text-neutral-600'}`}>
                              {day.label}
                            </span>
                            {isTaken && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                            {isSelected && !isTaken && <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />}
                            {!isTaken && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />}
                          </button>;
                })}
                    </div>

                    {takenDays.length > 0 && <p className="text-[10px] text-neutral-300 font-medium text-center mb-4">
                        Los días marcados ya tienen pedido programado
                      </p>}

                    {/* Preview selected day */}
                    <AnimatePresence>
                      {selectedDay !== null && <motion.div initial={{
                  opacity: 0,
                  y: 8
                }} animate={{
                  opacity: 1,
                  y: 0
                }} exit={{
                  opacity: 0,
                  y: -4
                }} className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shrink-0">
                            <Repeat2 size={15} strokeWidth={2.5} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-black leading-tight">
                              Todos los {selectedDayLabel}s
                            </p>
                            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                              Se creará un pedido semanal a {proveedor.name}
                            </p>
                          </div>
                        </motion.div>}
                    </AnimatePresence>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
                    <button onClick={() => setStep('items')} disabled={selectedDay === null} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                      <span>Armar el pedido</span>
                      <CalendarClock size={17} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>}

              {/* ── STEP 2 — Armar ítems ── */}
              {step === 'items' && <motion.div key="step-items" initial={{
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
                  {/* Search */}
                  <div className="px-5 pt-4 pb-3 shrink-0">
                    <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3">
                      <Search size={17} className="text-neutral-400 shrink-0" strokeWidth={2} />
                      <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar o escribir producto..." className="flex-1 bg-transparent text-sm text-black placeholder:text-neutral-400 outline-none font-medium" onKeyDown={e => {
                  if (e.key === 'Enter' && filteredProducts.filter(p => !cart[p.id]).length === 0 && productSearch.trim()) {
                    setCustomProductText(productSearch);
                    addCustomProduct();
                  }
                }} />
                      {productSearch && <button onClick={() => setProductSearch('')} className="text-neutral-400">
                          <X size={15} />
                        </button>}
                    </div>
                    {productSearch.trim().length > 1 && filteredProducts.filter(p => !cart[p.id]).length === 0 && <button onClick={() => {
                setCustomProductText(productSearch);
                addCustomProduct();
              }} className="mt-2 w-full flex items-center gap-2 px-4 py-3 border border-dashed border-neutral-300 rounded-2xl text-sm font-bold text-neutral-600 active:bg-neutral-50 transition-colors">
                        <Plus size={15} strokeWidth={2.5} />
                        <span>Agregar "<strong>{productSearch}</strong>"</span>
                      </button>}
                  </div>

                  {/* Products */}
                  <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
                    {/* Cart items */}
                    {cartItems.length > 0 && <div className="mb-1">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                          En el pedido · {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                        </p>
                        <div className="space-y-2">
                          {cartItems.map(item => <div key={item.productId} className="bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex-1 min-w-0 pr-3">
                                  <p className="font-bold text-black text-sm leading-tight">{item.name}</p>
                                  {item.isCustom && <p className="text-[10px] text-neutral-400 mt-0.5 font-medium">Personalizado</p>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <QtyInput qty={item.qty} unit={item.unit} onQtyChange={val => setQty(item.productId, item.name, item.unit, val)} />
                                  <button onClick={() => removeItem(item.productId)} className="w-7 h-7 rounded-full bg-white border border-neutral-200 text-neutral-400 flex items-center justify-center active:scale-90 transition-transform ml-1">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                              {/* Note */}
                              <div className="border-t border-dashed border-neutral-200">
                                <button onClick={() => setOpenNoteId(openNoteId === item.productId ? null : item.productId)} className="w-full text-left px-4 py-2 text-[11px] font-bold text-neutral-400">
                                  {item.note ? `📝 ${item.note}` : '+ Agregar nota'}
                                </button>
                                <AnimatePresence>
                                  {openNoteId === item.productId && <motion.div initial={{
                          height: 0,
                          opacity: 0
                        }} animate={{
                          height: 'auto',
                          opacity: 1
                        }} exit={{
                          height: 0,
                          opacity: 0
                        }} transition={{
                          duration: 0.15
                        }} className="overflow-hidden">
                                      <div className="px-4 pb-3">
                                        <input autoFocus value={item.note} onChange={e => updateNote(item.productId, e.target.value)} placeholder="Ej: sin tierra, bien maduro..." className="w-full text-xs text-neutral-700 placeholder:text-neutral-300 bg-white rounded-xl px-3 py-2 outline-none border border-neutral-200 focus:border-black" />
                                      </div>
                                    </motion.div>}
                                </AnimatePresence>
                              </div>
                            </div>)}
                        </div>
                      </div>}

                    {/* Available products */}
                    {filteredProducts.filter(p => !cart[p.id]).length > 0 && <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 mt-1">
                          {productSearch ? 'Resultados' : 'Productos del proveedor'}
                        </p>
                        <div className="space-y-2">
                          {filteredProducts.filter(p => !cart[p.id]).map(product => <div key={product.id} className="bg-white border border-neutral-100 rounded-2xl">
                              <div className="flex items-center justify-between px-4 py-3.5">
                                <div className="flex-1 min-w-0 pr-3">
                                  <p className="font-bold text-black text-sm leading-tight">{product.name}</p>
                                  {product.lastQty && <p className="text-[11px] text-neutral-400 mt-0.5">
                                      <span>Último: </span>
                                      <span className="font-bold text-neutral-600">{product.lastQty} {product.unit}</span>
                                    </p>}
                                </div>
                                <button onClick={() => setQty(product.id, product.name, product.unit, product.lastQty ?? 1)} className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform shrink-0">
                                  <Plus size={13} strokeWidth={2.5} />
                                  <span>Agregar</span>
                                </button>
                              </div>
                            </div>)}
                        </div>
                      </div>}

                    {cartItems.length === 0 && products.length === 0 && <div className="py-12 flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center">
                          <Package size={22} className="text-neutral-400" />
                        </div>
                        <p className="text-sm font-bold text-neutral-400">Sin productos registrados</p>
                        <p className="text-xs text-neutral-300">Escribí un producto para agregarlo al pedido</p>
                      </div>}
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
                    <button onClick={() => setStep('confirm')} disabled={cartItems.length === 0} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                      <span>Revisar programación</span>
                      {cartItems.length > 0 && <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums">
                          {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                        </span>}
                    </button>
                  </div>
                </motion.div>}

              {/* ── STEP 3 — Confirm ── */}
              {step === 'confirm' && <motion.div key="step-confirm" initial={{
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
                  <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-3">
                    {/* Summary card */}
                    <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0">
                        <Repeat2 size={20} strokeWidth={2.5} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-black text-sm leading-tight">
                          Todos los {selectedDayLabel}s
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {proveedor.name} · {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} · Semanal
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-2 py-1 rounded-xl shrink-0">
                        <CalendarClock size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-black">Auto</span>
                      </div>
                    </div>

                    {/* Items list */}
                    <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                          Productos del pedido ({cartItems.length})
                        </p>
                        <button onClick={() => setStep('items')} className="text-black text-xs font-bold underline underline-offset-2">
                          Editar
                        </button>
                      </div>
                      {cartItems.map(item => <div key={item.productId} className="flex items-center justify-between px-4 py-3 border-b border-dashed border-neutral-100 last:border-0">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-bold text-black">{item.name}</p>
                            {item.note && <p className="text-[11px] text-neutral-400 truncate mt-0.5">{item.note}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-black text-black tabular-nums">{item.qty}</span>
                            <span className="text-[11px] font-bold text-neutral-400">{item.unit}</span>
                          </div>
                        </div>)}
                    </div>

                    {/* Info banner */}
                    <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                      <CalendarClock size={17} className="text-indigo-500 shrink-0 mt-0.5" strokeWidth={2} />
                      <div>
                        <p className="text-sm font-bold text-indigo-800">Pedido automático semanal</p>
                        <p className="text-xs text-indigo-600 mt-0.5 leading-relaxed">
                          Cada <strong>{selectedDayLabel}</strong> se generará automáticamente un pedido a{' '}
                          <strong>{proveedor.name}</strong> con estos {cartItems.length} productos. Podrás pausarlo o editarlo cuando quieras.
                        </p>
                      </div>
                    </div>

                    {/* Next occurrence */}
                    <div className="flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-3">
                      <Clock size={14} strokeWidth={2} className="text-neutral-400 shrink-0" />
                      <p className="text-xs text-neutral-500 font-medium">
                        <span>Próximo pedido: </span>
                        <span className="font-black text-black">el próximo {selectedDayLabel}</span>
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
                    <AnimatePresence mode="wait">
                      {!confirmed ? <motion.button key="confirm-btn" exit={{
                  opacity: 0,
                  scale: 0.96
                }} onClick={handleConfirm} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                          <CalendarClock size={17} strokeWidth={2.5} />
                          <span>Guardar programación</span>
                        </motion.button> : <motion.div key="confirmed-feedback" initial={{
                  opacity: 0,
                  scale: 0.9
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle2 size={17} strokeWidth={2.5} />
                          <span>¡Pedido programado!</span>
                        </motion.div>}
                    </AnimatePresence>
                  </div>
                </motion.div>}

            </AnimatePresence>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
export type { ScheduledOrderPayload, ScheduledCartItem };