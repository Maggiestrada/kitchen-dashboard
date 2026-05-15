import React, { useState, useMemo } from 'react';
import { X, Package, Flame, ChevronDown, Search, Plus, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Insumo {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerKg: number;
  provider: string;
}

const INGREDIENTE_CATEGORIES = ['Carnes', 'Verduras', 'Lácteos', 'Almacén', 'Pescados', 'Bebidas'];
const UNIT_OPTIONS = ['kg', 'lt', 'u', 'paq', 'atado', 'docena', 'sobre', 'otro'];

const CATEGORY_COLOR: Record<string, string> = {
  Carnes: '#ef4444',
  Verduras: '#16a34a',
  Lácteos: '#0ea5e9',
  Almacén: '#D97706',
  Pescados: '#0891b2',
  Bebidas: '#7c3aed',
  Descartables: '#f97316',
};

interface NuevoInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsumoCreated: (insumo: Insumo) => void;
  catalogInsumos: Insumo[];
  customInsumos: Insumo[];
}

type SheetView = 'catalog' | 'create';

const CreateForm: React.FC<{
  onBack: () => void;
  onSave: (insumo: Insumo) => void;
}> = ({ onBack, onSave }) => {
  const [tipo, setTipo] = useState<'ingrediente' | 'apoyo'>('ingrediente');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(INGREDIENTE_CATEGORIES[0]);
  const [unit, setUnit] = useState('kg');
  const [proveedor, setProveedor] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showCategoriaPicker, setShowCategoriaPicker] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    if (!proveedor.trim()) { setError('El proveedor es requerido'); return; }

    const newInsumo: Insumo = {
      id: `custom-${Date.now()}`,
      name: nombre.trim(),
      category: tipo === 'apoyo' ? 'Descartables' : categoria,
      unit,
      pricePerKg: 0,
      provider: proveedor.trim(),
    };
    onSave(newInsumo);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform"
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        <div>
          <h2 className="text-base font-medium text-black">Nuevo insumo</h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">El costo se actualiza con las compras</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
        {/* Tipo toggle */}
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Tipo</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTipo('ingrediente')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border transition-all active:scale-[0.98] ${tipo === 'ingrediente' ? 'bg-black border-black' : 'bg-white border-neutral-200'}`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${tipo === 'ingrediente' ? 'bg-white/10' : 'bg-neutral-100'}`}>
                <Package size={14} strokeWidth={1.75} className={tipo === 'ingrediente' ? 'text-white' : 'text-neutral-500'} />
              </div>
              <div className="text-left">
                <p className={`text-xs font-medium ${tipo === 'ingrediente' ? 'text-white' : 'text-black'}`}>Ingrediente</p>
                <p className={`text-[10px] ${tipo === 'ingrediente' ? 'text-white/60' : 'text-neutral-400'}`}>Materias primas</p>
              </div>
            </button>
            <button
              onClick={() => setTipo('apoyo')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border transition-all active:scale-[0.98] ${tipo === 'apoyo' ? 'bg-orange-500 border-orange-500' : 'bg-white border-neutral-200'}`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${tipo === 'apoyo' ? 'bg-white/20' : 'bg-orange-100'}`}>
                <Flame size={14} strokeWidth={1.75} className={tipo === 'apoyo' ? 'text-white' : 'text-orange-500'} />
              </div>
              <div className="text-left">
                <p className={`text-xs font-medium ${tipo === 'apoyo' ? 'text-white' : 'text-black'}`}>De apoyo</p>
                <p className={`text-[10px] ${tipo === 'apoyo' ? 'text-white/70' : 'text-neutral-400'}`}>Leña, film, bolsas…</p>
              </div>
            </button>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Nombre</p>
          <input
            type="text"
            value={nombre}
            onChange={e => { setNombre(e.target.value); setError(''); }}
            placeholder={tipo === 'apoyo' ? 'Ej: Bolsa de vacío, Leña…' : 'Ej: Pollo entero, Espinaca…'}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-sm text-black outline-none placeholder-neutral-400 focus:border-neutral-400 transition-colors"
          />
        </div>

        {/* Categoría (solo para ingredientes) */}
        {tipo === 'ingrediente' && (
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Categoría</p>
            <button
              onClick={() => setShowCategoriaPicker(v => !v)}
              className="w-full flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 active:scale-[0.99] transition-transform"
            >
              <span className="text-sm text-black">{categoria}</span>
              <ChevronDown size={14} className={`text-neutral-400 transition-transform ${showCategoriaPicker ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showCategoriaPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1.5 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                    {INGREDIENTE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setCategoria(cat); setShowCategoriaPicker(false); }}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-neutral-50 last:border-0 transition-colors ${categoria === cat ? 'bg-black text-white' : 'text-black active:bg-neutral-50'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Unidad */}
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Unidad de medida</p>
          <button
            onClick={() => setShowUnitPicker(v => !v)}
            className="w-full flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 active:scale-[0.99] transition-transform"
          >
            <span className="text-sm text-black">{unit}</span>
            <ChevronDown size={14} className={`text-neutral-400 transition-transform ${showUnitPicker ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showUnitPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                  {UNIT_OPTIONS.map(u => (
                    <button
                      key={u}
                      onClick={() => { setUnit(u); setShowUnitPicker(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-neutral-50 last:border-0 transition-colors ${unit === u ? 'bg-black text-white' : 'text-black active:bg-neutral-50'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Proveedor (requerido) */}
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Proveedor</p>
          <input
            type="text"
            value={proveedor}
            onChange={e => { setProveedor(e.target.value); setError(''); }}
            placeholder="Nombre del proveedor…"
            className={`w-full bg-neutral-50 border rounded-xl px-3.5 py-3 text-sm text-black outline-none placeholder-neutral-400 focus:border-neutral-400 transition-colors ${error && !proveedor.trim() ? 'border-red-300' : 'border-neutral-200'}`}
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        <button
          onClick={handleSave}
          className="w-full bg-black text-white rounded-2xl py-4 text-sm font-medium active:scale-[0.98] transition-transform"
        >
          Guardar insumo
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
};

export const NuevoInsumoModal: React.FC<NuevoInsumoModalProps> = ({
  isOpen,
  onClose,
  onInsumoCreated,
  catalogInsumos,
  customInsumos,
}) => {
  const [view, setView] = useState<SheetView>('catalog');
  const [search, setSearch] = useState('');

  const allInsumos = useMemo(() => [...catalogInsumos, ...customInsumos], [catalogInsumos, customInsumos]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allInsumos;
    return allInsumos.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.provider.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }, [allInsumos, search]);

  const handleClose = () => {
    setView('catalog');
    setSearch('');
    onClose();
  };

  const handleCreated = (insumo: Insumo) => {
    onInsumoCreated(insumo);
    setView('catalog');
    setSearch('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 pb-safe flex flex-col"
            style={{ maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            <AnimatePresence mode="wait">
              {view === 'catalog' ? (
                <motion.div
                  key="catalog"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
                    <div>
                      <h2 className="text-base font-medium text-black">Insumos</h2>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{allInsumos.length} insumos en el catálogo</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setView('create')}
                        className="flex items-center gap-1.5 bg-black text-white rounded-xl px-3 py-2 text-xs font-medium active:scale-95 transition-transform"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        Agregar
                      </button>
                      <button onClick={handleClose} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                        <X size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="px-5 pt-3 pb-2 shrink-0">
                    <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-2.5">
                      <Search size={14} className="text-neutral-400 shrink-0" strokeWidth={2} />
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o proveedor…"
                        className="flex-1 bg-transparent text-sm text-black outline-none placeholder-neutral-400"
                      />
                      {search && (
                        <button onClick={() => setSearch('')} className="text-neutral-400 active:scale-90">
                          <X size={13} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto px-5 pb-6">
                    {filtered.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-neutral-400">Sin resultados</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filtered.map(ins => {
                          const color = CATEGORY_COLOR[ins.category] ?? '#6B7280';
                          const isCustom = ins.id.startsWith('custom-');
                          return (
                            <div key={ins.id} className="flex items-center gap-3 py-3 border-b border-neutral-50 last:border-0">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: color + '18' }}
                              >
                                {ins.category === 'Descartables'
                                  ? <Flame size={14} strokeWidth={1.75} style={{ color }} />
                                  : <Package size={14} strokeWidth={1.75} style={{ color }} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm text-black font-medium truncate">{ins.name}</p>
                                  {isCustom && (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-700 rounded px-1 py-0.5 shrink-0">nuevo</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-400 truncate">{ins.provider} · {ins.unit}</p>
                              </div>
                              <div className="text-right shrink-0">
                                {ins.pricePerKg > 0 ? (
                                  <p className="text-xs font-medium text-black tabular-nums">
                                    ${ins.pricePerKg.toLocaleString('es-AR')}/{ins.unit}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-neutral-400">Sin precio</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  <CreateForm onBack={() => setView('catalog')} onSave={handleCreated} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
