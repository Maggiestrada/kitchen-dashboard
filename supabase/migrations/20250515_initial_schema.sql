-- =====================================================
-- INSUMA KITCHEN — Schema inicial
-- =====================================================

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- =====================================================
-- NEGOCIO
-- =====================================================
create table if not exists public.negocio (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        text not null check (tipo in ('restaurante', 'local', 'delivery', 'otro')),
  pais        text not null,
  email       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================
-- USUARIOS
-- =====================================================
create table if not exists public.usuarios (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references public.negocio(id) on delete cascade,
  nombre      text not null,
  rol         text not null check (rol in ('admin', 'cocinero')),
  pin         text,          -- solo admins, 4 dígitos
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- =====================================================
-- PROVEEDORES
-- =====================================================
create table if not exists public.proveedores (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references public.negocio(id) on delete cascade,
  nombre      text not null,
  categoria   text,
  contacto    text,
  email       text,
  telefono    text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- =====================================================
-- INSUMOS (ingredientes + insumos de apoyo)
-- =====================================================
create table if not exists public.insumos (
  id               uuid primary key default gen_random_uuid(),
  negocio_id       uuid not null references public.negocio(id) on delete cascade,
  nombre           text not null,
  categoria        text not null default 'General',
  unidad           text not null check (unidad in ('kg', 'lt', 'u', 'paq', 'atado', 'otro')),
  costo_por_unidad numeric(10, 2),
  proveedor_id     uuid references public.proveedores(id) on delete set null,
  tipo             text not null check (tipo in ('ingrediente', 'apoyo')) default 'ingrediente',
  activo           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- =====================================================
-- RECETAS
-- =====================================================
create table if not exists public.recetas (
  id            uuid primary key default gen_random_uuid(),
  negocio_id    uuid not null references public.negocio(id) on delete cascade,
  nombre        text not null,
  categoria     text,
  porciones     int not null default 1,
  precio_venta  numeric(10, 2),
  tiempo_prep   int,            -- minutos
  ingredientes  jsonb not null default '[]',
  insumos_apoyo jsonb not null default '[]',
  notas         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =====================================================
-- PEDIDOS
-- =====================================================
create table if not exists public.pedidos (
  id                uuid primary key default gen_random_uuid(),
  negocio_id        uuid not null references public.negocio(id) on delete cascade,
  proveedor_nombre  text not null,
  proveedor_id      uuid references public.proveedores(id) on delete set null,
  estado            text not null check (estado in ('en_espera', 'en_camino', 'recibido', 'con_diferencias', 'pago_efectivo')) default 'en_espera',
  nota              text,
  creado_por        text,
  recepcionado_por  text,
  tiene_efectivo    boolean not null default false,
  alertas           jsonb,
  items             jsonb not null default '[]',
  total             numeric(10, 2),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- =====================================================
-- MENÚS DEL MES (Food Cost)
-- =====================================================
create table if not exists public.menus_mes (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references public.negocio(id) on delete cascade,
  label       text not null,
  receta_ids  uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- =====================================================
-- FUNCIÓN: updated_at automático
-- =====================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger negocio_updated_at
  before update on public.negocio
  for each row execute function public.handle_updated_at();

create trigger recetas_updated_at
  before update on public.recetas
  for each row execute function public.handle_updated_at();

create trigger pedidos_updated_at
  before update on public.pedidos
  for each row execute function public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Por ahora desactivado — se activa cuando se integre auth
-- =====================================================
alter table public.negocio      disable row level security;
alter table public.usuarios     disable row level security;
alter table public.proveedores  disable row level security;
alter table public.insumos      disable row level security;
alter table public.recetas      disable row level security;
alter table public.pedidos      disable row level security;
alter table public.menus_mes    disable row level security;

-- =====================================================
-- ÍNDICES
-- =====================================================
create index if not exists idx_usuarios_negocio     on public.usuarios(negocio_id);
create index if not exists idx_proveedores_negocio  on public.proveedores(negocio_id);
create index if not exists idx_insumos_negocio      on public.insumos(negocio_id);
create index if not exists idx_recetas_negocio      on public.recetas(negocio_id);
create index if not exists idx_pedidos_negocio      on public.pedidos(negocio_id);
create index if not exists idx_pedidos_estado       on public.pedidos(estado);
create index if not exists idx_pedidos_created      on public.pedidos(created_at desc);
create index if not exists idx_menus_mes_negocio    on public.menus_mes(negocio_id);
