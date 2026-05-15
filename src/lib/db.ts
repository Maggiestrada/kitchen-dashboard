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
  // 1. Insertar negocio
  const { data: negocioData, error: negocioError } = await supabase
    .from('negocio')
    .insert({
      id: crypto.randomUUID(),
      nombre: negocio.nombre,
      tipo: negocio.tipo,
      pais: negocio.pais,
      email: negocio.email,
    })
    .select('id')
    .single();

  if (negocioError || !negocioData) {
    throw new Error(`Error guardando negocio: ${negocioError?.message}`);
  }

  const negocioId = negocioData.id;

  // 2. Insertar usuarios
  const usuariosInsert = usuarios.map(u => ({
    id: u.id,
    negocio_id: negocioId,
    nombre: u.nombre,
    rol: u.rol,
    pin: u.pin ?? null,
    activo: true,
  }));

  const { error: usuariosError } = await supabase
    .from('usuarios')
    .insert(usuariosInsert);

  if (usuariosError) {
    throw new Error(`Error guardando usuarios: ${usuariosError.message}`);
  }

  // 3. Guardar referencia local
  setNegocioId(negocioId);
  localStorage.setItem('insuma_onboarding_ok', '1');

  return { negocioId };
}

// ─── Cargar negocio ───────────────────────────────────────────────────────────

export async function loadNegocio(): Promise<NegocioConfig | null> {
  const negocioId = getNegocioId();
  if (!negocioId) return null;

  const { data, error } = await supabase
    .from('negocio')
    .select('nombre, tipo, pais, email')
    .eq('id', negocioId)
    .single();

  if (error || !data) return null;
  return data as NegocioConfig;
}

// ─── Cargar usuarios ──────────────────────────────────────────────────────────

export async function loadUsuarios(): Promise<UsuarioConfig[]> {
  const negocioId = getNegocioId();
  if (!negocioId) return [];

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, pin')
    .eq('negocio_id', negocioId)
    .eq('activo', true)
    .order('created_at');

  if (error || !data) return [];
  return data.map(u => ({
    id: u.id,
    nombre: u.nombre,
    rol: u.rol as 'admin' | 'cocinero',
    pin: u.pin ?? undefined,
  }));
}

// ─── Insumos custom ───────────────────────────────────────────────────────────

export async function loadInsumos(): Promise<InsumoCustom[]> {
  const negocioId = getNegocioId();
  if (!negocioId) return [];

  const { data, error } = await supabase
    .from('insumos')
    .select('id, nombre, categoria, unidad, costo_por_unidad, proveedor_id')
    .eq('negocio_id', negocioId)
    .eq('activo', true)
    .order('created_at');

  if (error || !data) return [];

  return data.map(i => ({
    id: i.id,
    name: i.nombre,
    category: i.categoria,
    unit: i.unidad,
    pricePerKg: i.costo_por_unidad ?? 0,
    provider: i.proveedor_id ?? '',
  }));
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

  return {
    id: data.id,
    name: data.nombre,
    category: data.categoria,
    unit: data.unidad,
    pricePerKg: data.costo_por_unidad ?? 0,
    provider: data.proveedor_id ?? '',
  };
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
