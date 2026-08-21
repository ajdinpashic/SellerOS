-- SellerOS — 0001: core schema
-- Multi-tenant tables for the SellerOS marketplace seller tool.
-- Tenant isolation is enforced at the RLS layer (see 0002_rls.sql).
-- All monetary values are NUMERIC — never floating point.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Businesses & membership
-- ─────────────────────────────────────────────────────────────

create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 2 and 200),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create table public.business_members (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('owner', 'admin', 'staff')),
  created_at  timestamptz not null default now(),
  unique (business_id, user_id)
);

create index business_members_user_idx on public.business_members(user_id);

-- ─────────────────────────────────────────────────────────────
-- Profiles (auth-owned; credentials live in auth.users only)
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row whenever a Supabase Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Products (catalog; soft-deleted so order history stays intact)
-- ─────────────────────────────────────────────────────────────

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  sku           text not null check (length(trim(sku)) > 0),
  description   text not null default '',
  category      text not null default '',
  price         numeric(12, 2) not null check (price >= 0),
  cost          numeric(12, 2) not null default 0 check (cost >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  channels      text[] not null default '{webshop}'
                check (cardinality(channels) > 0 and channels <@ array['olx', 'instagram', 'facebook', 'webshop']),
  image_url     text,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- SKU uniqueness is per business — never global.
  unique (business_id, sku)
);

create index products_business_idx on public.products(business_id);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Inventory (stock is owned by the inventory_items row; the
-- products row keeps no stock so there is a single source of truth)
-- ─────────────────────────────────────────────────────────────

create table public.inventory_items (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id  uuid not null unique references public.products(id) on delete cascade,
  stock       integer not null default 0 check (stock >= 0),
  reserved    integer not null default 0 check (reserved >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (reserved <= stock)
);

create index inventory_items_business_idx on public.inventory_items(business_id);

create trigger inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

-- Audit trail for every stock change. Never updated or deleted.
create table public.inventory_movements (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  type            text not null check (type in ('sale', 'reservation', 'release', 'manual_adjustment', 'return', 'restock')),
  quantity_change integer not null check (quantity_change <> 0),
  previous_stock  integer not null,
  new_stock       integer not null,
  reason          text,
  actor_id        uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index inventory_movements_product_created_idx
  on public.inventory_movements(product_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Customers (soft-deleted; order history references survive)
-- ─────────────────────────────────────────────────────────────

create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  email       text,
  phone       text,
  address     text,
  city        text,
  notes       text,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index customers_business_idx on public.customers(business_id);
create index customers_business_email_idx on public.customers(business_id, email);

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  customer_id       uuid references public.customers(id) on delete set null,
  channel           text not null check (channel in ('olx', 'instagram', 'facebook', 'webshop', 'manual')),
  external_order_id text,
  display_id        text not null,          -- human-facing, e.g. "#1042" (per business)
  display_number    integer not null,       -- numeric part of display_id, per business
  status            text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'ready', 'shipped', 'delivered', 'cancelled')),
  payment_method    text not null check (payment_method in ('cod', 'paid', 'card', 'other')),
  shipping_amount   numeric(12, 2) not null default 0 check (shipping_amount >= 0),
  total_amount      numeric(12, 2) not null check (total_amount >= 0),
  address           text,
  phone             text,
  email             text,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (business_id, display_id),
  unique (business_id, display_number)
);

-- Idempotency: an external order can only be created once per business.
create unique index orders_business_external_uniq
  on public.orders(business_id, external_order_id)
  where external_order_id is not null;

create index orders_business_created_idx on public.orders(business_id, created_at desc);
create index orders_customer_idx on public.orders(customer_id);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Line items keep name/price snapshots so historical orders never
-- change when the catalog changes. product_id is SET NULL on product
-- deletion (products are soft-deleted anyway — this is a backstop).
create table public.order_items (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.businesses(id) on delete cascade,
  order_id             uuid not null references public.orders(id) on delete cascade,
  product_id           uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  variant_snapshot     text,
  quantity             integer not null check (quantity > 0),
  unit_price           numeric(12, 2) not null check (unit_price >= 0),
  created_at           timestamptz not null default now()
);

create index order_items_order_idx on public.order_items(order_id);

-- Every status transition (plus the initial "received") is recorded
-- here; this powers the Order Detail timeline.
create table public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id    uuid not null references public.orders(id) on delete cascade,
  status      text not null check (status in ('received', 'pending', 'confirmed', 'ready', 'shipped', 'delivered', 'cancelled')),
  changed_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index order_status_history_order_idx on public.order_status_history(order_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- Shipments
-- ─────────────────────────────────────────────────────────────

create table public.shipments (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references public.businesses(id) on delete cascade,
  order_id           uuid not null references public.orders(id) on delete cascade,
  carrier            text not null,
  tracking_number    text,
  status             text not null default 'pending'
                     check (status in ('pending', 'shipped', 'delivered', 'problem')),
  estimated_delivery date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index shipments_business_tracking_uniq
  on public.shipments(business_id, tracking_number)
  where tracking_number is not null;

create index shipments_business_idx on public.shipments(business_id);

create trigger shipments_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Invoices
-- ─────────────────────────────────────────────────────────────

create table public.invoices (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  order_id       uuid not null references public.orders(id) on delete restrict,
  invoice_number text not null,           -- e.g. "R-2024-042", unique per business
  amount         numeric(12, 2) not null check (amount >= 0),
  status         text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue')),
  issued_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create index invoices_business_idx on public.invoices(business_id);

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Integrations
-- ─────────────────────────────────────────────────────────────

create table public.integrations (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider    text not null check (length(trim(provider)) > 0),
  status      text not null default 'disconnected'
              check (status in ('connected', 'disconnected', 'error', 'needs_auth')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (business_id, provider)
);

create trigger integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

-- Credentials live OUTSIDE the browser-visible data path.
-- No RLS policies and no client grants exist for this table
-- (see 0002_rls.sql); only server-side code (service role / edge
-- functions) may read or write it. Tokens are never stored in
-- plaintext — see BACKEND.md for the encryption scheme.
create table public.integration_credentials (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  integration_id  uuid not null references public.integrations(id) on delete cascade,
  token_cipher    bytea not null,          -- encrypted blob, never plaintext
  token_hint      text,                    -- e.g. last 4 chars, safe to display
  scopes          text[] not null default '{}',
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (integration_id)
);

create trigger integration_credentials_updated_at
  before update on public.integration_credentials
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Inbox
-- ─────────────────────────────────────────────────────────────

create table public.conversations (
  id                       uuid primary key default gen_random_uuid(),
  business_id              uuid not null references public.businesses(id) on delete cascade,
  customer_id              uuid references public.customers(id) on delete set null,
  channel                  text not null check (channel in ('olx', 'instagram', 'facebook', 'webshop')),
  external_conversation_id text,
  status                   text not null default 'open' check (status in ('open', 'closed', 'archived')),
  last_message_at          timestamptz not null default now(),
  note                     text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create unique index conversations_business_external_uniq
  on public.conversations(business_id, external_conversation_id)
  where external_conversation_id is not null;

create index conversations_business_last_msg_idx
  on public.conversations(business_id, last_message_at desc);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.messages (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  conversation_id     uuid not null references public.conversations(id) on delete cascade,
  customer_id         uuid references public.customers(id) on delete set null,
  direction           text not null check (direction in ('inbound', 'outbound')),
  content             text not null check (length(trim(content)) > 0),
  external_message_id text,
  created_at          timestamptz not null default now()
);

create unique index messages_business_external_uniq
  on public.messages(business_id, external_message_id)
  where external_message_id is not null;

create index messages_conversation_created_idx on public.messages(conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- Webhook / event ingestion (idempotency + replay protection)
-- Server-side only; no client grants (see 0002_rls.sql).
-- ─────────────────────────────────────────────────────────────

create table public.incoming_events (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  provider          text not null,
  external_event_id text not null,
  event_type        text not null,
  payload           jsonb not null,
  status            text not null default 'received'
                    check (status in ('received', 'processing', 'processed', 'failed')),
  received_at       timestamptz not null default now(),
  processed_at      timestamptz,
  -- Idempotency key: the same provider event can never be ingested twice.
  unique (business_id, provider, external_event_id)
);

create index incoming_events_business_received_idx on public.incoming_events(business_id, received_at desc);

-- ─────────────────────────────────────────────────────────────
-- Audit log for sensitive actions (server-side only)
-- ─────────────────────────────────────────────────────────────

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid,
  actor_id    uuid,
  action      text not null,               -- e.g. 'product.deleted', 'order.cancelled'
  entity      text not null,               -- e.g. 'product', 'order', 'member'
  entity_id   text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index audit_logs_business_created_idx on public.audit_logs(business_id, created_at desc);
