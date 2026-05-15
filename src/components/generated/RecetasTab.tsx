import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Search, Camera, ArrowLeft, Edit3, BookOpen, ChefHat,
  TrendingUp, Scale, Package, Utensils, ChevronDown,
  Eye, EyeOff, Info, Flame, Lock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Insumo {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerKg: number;
  provider: string;
}

interface SubRecetaIngrediente {
  id: string;
  tipo: 'insumo' | 'subreceta';
  referenciaId: string;
  nombre: string;
  grams: number;
  unit: string;
}

interface SubReceta {
  id: string;
  nombre: string;
  rinde: number;
  rindeUnit: string;
  ingredientes: SubRecetaIngrediente[];
  procedimiento: string;
  imagenUrl?: string;
  createdAt: string;
}

interface RecetaIngrediente {
  id: string;
  tipo: 'insumo' | 'subreceta';
  referenciaId: string;
  nombre: string;
  grams: number;
  wastePercent: number;
  unit: string;
}

interface ExtraItem {
  id: string;
  nombre: string;
  insumoId?: string;
  qty: number;
  costo: number;  // cost per unit (from catalog or manual)
}

interface Receta {
  id: string;
  nombre: string;
  categoria: string;
  porciones: number;
  ingredientes: RecetaIngrediente[];
  procedimiento: string;
  imagenUrl?: string;
  precioVenta?: number;
  ingredientesExtra?: ExtraItem[];
  horasManoObra?: number;
  rindeGramos?: number;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatMoney = (n: number) =>
  '$' + Math.round(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });

const formatGrams = (g: number) =>
  g >= 1000 ? `${(g / 1000).toFixed(2).replace(/\.?0+$/, '')} kg` : `${g} g`;

function getInsumoPrecioGramo(insumoId: string, insumos: Insumo[]): number {
  const ins = insumos.find(i => i.id === insumoId);
  return ins ? ins.pricePerKg / 1000 : 0;
}

function getSubRecetaCostoPorGramo(
  subId: string,
  subRecetas: SubReceta[],
  insumos: Insumo[],
  visited = new Set<string>()
): number {
  if (visited.has(subId)) return 0;
  const sub = subRecetas.find(s => s.id === subId);
  if (!sub || sub.rinde <= 0) return 0;
  visited.add(subId);
  const total = sub.ingredientes.reduce((sum, ing) => {
    if (ing.tipo === 'insumo') {
      return sum + getInsumoPrecioGramo(ing.referenciaId, insumos) * ing.grams;
    } else {
      return sum + getSubRecetaCostoPorGramo(ing.referenciaId, subRecetas, insumos, new Set(visited)) * ing.grams;
    }
  }, 0);
  return total / sub.rinde;
}

function getIngCosto(
  ing: RecetaIngrediente,
  insumos: Insumo[],
  subRecetas: SubReceta[]
): number {
  const gramsNeeded = ing.grams * (1 + ing.wastePercent / 100);
  if (ing.tipo === 'insumo') {
    return getInsumoPrecioGramo(ing.referenciaId, insumos) * gramsNeeded;
  }
  return getSubRecetaCostoPorGramo(ing.referenciaId, subRecetas, insumos) * gramsNeeded;
}

function getTarifaHora(): number {
  return parseFloat(localStorage.getItem('insuma_tarifa_hora') ?? '0') || 0;
}

function getRecetaCostoPorPorcion(
  receta: Receta,
  insumos: Insumo[],
  subRecetas: SubReceta[]
): number {
  const ingTotal = receta.ingredientes.reduce(
    (s, i) => s + getIngCosto(i, insumos, subRecetas),
    0
  );
  const extraTotal = (receta.ingredientesExtra ?? []).reduce((s, e) => s + (e.qty ?? 1) * e.costo, 0);
  const manoObra = (receta.horasManoObra ?? 0) * getTarifaHora();
  const total = ingTotal + extraTotal + manoObra;
  return receta.porciones > 0 ? total / receta.porciones : total;
}

function getSubRecetaCostoTotal(
  sub: SubReceta,
  insumos: Insumo[],
  subRecetas: SubReceta[]
): number {
  return sub.ingredientes.reduce((sum, ing) => {
    if (ing.tipo === 'insumo') {
      return sum + getInsumoPrecioGramo(ing.referenciaId, insumos) * ing.grams;
    }
    return sum + getSubRecetaCostoPorGramo(ing.referenciaId, subRecetas, insumos) * ing.grams;
  }, 0);
}

function foodCostColor(pct: number): string {
  if (pct <= 0) return 'text-neutral-400';
  if (pct < 0.25) return 'text-emerald-600';
  if (pct < 0.35) return 'text-amber-500';
  return 'text-red-500';
}

function foodCostBg(pct: number): string {
  if (pct <= 0) return 'bg-neutral-100';
  if (pct < 0.25) return 'bg-emerald-50';
  if (pct < 0.35) return 'bg-amber-50';
  return 'bg-red-50';
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export const CATALOG_INSUMOS: Insumo[] = [
  { id: 'ins-01', name: 'Lomo vacuno', category: 'Carnes', unit: 'kg', pricePerKg: 3800, provider: 'Frigorífico Central' },
  { id: 'ins-02', name: 'Bife de chorizo', category: 'Carnes', unit: 'kg', pricePerKg: 3200, provider: 'Frigorífico Central' },
  { id: 'ins-03', name: 'Pollo entero', category: 'Carnes', unit: 'kg', pricePerKg: 1200, provider: 'Frigorífico Central' },
  { id: 'ins-04', name: 'Costeleta de cerdo', category: 'Carnes', unit: 'kg', pricePerKg: 1800, provider: 'Frigorífico Central' },
  { id: 'ins-05', name: 'Molleja de corazón', category: 'Carnes', unit: 'kg', pricePerKg: 2200, provider: 'Frigorífico Central' },
  { id: 'ins-06', name: 'Tomate redondo', category: 'Verduras', unit: 'kg', pricePerKg: 280, provider: 'Huerta Orgánica' },
  { id: 'ins-07', name: 'Cebolla morada', category: 'Verduras', unit: 'kg', pricePerKg: 190, provider: 'Huerta Orgánica' },
  { id: 'ins-08', name: 'Ajo', category: 'Verduras', unit: 'kg', pricePerKg: 650, provider: 'Huerta Orgánica' },
  { id: 'ins-09', name: 'Albahaca fresca', category: 'Verduras', unit: 'kg', pricePerKg: 1200, provider: 'Huerta Orgánica' },
  { id: 'ins-10', name: 'Zanahoria', category: 'Verduras', unit: 'kg', pricePerKg: 150, provider: 'Huerta Orgánica' },
  { id: 'ins-11', name: 'Papas', category: 'Verduras', unit: 'kg', pricePerKg: 180, provider: 'Huerta Orgánica' },
  { id: 'ins-12', name: 'Limón', category: 'Verduras', unit: 'kg', pricePerKg: 260, provider: 'Huerta Orgánica' },
  { id: 'ins-13', name: 'Perejil fresco', category: 'Verduras', unit: 'kg', pricePerKg: 980, provider: 'Huerta Orgánica' },
  { id: 'ins-14', name: 'Atado de verdeo', category: 'Verduras', unit: 'kg', pricePerKg: 420, provider: 'Huerta Orgánica' },
  { id: 'ins-15', name: 'Leche entera', category: 'Lácteos', unit: 'lt', pricePerKg: 180, provider: 'Lácteos La Fé' },
  { id: 'ins-16', name: 'Crema de leche', category: 'Lácteos', unit: 'lt', pricePerKg: 620, provider: 'Lácteos La Fé' },
  { id: 'ins-17', name: 'Queso rallado', category: 'Lácteos', unit: 'kg', pricePerKg: 1800, provider: 'Lácteos La Fé' },
  { id: 'ins-18', name: 'Manteca', category: 'Lácteos', unit: 'kg', pricePerKg: 1400, provider: 'Lácteos La Fé' },
  { id: 'ins-19', name: 'Huevo', category: 'Lácteos', unit: 'u', pricePerKg: 1445, provider: 'Lácteos La Fé' },
  { id: 'ins-20', name: 'Harina 000', category: 'Almacén', unit: 'kg', pricePerKg: 280, provider: 'Distribuidora Almacén' },
  { id: 'ins-21', name: 'Harina 0000', category: 'Almacén', unit: 'kg', pricePerKg: 310, provider: 'Distribuidora Almacén' },
  { id: 'ins-22', name: 'Aceite de girasol', category: 'Almacén', unit: 'lt', pricePerKg: 430, provider: 'Distribuidora Almacén' },
  { id: 'ins-23', name: 'Azúcar blanca', category: 'Almacén', unit: 'kg', pricePerKg: 220, provider: 'Distribuidora Almacén' },
  { id: 'ins-24', name: 'Sal fina', category: 'Almacén', unit: 'kg', pricePerKg: 95, provider: 'Distribuidora Almacén' },
  { id: 'ins-25', name: 'Arroz largo', category: 'Almacén', unit: 'kg', pricePerKg: 310, provider: 'Distribuidora Almacén' },
  { id: 'ins-26', name: 'Caldo de res', category: 'Almacén', unit: 'lt', pricePerKg: 320, provider: 'Distribuidora Almacén' },
  { id: 'ins-27', name: 'Filete de merluza', category: 'Pescados', unit: 'kg', pricePerKg: 2400, provider: 'Pescadería del Puerto' },
  { id: 'ins-28', name: 'Camarones', category: 'Pescados', unit: 'kg', pricePerKg: 4200, provider: 'Pescadería del Puerto' },
  { id: 'ins-29', name: 'Hongos shitake', category: 'Almacén', unit: 'kg', pricePerKg: 3800, provider: 'Distribuidora Almacén' },
  { id: 'ins-30', name: 'Pimienta en grano', category: 'Almacén', unit: 'kg', pricePerKg: 2400, provider: 'Distribuidora Almacén' },
  { id: 'ins-31', name: 'Semilla de mostaza', category: 'Almacén', unit: 'kg', pricePerKg: 680, provider: 'Distribuidora Almacén' },
  { id: 'ins-32', name: 'Aceite de oliva', category: 'Almacén', unit: 'lt', pricePerKg: 1800, provider: 'Distribuidora Almacén' },
  { id: 'apo-01', name: 'Leña', category: 'Descartables', unit: 'u', pricePerKg: 200, provider: 'Proveedor Descartables' },
  { id: 'apo-02', name: 'Film plástico', category: 'Descartables', unit: 'u', pricePerKg: 150, provider: 'Proveedor Descartables' },
  { id: 'apo-03', name: 'Bandeja aluminio', category: 'Descartables', unit: 'u', pricePerKg: 80, provider: 'Proveedor Descartables' },
  { id: 'apo-04', name: 'Bolsa de vacío', category: 'Descartables', unit: 'u', pricePerKg: 120, provider: 'Proveedor Descartables' },
  { id: 'apo-05', name: 'Papel manteca', category: 'Descartables', unit: 'u', pricePerKg: 50, provider: 'Proveedor Descartables' },
  { id: 'apo-06', name: 'Palillo madera', category: 'Descartables', unit: 'u', pricePerKg: 15, provider: 'Proveedor Descartables' },
  { id: 'apo-07', name: 'Descartable', category: 'Descartables', unit: 'u', pricePerKg: 60, provider: 'Proveedor Descartables' },
];

const CATEGORIAS = ['Entradas', 'Principales', 'Pastas', 'Postres', 'Panadería', 'Salsas', 'Fermentos', 'Cocina'];

const CATEGORIA_COLORS: Record<string, string> = {
  Entradas: '#0ea5e9',
  Principales: '#16a34a',
  Pastas: '#D97706',
  Postres: '#EC4899',
  Panadería: '#92400e',
  Salsas: '#EF4444',
  Fermentos: '#8B5CF6',
  Cocina: '#374151',
};

const INITIAL_SUBRECETAS: SubReceta[] = [
  {
    id: 'sub-01',
    nombre: 'Gravy de molleja',
    rinde: 400,
    rindeUnit: 'gr',
    ingredientes: [
      { id: 'si-1', tipo: 'insumo', referenciaId: 'ins-07', nombre: 'Cebolla morada', grams: 120, unit: 'gr' },
      { id: 'si-2', tipo: 'insumo', referenciaId: 'ins-08', nombre: 'Ajo', grams: 20, unit: 'gr' },
      { id: 'si-3', tipo: 'insumo', referenciaId: 'ins-26', nombre: 'Caldo de res', grams: 500, unit: 'ml' },
      { id: 'si-4', tipo: 'insumo', referenciaId: 'ins-18', nombre: 'Manteca', grams: 40, unit: 'gr' },
    ],
    procedimiento: 'Rehogar cebolla y ajo en manteca. Deglacear con caldo y reducir a la mitad. Tamizar y sazonar.',
    createdAt: 'hace 2 días',
  },
  {
    id: 'sub-02',
    nombre: 'Hongos fermentados',
    rinde: 500,
    rindeUnit: 'gr',
    ingredientes: [
      { id: 'si-5', tipo: 'insumo', referenciaId: 'ins-29', nombre: 'Hongos shitake', grams: 500, unit: 'gr' },
      { id: 'si-6', tipo: 'insumo', referenciaId: 'ins-24', nombre: 'Sal fina', grams: 4, unit: 'gr' },
    ],
    procedimiento: 'Limpiar hongos y laminar. Mezclar con sal y dejar fermentar en frasco tapado a temperatura ambiente por 48 hs.',
    createdAt: 'hace 1 semana',
  },
  {
    id: 'sub-03',
    nombre: 'Dressing de mostaza',
    rinde: 350,
    rindeUnit: 'ml',
    ingredientes: [
      { id: 'si-7', tipo: 'insumo', referenciaId: 'ins-31', nombre: 'Semilla de mostaza', grams: 30, unit: 'gr' },
      { id: 'si-8', tipo: 'insumo', referenciaId: 'ins-12', nombre: 'Limón', grams: 40, unit: 'gr' },
      { id: 'si-9', tipo: 'insumo', referenciaId: 'ins-22', nombre: 'Aceite de girasol', grams: 200, unit: 'ml' },
      { id: 'si-10', tipo: 'insumo', referenciaId: 'ins-13', nombre: 'Perejil fresco', grams: 15, unit: 'gr' },
    ],
    procedimiento: 'Procesar todos los ingredientes. Emulsionar el aceite en hilo. Sazonar y refrigerar.',
    createdAt: 'hace 3 días',
  },
];

const INITIAL_RECETAS: Receta[] = [
  {
    id: 'rec-01',
    nombre: 'Molleja brasa',
    categoria: 'Principales',
    porciones: 1,
    ingredientes: [
      { id: 'ri-1', tipo: 'insumo', referenciaId: 'ins-05', nombre: 'Molleja de corazón', grams: 400, wastePercent: 10, unit: 'gr' },
      { id: 'ri-2', tipo: 'subreceta', referenciaId: 'sub-01', nombre: 'Gravy de molleja', grams: 30, wastePercent: 0, unit: 'gr' },
      { id: 'ri-3', tipo: 'insumo', referenciaId: 'ins-14', nombre: 'Atado de verdeo', grams: 120, wastePercent: 15, unit: 'gr' },
    ],
    procedimiento: 'Blanquear molleja 5 minutos. Asar a las brasas hasta dorar bien por fuera. Servir con gravy caliente y verdeo salteado.',
    precioVenta: 40000,
    createdAt: 'hace 3 días',
  },
  {
    id: 'rec-02',
    nombre: 'Risotto de hongos fermentados',
    categoria: 'Principales',
    porciones: 1,
    ingredientes: [
      { id: 'ri-4', tipo: 'insumo', referenciaId: 'ins-25', nombre: 'Arroz largo', grams: 120, wastePercent: 0, unit: 'gr' },
      { id: 'ri-5', tipo: 'insumo', referenciaId: 'ins-26', nombre: 'Caldo de res', grams: 400, wastePercent: 0, unit: 'ml' },
      { id: 'ri-6', tipo: 'subreceta', referenciaId: 'sub-02', nombre: 'Hongos fermentados', grams: 60, wastePercent: 0, unit: 'gr' },
      { id: 'ri-7', tipo: 'insumo', referenciaId: 'ins-18', nombre: 'Manteca', grams: 40, wastePercent: 0, unit: 'gr' },
      { id: 'ri-8', tipo: 'insumo', referenciaId: 'ins-17', nombre: 'Queso rallado', grams: 30, wastePercent: 0, unit: 'gr' },
    ],
    procedimiento: 'Nacarar arroz en manteca. Incorporar caldo caliente de a poco revolviendo. A mitad de cocción agregar los hongos fermentados. Terminar con manteca y queso fuera del fuego.',
    precioVenta: 35000,
    createdAt: 'hace 1 semana',
  },
  {
    id: 'rec-03',
    nombre: 'Filete de merluza con dressing',
    categoria: 'Principales',
    porciones: 1,
    ingredientes: [
      { id: 'ri-9', tipo: 'insumo', referenciaId: 'ins-27', nombre: 'Filete de merluza', grams: 280, wastePercent: 5, unit: 'gr' },
      { id: 'ri-10', tipo: 'subreceta', referenciaId: 'sub-03', nombre: 'Dressing de mostaza', grams: 40, wastePercent: 0, unit: 'ml' },
      { id: 'ri-11', tipo: 'insumo', referenciaId: 'ins-11', nombre: 'Papas', grams: 200, wastePercent: 20, unit: 'gr' },
    ],
    procedimiento: 'Sellar filete en sartén caliente con aceite. Terminar en horno 4 minutos. Servir sobre papas rústicas y bañar con dressing de mostaza.',
    precioVenta: 38000,
    createdAt: 'hace 2 días',
  },
];

// ─── IngredientePicker ────────────────────────────────────────────────────────

type PickerResult =
  | { tipo: 'insumo'; item: Insumo }
  | { tipo: 'subreceta'; item: SubReceta };

const IngredientePicker = ({
  insumos,
  subRecetas,
  onAdd,
  placeholder = 'Agregar ingrediente o sub-receta...',
}: {
  insumos: Insumo[];
  subRecetas: SubReceta[];
  onAdd: (result: PickerResult) => void;
  placeholder?: string;
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const filteredInsumos = q.length > 0
    ? insumos.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)).slice(0, 4)
    : [];
  const filteredSubs = q.length > 0
    ? subRecetas.filter(s => s.nombre.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const hasResults = filteredInsumos.length > 0 || filteredSubs.length > 0;

  const handleSelect = (result: PickerResult) => {
    onAdd(result);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
        <Search size={14} className="text-neutral-400 shrink-0" strokeWidth={1.75} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-black outline-none placeholder-neutral-400"
        />
        {query.length > 0 && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="text-neutral-300">
            <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && hasResults && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl overflow-hidden z-20 shadow-lg"
          >
            {filteredSubs.length > 0 && (
              <div>
                <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest text-neutral-400 font-normal">Sub-recetas</p>
                {filteredSubs.map(sub => (
                  <button
                    key={sub.id}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect({ tipo: 'subreceta', item: sub })}
                    className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 border-b border-neutral-50 last:border-0 active:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                        <ChefHat size={10} className="text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-black truncate">{sub.nombre}</p>
                        <p className="text-[10px] text-neutral-400">Rinde {sub.rinde}{sub.rindeUnit}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {filteredInsumos.length > 0 && (
              <div>
                <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest text-neutral-400 font-normal">Insumos</p>
                {filteredInsumos.map(ins => (
                  <button
                    key={ins.id}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect({ tipo: 'insumo', item: ins })}
                    className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 border-b border-neutral-50 last:border-0 active:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                        <Package size={10} className="text-neutral-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-black truncate">{ins.name}</p>
                        <p className="text-[10px] text-neutral-400">{ins.category} · {ins.provider}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-neutral-500 shrink-0 tabular-nums">
                      {formatMoney(ins.pricePerKg)}/kg
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── IngredienteEditRow ───────────────────────────────────────────────────────

const IngredienteEditRow = ({
  ing,
  onRemove,
  onChange,
}: {
  ing: RecetaIngrediente;
  onRemove: () => void;
  onChange: (updated: RecetaIngrediente) => void;
}) => (
  <div className="py-3 border-b border-neutral-50 last:border-0">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ing.tipo === 'subreceta' ? 'bg-violet-100' : 'bg-neutral-100'}`}>
        {ing.tipo === 'subreceta'
          ? <ChefHat size={8} className="text-violet-600" />
          : <Package size={8} className="text-neutral-500" />}
      </div>
      <p className="flex-1 text-sm text-black truncate">{ing.nombre}</p>
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 active:scale-90 transition-transform shrink-0"
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </div>
    <div className="flex items-center gap-2 pl-6">
      <div className="flex-1 flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2">
        <Scale size={11} className="text-neutral-400 shrink-0" />
        <input
          type="number"
          inputMode="decimal"
          value={ing.grams || ''}
          onChange={e => onChange({ ...ing, grams: parseFloat(e.target.value) || 0 })}
          placeholder="0"
          className="flex-1 bg-transparent text-sm font-medium text-black outline-none tabular-nums w-0 min-w-0"
          style={{ MozAppearance: 'textfield' } as React.CSSProperties}
        />
        <span className="text-[10px] text-neutral-400 shrink-0">{ing.unit}</span>
      </div>
      <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 w-24" title="Porcentaje de la cantidad que se pierde en preparación (limpieza, cocción, etc.)">
        <span className="text-[10px] text-neutral-400 shrink-0">merma%</span>
        <input
          type="number"
          inputMode="decimal"
          value={ing.wastePercent || ''}
          onChange={e => onChange({ ...ing, wastePercent: Math.min(100, parseFloat(e.target.value) || 0) })}
          placeholder="0"
          className="flex-1 bg-transparent text-sm font-medium text-black outline-none tabular-nums w-0 min-w-0"
          style={{ MozAppearance: 'textfield' } as React.CSSProperties}
        />
      </div>
    </div>
  </div>
);

// ─── SubIngredienteEditRow ────────────────────────────────────────────────────

const SubIngredienteEditRow = ({
  ing,
  onRemove,
  onChange,
}: {
  ing: SubRecetaIngrediente;
  onRemove: () => void;
  onChange: (updated: SubRecetaIngrediente) => void;
}) => (
  <div className="py-3 border-b border-neutral-50 last:border-0">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ing.tipo === 'subreceta' ? 'bg-violet-100' : 'bg-neutral-100'}`}>
        {ing.tipo === 'subreceta'
          ? <ChefHat size={8} className="text-violet-600" />
          : <Package size={8} className="text-neutral-500" />}
      </div>
      <p className="flex-1 text-sm text-black truncate">{ing.nombre}</p>
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 active:scale-90 transition-transform shrink-0"
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </div>
    <div className="pl-6">
      <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2">
        <Scale size={11} className="text-neutral-400 shrink-0" />
        <input
          type="number"
          inputMode="decimal"
          value={ing.grams || ''}
          onChange={e => onChange({ ...ing, grams: parseFloat(e.target.value) || 0 })}
          placeholder="0"
          className="flex-1 bg-transparent text-sm font-medium text-black outline-none tabular-nums w-0 min-w-0"
          style={{ MozAppearance: 'textfield' } as React.CSSProperties}
        />
        <span className="text-[10px] text-neutral-400 shrink-0">{ing.unit}</span>
      </div>
    </div>
  </div>
);

// ─── SubRecetaPickerSearch (simplified, only insumos + other subs) ────────────

const SubRecetaIngredientePicker = ({
  insumos,
  subRecetas,
  currentSubId,
  onAdd,
}: {
  insumos: Insumo[];
  subRecetas: SubReceta[];
  currentSubId?: string;
  onAdd: (result: PickerResult) => void;
}) => {
  const availableSubs = subRecetas.filter(s => s.id !== currentSubId);
  return (
    <IngredientePicker
      insumos={insumos}
      subRecetas={availableSubs}
      onAdd={onAdd}
      placeholder="Agregar insumo o sub-receta..."
    />
  );
};

// ─── InsumosApoyoPicker ───────────────────────────────────────────────────────

const InsumosApoyoPicker = ({
  insumos,
  onAdd,
}: {
  insumos: Insumo[];
  onAdd: (item: ExtraItem) => void;
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const descartables = insumos.filter(i => i.category === 'Descartables');
  const q = query.trim().toLowerCase();
  const filtered = q.length > 0
    ? descartables.filter(i => i.name.toLowerCase().includes(q)).slice(0, 6)
    : descartables.slice(0, 6);

  const handleSelect = (ins: Insumo) => {
    onAdd({ id: `ex-${Date.now()}`, nombre: ins.name, insumoId: ins.id, qty: 1, costo: ins.pricePerKg });
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
        <Search size={14} className="text-neutral-400 shrink-0" strokeWidth={1.75} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Buscar insumo de apoyo..."
          className="flex-1 bg-transparent text-sm text-black outline-none placeholder-neutral-400"
        />
        {query.length > 0 && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="text-neutral-300">
            <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl overflow-hidden z-20 shadow-lg"
          >
            <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest text-neutral-400">Descartables</p>
            {filtered.map(ins => (
              <button
                key={ins.id}
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(ins)}
                className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 border-b border-neutral-50 last:border-0 active:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <Flame size={10} className="text-orange-500" />
                  </div>
                  <p className="text-sm text-black truncate">{ins.name}</p>
                </div>
                <span className="text-[11px] font-medium text-neutral-500 shrink-0 tabular-nums">
                  {formatMoney(ins.pricePerKg)}/u
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── RecetaForm ───────────────────────────────────────────────────────────────

const RecetaForm = ({
  isOpen,
  initial,
  insumos,
  subRecetas,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  initial?: Receta;
  insumos: Insumo[];
  subRecetas: SubReceta[];
  onSave: (r: Receta) => void;
  onClose: () => void;
}) => {
  const isEdit = !!initial;
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [categoria, setCategoria] = useState(initial?.categoria ?? 'Principales');
  const [porciones, setPorciones] = useState(initial?.porciones ?? 1);
  const [procedimiento, setProcedimiento] = useState(initial?.procedimiento ?? '');
  const [imagenUrl, setImagenUrl] = useState(initial?.imagenUrl ?? '');
  const [ingredientes, setIngredientes] = useState<RecetaIngrediente[]>(initial?.ingredientes ?? []);
  const [ingredientesExtra, setIngredientesExtra] = useState<ExtraItem[]>(initial?.ingredientesExtra ?? []);
  const [horasManoObra, setHorasManoObra] = useState(initial?.horasManoObra ?? 0);
  const [rindeGramos, setRindeGramos] = useState<number | ''>(initial?.rindeGramos ?? '');
  const [tarifaHora] = useState(() => getTarifaHora());
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setNombre(initial?.nombre ?? '');
      setCategoria(initial?.categoria ?? 'Principales');
      setPorciones(initial?.porciones ?? 1);
      setProcedimiento(initial?.procedimiento ?? '');
      setImagenUrl(initial?.imagenUrl ?? '');
      setIngredientes(initial?.ingredientes ?? []);
      setIngredientesExtra(initial?.ingredientesExtra ?? []);
      setHorasManoObra(initial?.horasManoObra ?? 0);
      setRindeGramos(initial?.rindeGramos ?? '');
    }
  }, [isOpen]);

  const handleAdd = (result: PickerResult) => {
    if (result.tipo === 'insumo') {
      const ins = result.item as Insumo;
      setIngredientes(prev => [...prev, {
        id: `ri-${Date.now()}`,
        tipo: 'insumo',
        referenciaId: ins.id,
        nombre: ins.name,
        grams: 100,
        wastePercent: 0,
        unit: ins.unit === 'lt' ? 'ml' : 'gr',
      }]);
    } else {
      const sub = result.item as SubReceta;
      setIngredientes(prev => [...prev, {
        id: `ri-${Date.now()}`,
        tipo: 'subreceta',
        referenciaId: sub.id,
        nombre: sub.nombre,
        grams: 50,
        wastePercent: 0,
        unit: sub.rindeUnit,
      }]);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagenUrl(url);
    }
  };

  const handleSave = () => {
    if (!nombre.trim()) return;
    onSave({
      id: initial?.id ?? `rec-${Date.now()}`,
      nombre: nombre.trim(),
      categoria,
      porciones,
      ingredientes,
      procedimiento,
      imagenUrl: imagenUrl || undefined,
      precioVenta: initial?.precioVenta,
      ingredientesExtra,
      horasManoObra,
      rindeGramos: rindeGramos !== '' ? Number(rindeGramos) : undefined,
      createdAt: initial?.createdAt ?? 'ahora',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          className="fixed inset-0 z-50 bg-white flex flex-col"
          style={{ maxWidth: 448, margin: '0 auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-12 pb-3 shrink-0 border-b border-neutral-100">
            <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
              <ArrowLeft size={17} strokeWidth={1.75} />
            </button>
            <h2 className="text-base font-medium text-black">{isEdit ? 'Editar receta' : 'Nueva receta'}</h2>
            <button
              onClick={handleSave}
              disabled={!nombre.trim()}
              className="px-4 py-2 bg-black text-white text-sm rounded-xl disabled:opacity-30 active:scale-95 transition-transform"
            >
              Guardar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Foto */}
            <div>
              {imagenUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-100 mb-3">
                  <img src={imagenUrl} alt="foto" className="w-full h-44 object-cover" />
                  <button
                    onClick={() => setImagenUrl('')}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 active:bg-neutral-50 transition-colors mb-3"
                >
                  <Camera size={20} strokeWidth={1.5} />
                  <span className="text-xs">Agregar foto</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </div>

            {/* Nombre */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-1.5">Nombre</label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Molleja brasa"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none placeholder-neutral-400"
              />
            </div>

            {/* Categoría + Porciones */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-1.5">Categoría</label>
                <div className="relative">
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none appearance-none"
                  >
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>
              <div className="w-28">
                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-1.5">Porciones</label>
                <div className="flex items-center border border-neutral-200 bg-neutral-50 rounded-xl overflow-hidden">
                  <button onClick={() => setPorciones(p => Math.max(1, p - 1))} className="w-9 h-10 flex items-center justify-center text-neutral-400 active:bg-neutral-100">
                    <span className="text-base font-light">−</span>
                  </button>
                  <span className="flex-1 text-center text-sm font-medium text-black tabular-nums">{porciones}</span>
                  <button onClick={() => setPorciones(p => p + 1)} className="w-9 h-10 flex items-center justify-center text-neutral-400 active:bg-neutral-100">
                    <span className="text-base font-light">+</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rinde total */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-1.5">Rinde total <span className="normal-case font-normal text-neutral-300">(opcional)</span></label>
              <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5">
                <input
                  type="number"
                  inputMode="numeric"
                  value={rindeGramos}
                  onChange={e => setRindeGramos(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ej: 1200"
                  className="flex-1 bg-transparent text-sm text-black outline-none tabular-nums placeholder-neutral-400"
                  style={{ MozAppearance: 'textfield' } as React.CSSProperties}
                />
                <span className="text-sm text-neutral-400">g</span>
              </div>
              {rindeGramos !== '' && porciones > 0 && (
                <p className="text-[11px] text-neutral-400 mt-1">{Math.round(Number(rindeGramos) / porciones)} g por porción</p>
              )}
            </div>

            {/* Ingredientes */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-2">Ingredientes</label>
              {ingredientes.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 mb-2">
                  {ingredientes.map((ing, idx) => (
                    <IngredienteEditRow
                      key={ing.id}
                      ing={ing}
                      onRemove={() => setIngredientes(prev => prev.filter((_, i) => i !== idx))}
                      onChange={updated => setIngredientes(prev => prev.map((it, i) => i === idx ? updated : it))}
                    />
                  ))}
                </div>
              )}
              <IngredientePicker insumos={insumos} subRecetas={subRecetas} onAdd={handleAdd} />
            </div>

            {/* Ingredientes extra */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-2">
                Insumos de apoyo
              </label>
              <p className="text-[10px] text-neutral-400 mb-2">Leña, film, bandeja, bolsa de vacío, etc.</p>
              {ingredientesExtra.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 mb-2">
                  {ingredientesExtra.map((item, idx) => (
                    <div key={item.id} className="py-3 border-b border-neutral-50 last:border-0 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <Flame size={8} className="text-orange-500" />
                      </div>
                      <p className="flex-1 text-sm text-black truncate min-w-0">{item.nombre}</p>
                      {/* qty stepper */}
                      <div className="flex items-center border border-neutral-200 bg-white rounded-lg overflow-hidden shrink-0">
                        <button
                          onClick={() => setIngredientesExtra(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(1, (it.qty ?? 1) - 1) } : it))}
                          className="w-7 h-7 flex items-center justify-center text-neutral-400 active:bg-neutral-100"
                        ><span className="text-sm font-light">−</span></button>
                        <span className="w-6 text-center text-xs font-bold text-black tabular-nums">{item.qty ?? 1}</span>
                        <button
                          onClick={() => setIngredientesExtra(prev => prev.map((it, i) => i === idx ? { ...it, qty: (it.qty ?? 1) + 1 } : it))}
                          className="w-7 h-7 flex items-center justify-center text-neutral-400 active:bg-neutral-100"
                        ><span className="text-sm font-light">+</span></button>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">{formatMoney(item.costo)}/u</span>
                      <button
                        onClick={() => setIngredientesExtra(prev => prev.filter((_, i) => i !== idx))}
                        className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 active:scale-90 transition-transform shrink-0"
                      >
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <InsumosApoyoPicker
                insumos={insumos}
                onAdd={item => setIngredientesExtra(prev => [...prev, item])}
              />
            </div>

            {/* Mano de obra */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-2">Mano de obra</label>
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-black">Horas de trabajo</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Tarifa: {tarifaHora > 0 ? `$${tarifaHora.toLocaleString('es-AR')}/h` : 'Sin configurar — ir a Pagos'}
                    </p>
                  </div>
                  <div className="flex items-center border border-neutral-200 bg-white rounded-xl overflow-hidden">
                    <button onClick={() => setHorasManoObra(h => Math.max(0, +(h - 0.5).toFixed(1)))} className="w-9 h-10 flex items-center justify-center text-neutral-400 active:bg-neutral-100">
                      <span className="text-base font-light">−</span>
                    </button>
                    <span className="w-10 text-center text-sm font-medium text-black tabular-nums">{horasManoObra}</span>
                    <button onClick={() => setHorasManoObra(h => +(h + 0.5).toFixed(1))} className="w-9 h-10 flex items-center justify-center text-neutral-400 active:bg-neutral-100">
                      <span className="text-base font-light">+</span>
                    </button>
                  </div>
                </div>
                {horasManoObra > 0 && tarifaHora > 0 && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    Costo M.O.: ${(horasManoObra * tarifaHora).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
            </div>

            {/* Procedimiento */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-1.5">Procedimiento</label>
              <textarea
                value={procedimiento}
                onChange={e => setProcedimiento(e.target.value)}
                placeholder="Describí el paso a paso de la preparación..."
                rows={5}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none placeholder-neutral-400 resize-none"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── SubRecetaForm ────────────────────────────────────────────────────────────

const SubRecetaForm = ({
  isOpen,
  initial,
  insumos,
  subRecetas,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  initial?: SubReceta;
  insumos: Insumo[];
  subRecetas: SubReceta[];
  onSave: (s: SubReceta) => void;
  onClose: () => void;
}) => {
  const isEdit = !!initial;
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [rinde, setRinde] = useState(initial?.rinde ?? 500);
  const [rindeUnit, setRindeUnit] = useState(initial?.rindeUnit ?? 'gr');
  const [procedimiento, setProcedimiento] = useState(initial?.procedimiento ?? '');
  const [imagenUrl, setImagenUrl] = useState(initial?.imagenUrl ?? '');
  const [ingredientes, setIngredientes] = useState<SubRecetaIngrediente[]>(initial?.ingredientes ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setNombre(initial?.nombre ?? '');
      setRinde(initial?.rinde ?? 500);
      setRindeUnit(initial?.rindeUnit ?? 'gr');
      setProcedimiento(initial?.procedimiento ?? '');
      setImagenUrl(initial?.imagenUrl ?? '');
      setIngredientes(initial?.ingredientes ?? []);
    }
  }, [isOpen]);

  const handleAdd = (result: PickerResult) => {
    if (result.tipo === 'insumo') {
      const ins = result.item as Insumo;
      setIngredientes(prev => [...prev, {
        id: `si-${Date.now()}`,
        tipo: 'insumo',
        referenciaId: ins.id,
        nombre: ins.name,
        grams: 100,
        unit: ins.unit === 'lt' ? 'ml' : 'gr',
      }]);
    } else {
      const sub = result.item as SubReceta;
      setIngredientes(prev => [...prev, {
        id: `si-${Date.now()}`,
        tipo: 'subreceta',
        referenciaId: sub.id,
        nombre: sub.nombre,
        grams: 50,
        unit: sub.rindeUnit,
      }]);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagenUrl(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (!nombre.trim()) return;
    onSave({
      id: initial?.id ?? `sub-${Date.now()}`,
      nombre: nombre.trim(),
      rinde,
      rindeUnit,
      ingredientes,
      procedimiento,
      imagenUrl: imagenUrl || undefined,
      createdAt: initial?.createdAt ?? 'ahora',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          className="fixed inset-0 z-50 bg-white flex flex-col"
          style={{ maxWidth: 448, margin: '0 auto' }}
        >
          <div className="flex items-center justify-between px-5 pt-12 pb-3 shrink-0 border-b border-neutral-100">
            <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
              <ArrowLeft size={17} strokeWidth={1.75} />
            </button>
            <h2 className="text-base font-medium text-black">{isEdit ? 'Editar sub-receta' : 'Nueva sub-receta'}</h2>
            <button
              onClick={handleSave}
              disabled={!nombre.trim()}
              className="px-4 py-2 bg-black text-white text-sm rounded-xl disabled:opacity-30 active:scale-95 transition-transform"
            >
              Guardar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Foto */}
            <div>
              {imagenUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-100 mb-3">
                  <img src={imagenUrl} alt="foto" className="w-full h-44 object-cover" />
                  <button onClick={() => setImagenUrl('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 active:bg-neutral-50 transition-colors mb-3"
                >
                  <Camera size={20} strokeWidth={1.5} />
                  <span className="text-xs">Agregar foto</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </div>

            {/* Nombre */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-1.5">Nombre</label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Dressing de mostaza"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none placeholder-neutral-400"
              />
            </div>

            {/* Rinde */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-1.5">Rinde (cantidad que produce)</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={rinde || ''}
                    onChange={e => setRinde(parseFloat(e.target.value) || 0)}
                    placeholder="500"
                    className="flex-1 bg-transparent text-sm font-medium text-black outline-none tabular-nums"
                    style={{ MozAppearance: 'textfield' } as React.CSSProperties}
                  />
                </div>
                <div className="relative w-24">
                  <select
                    value={rindeUnit}
                    onChange={e => setRindeUnit(e.target.value)}
                    className="w-full h-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none appearance-none"
                  >
                    <option value="gr">gr</option>
                    <option value="ml">ml</option>
                    <option value="u">u</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Ingredientes */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-2">Ingredientes</label>
              {ingredientes.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 mb-2">
                  {ingredientes.map((ing, idx) => (
                    <SubIngredienteEditRow
                      key={ing.id}
                      ing={ing}
                      onRemove={() => setIngredientes(prev => prev.filter((_, i) => i !== idx))}
                      onChange={updated => setIngredientes(prev => prev.map((it, i) => i === idx ? updated : it))}
                    />
                  ))}
                </div>
              )}
              <SubRecetaIngredientePicker
                insumos={insumos}
                subRecetas={subRecetas}
                currentSubId={initial?.id}
                onAdd={handleAdd}
              />
            </div>

            {/* Procedimiento */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-normal block mb-1.5">Procedimiento</label>
              <textarea
                value={procedimiento}
                onChange={e => setProcedimiento(e.target.value)}
                placeholder="Describí el paso a paso..."
                rows={4}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-black outline-none placeholder-neutral-400 resize-none"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── RecetaDetailView ─────────────────────────────────────────────────────────

const RecetaDetailView = ({
  receta,
  isOpen,
  onClose,
  onEdit,
  showCosts,
  onToggleCosts,
  insumos,
  subRecetas,
  canViewCosts = true,
}: {
  receta: Receta | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  showCosts: boolean;
  onToggleCosts: () => void;
  insumos: Insumo[];
  subRecetas: SubReceta[];
  canViewCosts?: boolean;
}) => {
  const [multiplicador, setMultiplicador] = useState(1);
  const [showScalePanel, setShowScalePanel] = useState(false);
  const [customScale, setCustomScale] = useState('');

  React.useEffect(() => {
    if (!isOpen) { setMultiplicador(1); setShowScalePanel(false); setCustomScale(''); }
  }, [isOpen]);

  if (!receta) return null;
  const color = CATEGORIA_COLORS[receta.categoria] ?? '#6B7280';
  const costo = getRecetaCostoPorPorcion(receta, insumos, subRecetas);
  const pct = receta.precioVenta && receta.precioVenta > 0 ? costo / receta.precioVenta : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed inset-0 z-50 bg-white flex flex-col"
          style={{ maxWidth: 448, margin: '0 auto' }}
        >
          <div className="flex items-center justify-between px-5 pt-12 pb-3 shrink-0">
            <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
              <ArrowLeft size={17} strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2">
              {/* Scale button */}
              <div className="relative">
                <button
                  onClick={() => setShowScalePanel(v => !v)}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-transform active:scale-90 ${multiplicador > 1 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'border-neutral-200 text-neutral-500'}`}
                  title="Escalar receta"
                >
                  {multiplicador > 1
                    ? <span className="text-[10px] font-black">×{multiplicador}</span>
                    : <Scale size={15} strokeWidth={1.75} />}
                </button>
                <AnimatePresence>
                  {showScalePanel && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl p-3 z-10"
                      style={{ width: 200 }}
                    >
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Escalar receta</p>
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => { setMultiplicador(n); setShowScalePanel(false); }}
                            className={`w-9 h-9 rounded-xl text-xs font-black transition-all active:scale-95 ${multiplicador === n ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}
                          >×{n}</button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2">
                        <span className="text-[10px] text-neutral-400">×</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={customScale}
                          onChange={e => setCustomScale(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const v = parseInt(customScale) || 1;
                              setMultiplicador(Math.max(1, v));
                              setShowScalePanel(false);
                              setCustomScale('');
                            }
                          }}
                          placeholder="Otro..."
                          className="flex-1 bg-transparent text-sm font-bold text-black outline-none tabular-nums"
                          style={{ MozAppearance: 'textfield' } as React.CSSProperties}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {canViewCosts ? (
                <button
                  onClick={onToggleCosts}
                  className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform"
                  title={showCosts ? 'Ocultar costos' : 'Ver costos'}
                >
                  {showCosts ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-300" title="Solo administradores pueden ver costos">
                  <Lock size={14} strokeWidth={1.75} />
                </div>
              )}
              <button onClick={onEdit} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                <Edit3 size={15} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-12 space-y-5">
            {receta.imagenUrl && (
              <div className="rounded-2xl overflow-hidden border border-neutral-100">
                <img src={receta.imagenUrl} alt={receta.nombre} className="w-full h-52 object-cover" />
              </div>
            )}

            <div>
              <span
                className="text-[9px] font-normal uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-2"
                style={{ backgroundColor: color + '18', color }}
              >
                {receta.categoria}
              </span>
              <h1 className="text-3xl font-light text-black leading-tight tracking-wide">{receta.nombre}</h1>
              <p className="text-sm text-neutral-400 mt-1">
                {receta.porciones * multiplicador} {receta.porciones * multiplicador === 1 ? 'porción' : 'porciones'}
                {receta.rindeGramos && receta.porciones > 0
                  ? ` · ${Math.round(receta.rindeGramos * multiplicador / receta.porciones)} g c/u`
                  : null}
              </p>
            </div>

            {/* Scaling banner */}
            {multiplicador > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2"
              >
                <Scale size={13} className="text-amber-500 shrink-0" strokeWidth={2} />
                <p className="text-xs font-bold text-amber-800">
                  Receta escalada ×{multiplicador} — {receta.porciones * multiplicador} porciones
                </p>
              </motion.div>
            )}

            {/* Cost section — toggleable */}
            <div className={`rounded-2xl border overflow-hidden transition-all ${showCosts ? 'bg-amber-50 border-amber-100' : 'bg-neutral-50 border-neutral-100'}`}>
              <div className="px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-neutral-400 mb-1">Costo / porción</p>
                  <p className={`text-xl font-medium tabular-nums transition-all ${showCosts ? 'text-black' : 'text-neutral-300 blur-sm select-none pointer-events-none'}`}>
                    {showCosts ? formatMoney(costo) : '••••'}
                  </p>
                </div>
                {receta.precioVenta && receta.precioVenta > 0 && (
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest text-neutral-400 mb-1">Food cost</p>
                    <p className={`text-xl font-medium tabular-nums transition-all ${showCosts ? foodCostColor(pct) : 'text-neutral-300 blur-sm select-none pointer-events-none'}`}>
                      {showCosts ? `${(pct * 100).toFixed(1)}%` : '•••%'}
                    </p>
                  </div>
                )}
              </div>
              {!showCosts && (
                <div className="px-4 pb-3 flex items-center gap-1.5">
                  <Eye size={11} className="text-neutral-400" />
                  <p className="text-[10px] text-neutral-400">Tocá el ojo para ver los costos</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3">Ingredientes</p>
              <div className="space-y-2">
                {receta.ingredientes.map(ing => {
                  const scaledGrams = ing.grams * multiplicador;
                  return (
                    <div key={ing.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ing.tipo === 'subreceta' ? 'bg-violet-100' : 'bg-neutral-100'}`}>
                          {ing.tipo === 'subreceta'
                            ? <ChefHat size={8} className="text-violet-600" />
                            : <Package size={8} className="text-neutral-500" />}
                        </div>
                        <p className="text-sm text-black truncate">{ing.nombre}</p>
                      </div>
                      <span className={`text-sm tabular-nums shrink-0 ${multiplicador > 1 ? 'text-amber-600 font-bold' : 'text-neutral-500'}`}>
                        {scaledGrams} {ing.unit}
                        {ing.wastePercent > 0 && <span className="text-orange-400 text-xs ml-1">+{ing.wastePercent}%</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {(receta.ingredientesExtra ?? []).length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Insumos de apoyo</p>
                <div className="space-y-1.5">
                  {receta.ingredientesExtra!.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <Flame size={8} className="text-orange-500" />
                        </div>
                        <p className="text-sm text-black">{item.nombre} × {item.qty ?? 1}</p>
                      </div>
                      <span className={`text-sm tabular-nums transition-all ${showCosts ? 'text-neutral-500' : 'text-neutral-300 blur-sm select-none'}`}>
                        {showCosts ? `= ${formatMoney((item.qty ?? 1) * item.costo)}` : '••••'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(receta.horasManoObra ?? 0) > 0 && (
              <div className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Mano de obra</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-black">{receta.horasManoObra} {receta.horasManoObra === 1 ? 'hora' : 'horas'}</p>
                  <span className={`text-sm font-medium tabular-nums transition-all ${showCosts ? 'text-neutral-700' : 'text-neutral-300 blur-sm select-none'}`}>
                    {showCosts
                      ? (getTarifaHora() > 0 ? formatMoney((receta.horasManoObra ?? 0) * getTarifaHora()) : 'sin tarifa')
                      : '••••'}
                  </span>
                </div>
              </div>
            )}

            {receta.procedimiento && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Procedimiento</p>
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{receta.procedimiento}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── SubRecetaDetailView ──────────────────────────────────────────────────────

const SubRecetaDetailView = ({
  sub,
  isOpen,
  onClose,
  onEdit,
  insumos,
  subRecetas,
  showCosts,
  onToggleCosts,
  canViewCosts = true,
}: {
  sub: SubReceta | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  insumos: Insumo[];
  subRecetas: SubReceta[];
  showCosts: boolean;
  onToggleCosts: () => void;
  canViewCosts?: boolean;
}) => {
  const [multiplicador, setMultiplicador] = useState(1);
  const [showScalePanel, setShowScalePanel] = useState(false);
  const [customScale, setCustomScale] = useState('');

  React.useEffect(() => {
    if (!isOpen) { setMultiplicador(1); setShowScalePanel(false); setCustomScale(''); }
  }, [isOpen]);

  if (!sub) return null;
  const costoTotal = getSubRecetaCostoTotal(sub, insumos, subRecetas);
  const costoPorUnidad = sub.rinde > 0 ? costoTotal / sub.rinde : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed inset-0 z-50 bg-white flex flex-col"
          style={{ maxWidth: 448, margin: '0 auto' }}
        >
          <div className="flex items-center justify-between px-5 pt-12 pb-3 shrink-0">
            <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
              <ArrowLeft size={17} strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2">
              {/* Scale button */}
              <div className="relative">
                <button
                  onClick={() => setShowScalePanel(v => !v)}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-transform active:scale-90 ${multiplicador > 1 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'border-neutral-200 text-neutral-500'}`}
                >
                  {multiplicador > 1
                    ? <span className="text-[10px] font-black">×{multiplicador}</span>
                    : <Scale size={15} strokeWidth={1.75} />}
                </button>
                <AnimatePresence>
                  {showScalePanel && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl p-3 z-10"
                      style={{ width: 200 }}
                    >
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Escalar</p>
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => { setMultiplicador(n); setShowScalePanel(false); }}
                            className={`w-9 h-9 rounded-xl text-xs font-black transition-all active:scale-95 ${multiplicador === n ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}
                          >×{n}</button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2">
                        <span className="text-[10px] text-neutral-400">×</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={customScale}
                          onChange={e => setCustomScale(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const v = parseInt(customScale) || 1;
                              setMultiplicador(Math.max(1, v));
                              setShowScalePanel(false);
                              setCustomScale('');
                            }
                          }}
                          placeholder="Otro..."
                          className="flex-1 bg-transparent text-sm font-bold text-black outline-none tabular-nums"
                          style={{ MozAppearance: 'textfield' } as React.CSSProperties}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {canViewCosts ? (
                <button
                  onClick={onToggleCosts}
                  className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform"
                  title={showCosts ? 'Ocultar costos' : 'Ver costos'}
                >
                  {showCosts ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-300" title="Solo administradores pueden ver costos">
                  <Lock size={14} strokeWidth={1.75} />
                </div>
              )}
              <button onClick={onEdit} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                <Edit3 size={15} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-12 space-y-5">
            {sub.imagenUrl && (
              <div className="rounded-2xl overflow-hidden border border-neutral-100">
                <img src={sub.imagenUrl} alt={sub.nombre} className="w-full h-52 object-cover" />
              </div>
            )}

            <div>
              <span className="text-[9px] font-normal uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-2 bg-violet-100 text-violet-700">
                Sub-receta
              </span>
              <h1 className="text-3xl font-light text-black leading-tight tracking-wide">{sub.nombre}</h1>
              <p className="text-sm text-neutral-400 mt-1">Rinde {sub.rinde} {sub.rindeUnit}</p>
            </div>

            <div className={`flex gap-3 rounded-2xl border overflow-hidden transition-all ${showCosts ? 'bg-amber-50 border-amber-100' : 'bg-neutral-50 border-neutral-100'}`}>
              <div className="flex-1 p-3.5">
                <p className="text-[9px] uppercase tracking-widest text-neutral-400 mb-1">Costo total</p>
                <p className={`text-lg font-medium tabular-nums transition-all ${showCosts ? 'text-black' : 'text-neutral-300 blur-sm select-none pointer-events-none'}`}>
                  {showCosts ? formatMoney(costoTotal) : '••••'}
                </p>
              </div>
              <div className="flex-1 p-3.5 border-l border-neutral-100">
                <p className="text-[9px] uppercase tracking-widest text-neutral-400 mb-1">Por {sub.rindeUnit}</p>
                <p className={`text-lg font-medium tabular-nums transition-all ${showCosts ? 'text-black' : 'text-neutral-300 blur-sm select-none pointer-events-none'}`}>
                  {showCosts ? formatMoney(costoPorUnidad) : '••••'}
                </p>
              </div>
            </div>

            {/* Sub scaling banner */}
            {multiplicador > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2"
              >
                <Scale size={13} className="text-amber-500 shrink-0" strokeWidth={2} />
                <p className="text-xs font-bold text-amber-800">
                  Sub-receta escalada ×{multiplicador} — rinde {sub.rinde * multiplicador} {sub.rindeUnit}
                </p>
              </motion.div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3">Ingredientes</p>
              <div className="space-y-2">
                {sub.ingredientes.map(ing => {
                  const scaledGrams = ing.grams * multiplicador;
                  return (
                    <div key={ing.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ing.tipo === 'subreceta' ? 'bg-violet-100' : 'bg-neutral-100'}`}>
                          {ing.tipo === 'subreceta'
                            ? <ChefHat size={8} className="text-violet-600" />
                            : <Package size={8} className="text-neutral-500" />}
                        </div>
                        <p className="text-sm text-black truncate">{ing.nombre}</p>
                      </div>
                      <span className={`text-sm tabular-nums shrink-0 ${multiplicador > 1 ? 'text-amber-600 font-bold' : 'text-neutral-500'}`}>
                        {scaledGrams} {ing.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {sub.procedimiento && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Procedimiento</p>
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{sub.procedimiento}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── RecetaCard ───────────────────────────────────────────────────────────────

const RecetaCard = ({
  receta,
  onClick,
}: {
  receta: Receta;
  onClick: () => void;
}) => {
  const color = CATEGORIA_COLORS[receta.categoria] ?? '#6B7280';
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left bg-white border border-neutral-100 rounded-2xl overflow-hidden active:bg-neutral-50 transition-colors"
    >
      {receta.imagenUrl ? (
        <div className="h-36 overflow-hidden">
          <img src={receta.imagenUrl} alt={receta.nombre} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-20 bg-neutral-50 flex items-center justify-center">
          <Utensils size={24} className="text-neutral-200" strokeWidth={1} />
        </div>
      )}
      <div className="p-3.5">
        <span
          className="text-[8px] font-normal uppercase tracking-widest px-1.5 py-0.5 rounded-full inline-block mb-1.5"
          style={{ backgroundColor: color + '18', color }}
        >
          {receta.categoria}
        </span>
        <p className="text-sm font-medium text-black leading-tight">{receta.nombre}</p>
        <p className="text-[11px] text-neutral-400 mt-1">
          {receta.porciones} {receta.porciones === 1 ? 'porción' : 'porciones'} · {receta.ingredientes.length} ingredientes
        </p>
      </div>
    </motion.button>
  );
};

// ─── SubRecetaCard ────────────────────────────────────────────────────────────

const SubRecetaCard = ({
  sub,
  onClick,
}: {
  sub: SubReceta;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.97 }}
    className="w-full text-left bg-white border border-neutral-100 rounded-2xl overflow-hidden active:bg-neutral-50 transition-colors"
  >
    {sub.imagenUrl ? (
      <div className="h-36 overflow-hidden">
        <img src={sub.imagenUrl} alt={sub.nombre} className="w-full h-full object-cover" />
      </div>
    ) : (
      <div className="h-20 bg-violet-50 flex items-center justify-center">
        <ChefHat size={24} className="text-violet-200" strokeWidth={1} />
      </div>
    )}
    <div className="p-3.5">
      <span className="text-[8px] font-normal uppercase tracking-widest px-1.5 py-0.5 rounded-full inline-block mb-1.5 bg-violet-100 text-violet-700">
        Sub-receta
      </span>
      <p className="text-sm font-medium text-black leading-tight">{sub.nombre}</p>
      <p className="text-[11px] text-neutral-400 mt-1">
        Rinde {sub.rinde} {sub.rindeUnit} · {sub.ingredientes.length} ingredientes
      </p>
    </div>
  </motion.button>
);

// ─── FoodCostView ─────────────────────────────────────────────────────────────

const FoodCostView = ({
  recetas,
  insumos,
  subRecetas,
  onUpdatePrecio,
  onOpenDetail,
}: {
  recetas: Receta[];
  insumos: Insumo[];
  subRecetas: SubReceta[];
  onUpdatePrecio: (recetaId: string, precio: number) => void;
  onOpenDetail: (receta: Receta) => void;
}) => {
  const rows = recetas.map(r => {
    const costo = getRecetaCostoPorPorcion(r, insumos, subRecetas);
    const precio = r.precioVenta ?? 0;
    const sugerido = costo * 5;
    const pct = precio > 0 ? costo / precio : 0;
    const mult = precio > 0 ? precio / costo : 0;
    return { receta: r, costo, precio, sugerido, pct, mult };
  });

  const avgFoodCost = rows.filter(r => r.precio > 0).reduce((s, r) => s + r.pct, 0) / (rows.filter(r => r.precio > 0).length || 1);
  const bestRow = rows.filter(r => r.precio > 0).sort((a, b) => a.pct - b.pct)[0];
  const worstRow = rows.filter(r => r.precio > 0).sort((a, b) => b.pct - a.pct)[0];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {rows.some(r => r.precio > 0) && (
        <div className="flex gap-3">
          <div className={`flex-1 rounded-2xl p-3.5 border ${foodCostBg(avgFoodCost)} border-neutral-100`}>
            <p className="text-[9px] uppercase tracking-widest text-neutral-400 mb-1">Food cost promedio</p>
            <p className={`text-xl font-medium tabular-nums ${foodCostColor(avgFoodCost)}`}>
              {(avgFoodCost * 100).toFixed(1)}%
            </p>
          </div>
          {bestRow && (
            <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5">
              <p className="text-[9px] uppercase tracking-widest text-neutral-400 mb-1">Más rentable</p>
              <p className="text-xs font-medium text-emerald-700 truncate">{bestRow.receta.nombre}</p>
              <p className="text-[10px] text-emerald-600 tabular-nums">{(bestRow.pct * 100).toFixed(1)}% food cost</p>
            </div>
          )}
        </div>
      )}

      {/* Table header */}
      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
          <p className="text-[9px] uppercase tracking-widest text-neutral-400">Plato</p>
          <p className="text-[9px] uppercase tracking-widest text-neutral-400 text-right">Costo</p>
          <p className="text-[9px] uppercase tracking-widest text-neutral-400 text-right">Precio</p>
          <p className="text-[9px] uppercase tracking-widest text-neutral-400 text-right">FC%</p>
        </div>
        {rows.map(({ receta, costo, precio, sugerido, pct }) => (
          <FoodCostRow
            key={receta.id}
            receta={receta}
            costo={costo}
            precio={precio}
            sugerido={sugerido}
            pct={pct}
            onPrecioChange={v => onUpdatePrecio(receta.id, v)}
            onOpenDetail={() => onOpenDetail(receta)}
          />
        ))}
      </div>

      <p className="text-[10px] text-neutral-400 text-center px-4">
        Precio sugerido = costo × 5 · Verde &lt;25% · Amarillo 25–35% · Rojo &gt;35%
      </p>
    </div>
  );
};

const FoodCostRow = ({
  receta,
  costo,
  precio,
  sugerido,
  pct,
  onPrecioChange,
  onOpenDetail,
}: {
  receta: Receta;
  costo: number;
  precio: number;
  sugerido: number;
  pct: number;
  onPrecioChange: (v: number) => void;
  onOpenDetail: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const color = CATEGORIA_COLORS[receta.categoria] ?? '#6B7280';

  return (
    <div className="px-4 py-3.5 border-b border-neutral-50 last:border-0">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
        <button className="min-w-0 text-left active:opacity-70 transition-opacity" onClick={onOpenDetail}>
          <span
            className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full inline-block mb-0.5"
            style={{ backgroundColor: color + '15', color }}
          >
            {receta.categoria}
          </span>
          <p className="text-sm font-medium text-black truncate">{receta.nombre}</p>
          <p className="text-[9px] text-neutral-400 mt-0.5">Ver detalle →</p>
        </button>
        <div className="text-right">
          <p className="text-sm font-medium text-black tabular-nums">{formatMoney(costo)}</p>
          <p className="text-[10px] text-neutral-400">sug. {formatMoney(sugerido)}</p>
        </div>
        <div className="text-right min-w-[72px]">
          {editing ? (
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              defaultValue={precio || ''}
              onBlur={e => {
                const v = parseFloat(e.target.value) || 0;
                onPrecioChange(v);
                setEditing(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="w-20 text-right bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 text-sm font-medium text-black outline-none tabular-nums"
              style={{ MozAppearance: 'textfield' } as React.CSSProperties}
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="group flex flex-col items-end"
            >
              <p className={`text-sm font-medium tabular-nums ${precio > 0 ? 'text-black' : 'text-neutral-300'}`}>
                {precio > 0 ? formatMoney(precio) : '—'}
              </p>
              <p className="text-[9px] text-neutral-400 group-hover:text-neutral-600 transition-colors">editar</p>
            </button>
          )}
        </div>
        <div className="text-right">
          {precio > 0 ? (
            <span className={`text-sm font-medium tabular-nums ${foodCostColor(pct)}`}>
              {(pct * 100).toFixed(1)}%
            </span>
          ) : (
            <span className="text-sm text-neutral-300">—</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── RecetasTab ───────────────────────────────────────────────────────────────

export const RecetasTab: React.FC<{ canViewCosts?: boolean; customInsumos?: Insumo[] }> = ({ canViewCosts = true, customInsumos }) => {
  const [activeTab, setActiveTab] = useState<'recetario' | 'subrecetas' | 'foodcost'>('recetario');
  const [recetas, setRecetas] = useState<Receta[]>(INITIAL_RECETAS);
  const [subRecetas, setSubRecetas] = useState<SubReceta[]>(INITIAL_SUBRECETAS);
  const insumos = React.useMemo(() => [...CATALOG_INSUMOS, ...(customInsumos ?? [])], [customInsumos]);
  const [showCosts, setShowCosts] = useState(false);
  const effectiveShowCosts = canViewCosts && showCosts;
  // Search bars
  const [searchRecetario, setSearchRecetario] = useState('');
  const [searchSubrecetas, setSearchSubrecetas] = useState('');
  const [searchFoodcost, setSearchFoodcost] = useState('');

  // Receta form state
  const [recetaFormOpen, setRecetaFormOpen] = useState(false);
  const [recetaEditing, setRecetaEditing] = useState<Receta | undefined>();
  const [recetaDetail, setRecetaDetail] = useState<Receta | null>(null);
  const [recetaDetailOpen, setRecetaDetailOpen] = useState(false);

  // Sub-receta form state
  const [subFormOpen, setSubFormOpen] = useState(false);
  const [subEditing, setSubEditing] = useState<SubReceta | undefined>();
  const [subDetail, setSubDetail] = useState<SubReceta | null>(null);
  const [subDetailOpen, setSubDetailOpen] = useState(false);

  const handleSaveReceta = useCallback((r: Receta) => {
    setRecetas(prev => {
      const idx = prev.findIndex(x => x.id === r.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = r;
        return next;
      }
      return [...prev, r];
    });
  }, []);

  const handleSaveSubReceta = useCallback((s: SubReceta) => {
    setSubRecetas(prev => {
      const idx = prev.findIndex(x => x.id === s.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = s;
        return next;
      }
      return [...prev, s];
    });
  }, []);

  const handleUpdatePrecio = useCallback((recetaId: string, precio: number) => {
    setRecetas(prev => prev.map(r => r.id === recetaId ? { ...r, precioVenta: precio } : r));
  }, []);

  const openRecetaDetail = (r: Receta) => {
    setRecetaDetail(r);
    setRecetaDetailOpen(true);
  };

  const openSubDetail = (s: SubReceta) => {
    setSubDetail(s);
    setSubDetailOpen(true);
  };

  const tabs = [
    { id: 'recetario' as const, label: 'Recetario', icon: BookOpen },
    { id: 'subrecetas' as const, label: 'Sub-recetas', icon: ChefHat },
    { id: 'foodcost' as const, label: 'Food Cost', icon: TrendingUp },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tab bar */}
      <div className="px-4 pt-4 pb-1 shrink-0">
        <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-normal transition-all ${active ? 'bg-white text-black shadow-sm' : 'text-neutral-500'}`}
              >
                <Icon size={12} strokeWidth={active ? 2 : 1.75} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <AnimatePresence mode="wait">
          {activeTab === 'recetario' && (
            <motion.div
              key="recetario"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-black">Recetario</h2>
                  <p className="text-xs text-neutral-400">{recetas.length} recetas</p>
                </div>
                <button
                  onClick={() => { setRecetaEditing(undefined); setRecetaFormOpen(true); }}
                  className="flex items-center gap-1.5 bg-black text-white text-xs px-3 py-2 rounded-xl active:scale-95 transition-transform"
                >
                  <Plus size={13} strokeWidth={2} />
                  Nueva receta
                </button>
              </div>
              {/* Search bar */}
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 mb-4">
                <Search size={14} className="text-neutral-400 shrink-0" strokeWidth={1.75} />
                <input
                  value={searchRecetario}
                  onChange={e => setSearchRecetario(e.target.value)}
                  placeholder="Buscar receta..."
                  className="flex-1 bg-transparent text-sm text-black outline-none placeholder-neutral-400"
                />
                {searchRecetario && (
                  <button onClick={() => setSearchRecetario('')} className="text-neutral-300 shrink-0">
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
              {(() => {
                const filtered = recetas.filter(r => r.nombre.toLowerCase().includes(searchRecetario.toLowerCase()));
                return filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen size={32} className="text-neutral-200 mb-3" strokeWidth={1} />
                    <p className="text-sm text-neutral-400">{searchRecetario ? 'Sin resultados' : 'Sin recetas todavía'}</p>
                    <p className="text-xs text-neutral-300 mt-1">{searchRecetario ? 'Probá con otro término' : 'Creá tu primera receta'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map(r => (
                      <RecetaCard key={r.id} receta={r} onClick={() => openRecetaDetail(r)} />
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === 'subrecetas' && (
            <motion.div
              key="subrecetas"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-black">Sub-recetas</h2>
                  <p className="text-xs text-neutral-400">{subRecetas.length} preparaciones</p>
                </div>
                <button
                  onClick={() => { setSubEditing(undefined); setSubFormOpen(true); }}
                  className="flex items-center gap-1.5 bg-black text-white text-xs px-3 py-2 rounded-xl active:scale-95 transition-transform"
                >
                  <Plus size={13} strokeWidth={2} />
                  Nueva
                </button>
              </div>
              {/* Search bar */}
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 mb-4">
                <Search size={14} className="text-neutral-400 shrink-0" strokeWidth={1.75} />
                <input
                  value={searchSubrecetas}
                  onChange={e => setSearchSubrecetas(e.target.value)}
                  placeholder="Buscar sub-receta..."
                  className="flex-1 bg-transparent text-sm text-black outline-none placeholder-neutral-400"
                />
                {searchSubrecetas && (
                  <button onClick={() => setSearchSubrecetas('')} className="text-neutral-300 shrink-0">
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
              {(() => {
                const filtered = subRecetas.filter(s => s.nombre.toLowerCase().includes(searchSubrecetas.toLowerCase()));
                return filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ChefHat size={32} className="text-neutral-200 mb-3" strokeWidth={1} />
                    <p className="text-sm text-neutral-400">{searchSubrecetas ? 'Sin resultados' : 'Sin sub-recetas todavía'}</p>
                    <p className="text-xs text-neutral-300 mt-1">{searchSubrecetas ? 'Probá con otro término' : 'Las sub-recetas son preparaciones reutilizables'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map(s => (
                      <SubRecetaCard key={s.id} sub={s} onClick={() => openSubDetail(s)} />
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === 'foodcost' && (
            <motion.div
              key="foodcost"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
            >
              {!canViewCosts ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                    <Lock size={24} strokeWidth={1.5} className="text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Solo para administradores</p>
                    <p className="text-xs text-neutral-400 mt-1">Cambiá a perfil Admin para ver el Food Cost</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="text-lg font-medium text-black">Food Cost</h2>
                    <p className="text-xs text-neutral-400">Toca el precio de venta para editarlo</p>
                  </div>
                  {/* Search bar */}
                  <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 mb-4">
                    <Search size={14} className="text-neutral-400 shrink-0" strokeWidth={1.75} />
                    <input
                      value={searchFoodcost}
                      onChange={e => setSearchFoodcost(e.target.value)}
                      placeholder="Buscar receta..."
                      className="flex-1 bg-transparent text-sm text-black outline-none placeholder-neutral-400"
                    />
                    {searchFoodcost && (
                      <button onClick={() => setSearchFoodcost('')} className="text-neutral-300 shrink-0">
                        <X size={12} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                  {recetas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <TrendingUp size={32} className="text-neutral-200 mb-3" strokeWidth={1} />
                      <p className="text-sm text-neutral-400">Sin recetas para analizar</p>
                      <p className="text-xs text-neutral-300 mt-1">Creá recetas en el Recetario primero</p>
                    </div>
                  ) : (
                    <FoodCostView
                      recetas={recetas.filter(r => r.nombre.toLowerCase().includes(searchFoodcost.toLowerCase()))}
                      insumos={insumos}
                      subRecetas={subRecetas}
                      onUpdatePrecio={handleUpdatePrecio}
                      onOpenDetail={openRecetaDetail}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Forms */}
      <RecetaForm
        isOpen={recetaFormOpen}
        initial={recetaEditing}
        insumos={insumos}
        subRecetas={subRecetas}
        onSave={handleSaveReceta}
        onClose={() => setRecetaFormOpen(false)}
      />

      <SubRecetaForm
        isOpen={subFormOpen}
        initial={subEditing}
        insumos={insumos}
        subRecetas={subRecetas}
        onSave={handleSaveSubReceta}
        onClose={() => setSubFormOpen(false)}
      />

      {/* Detail views */}
      <RecetaDetailView
        receta={recetaDetail}
        isOpen={recetaDetailOpen}
        onClose={() => setRecetaDetailOpen(false)}
        onEdit={() => {
          setRecetaDetailOpen(false);
          setRecetaEditing(recetaDetail!);
          setRecetaFormOpen(true);
        }}
        showCosts={effectiveShowCosts}
        onToggleCosts={() => setShowCosts(v => !v)}
        insumos={insumos}
        subRecetas={subRecetas}
        canViewCosts={canViewCosts}
      />

      <SubRecetaDetailView
        sub={subDetail}
        isOpen={subDetailOpen}
        onClose={() => setSubDetailOpen(false)}
        onEdit={() => {
          setSubDetailOpen(false);
          setSubEditing(subDetail!);
          setSubFormOpen(true);
        }}
        insumos={insumos}
        subRecetas={subRecetas}
        showCosts={effectiveShowCosts}
        onToggleCosts={() => setShowCosts(v => !v)}
        canViewCosts={canViewCosts}
      />
    </div>
  );
};

export default RecetasTab;
