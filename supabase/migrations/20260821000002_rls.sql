-- SellerOS — 0002: Row Level Security
--
-- RLS is the FINAL authorization boundary for every business-owned
-- table. Application-level checks are defense in depth, never a
-- substitute for these policies. A user may only touch rows whose
-- business they are a member of.
--
-- Owner (postgres) bypasses RLS, so the SECURITY DEFINER functions
-- in 0003_functions.sql must re-check membership explicitly.

-- ─────────────────────────────────────────────────────────────
-- Membership helpers (used by policies AND by SECURITY DEFINER
-- functions as a cross-check)
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_business_admin(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Grants: least privilege, anon gets nothing.
-- Supabase's default privileges grant broad access to new tables;
-- revoke all of that from `anon` and hand out only what each role
-- actually needs. RLS then restricts rows within those grants.
-- ─────────────────────────────────────────────────────────────

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;

-- Read access for authenticated members (row-level gated by policies).
grant select on
  public.businesses,
  public.business_members,
  public.profiles,
  public.products,
  public.customers,
  public.orders,
  public.order_items,
  public.order_status_history,
  public.inventory_items,
  public.inventory_movements,
  public.shipments,
  public.invoices,
  public.integrations,
  public.conversations,
  public.messages
to authenticated;

-- Narrow write grants (all row-level gated by policies).
grant insert on public.customers, public.shipments, public.invoices, public.integrations, public.conversations, public.messages to authenticated;
grant update on public.businesses, public.business_members, public.profiles, public.products, public.customers, public.shipments, public.invoices, public.integrations, public.conversations to authenticated;
grant delete on public.business_members to authenticated;

-- The following tables are server-side only: no grants at all for
-- authenticated (or anon). The Data API cannot read or write them,
-- regardless of RLS:
--   integration_credentials, incoming_events, audit_logs

-- ─────────────────────────────────────────────────────────────
-- RLS: enable on every business-owned table
-- ─────────────────────────────────────────────────────────────

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.shipments enable row level security;
alter table public.invoices enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_credentials enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.incoming_events enable row level security;
alter table public.audit_logs enable row level security;

-- ─────────────────────────────────────────────────────────────
-- businesses
-- ─────────────────────────────────────────────────────────────

create policy businesses_select on public.businesses
  for select to authenticated
  using (public.is_business_member(id));

create policy businesses_update on public.businesses
  for update to authenticated
  using (public.is_business_owner(id))
  with check (public.is_business_owner(id));

-- Insert/delete go through SECURITY DEFINER functions only.

-- ─────────────────────────────────────────────────────────────
-- business_members
-- ─────────────────────────────────────────────────────────────

create policy business_members_select on public.business_members
  for select to authenticated
  using (public.is_business_member(business_id));

-- Role changes: owner-only. The USING/WITH CHECK pair keeps the
-- owner from being able to demote themselves through this path
-- (a row whose role changed to non-owner would fail WITH CHECK on
-- the way out). Use update_member_role() for role changes.
create policy business_members_update on public.business_members
  for update to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

create policy business_members_delete on public.business_members
  for delete to authenticated
  using (public.is_business_owner(business_id));

-- Insert goes through add_business_member() only.

-- ─────────────────────────────────────────────────────────────
-- profiles (user-scoped, not business-scoped)
-- ─────────────────────────────────────────────────────────────

create policy profiles_select on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────

create policy products_select on public.products
  for select to authenticated
  using (public.is_business_member(business_id) and deleted_at is null);

create policy products_update on public.products
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- Insert/delete go through create_product()/delete_product() so the
-- inventory row and audit trail are created atomically.

-- ─────────────────────────────────────────────────────────────
-- customers
-- ─────────────────────────────────────────────────────────────

create policy customers_select on public.customers
  for select to authenticated
  using (public.is_business_member(business_id) and deleted_at is null);

create policy customers_insert on public.customers
  for insert to authenticated
  with check (public.is_business_member(business_id));

create policy customers_update on public.customers
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- Deletion is soft (delete_customer()) so order history survives.

-- ─────────────────────────────────────────────────────────────
-- orders (reads only through the Data API; writes via functions)
-- ─────────────────────────────────────────────────────────────

create policy orders_select on public.orders
  for select to authenticated
  using (public.is_business_member(business_id));

-- ─────────────────────────────────────────────────────────────
-- order_items / order_status_history
-- ─────────────────────────────────────────────────────────────

create policy order_items_select on public.order_items
  for select to authenticated
  using (public.is_business_member(business_id));

create policy order_status_history_select on public.order_status_history
  for select to authenticated
  using (public.is_business_member(business_id));

-- ─────────────────────────────────────────────────────────────
-- inventory (reads only; writes via functions)
-- ─────────────────────────────────────────────────────────────

create policy inventory_items_select on public.inventory_items
  for select to authenticated
  using (public.is_business_member(business_id));

create policy inventory_movements_select on public.inventory_movements
  for select to authenticated
  using (public.is_business_member(business_id));

-- ─────────────────────────────────────────────────────────────
-- shipments
-- ─────────────────────────────────────────────────────────────

create policy shipments_select on public.shipments
  for select to authenticated
  using (public.is_business_member(business_id));

create policy shipments_insert on public.shipments
  for insert to authenticated
  with check (public.is_business_member(business_id));

create policy shipments_update on public.shipments
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ─────────────────────────────────────────────────────────────
-- invoices
-- ─────────────────────────────────────────────────────────────

create policy invoices_select on public.invoices
  for select to authenticated
  using (public.is_business_member(business_id));

create policy invoices_insert on public.invoices
  for insert to authenticated
  with check (public.is_business_member(business_id));

create policy invoices_update on public.invoices
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- Deletion is never allowed via the Data API (financial history).

-- ─────────────────────────────────────────────────────────────
-- integrations
-- ─────────────────────────────────────────────────────────────

create policy integrations_select on public.integrations
  for select to authenticated
  using (public.is_business_member(business_id));

create policy integrations_insert on public.integrations
  for insert to authenticated
  with check (public.is_business_member(business_id));

create policy integrations_update on public.integrations
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ─────────────────────────────────────────────────────────────
-- conversations / messages
-- ─────────────────────────────────────────────────────────────

create policy conversations_select on public.conversations
  for select to authenticated
  using (public.is_business_member(business_id));

create policy conversations_insert on public.conversations
  for insert to authenticated
  with check (public.is_business_member(business_id));

create policy conversations_update on public.conversations
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy messages_select on public.messages
  for select to authenticated
  using (public.is_business_member(business_id));

create policy messages_insert on public.messages
  for insert to authenticated
  with check (public.is_business_member(business_id));

-- Messages are immutable once written (update/delete not granted).

-- ─────────────────────────────────────────────────────────────
-- integration_credentials / incoming_events / audit_logs
-- ─────────────────────────────────────────────────────────────
-- RLS is enabled (defense in depth) but NO policies exist and no
-- grants were issued: these tables are invisible to the Data API.
