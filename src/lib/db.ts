/**
 * db.ts — Helpers de Supabase para Insuma Kitchen
 *
 * Estrategia localStorage:
 *  - insuma_negocio_id   → UUID del negocio en Supabase (referencia local)
 *  - insuma_onboarding_ok → flag de UI ("1" = completado)
 *  Todo lo demás (negocio, usuarios, insumos, pedidos) vive en Supabase.
 */

import { supabase } from './supabase';

// ─── Tipos locales ────────────────────────────────────────────────────────────

export interface NegocioConfig {
  nombre: string;
  tipo: 'restaurante' | 'local' | 'delivery' | 'otro';
  pais: string;
  email: string;
}

export interface UsuarioConfig {
  id: string;
  nombre: string;
  rol: 'admin' | 'cocinero';
  pin?: string;
}

export interface InsumoCustom {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerKg: number;
  provider: string;
}

// ─── Seed de insumos ─────────────────────────────────────────────────────────

type UnidadInsumo = 'kg' | 'lt' | 'u' | 'paq' | 'atado' | 'otro';
type TipoInsumo = 'ingrediente' | 'apoyo';

export const SEED_INSUMOS: { nombre: string; categoria: string; unidad: UnidadInsumo; tipo: TipoInsumo }[] = [
  // ── Bebidas ────────────────────────────────────────────────────────────────
  { nombre: 'Litro de Vino Malbec - Torrontés', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Alto Sur Malbec', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Alto Sur Sauvignon Blanc', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Finca Sophenia Malbec', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Sophenia Estate Reserva Cabernet Sauvignon', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Finca Suárez Malbec', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'La Mantis Pet Nat Chardonnay', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Punta Flechas Malbec', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Zorzal Eggo Franco', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Zorzal T. Único Malbec', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'H.C. Estate Merlot', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'H.C. Marcus Sauvignon Blanc', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'H.C. Old Vineyard Rose Pinot Noir', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Humberto Canale Estate Cabernet Franc', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Humberto Canale Old Vineyard Pinot Noir', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Humberto Canale Old Vineyard Riesling', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Humberto Canale Old Vineyard Semillón', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'El Zorrito Chardonnay', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Luigi Bosca Blanc de Blancs', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Luigi Bosca de Sangre White Blend 750', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Luigi Bosca Rose SC', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Manos Negras Pinot Noir', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Rocamadre Criolla Blanca', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Rocamadre Pinot Noir', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Vuelá Sauvignon Blanc', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'La Grappe Criolla - Tempranillo', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Naranjas del Cielo', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Quimerino Corte Tintas', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Rosa Rosa', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Rocamadre Criolla Blanca 2024', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Rocamadre Rosado 2023', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Alisa Magnum 2022/2021', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Cru Gualtallary Malbec', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Gravas de San Pablo', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Tinto de San Pablo', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Coquena Rosado 2024', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Coquena Rosado de Malbec', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'SPY Torrontes', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Yacochuya Torrontés', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Laborum Garnach Single Vineyard 2023', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Rosa Rosa 2023', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Flora Pinot Noir', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Cara Sur Tinto Magnum 2015', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Punta de Flechas Malbec', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Turbio Cruza de Blancas 1500ml', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Eggo Franco Cabernet Franc', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Polígonos del Valle de Uco Albariño', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Polígonos del Valle de Uco Cabernet Franc', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Zorzal Terroir Único Malbec', categoria: 'Bebidas', unidad: 'u', tipo: 'ingrediente' },
  // ── Almacén ────────────────────────────────────────────────────────────────
  { nombre: 'Aceitunas griegas', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Aceitunas pote 1500g', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Aceitunas verdes con carozo', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Aceitunas negras griegas', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ají amarillo seco', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ají molido', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ají panka', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ajo en polvo', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ajo negro pack 40gr', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Almendras', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Anís estrellado', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Arroz largo fino Cañuelas 1kg', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Arroz aromático', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Arroz largo pulido', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Arroz dos hermanos', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Avellanas', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Azúcar mascabo', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Azúcar blanca', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Azúcar orgánica', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Bicarbonato de sodio', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Burrata', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Balde queso crema Milkaut 3.6kg', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Blue Coluy', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Bolsa Harina 0000 25kg', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Bolsa Harina 000 25kg', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Bolsa Harina integral 25kg', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Bolsa Harina de centeno 25kg', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Brie', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cacao República', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Café en grano moka 1kg', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Caja Lincoln', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Canela en rama', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cardamomo', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cebada perlada orgánica', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cebada perlada Quilmes', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cera de abeja', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cheddar inglés La Suerte', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Cheddar La Suerte', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Chile coreano', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Chocolate blanco 54% Callebaut', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Chocolate negro 70% Callebaut', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ciruelas pasas', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Clavo de olor', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Comino grano', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Coriandro', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cottage', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Crema 30% pote 360cc', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Crema 39% La Paulina', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Crema 39% Milkaut 5L', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Cuña Lincoln 3kg', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Doquin rouge', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Dulce de leche Colonial Serenísima', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Dulce de leche', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Enebro', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Farinha de mandioca', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Fécula de Mandioca Señor Sipan', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Fenogreco', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Frasco alcaparras 650gr', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Gelatina sin sabor', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Harina de arroz', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Harina de garbanzos', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Hoja shiso paquete', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Kummel', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Laurel', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Leche cruda bidón 10L', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Leche cruda', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Leche en polvo', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Leche entera Milkaut', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Leche entera Sancor', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Lentejas', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Lentejas coral', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Levadura paquete 10gr', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Levadura seca levex 10gr', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Maicena', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Maní crudo', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Manteca La Paulina', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Mascarpone artesanal', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Miel', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Mostaza amarilla grano', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Mostaza marrón grano', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Mostaza antigua', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Nueces mariposas', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Nuez moscada', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Nuez pecán', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Aceite de oliva bag in box Zuelo 2x5000ml', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Aceite girasol', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Aceite Miguel', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Almidón de maíz', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Orégano seco', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Paprika', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Pasas de uva rubias', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Penne rigatti Matarazzo', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Pilón manteca La Paulina', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Pimentón', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Pimienta en grano', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Pimienta Jamaica', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Pimienta Szechuan', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Polenta instantánea', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Polvo para hornear', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Porotos alubia', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Porotos negros', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Quartirolo', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Queso azul El Criollo 2.4kg', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Queso crema Milkaut', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Queso crema Juan Grande', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Queso feta', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Queso sardo Sancor', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Raclette La Suerte', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Regalis', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ricota Arrivata', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Sal de aquí', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Sal rosa', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Sal entrefina', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Sal fina', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Sal gruesa', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Sal fermentos', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Salsa de soja', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Salsa de soja sakura light', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Salsa de soja soy sa', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Semilla de amapola', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Semilla de girasol', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Semilla de hinojo', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Semilla de zapallo', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Semillas de amaranto', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Semillas de chía', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Semillas de lino', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Semolín', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Sésamo blanco', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Stracciatella Arrivata', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Suero', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Suero bidón 10L', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Tahina al Kanater', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Té rishi', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Tinta de calamar', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Tomate triturado', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Trigo sarraceno', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Vaina de vainilla', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Vinagre de arroz 750ml', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Vinagre de uva Miguel Mas 500ml', categoria: 'Almacén', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Vinagre de alcohol Menoyo', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Vinagre de manzana Menoyo', categoria: 'Almacén', unidad: 'lt', tipo: 'ingrediente' },
  { nombre: 'Yogurt neutro', categoria: 'Almacén', unidad: 'kg', tipo: 'ingrediente' },
  // ── Carnes ─────────────────────────────────────────────────────────────────
  { nombre: 'Bife Granja 3 costillas', categoria: 'Carnes', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Bife de chorizo Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Caracú Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Diezmillo de comisario Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Lengua Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Molleja de corazón Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Nalga Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ojo de bife Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Osobuco Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Rack Ribs Vacuno Granja', categoria: 'Carnes', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Bondiola de cerdo Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Churrasco de cerdo Granja', categoria: 'Carnes', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Secreto de cerdo Granja', categoria: 'Carnes', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Jamón de cuadril Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Lardo Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Nduja Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Pieza única Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Sobrasada Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cajón de huevos Granja', categoria: 'Carnes', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Huevos Granja', categoria: 'Carnes', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Maple de huevos Granja', categoria: 'Carnes', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Pollo congelado orgánico Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Pollo fresco orgánico Granja', categoria: 'Carnes', unidad: 'kg', tipo: 'ingrediente' },
  // ── Pescados ───────────────────────────────────────────────────────────────
  { nombre: 'Anchoas Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Boquerones Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Caballa Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Caja de Chernia Granja', categoria: 'Pescados', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Caja de Corvina Granja', categoria: 'Pescados', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Caja de Trucha Granja', categoria: 'Pescados', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Caja de Tubo de Calamar Granja', categoria: 'Pescados', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Calamar Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Chernia Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Chipirones Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Corvina Granja', categoria: 'Pescados', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Huevas de trucha Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Langostinos Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Morros Granja', categoria: 'Pescados', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Pulpo Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Raya Granja', categoria: 'Pescados', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Trucha Granja', categoria: 'Pescados', unidad: 'u', tipo: 'ingrediente' },
  // ── Verdulería ─────────────────────────────────────────────────────────────
  { nombre: 'Bananas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cajones de frutillas', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Limones', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Mandarinas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Manzanas Pink lady', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Manzanas verdes', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ajíes morrones', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ajíes españoles', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Akusai (col china)', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Alcauciles', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Apio nabo', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Arvejas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Atado de brotes', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de ciboulette', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de cilantro', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de eneldo', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de espárragos', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de espinacas', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de hojas de mostaza', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de kale', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de menta', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de mizuna', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de orégano', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de remolacha', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de rúcula', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de salvia', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de tomillo', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de verdeo', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de radicheta', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Atado de romero', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Batatas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Berenjenas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Bimi', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Brócolis', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Brocolini', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cebollas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cebollas moradas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Chauchas alubias', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Chauchas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Coliflores', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Cúrcuma fresca', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Endivias', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Grelos', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Hinojo', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Jalapeños rojos', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Jalapeños verdes', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Jengibre', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Kreines (rábano picante)', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Lechugas criollas', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Lechugas romanas', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Morrones rojos', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Nabos', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Papas negras', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Papas nuevas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Papines', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Pepinos', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Perejil', categoria: 'Verdulería', unidad: 'atado', tipo: 'ingrediente' },
  { nombre: 'Planta de apio', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Planta de lechuga mantecosa', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Planta de lechuga repollada', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Puerros', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Repollitos de Bruselas', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Ristra de ajo', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Zanahorias', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  { nombre: 'Zapallo ancho', categoria: 'Verdulería', unidad: 'u', tipo: 'ingrediente' },
  { nombre: 'Zucchinis', categoria: 'Verdulería', unidad: 'kg', tipo: 'ingrediente' },
  // ── Carbón y Leña (apoyo) ──────────────────────────────────────────────────
  { nombre: 'Carbón Kamado bolsa 9kg', categoria: 'Carbón y Leña', unidad: 'u', tipo: 'apoyo' },
  { nombre: 'Espinillo blanco', categoria: 'Carbón y Leña', unidad: 'kg', tipo: 'apoyo' },
  { nombre: 'Quebracho blanco', categoria: 'Carbón y Leña', unidad: 'kg', tipo: 'apoyo' },
  { nombre: 'Quebracho colorado', categoria: 'Carbón y Leña', unidad: 'kg', tipo: 'apoyo' },
  // ── Logística (apoyo) ──────────────────────────────────────────────────────
  { nombre: 'Logística', categoria: 'Logística', unidad: 'u', tipo: 'apoyo' },
  { nombre: 'Recarga de gas', categoria: 'Logística', unidad: 'u', tipo: 'apoyo' },
];

// ─── Seed de proveedores ──────────────────────────────────────────────────────

const SEED_PROVEEDORES = [
  { id: 'e8ccfe93', nombre: 'Zuccardi', categoria: 'Bebidas', telefono: '+5491165310391', contacto: 'Sergio / fernanda doll', email: 'sarregui@familiazuccardi.com' },
  { id: 'prov1', nombre: 'Fura', categoria: 'Carnes', telefono: '+5491156937934', contacto: 'Ariel', email: 'comprobantesfura@gmail.com' },
  { id: 'prov2', nombre: 'Santo berraco', categoria: 'Carnes', telefono: '+5491122506002', contacto: 'Santo berraco', email: 'santoberraco@gmail.com' },
  { id: 'prov3', nombre: 'Cocorokeen', categoria: 'Bebidas', telefono: '+5491170040501' },
  { id: 'prov4', nombre: 'Patricia Graffer', categoria: 'Verduras', telefono: '+5492226472711', contacto: 'Patricia Graffer' },
  { id: 'prov5', nombre: 'The grocery', categoria: 'Verduras', telefono: '+5491167083458', contacto: 'Daniel central', email: 'thegrocerypalermo@gmail.com' },
  { id: 'a4eb5955', nombre: '4 estaciones', categoria: 'Verduras', telefono: '+5491150496176', contacto: 'Pablo bonano', email: 'bolsonorganicoentucasa@gmail.com' },
  { id: 'prov6', nombre: 'Gabi verduleria', categoria: 'Verduras', telefono: '+5491136294534' },
  { id: 'prov7', nombre: 'Barrio chino', categoria: 'Verduras', telefono: '+5491140969494', contacto: 'Mari' },
  { id: 'prov8', nombre: 'Kaiken', categoria: 'Bebidas', telefono: '+5491167073332' },
  { id: 'prov9', nombre: 'Adrian huevos', categoria: 'Lácteos', telefono: '+5491165461043', contacto: 'Adrian Alejandro Cambón' },
  { id: 'prov10', nombre: 'Coppola', categoria: 'Bebidas', telefono: '+5491165462877', contacto: 'Nadia' },
  { id: 'prov11', nombre: 'Soleil', categoria: 'Almacén', telefono: '+5491128324242', contacto: 'Sol' },
  { id: 'prov12', nombre: 'Quilmes', categoria: 'Bebidas', telefono: '+5491135810054', contacto: 'Gonzalo casco' },
  { id: 'prov13', nombre: 'Criollo', categoria: 'Carnes', telefono: '+5491163512001', contacto: 'Juan Pablo' },
  { id: 'prov14', nombre: 'alyser', categoria: 'Otros', telefono: '+5491164872924', contacto: 'Belen' },
  { id: 'prov15', nombre: 'La chacrita', categoria: 'Carnes', telefono: '+5493468524428', contacto: 'La chacrita' },
  { id: 'prov16', nombre: 'Juan grande', categoria: 'Otros', telefono: '+5491160211545', contacto: 'Ignacio grande' },
  { id: 'prov17', nombre: 'la meson', categoria: 'Otros', telefono: '+5491155608565', contacto: 'La meson' },
  { id: 'prov18', nombre: 'arrivata', categoria: 'Verduras' },
  { id: 'prov19', nombre: 'ventigmilia', categoria: 'Otros', telefono: '+5492995573637', contacto: 'kiara', email: 'ventas@queseriaventimiglia.com.ar' },
  { id: 'prov20', nombre: 'molino cerillo', categoria: 'Almacén', telefono: '+5493875161190', contacto: 'Facundo' },
  { id: 'prov21', nombre: 'miguel simone', categoria: 'Carnes', contacto: 'casa grippo' },
  { id: 'prov22', nombre: 'Fer hara', categoria: 'Otros', contacto: 'Fernando hara' },
  { id: 'prov23', nombre: 'bapan', categoria: 'Almacén', telefono: '+5491132347280', contacto: 'Jose Ambuchástegui' },
  { id: 'prov24', nombre: 'Pampas rice', categoria: 'Almacén', telefono: '+5491132440055', contacto: 'Federico Fernandez' },
  { id: 'prov25', nombre: 'Cuervo', categoria: 'Carnes', telefono: '+5491140869149', contacto: 'Agustin chino' },
  { id: 'prov26', nombre: 'J.D fish art', categoria: 'Pescados', telefono: '+5491135484954', contacto: 'Jorge Dominguez' },
  { id: 'prov27', nombre: 'Pulpo patagonico', categoria: 'Pescados', telefono: '+5492804597670', contacto: 'Gonzalo Colipi' },
  { id: 'prov28', nombre: 'Hernan viva', categoria: 'Otros', telefono: '+5492234567446', contacto: 'Hernan' },
  { id: 'prov29', nombre: 'Gaby Leña', categoria: 'Otros', telefono: '+5491151340157', contacto: 'Gaby' },
  { id: 'prov30', nombre: 'kamado', categoria: 'Otros', telefono: '+5491158539717', contacto: 'luciana' },
  { id: 'prov31', nombre: 'JMS', categoria: 'Almacén', telefono: '+5491166797241', contacto: 'JMS' },
  { id: 'prov32', nombre: 'Moop', categoria: 'Almacén', telefono: '+5491169703452', contacto: 'Ann' },
  { id: 'prov33', nombre: 'Casa thames', categoria: 'Almacén', telefono: '+5491166541474', contacto: 'Greta' },
  { id: 'prov34', nombre: 'Morgade', categoria: 'Bebidas' },
  { id: 'prov35', nombre: 'Coca cola', categoria: 'Bebidas' },
  { id: 'prov36', nombre: 'AQA', categoria: 'Bebidas', telefono: '+5491133972317', contacto: 'Nicolas Portillo' },
  { id: 'prov37', nombre: 'Elephant Wines', categoria: 'Bebidas', telefono: '+5491140426066', contacto: 'Sebastián López' },
  { id: 'prov38', nombre: 'Jarilla Wines', categoria: 'Bebidas', telefono: '+5491141988049', contacto: 'Juan Ferrarotti' },
  { id: 'prov39', nombre: 'Verum Patagonia', categoria: 'Bebidas', telefono: '+5491150951600', contacto: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com' },
  { id: 'prov40', nombre: 'San Pedro de Yacochuya', categoria: 'Bebidas', telefono: '+5491150951600', contacto: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com' },
  { id: 'prov41', nombre: 'Establecimiento Humberto Canale', categoria: 'Bebidas', telefono: '+5491150951600', contacto: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com' },
  { id: 'prov42', nombre: 'El Garage de Aldo', categoria: 'Bebidas', telefono: '+5491125537053', contacto: 'Carolina Lopez Bueno' },
  { id: 'prov43', nombre: 'Rocamadre Wines', categoria: 'Bebidas', contacto: 'Juanfa Suares', email: 'vinosrocamadre@gmail.com' },
  { id: 'prov44', nombre: 'Casa de Uco', categoria: 'Bebidas', telefono: '+5491150951600', contacto: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com' },
  { id: 'prov45', nombre: 'El Porvenir', categoria: 'Bebidas', telefono: '+5491130391384', contacto: 'Daniel Davila' },
  { id: 'prov46', nombre: 'Catena Zapata', categoria: 'Bebidas', telefono: '+5491168840990', contacto: 'Patricia Haux' },
  { id: 'prov47', nombre: 'Grupo Avinea', categoria: 'Bebidas', telefono: '+5491156605268', contacto: 'Andrea Techera', email: 'andrea.techera@grupoavinea.com' },
  { id: 'prov48', nombre: 'Chacra', categoria: 'Bebidas', telefono: '+5492984415032', contacto: 'Rocio Morales' },
  { id: 'prov49', nombre: 'El Gallo Wines', categoria: 'Bebidas', telefono: '+5491150951600', contacto: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com' },
  { id: 'prov50', nombre: 'Vinandina', categoria: 'Bebidas', contacto: 'Vinandina' },
  { id: 'prov51', nombre: 'Punto', categoria: 'Otros', telefono: '+5491133578389', contacto: 'Alma Cabral' },
  { id: 'prov52', nombre: 'Grand Cru', categoria: 'Bebidas', telefono: '+5491152499975', contacto: 'Alberto Levi' },
  { id: 'prov53', nombre: 'Aurea', categoria: 'Bebidas', telefono: '+5491133578389', contacto: 'Alma Cabral' },
  { id: 'prov54', nombre: 'Vinicult', categoria: 'Bebidas', telefono: '+5491169012375', contacto: 'Rodrigo Calderon' },
  { id: 'prov55', nombre: 'Finca Sophenia', categoria: 'Bebidas', telefono: '+5491160479400', contacto: 'Eugenia Luka' },
  { id: 'prov56', nombre: 'Achaval Ferrer', categoria: 'Bebidas', telefono: '+5491150951600', contacto: 'Catalina Uriburu', email: 'uriburu.cata@gmail.com' },
];

// ─── Negocio ID helpers ───────────────────────────────────────────────────────

export function getNegocioId(): string | null {
  return localStorage.getItem('insuma_negocio_id');
}

function setNegocioId(id: string) {
  localStorage.setItem('insuma_negocio_id', id);
}

// ─── Onboarding: guardar negocio + usuarios en Supabase ──────────────────────

export async function guardarOnboarding(
  negocio: NegocioConfig,
  usuarios: UsuarioConfig[]
): Promise<{ negocioId: string }> {
  const negocioId = crypto.randomUUID();

  // Guardar siempre en localStorage como fuente de verdad local
  localStorage.setItem('insuma_negocio', JSON.stringify(negocio));
  localStorage.setItem('insuma_usuarios', JSON.stringify(usuarios));

  // Intentar guardar en Supabase (sin bloquear si falla)
  try {
    const { data: negocioData, error: negocioError } = await supabase
      .from('negocio')
      .insert({
        id: negocioId,
        nombre: negocio.nombre,
        tipo: negocio.tipo,
        pais: negocio.pais,
        email: negocio.email,
      })
      .select('id')
      .single();

    if (!negocioError && negocioData) {
      const remoteId = negocioData.id;

      const usuariosInsert = usuarios.map(u => ({
        id: u.id,
        negocio_id: remoteId,
        nombre: u.nombre,
        rol: u.rol,
        pin: u.pin ?? null,
        activo: true,
      }));

      await supabase.from('usuarios').insert(usuariosInsert);

      // Insertar proveedores seed
      const proveedoresInsert = SEED_PROVEEDORES.map(p => ({
        id: p.id,
        negocio_id: remoteId,
        nombre: p.nombre,
        categoria: p.categoria ?? null,
        contacto: (p as Record<string, unknown>).contacto as string ?? null,
        email: (p as Record<string, unknown>).email as string ?? null,
        telefono: (p as Record<string, unknown>).telefono as string ?? null,
        activo: true,
      }));
      await supabase.from('proveedores').insert(proveedoresInsert);

      // Insertar insumos seed
      const insumosInsert = SEED_INSUMOS.map(i => ({
        id: crypto.randomUUID(),
        negocio_id: remoteId,
        nombre: i.nombre,
        categoria: i.categoria,
        unidad: i.unidad,
        costo_por_unidad: 0,
        proveedor_id: null,
        tipo: i.tipo,
        activo: true,
      }));
      await supabase.from('insumos').insert(insumosInsert);

      setNegocioId(remoteId);
    } else {
      // Supabase no disponible — usar ID local
      setNegocioId(negocioId);
    }
  } catch {
    // Sin conexión — continuar con localStorage
    setNegocioId(negocioId);
  }

  localStorage.setItem('insuma_onboarding_ok', '1');
  return { negocioId };
}

// ─── Cargar negocio ───────────────────────────────────────────────────────────

export async function loadNegocio(): Promise<NegocioConfig | null> {
  // Intentar desde Supabase
  const negocioId = getNegocioId();
  if (negocioId) {
    try {
      const { data, error } = await supabase
        .from('negocio')
        .select('nombre, tipo, pais, email')
        .eq('id', negocioId)
        .single();
      if (!error && data) return data as NegocioConfig;
    } catch { /* fallback */ }
  }

  // Fallback a localStorage
  try {
    const local = localStorage.getItem('insuma_negocio');
    if (local) return JSON.parse(local) as NegocioConfig;
  } catch { /* ignore */ }

  return null;
}

// ─── Cargar usuarios ──────────────────────────────────────────────────────────

export async function loadUsuarios(): Promise<UsuarioConfig[]> {
  // Intentar desde Supabase
  const negocioId = getNegocioId();
  if (negocioId) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, rol, pin')
        .eq('negocio_id', negocioId)
        .eq('activo', true)
        .order('created_at');

      if (!error && data && data.length > 0) {
        return data.map(u => ({
          id: u.id,
          nombre: u.nombre,
          rol: u.rol as 'admin' | 'cocinero',
          pin: u.pin ?? undefined,
        }));
      }
    } catch { /* fallback */ }
  }

  // Fallback a localStorage
  try {
    const local = localStorage.getItem('insuma_usuarios');
    if (local) {
      const arr = JSON.parse(local);
      if (Array.isArray(arr) && arr.length > 0) return arr as UsuarioConfig[];
    }
  } catch { /* ignore */ }

  return [];
}

// ─── Insumos custom ───────────────────────────────────────────────────────────

export async function loadInsumos(): Promise<InsumoCustom[]> {
  const negocioId = getNegocioId();
  if (!negocioId) return [];

  try {
    const { data, error } = await supabase
      .from('insumos')
      .select('id, nombre, categoria, unidad, costo_por_unidad, proveedor_id')
      .eq('negocio_id', negocioId)
      .eq('activo', true)
      .order('created_at');

    if (!error && data && data.length > 0) {
      const result = data.map(i => ({
        id: i.id,
        name: i.nombre,
        category: i.categoria,
        unit: i.unidad,
        pricePerKg: i.costo_por_unidad ?? 0,
        provider: i.proveedor_id ?? '',
      }));
      localStorage.setItem('insuma_insumos', JSON.stringify(result));
      return result;
    }
  } catch { /* fallback */ }

  // Fallback a localStorage
  try {
    const local = localStorage.getItem('insuma_insumos');
    if (local) {
      const arr = JSON.parse(local);
      if (Array.isArray(arr) && arr.length > 0) return arr as InsumoCustom[];
    }
  } catch { /* ignore */ }

  return [];
}

export async function crearInsumo(insumo: InsumoCustom, tipo: 'ingrediente' | 'apoyo' = 'ingrediente'): Promise<InsumoCustom> {
  const negocioId = getNegocioId();
  if (!negocioId) throw new Error('No hay negocio activo');

  const { data, error } = await supabase
    .from('insumos')
    .insert({
      id: insumo.id,
      negocio_id: negocioId,
      nombre: insumo.name,
      categoria: insumo.category,
      unidad: insumo.unit as 'kg' | 'lt' | 'u' | 'paq' | 'atado' | 'otro',
      costo_por_unidad: insumo.pricePerKg,
      proveedor_id: insumo.provider || null,
      tipo,
      activo: true,
    })
    .select('id, nombre, categoria, unidad, costo_por_unidad, proveedor_id')
    .single();

  if (error || !data) throw new Error(`Error creando insumo: ${error?.message}`);

  const result: InsumoCustom = {
    id: data.id,
    name: data.nombre,
    category: data.categoria,
    unit: data.unidad,
    pricePerKg: data.costo_por_unidad ?? 0,
    provider: data.proveedor_id ?? '',
  };

  // Persist in localStorage as backup
  try {
    const local = localStorage.getItem('insuma_insumos');
    const arr: InsumoCustom[] = local ? JSON.parse(local) : [];
    arr.push(result);
    localStorage.setItem('insuma_insumos', JSON.stringify(arr));
  } catch { /* ignore */ }

  return result;
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export async function guardarPedido(pedido: {
  id: string;
  proveedorNombre: string;
  proveedorId?: string;
  estado: string;
  nota?: string;
  creadoPor?: string;
  items: unknown[];
  total?: number;
}): Promise<void> {
  const negocioId = getNegocioId();
  if (!negocioId) return;

  const { error } = await supabase.from('pedidos').insert({
    id: pedido.id,
    negocio_id: negocioId,
    proveedor_nombre: pedido.proveedorNombre,
    proveedor_id: pedido.proveedorId ?? null,
    estado: pedido.estado as 'en_espera',
    nota: pedido.nota ?? null,
    creado_por: pedido.creadoPor ?? null,
    items: pedido.items,
    total: pedido.total ?? null,
    tiene_efectivo: false,
    alertas: null,
  });

  if (error) console.error('Error guardando pedido:', error.message);
}

export async function actualizarPedido(id: string, cambios: {
  estado?: string;
  recepcionadoPor?: string;
  tieneEfectivo?: boolean;
  alertas?: unknown;
}): Promise<void> {
  const { error } = await supabase
    .from('pedidos')
    .update({
      ...(cambios.estado && { estado: cambios.estado }),
      ...(cambios.recepcionadoPor && { recepcionado_por: cambios.recepcionadoPor }),
      ...(cambios.tieneEfectivo !== undefined && { tiene_efectivo: cambios.tieneEfectivo }),
      ...(cambios.alertas !== undefined && { alertas: cambios.alertas }),
    })
    .eq('id', id);

  if (error) console.error('Error actualizando pedido:', error.message);
}
