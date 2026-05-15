import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, BarChart2, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthData {
  month: string;
  shortMonth: string;
  total: number;
  areas: AreaData;
}
interface AreaData {
  Carnes: AreaDetail;
  Verduras: AreaDetail;
  Bebidas: AreaDetail;
  Limpieza: AreaDetail;
  Almacén: AreaDetail;
}
interface AreaDetail {
  total: number;
  items: ItemDetail[];
}
interface ItemDetail {
  id: string;
  name: string;
  values: number[];
}
type AreaKey = keyof AreaData;

// ─── Mock Data ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MONTHS_DATA: MonthData[] = [];
const _MONTHS_DATA_UNUSED = [{
  month: 'Noviembre 2024',
  shortMonth: 'Nov',
  total: 187400,
  areas: {
    Carnes: {
      total: 62400,
      items: [{
        id: 'c1',
        name: 'Asado x kg',
        values: [8200, 9100, 7800]
      }, {
        id: 'c2',
        name: 'Pollo entero x kg',
        values: [6300, 5800, 7200]
      }, {
        id: 'c3',
        name: 'Lomo x kg',
        values: [14200, 15600, 13900]
      }, {
        id: 'c4',
        name: 'Vacío x kg',
        values: [9800, 10200, 9400]
      }, {
        id: 'c5',
        name: 'Cerdo costilla x kg',
        values: [5400, 4900, 6100]
      }]
    },
    Verduras: {
      total: 38200,
      items: [{
        id: 'v1',
        name: 'Tomate x kg',
        values: [3200, 3800, 4200]
      }, {
        id: 'v2',
        name: 'Lechuga x u',
        values: [1800, 2100, 1600]
      }, {
        id: 'v3',
        name: 'Cebolla x kg',
        values: [2400, 2200, 2600]
      }, {
        id: 'v4',
        name: 'Papa x kg',
        values: [4800, 5200, 4400]
      }, {
        id: 'v5',
        name: 'Zanahoria x kg',
        values: [1600, 1800, 1500]
      }]
    },
    Bebidas: {
      total: 31800,
      items: [{
        id: 'b1',
        name: 'Agua mineral x lt',
        values: [4200, 4800, 3900]
      }, {
        id: 'b2',
        name: 'Gaseosa x lt',
        values: [5600, 5200, 6100]
      }, {
        id: 'b3',
        name: 'Cerveza x lt',
        values: [7800, 8200, 7200]
      }, {
        id: 'b4',
        name: 'Vino x lt',
        values: [9400, 10200, 8800]
      }]
    },
    Limpieza: {
      total: 18600,
      items: [{
        id: 'l1',
        name: 'Detergente x lt',
        values: [2800, 3100, 2600]
      }, {
        id: 'l2',
        name: 'Desinfectante x lt',
        values: [3400, 3200, 3800]
      }, {
        id: 'l3',
        name: 'Guantes x par',
        values: [1200, 1400, 1100]
      }, {
        id: 'l4',
        name: 'Trapos de piso x u',
        values: [900, 800, 1000]
      }]
    },
    Almacén: {
      total: 36400,
      items: [{
        id: 'a1',
        name: 'Harina 000 x kg',
        values: [8400, 9200, 7800]
      }, {
        id: 'a2',
        name: 'Aceite girasol x lt',
        values: [6200, 5800, 6800]
      }, {
        id: 'a3',
        name: 'Azúcar x kg',
        values: [2400, 2600, 2200]
      }, {
        id: 'a4',
        name: 'Sal x kg',
        values: [800, 900, 750]
      }, {
        id: 'a5',
        name: 'Arroz x kg',
        values: [3800, 4200, 3600]
      }]
    }
  }
}, {
  month: 'Diciembre 2024',
  shortMonth: 'Dic',
  total: 214600,
  areas: {
    Carnes: {
      total: 72600,
      items: [{
        id: 'c1',
        name: 'Asado x kg',
        values: [8200, 9100, 7800]
      }, {
        id: 'c2',
        name: 'Pollo entero x kg',
        values: [6300, 5800, 7200]
      }, {
        id: 'c3',
        name: 'Lomo x kg',
        values: [14200, 15600, 13900]
      }, {
        id: 'c4',
        name: 'Vacío x kg',
        values: [9800, 10200, 9400]
      }, {
        id: 'c5',
        name: 'Cerdo costilla x kg',
        values: [5400, 4900, 6100]
      }]
    },
    Verduras: {
      total: 42800,
      items: [{
        id: 'v1',
        name: 'Tomate x kg',
        values: [3200, 3800, 4200]
      }, {
        id: 'v2',
        name: 'Lechuga x u',
        values: [1800, 2100, 1600]
      }, {
        id: 'v3',
        name: 'Cebolla x kg',
        values: [2400, 2200, 2600]
      }, {
        id: 'v4',
        name: 'Papa x kg',
        values: [4800, 5200, 4400]
      }, {
        id: 'v5',
        name: 'Zanahoria x kg',
        values: [1600, 1800, 1500]
      }]
    },
    Bebidas: {
      total: 36200,
      items: [{
        id: 'b1',
        name: 'Agua mineral x lt',
        values: [4200, 4800, 3900]
      }, {
        id: 'b2',
        name: 'Gaseosa x lt',
        values: [5600, 5200, 6100]
      }, {
        id: 'b3',
        name: 'Cerveza x lt',
        values: [7800, 8200, 7200]
      }, {
        id: 'b4',
        name: 'Vino x lt',
        values: [9400, 10200, 8800]
      }]
    },
    Limpieza: {
      total: 20400,
      items: [{
        id: 'l1',
        name: 'Detergente x lt',
        values: [2800, 3100, 2600]
      }, {
        id: 'l2',
        name: 'Desinfectante x lt',
        values: [3400, 3200, 3800]
      }, {
        id: 'l3',
        name: 'Guantes x par',
        values: [1200, 1400, 1100]
      }, {
        id: 'l4',
        name: 'Trapos de piso x u',
        values: [900, 800, 1000]
      }]
    },
    Almacén: {
      total: 42600,
      items: [{
        id: 'a1',
        name: 'Harina 000 x kg',
        values: [8400, 9200, 7800]
      }, {
        id: 'a2',
        name: 'Aceite girasol x lt',
        values: [6200, 5800, 6800]
      }, {
        id: 'a3',
        name: 'Azúcar x kg',
        values: [2400, 2600, 2200]
      }, {
        id: 'a4',
        name: 'Sal x kg',
        values: [800, 900, 750]
      }, {
        id: 'a5',
        name: 'Arroz x kg',
        values: [3800, 4200, 3600]
      }]
    }
  }
}, {
  month: 'Enero 2025',
  shortMonth: 'Ene',
  total: 198200,
  areas: {
    Carnes: {
      total: 68400,
      items: [{
        id: 'c1',
        name: 'Asado x kg',
        values: [8200, 9100, 7800]
      }, {
        id: 'c2',
        name: 'Pollo entero x kg',
        values: [6300, 5800, 7200]
      }, {
        id: 'c3',
        name: 'Lomo x kg',
        values: [14200, 15600, 13900]
      }, {
        id: 'c4',
        name: 'Vacío x kg',
        values: [9800, 10200, 9400]
      }, {
        id: 'c5',
        name: 'Cerdo costilla x kg',
        values: [5400, 4900, 6100]
      }]
    },
    Verduras: {
      total: 35600,
      items: [{
        id: 'v1',
        name: 'Tomate x kg',
        values: [3200, 3800, 4200]
      }, {
        id: 'v2',
        name: 'Lechuga x u',
        values: [1800, 2100, 1600]
      }, {
        id: 'v3',
        name: 'Cebolla x kg',
        values: [2400, 2200, 2600]
      }, {
        id: 'v4',
        name: 'Papa x kg',
        values: [4800, 5200, 4400]
      }, {
        id: 'v5',
        name: 'Zanahoria x kg',
        values: [1600, 1800, 1500]
      }]
    },
    Bebidas: {
      total: 29400,
      items: [{
        id: 'b1',
        name: 'Agua mineral x lt',
        values: [4200, 4800, 3900]
      }, {
        id: 'b2',
        name: 'Gaseosa x lt',
        values: [5600, 5200, 6100]
      }, {
        id: 'b3',
        name: 'Cerveza x lt',
        values: [7800, 8200, 7200]
      }, {
        id: 'b4',
        name: 'Vino x lt',
        values: [9400, 10200, 8800]
      }]
    },
    Limpieza: {
      total: 17200,
      items: [{
        id: 'l1',
        name: 'Detergente x lt',
        values: [2800, 3100, 2600]
      }, {
        id: 'l2',
        name: 'Desinfectante x lt',
        values: [3400, 3200, 3800]
      }, {
        id: 'l3',
        name: 'Guantes x par',
        values: [1200, 1400, 1100]
      }, {
        id: 'l4',
        name: 'Trapos de piso x u',
        values: [900, 800, 1000]
      }]
    },
    Almacén: {
      total: 47600,
      items: [{
        id: 'a1',
        name: 'Harina 000 x kg',
        values: [8400, 9200, 7800]
      }, {
        id: 'a2',
        name: 'Aceite girasol x lt',
        values: [6200, 5800, 6800]
      }, {
        id: 'a3',
        name: 'Azúcar x kg',
        values: [2400, 2600, 2200]
      }, {
        id: 'a4',
        name: 'Sal x kg',
        values: [800, 900, 750]
      }, {
        id: 'a5',
        name: 'Arroz x kg',
        values: [3800, 4200, 3600]
      }]
    }
  }
}];
// ─── Area colors ──────────────────────────────────────────────────────────────
const AREA_COLORS: Record<AreaKey, {
  primary: string;
  light: string;
  text: string;
}> = {
  Carnes: {
    primary: '#EF4444',
    light: '#FEF2F2',
    text: '#991B1B'
  },
  Verduras: {
    primary: '#22C55E',
    light: '#F0FDF4',
    text: '#14532D'
  },
  Bebidas: {
    primary: '#3B82F6',
    light: '#EFF6FF',
    text: '#1E3A8A'
  },
  Limpieza: {
    primary: '#F59E0B',
    light: '#FFFBEB',
    text: '#78350F'
  },
  Almacén: {
    primary: '#8B5CF6',
    light: '#F5F3FF',
    text: '#4C1D95'
  }
};
const AREA_KEYS: AreaKey[] = ['Carnes', 'Verduras', 'Bebidas', 'Limpieza', 'Almacén'];
const formatMoney = (n: number) => '$' + n.toLocaleString('es-AR', {
  maximumFractionDigits: 0
});
const formatMoneyShort = (n: number) => {
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'k';
  return '$' + n;
};

// ─── Item Drill-down Sheet ────────────────────────────────────────────────────

const ItemDrillSheet = ({
  area,
  item,
  isOpen,
  onClose
}: {
  area: AreaKey | null;
  item: ItemDetail | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!area || !item) return null;
  const colors = AREA_COLORS[area];
  const chartData = MONTHS_DATA.map((m, idx) => ({
    month: m.shortMonth,
    value: item.values[idx] ?? 0
  }));
  const maxVal = Math.max(...item.values);
  const minVal = Math.min(...item.values);
  return <AnimatePresence>
      {isOpen && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} className="fixed inset-0 z-[90] flex flex-col justify-end" style={{
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
      }} className="relative flex flex-col bg-white rounded-t-3xl overflow-hidden max-h-[80vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="px-5 pt-2 pb-4 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{
                backgroundColor: colors.primary
              }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{
                color: colors.primary
              }}>{area}</span>
                </div>
                <h2 className="text-base font-black text-black leading-tight">{item.name}</h2>
                <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Últimos 3 meses</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                <span className="text-lg font-medium leading-none">×</span>
              </button>
            </div>
            <div className="h-px bg-neutral-100 mx-5 shrink-0" />

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-5">
              {/* Chart */}
              <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={28}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
                    fontSize: 11,
                    fontWeight: 700,
                    fill: '#9CA3AF'
                  }} />
                      <YAxis hide />
                      <CartesianGrid vertical={false} stroke="#F3F4F6" />
                      <Tooltip formatter={(value: number) => [formatMoney(value), 'Gasto']} contentStyle={{
                    border: 'none',
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: 11,
                    fontWeight: 700
                  }} cursor={{
                    fill: 'rgba(0,0,0,0.04)',
                    radius: 6
                  }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? colors.primary : colors.primary + '60'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Month comparison */}
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Comparación mes a mes</p>
                <div className="space-y-2">
                  {MONTHS_DATA.map((m, idx) => {
                const val = item.values[idx] ?? 0;
                const prevVal = idx > 0 ? item.values[idx - 1] ?? 0 : null;
                const diff = prevVal !== null ? val - prevVal : null;
                const pct = prevVal !== null && prevVal > 0 ? ((val - prevVal) / prevVal * 100).toFixed(1) : null;
                const isUp = diff !== null && diff > 0;
                const isDown = diff !== null && diff < 0;
                return <div key={m.shortMonth} className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black" style={{
                      backgroundColor: idx === MONTHS_DATA.length - 1 ? colors.primary : colors.light,
                      color: idx === MONTHS_DATA.length - 1 ? 'white' : colors.text
                    }}>
                            <span>{m.shortMonth.slice(0, 1)}</span>
                          </div>
                          <div>
                            <p className="text-xs font-black text-neutral-800">{m.shortMonth}</p>
                            <p className="text-[10px] text-neutral-400 font-medium">{m.month.split(' ')[1]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {pct !== null && <div className={`flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${isUp ? 'bg-red-50 text-red-600' : isDown ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}>
                              {isUp ? <TrendingUp size={8} strokeWidth={3} /> : isDown ? <TrendingDown size={8} strokeWidth={3} /> : <Minus size={8} strokeWidth={3} />}
                              <span>{isUp ? '+' : ''}{pct}%</span>
                            </div>}
                          <p className="text-sm font-black text-black tabular-nums">{formatMoney(val)}</p>
                        </div>
                      </div>;
              })}
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-3">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Máximo</p>
                  <p className="text-base font-black text-black tabular-nums">{formatMoney(maxVal)}</p>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-3">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Mínimo</p>
                  <p className="text-base font-black text-black tabular-nums">{formatMoney(minVal)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};

// ─── Area Detail Sheet ────────────────────────────────────────────────────────

const AreaDetailSheet = ({
  area,
  isOpen,
  onClose
}: {
  area: AreaKey | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null);
  if (!area) return null;
  const colors = AREA_COLORS[area];

  // Aggregate items across months
  const allItems = MONTHS_DATA[0].areas[area].items;
  const chartData = MONTHS_DATA.map(m => ({
    month: m.shortMonth,
    value: m.areas[area].total
  }));
  const totals = MONTHS_DATA.map(m => m.areas[area].total);
  const lastTotal = totals[totals.length - 1];
  const prevTotal = totals[totals.length - 2];
  const diff = lastTotal - prevTotal;
  const pct = prevTotal > 0 ? (diff / prevTotal * 100).toFixed(1) : '0';
  const isUp = diff > 0;
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
      }} className="relative flex flex-col bg-white rounded-t-3xl overflow-hidden max-h-[92vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="px-5 pt-2 pb-4 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{
              backgroundColor: colors.primary
            }}>
                  <Package size={18} strokeWidth={2} color="white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-black leading-tight">{area}</h2>
                  <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Desglose por insumo · 3 meses</p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                <span className="text-lg font-medium leading-none">×</span>
              </button>
            </div>
            <div className="h-px bg-neutral-100 mx-5 shrink-0" />

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-5">
              {/* Trend card */}
              <div className="flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Mes actual</p>
                  <p className="text-3xl font-black text-black tabular-nums leading-none">{formatMoney(lastTotal)}</p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-black ${isUp ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {isUp ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                  <span>{isUp ? '+' : ''}{pct}%</span>
                </div>
              </div>

              {/* 3-month chart */}
              <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Evolución 3 meses</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={36}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
                    fontSize: 11,
                    fontWeight: 700,
                    fill: '#9CA3AF'
                  }} />
                      <YAxis hide />
                      <CartesianGrid vertical={false} stroke="#F3F4F6" />
                      <Tooltip formatter={(value: number) => [formatMoney(value), area]} contentStyle={{
                    border: 'none',
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: 11,
                    fontWeight: 700
                  }} cursor={{
                    fill: 'rgba(0,0,0,0.04)',
                    radius: 6
                  }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? colors.primary : colors.primary + '55'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Items breakdown */}
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                  Insumos · tocá para ver detalle
                </p>
                <div className="space-y-2">
                  {allItems.map(item => {
                const latestVal = item.values[item.values.length - 1] ?? 0;
                const prevVal = item.values[item.values.length - 2] ?? 0;
                const itemDiff = latestVal - prevVal;
                const itemPct = prevVal > 0 ? (itemDiff / prevVal * 100).toFixed(0) : '0';
                const itemIsUp = itemDiff > 0;
                const barPct = lastTotal > 0 ? Math.round(latestVal / lastTotal * 100) : 0;
                return <button key={item.id} onClick={() => setSelectedItem(item)} className="w-full text-left bg-white border border-neutral-100 rounded-xl px-4 py-3 active:scale-[0.985] transition-transform">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-xs font-black text-neutral-800 flex-1 min-w-0 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${itemIsUp ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {itemIsUp ? <TrendingUp size={8} strokeWidth={3} /> : <TrendingDown size={8} strokeWidth={3} />}
                              <span>{itemIsUp ? '+' : ''}{itemPct}%</span>
                            </div>
                            <p className="text-sm font-black text-black tabular-nums">{formatMoney(latestVal)}</p>
                            <ChevronRight size={12} className="text-neutral-300" strokeWidth={2} />
                          </div>
                        </div>
                        {/* Mini bar showing 3 months */}
                        <div className="flex items-end gap-1 h-6">
                          {item.values.map((val, idx) => {
                      const h = Math.round(val / maxItemVal(item) * 100);
                      return <div key={idx} className="flex-1 rounded-sm transition-all" style={{
                        height: `${h}%`,
                        backgroundColor: idx === item.values.length - 1 ? colors.primary : colors.primary + '40',
                        minHeight: 4
                      }} />;
                    })}
                        </div>
                        <div className="flex justify-between mt-1">
                          {MONTHS_DATA.map(m => <p key={m.shortMonth} className="text-[8px] font-bold text-neutral-300 flex-1 text-center">{m.shortMonth}</p>)}
                        </div>
                      </button>;
              })}
                </div>
              </div>
            </div>
          </motion.div>

          <ItemDrillSheet area={area} item={selectedItem} isOpen={selectedItem !== null} onClose={() => setSelectedItem(null)} />
        </motion.div>}
    </AnimatePresence>;
};
const maxItemVal = (item: ItemDetail) => Math.max(...item.values, 1);

// ─── Main MetricasTab ─────────────────────────────────────────────────────────

export const MetricasTab = () => {
  return <motion.div key="tab-metricas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-24">
    {/* Header */}
    <div className="mb-6">
      <h2 className="text-xl font-black text-black leading-tight">Métricas</h2>
      <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Gastos por categoría</p>
    </div>

    {/* Empty state */}
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
        <BarChart2 size={28} strokeWidth={1.5} className="text-neutral-400" />
      </div>
      <p className="text-base font-black text-neutral-800 leading-tight mb-1">Sin datos todavía</p>
      <p className="text-sm text-neutral-400 font-medium max-w-[220px] leading-relaxed">
        Los gastos por área aparecerán aquí cuando tengas pedidos registrados.
      </p>
    </div>
  </motion.div>;
};