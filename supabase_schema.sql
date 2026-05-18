-- ============================================================
-- INSUMA Kitchen Dashboard — Supabase Schema
-- Run this in the Supabase SQL Editor (project > SQL Editor)
-- ============================================================

-- Enable UUID extension (already enabled in new projects)
create extension if not exists "pgcrypto";

-- ─── negocio ──────────────────────────────────────────────────────────────────
create table if not exists public.negocio (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        text not null check (tipo in ('restaurante','local','delivery','otro')),
  pais        text not null default 'Argentina',
  email       text,
  created_at  timestamptz not null default now()
);

-- ─── usuarios ─────────────────────────────────────────────────────────────────
create table if not exists public.usuarios (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references public.negocio(id) on delete cascade,
  nombre      text not null,
  rol         text not null check (rol in ('admin','cocinero')),
  pin         text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_usuarios_negocio on public.usuarios(negocio_id);

-- ─── proveedores ──────────────────────────────────────────────────────────────
create table if not exists public.proveedores (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references public.negocio(id) on delete cascade,
  nombre      text not null,
  categoria   text,
  contacto    text,
  email       text,
  telefono    text,
  nombre_ventas text,
  plazo_pago  text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_proveedores_negocio on public.proveedores(negocio_id);

-- ─── insumos ──────────────────────────────────────────────────────────────────
create table if not exists public.insumos (
  id               uuid primary key default gen_random_uuid(),
  negocio_id       uuid not null references public.negocio(id) on delete cascade,
  nombre           text not null,
  categoria        text not null,
  unidad           text not null check (unidad in ('kg','lt','u','paq','atado','otro')),
  costo_por_unidad numeric(12,4) not null default 0,
  proveedor_id     uuid references public.proveedores(id) on delete set null,
  tipo             text not null check (tipo in ('ingrediente','apoyo')) default 'ingrediente',
  activo           boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_insumos_negocio   on public.insumos(negocio_id);
create index if not exists idx_insumos_categoria on public.insumos(negocio_id, categoria);

-- ─── pedidos ──────────────────────────────────────────────────────────────────
create table if not exists public.pedidos (
  id                uuid primary key default gen_random_uuid(),
  negocio_id        uuid not null references public.negocio(id) on delete cascade,
  proveedor_nombre  text not null,
  proveedor_id      uuid references public.proveedores(id) on delete set null,
  estado            text not null check (estado in ('en_espera','recepcionado','pagado','cancelado')) default 'en_espera',
  nota              text,
  creado_por        text,
  recepcionado_por  text,
  items             jsonb not null default '[]',
  total             numeric(12,2),
  tiene_efectivo    boolean not null default false,
  alertas           jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_pedidos_negocio on public.pedidos(negocio_id);
create index if not exists idx_pedidos_estado  on public.pedidos(negocio_id, estado);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pedidos_updated_at
  before update on public.pedidos
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- All tables: only the owning negocio can read/write its own rows.
-- We use anon key from the client — policy checks negocio_id matches a claim.
-- For a simple single-tenant setup, we allow full access via anon key and
-- rely on negocio_id scoping in app code. Enable RLS but allow all for now;
-- tighten with auth when multi-tenant auth is added.

alter table public.negocio    enable row level security;
alter table public.usuarios   enable row level security;
alter table public.proveedores enable row level security;
alter table public.insumos    enable row level security;
alter table public.pedidos    enable row level security;

-- Permissive policies (anon key — app enforces negocio_id scoping)
create policy "anon full access negocio"     on public.negocio     for all using (true) with check (true);
create policy "anon full access usuarios"    on public.usuarios    for all using (true) with check (true);
create policy "anon full access proveedores" on public.proveedores for all using (true) with check (true);
create policy "anon full access insumos"     on public.insumos     for all using (true) with check (true);
create policy "anon full access pedidos"     on public.pedidos     for all using (true) with check (true);
