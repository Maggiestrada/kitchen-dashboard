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
