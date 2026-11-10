import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, BarChart2, Package, Search, X, ChefHat, ArrowUp, ArrowDown, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatoVendido {
  name: string;
  porciones: number;
  categoria: string;
}
interface MonthData {
  month: string;
  shortMonth: string;
  total: number;
  areas: AreaData;
  platos?: PlatoVendido[];
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

const MONTHS_DATA: MonthData[] = [{
  month: 'Septiembre 2025',
  shortMonth: 'Sep',
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
  },
  platos: [
    { name: 'Pollo asado', porciones: 148, categoria: 'Principales' },
    { name: 'Pasta al tomate', porciones: 132, categoria: 'Pastas' },
    { name: 'Milanesa napolitana', porciones: 118, categoria: 'Principales' },
    { name: 'Crema pastelera', porciones: 96, categoria: 'Postres' },
    { name: 'Risotto de hongos', porciones: 72, categoria: 'Pastas' },
    { name: 'Ensalada césar', porciones: 54, categoria: 'Entradas' },
    { name: 'Sopa de verduras', porciones: 28, categoria: 'Entradas' },
  ]
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
  },
  platos: [
    { name: 'Pollo asado', porciones: 162, categoria: 'Principales' },
    { name: 'Milanesa napolitana', porciones: 141, categoria: 'Principales' },
    { name: 'Pasta al tomate', porciones: 108, categoria: 'Pastas' },
    { name: 'Crema pastelera', porciones: 88, categoria: 'Postres' },
    { name: 'Risotto de hongos', porciones: 65, categoria: 'Pastas' },
    { name: 'Ensalada césar', porciones: 42, categoria: 'Entradas' },
    { name: 'Sopa de verduras', porciones: 21, categoria: 'Entradas' },
  ]
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
  },
  platos: [
    { name: 'Pollo asado', porciones: 134, categoria: 'Principales' },
    { name: 'Pasta al tomate', porciones: 119, categoria: 'Pastas' },
    { name: 'Milanesa napolitana', porciones: 104, categoria: 'Principales' },
    { name: 'Crema pastelera', porciones: 78, categoria: 'Postres' },
    { name: 'Risotto de hongos', porciones: 59, categoria: 'Pastas' },
    { name: 'Ensalada césar', porciones: 38, categoria: 'Entradas' },
    { name: 'Sopa de verduras', porciones: 19, categoria: 'Entradas' },
  ]
}, {
  month: 'Octubre 2025',
  shortMonth: 'Oct',
  total: 214600,
  areas: {
    Carnes: { total: 72600, items: [
      { id: 'c1', name: 'Asado x kg', values: [8200, 9100, 10400] },
      { id: 'c2', name: 'Pollo entero x kg', values: [6300, 5800, 7800] },
      { id: 'c3', name: 'Lomo x kg', values: [14200, 15600, 18200] },
      { id: 'c4', name: 'Vacío x kg', values: [9800, 10200, 12400] },
      { id: 'c5', name: 'Cerdo costilla x kg', values: [5400, 4900, 6800] },
    ]},
    Verduras: { total: 44800, items: [
      { id: 'v1', name: 'Tomate x kg', values: [3200, 3800, 5200] },
      { id: 'v2', name: 'Lechuga x u', values: [1800, 2100, 1900] },
      { id: 'v3', name: 'Cebolla x kg', values: [2400, 2200, 3100] },
      { id: 'v4', name: 'Papa x kg', values: [4800, 5200, 6400] },
      { id: 'v5', name: 'Zanahoria x kg', values: [1600, 1800, 1900] },
    ]},
    Bebidas: { total: 36800, items: [
      { id: 'b1', name: 'Agua mineral x lt', values: [4200, 4800, 5100] },
      { id: 'b2', name: 'Gaseosa x lt', values: [5600, 5200, 7200] },
      { id: 'b3', name: 'Cerveza x lt', values: [7800, 8200, 9400] },
      { id: 'b4', name: 'Vino x lt', values: [9400, 10200, 11800] },
    ]},
    Limpieza: { total: 20800, items: [
      { id: 'l1', name: 'Detergente x lt', values: [2800, 3100, 3200] },
      { id: 'l2', name: 'Desinfectante x lt', values: [3400, 3200, 4100] },
      { id: 'l3', name: 'Guantes x par', values: [1200, 1400, 1600] },
      { id: 'l4', name: 'Trapos de piso x u', values: [900, 800, 1100] },
    ]},
    Almacén: { total: 39600, items: [
      { id: 'a1', name: 'Harina 000 x kg', values: [8400, 9200, 10200] },
      { id: 'a2', name: 'Aceite girasol x lt', values: [6200, 5800, 7400] },
      { id: 'a3', name: 'Azúcar x kg', values: [2400, 2600, 2800] },
      { id: 'a4', name: 'Sal x kg', values: [800, 900, 950] },
      { id: 'a5', name: 'Arroz x kg', values: [3800, 4200, 4600] },
    ]},
  },
  platos: [
    { name: 'Pollo asado', porciones: 176, categoria: 'Principales' },
    { name: 'Milanesa napolitana', porciones: 158, categoria: 'Principales' },
    { name: 'Pasta al tomate', porciones: 143, categoria: 'Pastas' },
    { name: 'Crema pastelera', porciones: 112, categoria: 'Postres' },
    { name: 'Risotto de hongos', porciones: 84, categoria: 'Pastas' },
    { name: 'Ensalada césar', porciones: 47, categoria: 'Entradas' },
    { name: 'Sopa de verduras', porciones: 24, categoria: 'Entradas' },
  ]
}, {
  month: 'Noviembre 2025',
  shortMonth: 'Nov',
  total: 198200,
  areas: {
    Carnes: { total: 68400, items: [
      { id: 'c1', name: 'Asado x kg', values: [9100, 10400, 9800] },
      { id: 'c2', name: 'Pollo entero x kg', values: [5800, 7800, 7200] },
      { id: 'c3', name: 'Lomo x kg', values: [15600, 18200, 17400] },
      { id: 'c4', name: 'Vacío x kg', values: [10200, 12400, 11200] },
      { id: 'c5', name: 'Cerdo costilla x kg', values: [4900, 6800, 5800] },
    ]},
    Verduras: { total: 38600, items: [
      { id: 'v1', name: 'Tomate x kg', values: [3800, 5200, 4400] },
      { id: 'v2', name: 'Lechuga x u', values: [2100, 1900, 1800] },
      { id: 'v3', name: 'Cebolla x kg', values: [2200, 3100, 2800] },
      { id: 'v4', name: 'Papa x kg', values: [5200, 6400, 5600] },
      { id: 'v5', name: 'Zanahoria x kg', values: [1800, 1900, 1600] },
    ]},
    Bebidas: { total: 32200, items: [
      { id: 'b1', name: 'Agua mineral x lt', values: [4800, 5100, 4600] },
      { id: 'b2', name: 'Gaseosa x lt', values: [5200, 7200, 6400] },
      { id: 'b3', name: 'Cerveza x lt', values: [8200, 9400, 8600] },
      { id: 'b4', name: 'Vino x lt', values: [10200, 11800, 10400] },
    ]},
    Limpieza: { total: 18400, items: [
      { id: 'l1', name: 'Detergente x lt', values: [3100, 3200, 2900] },
      { id: 'l2', name: 'Desinfectante x lt', values: [3200, 4100, 3600] },
      { id: 'l3', name: 'Guantes x par', values: [1400, 1600, 1400] },
      { id: 'l4', name: 'Trapos de piso x u', values: [800, 1100, 900] },
    ]},
    Almacén: { total: 40600, items: [
      { id: 'a1', name: 'Harina 000 x kg', values: [9200, 10200, 10800] },
      { id: 'a2', name: 'Aceite girasol x lt', values: [5800, 7400, 7200] },
      { id: 'a3', name: 'Azúcar x kg', values: [2600, 2800, 2600] },
      { id: 'a4', name: 'Sal x kg', values: [900, 950, 900] },
      { id: 'a5', name: 'Arroz x kg', values: [4200, 4600, 4600] },
    ]},
  },
  platos: [
    { name: 'Pollo asado', porciones: 189, categoria: 'Principales' },
    { name: 'Milanesa napolitana', porciones: 164, categoria: 'Principales' },
    { name: 'Pasta al tomate', porciones: 151, categoria: 'Pastas' },
    { name: 'Crema pastelera', porciones: 118, categoria: 'Postres' },
    { name: 'Risotto de hongos', porciones: 91, categoria: 'Pastas' },
    { name: 'Ensalada césar', porciones: 52, categoria: 'Entradas' },
    { name: 'Sopa de verduras', porciones: 22, categoria: 'Entradas' },
  ]
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
                      <Tooltip formatter={((value: number) => [formatMoney(value ?? 0), 'Gasto']) as any} contentStyle={{
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
                      <Tooltip formatter={((value: number) => [formatMoney(value ?? 0), area]) as any} contentStyle={{
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

// ─── POS Upload Section ───────────────────────────────────────────────────────

interface POSRow { plato: string; porciones: number; ventaTotal: number; costoEstimado: number; margen: number; }

const POS_DEMO_ROWS: POSRow[] = [
  { plato: 'Pollo asado',          porciones: 189, ventaTotal: 284_000, costoEstimado: 134_000, margen: 52.8 },
  { plato: 'Milanesa napolitana',  porciones: 164, ventaTotal: 263_000, costoEstimado: 149_000, margen: 43.3 },
  { plato: 'Pasta al tomate',      porciones: 151, ventaTotal: 198_000, costoEstimado: 87_000,  margen: 56.1 },
  { plato: 'Crema pastelera',      porciones: 118, ventaTotal: 112_000, costoEstimado: 48_000,  margen: 57.1 },
  { plato: 'Risotto de hongos',    porciones: 91,  ventaTotal: 182_000, costoEstimado: 103_000, margen: 43.4 },
  { plato: 'Ensalada césar',       porciones: 52,  ventaTotal: 78_000,  costoEstimado: 29_000,  margen: 62.8 },
  { plato: 'Sopa de verduras',     porciones: 22,  ventaTotal: 28_000,  costoEstimado: 14_000,  margen: 50.0 },
];

const POSUploadSection = () => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setStatus('processing');
    setTimeout(() => setStatus('done'), 1800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const totalVenta = POS_DEMO_ROWS.reduce((s, r) => s + r.ventaTotal, 0);
  const totalCosto = POS_DEMO_ROWS.reduce((s, r) => s + r.costoEstimado, 0);
  const margenGlobal = totalVenta > 0 ? ((totalVenta - totalCosto) / totalVenta * 100).toFixed(1) : '0';

  return (
    <div>
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Cruce con POS</p>

      {status === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-neutral-200 rounded-2xl px-4 py-8 flex flex-col items-center gap-3 cursor-pointer active:scale-[0.985] transition-transform bg-neutral-50"
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center">
            <Upload size={20} className="text-neutral-400" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-neutral-700">Subir export del POS</p>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">PDF o Excel de Fudo, Lightspeed, Restoo…</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-neutral-400 bg-neutral-200 px-2 py-0.5 rounded-full">.PDF</span>
            <span className="text-[9px] font-bold text-neutral-400 bg-neutral-200 px-2 py-0.5 rounded-full">.XLSX</span>
            <span className="text-[9px] font-bold text-neutral-400 bg-neutral-200 px-2 py-0.5 rounded-full">.CSV</span>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.xlsx,.csv,.xls" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>
      )}

      {status === 'processing' && (
        <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-6 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
            <RefreshCw size={18} className="text-neutral-500 animate-spin" strokeWidth={2} />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-neutral-800">Procesando…</p>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{fileName}</p>
          </div>
          <p className="text-[10px] text-neutral-300 font-medium">Cruzando ventas con costos de insumos</p>
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-3">
          {/* File tag */}
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            <CheckCircle2 size={13} className="text-green-500 shrink-0" strokeWidth={2} />
            <p className="text-xs font-bold text-green-800 flex-1 truncate">{fileName}</p>
            <span className="text-[9px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full uppercase">⚡ Simulado</span>
            <button onClick={() => { setStatus('idle'); setFileName(''); }} className="text-neutral-400 active:opacity-60">
              <X size={12} strokeWidth={2} />
            </button>
          </div>

          {/* Global KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-2 py-2.5 text-center">
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Venta</p>
              <p className="text-xs font-black text-black tabular-nums">{formatMoneyShort(totalVenta)}</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-2 py-2.5 text-center">
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Costo</p>
              <p className="text-xs font-black text-black tabular-nums">{formatMoneyShort(totalCosto)}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl px-2 py-2.5 text-center">
              <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-0.5">Margen</p>
              <p className="text-xs font-black text-green-700 tabular-nums">{margenGlobal}%</p>
            </div>
          </div>

          {/* Per-dish table */}
          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-neutral-50 grid grid-cols-4 gap-1">
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest col-span-2">Plato</p>
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest text-right">Venta</p>
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest text-right">Margen</p>
            </div>
            {POS_DEMO_ROWS.map(row => (
              <div key={row.plato} className="px-4 py-2.5 border-b border-neutral-50 last:border-0 grid grid-cols-4 gap-1 items-center">
                <div className="col-span-2 min-w-0">
                  <p className="text-xs font-bold text-neutral-800 truncate">{row.plato}</p>
                  <p className="text-[9px] text-neutral-400 font-medium">{row.porciones} porc.</p>
                </div>
                <p className="text-xs font-black text-black tabular-nums text-right">{formatMoneyShort(row.ventaTotal)}</p>
                <div className="flex justify-end">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full tabular-nums ${row.margen >= 50 ? 'bg-green-50 text-green-700' : row.margen >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                    {row.margen}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Alert low margin */}
          {POS_DEMO_ROWS.some(r => r.margen < 45) && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[11px] font-medium text-amber-700 leading-snug">
                {POS_DEMO_ROWS.filter(r => r.margen < 45).map(r => r.plato).join(', ')} tienen margen bajo — revisá costos de insumos.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Plato Drill Sheet ────────────────────────────────────────────────────────

const PlatoDrillSheet = ({
  plato,
  isOpen,
  onClose,
}: {
  plato: PlatoVendido | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!plato) return null;
  const color = '#38BDF8';
  const colorLight = '#F0F9FF';

  const chartData = MONTHS_DATA.map(m => {
    const found = m.platos?.find(p => p.name === plato.name);
    return { month: m.shortMonth, value: found?.porciones ?? 0 };
  });
  const values = chartData.map(d => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values.filter(v => v > 0));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex flex-col justify-end" style={{ maxWidth: 448, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative flex flex-col bg-white rounded-t-3xl overflow-hidden max-h-[80vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="px-5 pt-2 pb-4 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{plato.categoria}</span>
                </div>
                <h2 className="text-base font-black text-black leading-tight">{plato.name}</h2>
                <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Porciones vendidas · últimos meses</p>
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
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} />
                      <YAxis hide />
                      <CartesianGrid vertical={false} stroke="#F3F4F6" />
                      <Tooltip
                        formatter={((value: number) => [value + ' porciones', plato.name]) as any}
                        contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 700 }}
                        cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={i === chartData.length - 1 ? color : color + '60'} />
                        ))}
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
                    const val = chartData[idx]?.value ?? 0;
                    const prevVal = idx > 0 ? (chartData[idx - 1]?.value ?? 0) : null;
                    const diff = prevVal !== null ? val - prevVal : null;
                    const pct = prevVal !== null && prevVal > 0 ? ((val - prevVal) / prevVal * 100).toFixed(1) : null;
                    const isUp = diff !== null && diff > 0;
                    const isDown = diff !== null && diff < 0;
                    return (
                      <div key={m.shortMonth} className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                            style={{ backgroundColor: idx === MONTHS_DATA.length - 1 ? color : colorLight, color: idx === MONTHS_DATA.length - 1 ? 'white' : color }}>
                            <span>{m.shortMonth.slice(0, 1)}</span>
                          </div>
                          <div>
                            <p className="text-xs font-black text-neutral-800">{m.shortMonth}</p>
                            <p className="text-[10px] text-neutral-400 font-medium">{m.month.split(' ')[1]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {pct !== null && (
                            <div className={`flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${isUp ? 'bg-green-50 text-green-600' : isDown ? 'bg-red-50 text-red-500' : 'bg-neutral-100 text-neutral-500'}`}>
                              {isUp ? <TrendingUp size={8} strokeWidth={3} /> : isDown ? <TrendingDown size={8} strokeWidth={3} /> : <Minus size={8} strokeWidth={3} />}
                              <span>{isUp ? '+' : ''}{pct}%</span>
                            </div>
                          )}
                          <p className="text-sm font-black text-black tabular-nums">{val}</p>
                          <p className="text-[10px] text-neutral-400 font-medium">porc.</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-3">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Máximo</p>
                  <p className="text-base font-black text-black tabular-nums">{maxVal} <span className="text-[10px] font-medium text-neutral-400">porc.</span></p>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-3">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Mínimo</p>
                  <p className="text-base font-black text-black tabular-nums">{minVal} <span className="text-[10px] font-medium text-neutral-400">porc.</span></p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Main MetricasTab ─────────────────────────────────────────────────────────

export const MetricasTab = () => {
  const [monthIdx, setMonthIdx] = useState(MONTHS_DATA.length - 1);
  const [selectedArea, setSelectedArea] = useState<AreaKey | null>(null);
  const [selectedPlato, setSelectedPlato] = useState<PlatoVendido | null>(null);
  const [search, setSearch] = useState('');
  const [expandedMonthDetail, setExpandedMonthDetail] = useState<number | null>(null);
  const month = MONTHS_DATA[monthIdx];

  const prevMonth = monthIdx > 0 ? MONTHS_DATA[monthIdx - 1] : null;
  const totalDiff = prevMonth ? month.total - prevMonth.total : 0;
  const totalPct = prevMonth && prevMonth.total > 0 ? (totalDiff / prevMonth.total * 100).toFixed(1) : null;
  const totalIsUp = totalDiff > 0;

  const allTotals = MONTHS_DATA.map(m => m.total);
  const avg3 = allTotals.reduce((s, v) => s + v, 0) / allTotals.length;

  const searchLower = search.toLowerCase();

  // Filter area keys by search
  const filteredAreas = AREA_KEYS.filter(area => {
    if (!search) return true;
    if (area.toLowerCase().includes(searchLower)) return true;
    return month.areas[area].items.some(it => it.name.toLowerCase().includes(searchLower));
  });

  // Top insumos across all areas for selected month
  const allInsumos = AREA_KEYS.flatMap(area =>
    month.areas[area].items.map(item => ({
      name: item.name,
      area,
      value: item.values[item.values.length - 1] ?? 0,
    }))
  ).sort((a, b) => b.value - a.value);
  const filteredInsumos = search
    ? allInsumos.filter(i => i.name.toLowerCase().includes(searchLower) || i.area.toLowerCase().includes(searchLower))
    : allInsumos.slice(0, 5);

  // Platos vendidos for selected month
  const platos = month.platos ?? [];
  const sortedPlatos = [...platos].sort((a, b) => b.porciones - a.porciones);
  const filteredPlatos = search
    ? sortedPlatos.filter(p => p.name.toLowerCase().includes(searchLower) || p.categoria.toLowerCase().includes(searchLower))
    : sortedPlatos;
  const maxPorciones = sortedPlatos[0]?.porciones ?? 1;

  const CATEGORIA_COLORS: Record<string, string> = {
    Principales: '#38BDF8', Pastas: '#38BDF8', Postres: '#38BDF8', Entradas: '#38BDF8',
  };

  return (
    <motion.div key="tab-metricas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-black leading-tight">Métricas</h2>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Gastos por categoría</p>
        </div>
        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Datos de muestra</span>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" strokeWidth={2} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar categoría, insumo o plato…"
          className="w-full pl-9 pr-9 py-2.5 bg-neutral-100 rounded-xl text-sm font-medium text-black placeholder-neutral-400 outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-neutral-400" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Month selector */}
      {!search && (
        <div className="flex bg-neutral-100 rounded-xl p-0.5">
          {MONTHS_DATA.map((m, i) => (
            <button
              key={m.shortMonth}
              onClick={() => setMonthIdx(i)}
              className={`flex-1 py-2.5 rounded-[10px] text-xs font-black transition-all ${i === monthIdx ? 'bg-white shadow-sm text-black' : 'text-neutral-400'}`}
            >
              {m.shortMonth}
            </button>
          ))}
        </div>
      )}

      {!search && (
        <>
          {/* KPI total */}
          <div className="bg-neutral-50 border border-neutral-100 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Total gastado</p>
              <p className="text-3xl font-black text-black tabular-nums leading-none">{formatMoney(month.total)}</p>
              {totalPct !== null && (
                <p className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 ${totalIsUp ? 'text-red-500' : 'text-emerald-600'}`}>
                  {totalIsUp ? <TrendingUp size={11} strokeWidth={2.5} /> : <TrendingDown size={11} strokeWidth={2.5} />}
                  {totalIsUp ? '+' : ''}{totalPct}% vs {prevMonth?.shortMonth}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Prom. 3 meses</p>
              <p className="text-lg font-black text-neutral-500 tabular-nums">{formatMoneyShort(Math.round(avg3))}</p>
            </div>
          </div>

          {/* 3-month trend chart — tap a bar to expand detail */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-4">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Evolución · tocá el mes para ver detalle</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MONTHS_DATA.map((m, i) => ({ month: m.shortMonth, value: m.total, idx: i }))}
                  barSize={40}
                  onClick={(data: any) => {
                    if (data?.activePayload?.[0]) {
                      const i = (data.activePayload[0].payload as { idx: number }).idx;
                      setMonthIdx(i);
                      setExpandedMonthDetail(expandedMonthDetail === i ? null : i);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} />
                  <YAxis hide />
                  <CartesianGrid vertical={false} stroke="#F3F4F6" />
                  <Tooltip
                    formatter={((value: number) => [formatMoney(value ?? 0), 'Total']) as any}
                    contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 700 }}
                    cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {MONTHS_DATA.map((m, i) => (
                      <Cell key={i} fill={i === monthIdx ? '#171717' : '#D1D5DB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Expanded month detail */}
            <AnimatePresence>
              {expandedMonthDetail !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-neutral-100 mt-3">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">{MONTHS_DATA[expandedMonthDetail].month}</p>
                    <div className="space-y-1.5">
                      {AREA_KEYS.map(area => {
                        const areaData = MONTHS_DATA[expandedMonthDetail].areas[area];
                        const colors = AREA_COLORS[area];
                        const pct = MONTHS_DATA[expandedMonthDetail].total > 0
                          ? (areaData.total / MONTHS_DATA[expandedMonthDetail].total * 100).toFixed(0)
                          : '0';
                        return (
                          <div key={area} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors.primary }} />
                            <p className="text-xs font-bold text-neutral-700 w-20 shrink-0">{area}</p>
                            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors.primary }} />
                            </div>
                            <p className="text-xs font-black text-black tabular-nums shrink-0">{formatMoneyShort(areaData.total)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Area breakdown */}
      {filteredAreas.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Por categoría · tocá para detallar</p>
          <div className="space-y-2">
            {filteredAreas.map(area => {
              const areaData = month.areas[area];
              const prevAreaData = prevMonth?.areas[area];
              const diff = prevAreaData ? areaData.total - prevAreaData.total : 0;
              const pct = prevAreaData && prevAreaData.total > 0 ? (diff / prevAreaData.total * 100).toFixed(0) : null;
              const isUp = diff > 0;
              const colors = AREA_COLORS[area];
              const pctOfTotal = month.total > 0 ? (areaData.total / month.total * 100) : 0;
              return (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className="w-full text-left bg-white border border-neutral-100 rounded-2xl px-4 py-3.5 active:scale-[0.985] transition-transform"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: colors.light }}>
                        <Package size={13} style={{ color: colors.primary }} strokeWidth={2.5} />
                      </div>
                      <p className="text-sm font-black text-black">{area}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {pct !== null && (
                        <div className={`flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${isUp ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          {isUp ? <TrendingUp size={8} strokeWidth={3} /> : <TrendingDown size={8} strokeWidth={3} />}
                          <span>{isUp ? '+' : ''}{pct}%</span>
                        </div>
                      )}
                      <p className="text-sm font-black text-black tabular-nums">{formatMoney(areaData.total)}</p>
                      <ChevronRight size={14} className="text-neutral-300" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pctOfTotal}%`, backgroundColor: colors.primary }} />
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium mt-1">{pctOfTotal.toFixed(0)}% del total</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top insumos por gasto */}
      {filteredInsumos.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
            {search ? 'Insumos encontrados' : 'Top 5 insumos · más gastado'}
          </p>
          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden divide-y divide-neutral-50">
            {filteredInsumos.map((ins, idx) => {
              const colors = AREA_COLORS[ins.area as AreaKey];
              const barPct = allInsumos[0]?.value > 0 ? (ins.value / allInsumos[0].value * 100) : 0;
              return (
                <div key={ins.name} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    {!search && (
                      <span className="text-[10px] font-black text-neutral-300 w-4 shrink-0">{idx + 1}</span>
                    )}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-neutral-800 truncate">{ins.name}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: colors.light, color: colors.text }}>{ins.area}</span>
                      </div>
                      <p className="text-sm font-black text-black tabular-nums shrink-0">{formatMoney(ins.value)}</p>
                    </div>
                  </div>
                  <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: colors.primary }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platos vendidos */}
      {filteredPlatos.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Platos vendidos</p>
          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden divide-y divide-neutral-50">
            {filteredPlatos.map((plato, idx) => {
              const color = CATEGORIA_COLORS[plato.categoria] ?? '#9CA3AF';
              const barPct = (plato.porciones / maxPorciones) * 100;
              const isTop = idx === 0 && !search;
              const isLast = idx === filteredPlatos.length - 1 && !search;
              return (
                <button key={plato.name} onClick={() => setSelectedPlato(plato)} className="w-full text-left px-4 py-3 active:scale-[0.985] transition-transform">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isTop && <ArrowUp size={11} className="text-emerald-500 shrink-0" strokeWidth={3} />}
                      {isLast && <ArrowDown size={11} className="text-red-400 shrink-0" strokeWidth={3} />}
                      {!isTop && !isLast && <ChefHat size={11} style={{ color }} strokeWidth={2} className="shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-xs font-black text-neutral-800 truncate">{plato.name}</p>
                        <span className="text-[9px] font-bold" style={{ color }}>{plato.categoria}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-black tabular-nums">{plato.porciones}</p>
                        <p className="text-[9px] text-neutral-400 font-medium">porciones</p>
                      </div>
                      <ChevronRight size={12} className="text-neutral-300" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, backgroundColor: color }} />
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-neutral-300 font-medium mt-1.5 text-center">
            ↑ más vendido · ↓ menos vendido
          </p>
        </div>
      )}

      {/* POS Upload */}
      {!search && <POSUploadSection />}

      <AreaDetailSheet
        area={selectedArea}
        isOpen={selectedArea !== null}
        onClose={() => setSelectedArea(null)}
      />
      <PlatoDrillSheet
        plato={selectedPlato}
        isOpen={selectedPlato !== null}
        onClose={() => setSelectedPlato(null)}
      />
    </motion.div>
  );
};