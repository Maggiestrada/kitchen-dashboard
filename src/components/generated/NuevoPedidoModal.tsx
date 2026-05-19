import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Search, Check, Plus, Minus, MessageCircle, Leaf, Star, Trash2, Calendar, RotateCcw, Package, Clock, Scale, Tag, Pencil } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3;
type UnitType = 'kg' | 'unid.' | 'lt';
interface Provider {
  id: string;
  name: string;
  category: string;
  isOrganic?: boolean;
  isFavorite?: boolean;
  lastOrderDate?: string;
  whatsapp: string;
  nombreVentas?: string;
}
interface Product {
  id: string;
  name: string;
  unit: string;
  lastQty?: number;
}
interface CartItem {
  productId: string;
  name: string;
  unit: string;
  qty: number;
  note: string;
  isCustom?: boolean;
  area?: string;
}
interface LastOrder {
  providerId: string;
  date: string;
  items: CartItem[];
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const DEFAULT_AREAS = ['Verdulería', 'Carnes', 'Pescados', 'Almacén', 'Lácteos', 'Limpieza'];
const UNIT_OPTIONS: {
  value: UnitType;
  label: string;
  desc: string;
}[] = [{
  value: 'kg',
  label: 'Kg',
  desc: 'Kilogramos'
}, {
  value: 'unid.',
  label: 'Unid.',
  desc: 'Unidades'
}, {
  value: 'lt',
  label: 'Lt',
  desc: 'Litros'
}];
const PROVIDERS: Provider[] = [];
const PRODUCTS_BY_PROVIDER: Record<string, Product[]> = {};
const LAST_ORDERS: Record<string, LastOrder> = {};
const DELIVERY_OPTIONS = [{
  id: 'today',
  label: 'Hoy',
  sublabel: () => new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  })
}, {
  id: 'tomorrow',
  label: 'Mañana',
  sublabel: () => new Date(Date.now() + 86400000).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  })
}, {
  id: 'day2',
  label: 'Pasado',
  sublabel: () => new Date(Date.now() + 2 * 86400000).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  })
}, {
  id: 'custom',
  label: 'Otra fecha',
  sublabel: () => 'Elegí un día'
}] as any[];

// ─── Step progress bar ────────────────────────────────────────────────────────

const StepBar = ({
  step
}: {
  step: WizardStep;
}) => <div className="flex gap-1.5 items-center">
    {([1, 2, 3] as WizardStep[]).map(s => <div key={s} className="h-1 rounded-full transition-all duration-300" style={{
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
  onQtyChange: (val: number) => void;
}) => {
  const [inputVal, setInputVal] = useState(String(qty));
  const [focused, setFocused] = useState(false);
  const commit = useCallback((raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onQtyChange(parsed);
      setInputVal(String(parsed));
    } else setInputVal(String(qty));
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

// ─── Custom Product Config Panel ──────────────────────────────────────────────

interface CustomProductPanelProps {
  productName: string;
  areas: string[];
  onAddArea: (area: string) => void;
  onRemoveArea: (area: string) => void;
  onConfirm: (unit: UnitType, area: string, name: string) => void;
  onCancel: () => void;
}
const CustomProductPanel = ({
  productName,
  areas,
  onAddArea,
  onRemoveArea,
  onConfirm,
  onCancel
}: CustomProductPanelProps) => {
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('kg');
  const [selectedArea, setSelectedArea] = useState<string>(areas[0] ?? '');
  const [localName, setLocalName] = useState(productName);
  const [newAreaInput, setNewAreaInput] = useState('');
  const [showAddArea, setShowAddArea] = useState(false);
  const handleAddArea = () => {
    const trimmed = newAreaInput.trim();
    if (!trimmed || areas.includes(trimmed)) return;
    onAddArea(trimmed);
    setSelectedArea(trimmed);
    setNewAreaInput('');
    setShowAddArea(false);
  };
  const handleRemoveArea = (area: string) => {
    onRemoveArea(area);
    if (selectedArea === area) setSelectedArea(areas.find(a => a !== area) ?? '');
  };
  return <motion.div initial={{
    opacity: 0,
    y: '100%'
  }} animate={{
    opacity: 1,
    y: 0
  }} exit={{
    opacity: 0,
    y: '100%'
  }} transition={{
    type: 'spring',
    damping: 30,
    stiffness: 320
  }} className="absolute inset-0 bg-white z-10 flex flex-col rounded-t-3xl">
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1 shrink-0">
        <div className="w-9 h-1 rounded-full bg-neutral-200" />
      </div>

      {/* Header */}
      <div className="px-5 pt-2 pb-4 flex items-center justify-between shrink-0">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="text-base font-black text-black leading-tight mb-1.5">Nuevo insumo</h3>
          <input
            type="text"
            value={localName}
            onChange={e => setLocalName(e.target.value)}
            placeholder="Nombre del insumo…"
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-medium text-black outline-none focus:border-neutral-400 transition-colors placeholder-neutral-400"
          />
        </div>
        <button onClick={onCancel} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform shrink-0">
          <X size={17} strokeWidth={2} />
        </button>
      </div>

      <div className="h-px bg-neutral-100 mx-5 shrink-0" />

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-6">

        {/* Unidad de medida */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Scale size={14} strokeWidth={2.5} className="text-neutral-500" />
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Unidad de medida</p>
          </div>
          <div className="flex gap-2">
            {UNIT_OPTIONS.map(opt => <button key={opt.value} onClick={() => setSelectedUnit(opt.value)} className={`flex-1 flex flex-col items-center py-4 rounded-2xl border-2 transition-all active:scale-95 ${selectedUnit === opt.value ? 'border-black bg-black text-white' : 'border-neutral-150 bg-neutral-50 text-neutral-600 border-neutral-100'}`}>
                <span className="text-lg font-black leading-none">{opt.label}</span>
                <span className={`text-[10px] font-bold mt-1 ${selectedUnit === opt.value ? 'text-white/60' : 'text-neutral-400'}`}>{opt.desc}</span>
              </button>)}
          </div>
          <p className="text-[10px] text-neutral-300 font-medium mt-2 text-center">Solo se puede elegir kg, unidades o litros</p>
        </div>

        {/* Área */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag size={14} strokeWidth={2.5} className="text-neutral-500" />
              <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Área</p>
            </div>
            <button onClick={() => setShowAddArea(v => !v)} className="text-[11px] font-bold text-black flex items-center gap-1 active:opacity-60">
              <Plus size={11} strokeWidth={2.5} />
              <span>Nueva área</span>
            </button>
          </div>

          {/* Add area input */}
          <AnimatePresence>
            {showAddArea && <motion.div initial={{
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
          }} className="overflow-hidden mb-3">
                <div className="flex gap-2">
                  <input autoFocus value={newAreaInput} onChange={e => setNewAreaInput(e.target.value)} onKeyDown={e => {
                if (e.key === 'Enter') handleAddArea();
              }} placeholder="Ej: Panadería, Bebidas..." className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none focus:border-black placeholder:text-neutral-300" />
                  <button onClick={handleAddArea} disabled={!newAreaInput.trim()} className="px-4 py-2.5 bg-black text-white rounded-xl text-xs font-black active:scale-95 transition-transform disabled:opacity-30">
                    Agregar
                  </button>
                </div>
              </motion.div>}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2">
            {areas.map(area => <div key={area} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all cursor-pointer ${selectedArea === area ? 'border-black bg-black text-white' : 'border-neutral-100 bg-neutral-50 text-neutral-600'}`} onClick={() => setSelectedArea(area)}>
                <span className="text-xs font-bold">{area}</span>
                <button onClick={e => {
              e.stopPropagation();
              handleRemoveArea(area);
            }} className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${selectedArea === area ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-neutral-200 text-neutral-500 hover:bg-red-100 hover:text-red-500'}`} aria-label={`Eliminar área ${area}`}>
                  <X size={9} strokeWidth={3} />
                </button>
              </div>)}
          </div>

          {areas.length === 0 && <div className="py-6 text-center">
              <p className="text-xs text-neutral-300 font-medium">No hay áreas. Agregá una arriba.</p>
            </div>}
        </div>

        {/* Preview */}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
            <Pencil size={15} strokeWidth={2.5} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-black truncate">{localName || productName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {selectedArea && <span className="text-[10px] font-bold text-neutral-500 bg-neutral-200 px-1.5 py-0.5 rounded">{selectedArea}</span>}
              <span className="text-[10px] font-bold text-neutral-400">·</span>
              <span className="text-[10px] font-bold text-neutral-500">medido en <span className="text-black">{UNIT_OPTIONS.find(u => u.value === selectedUnit)?.desc}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
        <button onClick={() => onConfirm(selectedUnit, selectedArea, localName.trim() || productName)} disabled={!selectedArea || !localName.trim()} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-30">
          <Plus size={17} strokeWidth={2.5} />
          <span>Agregar al pedido</span>
        </button>
      </div>
    </motion.div>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProviderProp {
  id: string;
  name: string;
  category: string;
  telefono?: string;
  nombreVentas?: string;
  isOrganic?: boolean;
  isFavorite?: boolean;
  lastOrderDate?: string;
}
interface NuevoPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (providerName?: string, orderNote?: string, creadoPor?: string, items?: Array<{id: string; name: string; qty: number; unit: string}>, providerPhone?: string, deliveryDate?: string) => void;
  onInsumoCreated?: (insumo: {id: string; name: string; unit: string; category: string}) => void;
  creadoPor?: string;
  providers?: ProviderProp[];
  negocioNombre?: string;
  insumos?: Array<{id: string; name: string; unit: string; category: string}>;
}
export const NuevoPedidoModal = ({
  isOpen,
  onClose,
  onOrderCreated,
  onInsumoCreated,
  creadoPor,
  providers: providersProp = [],
  negocioNombre = '',
  insumos = [],
}: NuevoPedidoModalProps) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('tomorrow');
  const [customDate, setCustomDate] = useState('');
  const [sent, setSent] = useState(false);
  const [lastOrderBannerDismissed, setLastOrderBannerDismissed] = useState(false);
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [pendingCustomName, setPendingCustomName] = useState('');
  const [areas, setAreas] = useState<string[]>(DEFAULT_AREAS);
  const [mensajeEditable, setMensajeEditable] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setSearch('');
      setProductSearch('');
      setSelectedProvider(null);
      setCart({});
      setOpenNoteId(null);
      setOrderNote('');
      setDeliveryOption('tomorrow');
      setCustomDate('');
      setSent(false);
      setLastOrderBannerDismissed(false);
      setShowCustomPanel(false);
      setPendingCustomName('');
      setMensajeEditable('');
    }, 400);
  };

  // ── Step 1 helpers ─────────────────────────────────────────────────────────

  const mappedProviders: Provider[] = providersProp.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    whatsapp: p.telefono ?? '',
    nombreVentas: p.nombreVentas,
    isOrganic: p.isOrganic,
    isFavorite: p.isFavorite,
    lastOrderDate: p.lastOrderDate,
  }));
  const filteredProviders = mappedProviders.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
  const selectProvider = (p: Provider) => {
    setSelectedProvider(p);
    setCart({});
    setLastOrderBannerDismissed(false);
    setStep(2);
  };

  // ── Step 2 helpers ─────────────────────────────────────────────────────────

  const products: Product[] = insumos.map(i => ({ id: i.id, name: i.name, unit: i.unit }));
  const lastOrder = selectedProvider ? LAST_ORDERS[selectedProvider.id] : null;
  const filteredProducts = productSearch.trim().length > 0
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;
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
  const repeatLastOrder = () => {
    if (!lastOrder) return;
    const newCart: Record<string, CartItem> = {};
    lastOrder.items.forEach(item => {
      newCart[item.productId] = {
        ...item
      };
    });
    setCart(newCart);
    setLastOrderBannerDismissed(true);
  };
  const updateNote = (productId: string, note: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        note
      }
    }));
  };

  // Opens the config panel for a new custom product
  const openCustomPanel = (name: string) => {
    setPendingCustomName(name);
    setShowCustomPanel(true);
  };
  const handleCustomConfirm = (unit: UnitType, area: string, name: string) => {
    const trimmed = (name || pendingCustomName).trim();
    if (!trimmed) return;
    const customId = `custom-${Date.now()}`;
    setCart(prev => ({
      ...prev,
      [customId]: {
        productId: customId,
        name: trimmed,
        unit,
        qty: 1,
        note: '',
        isCustom: true,
        area
      }
    }));
    // Guardar como insumo para que aparezca en futuros pedidos
    onInsumoCreated?.({ id: customId, name: trimmed, unit, category: area || 'Almacén' });
    setShowCustomPanel(false);
    setPendingCustomName('');
    setProductSearch('');
  };
  const handleCustomCancel = () => {
    setShowCustomPanel(false);
    setPendingCustomName('');
  };
  const handleAddArea = (area: string) => {
    setAreas(prev => [...prev, area]);
  };
  const handleRemoveArea = (area: string) => {
    setAreas(prev => prev.filter(a => a !== area));
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
  const cartItems = Object.values(cart);
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);

  // ── Step 3 / WhatsApp ──────────────────────────────────────────────────────

  const selectedDelivery = DELIVERY_OPTIONS.find(o => o.id === deliveryOption) ?? DELIVERY_OPTIONS[1];
  const getDeliveryLabel = () => {
    if (deliveryOption === 'custom' && customDate) {
      const d = new Date(customDate + 'T00:00:00');
      return d.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    const found = DELIVERY_OPTIONS.find(o => o.id === deliveryOption);
    return found ? `${found.label} (${found.sublabel()})` : '';
  };
  const buildRawMessage = () => {
    if (!selectedProvider) return '';
    const contactName = selectedProvider.nombreVentas || selectedProvider.name;
    const deliveryStr = deliveryOption === 'custom' && customDate ? getDeliveryLabel() : `${selectedDelivery.label} (${selectedDelivery.sublabel()})`;
    const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const lines = [
      `Hola ${contactName} como estás? Te envío un pedido nuevo.`,
      ``,
      ...(negocioNombre ? [`🍽 "${negocioNombre}"`] : []),
      `📦 Pedido: ${today}`,
      `🚚 Entrega: ${deliveryStr}`,
      ``,
      ...cartItems.map(i => `• ${i.qty} ${i.unit} de ${i.name}${i.note ? ` _(${i.note})_` : ''}`),
    ];
    if (orderNote) lines.push(``, `📝 Nota: ${orderNote}`);
    lines.push(``, `Enviado desde INSUMA app.`);
    return lines.join('\n');
  };
  const handleGoToStep3 = () => {
    setMensajeEditable(buildRawMessage());
    setStep(3);
  };

  // Regenerar el mensaje cuando cambia la fecha estando en el paso 3
  useEffect(() => {
    if (step === 3) {
      setMensajeEditable(buildRawMessage());
    }
  }, [deliveryOption, customDate]);
  const handleSend = () => {
    const rawPhone = selectedProvider?.whatsapp ?? '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(mensajeEditable || buildRawMessage());
    const items = cartItems.map(i => ({ id: i.productId, name: i.name, qty: i.qty, unit: i.unit }));
    // Registrar pedido y cerrar ANTES de abrir WhatsApp para evitar que la app se trabe al volver
    onOrderCreated(selectedProvider?.name, orderNote.trim() || undefined, creadoPor, items, rawPhone, getDeliveryLabel());
    resetAndClose();
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
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
                {step > 1 && !sent && <button onClick={() => setStep(s => s - 1 as WizardStep)} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 active:scale-90 transition-transform shrink-0">
                    <ChevronLeft size={19} strokeWidth={2} />
                  </button>}
                <div>
                  <h2 className="text-lg font-black text-black leading-tight">
                    {step === 1 && 'Nuevo Pedido'}
                    {step === 2 && 'Armar Pedido'}
                    {step === 3 && 'Confirmar Pedido'}
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">
                    {step === 1 && 'Elegí el proveedor'}
                    {step === 2 && selectedProvider?.name}
                    {step === 3 && 'Revisá y enviá por WhatsApp'}
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

              {/* ── STEP 1 — Select Provider ── */}
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
                  <div className="px-5 pt-4 pb-3 shrink-0">
                    <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3">
                      <Search size={17} className="text-neutral-400 shrink-0" strokeWidth={2} />
                      <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proveedor o rubro..." className="flex-1 bg-transparent text-sm text-black placeholder:text-neutral-400 outline-none font-medium" />
                      {search && <button onClick={() => setSearch('')} className="text-neutral-400"><X size={15} /></button>}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-2">
                    {filteredProviders.map(provider => <button key={provider.id} onClick={() => selectProvider(provider)} className="w-full flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl active:bg-neutral-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center text-base font-black shrink-0">
                            <span>{provider.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className="font-bold text-black text-sm leading-tight">{provider.name}</span>
                              {provider.isOrganic && <span className="inline-flex items-center gap-0.5 bg-neutral-100 text-neutral-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                                <Leaf size={9} /><span>Org</span>
                              </span>}
                              {provider.isFavorite && <Star size={11} className="text-neutral-400 fill-neutral-300" />}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">{provider.category}</span>
                              {provider.lastOrderDate && <span className="text-[11px] text-neutral-400 flex items-center gap-0.5">
                                <Clock size={9} /><span>{provider.lastOrderDate}</span>
                              </span>}
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={18} strokeWidth={2} className="text-neutral-300 shrink-0" />
                      </button>)}
                  </div>
                </motion.div>}

              {/* ── STEP 2 — Build Order ── */}
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
          }} className="flex flex-col flex-1 overflow-hidden relative">
                  {/* Last Order Banner */}
                  <AnimatePresence>
                    {lastOrder && !lastOrderBannerDismissed && <motion.div key="last-order-banner" initial={{
                opacity: 0,
                height: 0
              }} animate={{
                opacity: 1,
                height: 'auto'
              }} exit={{
                opacity: 0,
                height: 0
              }} transition={{
                duration: 0.2
              }} className="shrink-0 overflow-hidden">
                        <div className="mx-5 mt-4 bg-black text-white rounded-2xl p-4 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                            <RotateCcw size={16} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black leading-tight">Último pedido</p>
                            <p className="text-xs text-white/60 mt-0.5">{lastOrder.items.length} productos · {lastOrder.date}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {lastOrder.items.slice(0, 3).map(item => <span key={item.productId} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-medium">
                                  {item.qty} {item.unit} {item.name}
                                </span>)}
                              {lastOrder.items.length > 3 && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-medium">+{lastOrder.items.length - 3} más</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button onClick={repeatLastOrder} className="text-xs font-black bg-white text-black px-3 py-1.5 rounded-xl active:scale-95 transition-transform">Repetir</button>
                            <button onClick={() => setLastOrderBannerDismissed(true)} className="text-xs font-bold text-white/50 text-center">Ignorar</button>
                          </div>
                        </div>
                      </motion.div>}
                  </AnimatePresence>

                  {/* Product search */}
                  <div className="px-5 pt-4 pb-3 shrink-0">
                    <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3">
                      <Search size={17} className="text-neutral-400 shrink-0" strokeWidth={2} />
                      <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar o escribir producto..." className="flex-1 bg-transparent text-sm text-black placeholder:text-neutral-400 outline-none font-medium" onKeyDown={e => {
                  if (e.key === 'Enter' && filteredProducts.length === 0 && productSearch.trim()) {
                    openCustomPanel(productSearch);
                  }
                }} />
                      {productSearch && <button onClick={() => setProductSearch('')} className="text-neutral-400"><X size={15} /></button>}
                    </div>

                    {/* Add custom product trigger */}
                    {productSearch.trim().length > 1 && filteredProducts.length === 0 && <button onClick={() => openCustomPanel(productSearch)} className="mt-2 w-full flex items-center gap-2 px-4 py-3 border border-dashed border-neutral-300 rounded-2xl text-sm font-bold text-neutral-600 active:bg-neutral-50 transition-colors">
                        <Plus size={15} strokeWidth={2.5} />
                        <span>Agregar <strong>"{productSearch}"</strong> como nuevo insumo</span>
                      </button>}
                  </div>

                  {/* Product list */}
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
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {item.isCustom && <span className="text-[10px] text-neutral-400 font-medium">Nuevo insumo</span>}
                                    {item.area && <span className="text-[10px] font-bold text-neutral-500 bg-neutral-200 px-1.5 py-0.5 rounded">{item.area}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <QtyInput qty={item.qty} unit={item.unit} onQtyChange={val => setQty(item.productId, item.name, item.unit, val)} />
                                  <button onClick={() => removeItem(item.productId)} className="w-7 h-7 rounded-full bg-white border border-neutral-200 text-neutral-400 flex items-center justify-center active:scale-90 transition-transform ml-1">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                              {/* Note toggle */}
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
                                        <input autoFocus value={item.note} onChange={e => updateNote(item.productId, e.target.value)} placeholder="Ej: sin tierra, bien maduro, 1ra calidad..." className="w-full text-xs text-neutral-700 placeholder:text-neutral-300 bg-white rounded-xl px-3 py-2 outline-none border border-neutral-200 focus:border-black" />
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

                    {cartItems.length === 0 && filteredProducts.length === 0 && !productSearch && <div className="py-12 flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center">
                          <Package size={22} className="text-neutral-400" />
                        </div>
                        <p className="text-sm font-bold text-neutral-400"><span>No hay productos registrados</span></p>
                        <p className="text-xs text-neutral-300"><span>Escribí un producto en el buscador para agregarlo</span></p>
                      </div>}
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
                    <button onClick={handleGoToStep3} disabled={cartItems.length === 0} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                      <span>Revisar pedido</span>
                      {totalQty > 0 && <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums">
                        {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                      </span>}
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Custom Product Config Panel (slides in over step 2) */}
                  <AnimatePresence>
                    {showCustomPanel && <CustomProductPanel productName={pendingCustomName} areas={areas} onAddArea={handleAddArea} onRemoveArea={handleRemoveArea} onConfirm={handleCustomConfirm} onCancel={handleCustomCancel} />}
                  </AnimatePresence>
                </motion.div>}

              {/* ── STEP 3 — Confirm ── */}
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

                    {/* Provider row */}
                    <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center text-base font-black shrink-0">
                        <span>{selectedProvider?.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-black text-sm">{selectedProvider?.name}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{selectedProvider?.category} · WhatsApp</p>
                      </div>
                      <button onClick={() => setStep(1)} className="text-black text-xs font-bold underline underline-offset-2">Cambiar</button>
                    </div>

                    {/* Delivery date */}
                    <div className="bg-white border border-neutral-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar size={14} strokeWidth={2} className="text-neutral-500" />
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Fecha de entrega</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {DELIVERY_OPTIONS.map(option => <button key={option.id} onClick={() => setDeliveryOption(option.id)} className={`flex flex-col items-center py-3 px-1 rounded-xl border text-center transition-all active:scale-95 ${deliveryOption === option.id ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                            <span className="text-[11px] font-black leading-tight">{option.label}</span>
                            <span className={`text-[8px] mt-0.5 leading-tight font-medium ${deliveryOption === option.id ? 'text-white/60' : 'text-neutral-400'}`}>
                              {option.sublabel()}
                            </span>
                          </button>)}
                      </div>
                      <AnimatePresence>
                        {deliveryOption === 'custom' && <motion.div initial={{
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
                            <div className="mt-3 pt-3 border-t border-neutral-100">
                              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Elegí la fecha</label>
                              <input type="date" value={customDate} min={new Date().toISOString().split('T')[0]} onChange={e => setCustomDate(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold text-black outline-none focus:border-black transition-colors" />
                              {customDate && <p className="mt-2 text-xs font-bold text-neutral-500 text-center">
                                <span>📅 </span>
                                <span>{new Date(customDate + 'T00:00:00').toLocaleDateString('es-AR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}</span>
                              </p>}
                            </div>
                          </motion.div>}
                      </AnimatePresence>
                    </div>

                    {/* Items */}
                    <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Productos ({cartItems.length})</p>
                        <button onClick={() => setStep(2)} className="text-black text-xs font-bold underline underline-offset-2">Editar</button>
                      </div>
                      {cartItems.map(item => <div key={item.productId} className="flex items-center justify-between px-4 py-3 border-b border-dashed border-neutral-100 last:border-0">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-bold text-black">{item.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {item.area && <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">{item.area}</span>}
                              {item.note && <p className="text-[11px] text-neutral-400 truncate">{item.note}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <QtyInput qty={item.qty} unit={item.unit} onQtyChange={val => setQty(item.productId, item.name, item.unit, val)} />
                            <button onClick={() => removeItem(item.productId)} className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center active:scale-90 transition-transform ml-1">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>)}
                    </div>

                    {/* Note */}
                    <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-3">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Nota general (opcional)</p>
                      <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder="Ej: entrega antes de las 10am, dejar con el encargado..." rows={2} className="w-full text-sm text-neutral-700 placeholder:text-neutral-300 bg-neutral-50 rounded-xl px-3 py-2.5 outline-none border border-neutral-100 focus:border-black resize-none" />
                      {creadoPor && (
                        <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
                          <span>👤</span> Pedido por <span className="font-medium text-neutral-600">{creadoPor}</span>
                        </p>
                      )}
                    </div>

                    {/* Editable WhatsApp message */}
                    <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#BBF7D0]">
                        <MessageCircle size={15} className="text-[#15803D] shrink-0" strokeWidth={2} />
                        <p className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider">Mensaje para {selectedProvider?.name}</p>
                        <span className="ml-auto text-[10px] text-[#16A34A] font-medium">Editable</span>
                      </div>
                      <textarea
                        value={mensajeEditable}
                        onChange={e => setMensajeEditable(e.target.value)}
                        rows={8}
                        className="w-full bg-transparent px-4 py-3 text-xs text-[#14532D] font-mono outline-none resize-none leading-relaxed placeholder-[#86EFAC]"
                        placeholder="El mensaje se generará automáticamente..."
                      />
                    </div>
                  </div>

                  {/* Send CTA */}
                  <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
                    <AnimatePresence mode="wait">
                      {!sent ? <motion.button key="send-btn" exit={{
                  opacity: 0,
                  scale: 0.96
                }} onClick={handleSend} disabled={cartItems.length === 0 || deliveryOption === 'custom' && !customDate} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 bg-[#22C55E] text-white active:scale-[0.98] transition-all disabled:opacity-30" style={{
                  boxShadow: '0 6px 20px rgba(34,197,94,0.3)'
                }}>
                            <MessageCircle size={19} strokeWidth={2.5} />
                            <span>Enviar pedido por WhatsApp</span>
                          </motion.button> : <motion.div key="sent-feedback" initial={{
                  opacity: 0,
                  scale: 0.9
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 bg-[#DCFCE7] text-[#15803D]">
                            <Check size={19} strokeWidth={3} />
                            <span>¡Pedido enviado!</span>
                          </motion.div>}
                    </AnimatePresence>
                  </div>
                </motion.div>}

            </AnimatePresence>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};