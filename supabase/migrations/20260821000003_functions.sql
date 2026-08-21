-- SellerOS — 0003: transactional business functions
--
-- SECURITY DEFINER functions are the ONLY write path for sensitive
-- aggregates (orders, inventory, members). They bypass RLS (owner
-- postgres) and therefore re-check business membership explicitly
-- on every call. auth.uid() comes from the caller's JWT.
--
-- Error discipline: every `raise exception` in these functions uses a
-- short safe code (e.g. 'INSUFFICIENT_STOCK'). Unexpected database
-- errors are mapped to a generic 'OPERATION_FAILED' so no SQL
-- details, relation names or constraint messages reach the client.

-- ─────────────────────────────────────────────────────────────
-- slugify: ASCII, kebab-case (used for business slugs)
-- ─────────────────────────────────────────────────────────────

create or replace function public.slugify(p_name text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(
      lower(translate(trim(p_name), 'čćžšđČĆŽŠĐ', 'cczsdcczsd')),
      '[^a-z0-9]+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Audit helper (server-side table, no client grants)
-- ─────────────────────────────────────────────────────────────

create or replace function public.log_audit(
  p_business_id uuid,
  p_action text,
  p_entity text,
  p_entity_id text,
  p_metadata jsonb default '{}'
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (business_id, actor_id, action, entity, entity_id, metadata)
  values (p_business_id, auth.uid(), p_action, p_entity, p_entity_id, p_metadata);
$$;

-- ─────────────────────────────────────────────────────────────
-- Businesses & membership
-- ─────────────────────────────────────────────────────────────

create or replace function public.create_business(p_name text)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses;
  v_slug text;
  v_try int := 0;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'INVALID_BUSINESS_NAME';
  end if;

  v_slug := public.slugify(p_name);
  if v_slug = '' then
    v_slug := 'shop';
  end if;

  loop
    v_try := v_try + 1;
    begin
      insert into public.businesses (name, slug)
      values (trim(p_name), v_slug)
      returning * into v_business;
      exit;
    exception
      when unique_violation then
        if v_try > 20 then
          raise exception 'SLUG_UNAVAILABLE';
        end if;
        v_slug := public.slugify(p_name) || '-' || v_try;
    end;
  end loop;

  -- Creator becomes owner atomically with the business.
  insert into public.business_members (business_id, user_id, role)
  values (v_business.id, auth.uid(), 'owner');

  perform public.log_audit(v_business.id, 'business.created', 'business', v_business.id::text,
                           jsonb_build_object('name', v_business.name));
  return v_business;
end;
$$;

create or replace function public.add_business_member(
  p_business_id uuid,
  p_email text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_user_id uuid;
begin
  select role into v_caller_role
  from public.business_members
  where business_id = p_business_id and user_id = auth.uid();

  if v_caller_role is null then
    raise exception 'NOT_A_MEMBER';
  end if;
  if p_role not in ('owner', 'admin', 'staff') then
    raise exception 'INVALID_ROLE';
  end if;
  -- Least privilege: admins may only add staff; only owners may
  -- grant owner/admin.
  if v_caller_role = 'admin' and p_role in ('owner', 'admin') then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_caller_role = 'staff' then
    raise exception 'NOT_ALLOWED';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(p_email);

  if v_user_id is null then
    raise exception 'USER_NOT_FOUND';
  end if;

  insert into public.business_members (business_id, user_id, role)
  values (p_business_id, v_user_id, p_role);

  perform public.log_audit(p_business_id, 'member.added', 'member', v_user_id::text,
                           jsonb_build_object('role', p_role));
end;
$$;

create or replace function public.update_member_role(
  p_business_id uuid,
  p_member_user_id uuid,
  p_new_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role
  from public.business_members
  where business_id = p_business_id and user_id = auth.uid();

  if v_caller_role is null then
    raise exception 'NOT_A_MEMBER';
  end if;
  if v_caller_role <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_new_role not in ('owner', 'admin', 'staff') then
    raise exception 'INVALID_ROLE';
  end if;
  if p_member_user_id = auth.uid() then
    raise exception 'CANNOT_CHANGE_OWN_ROLE';
  end if;
  -- Never demote the last owner.
  if p_new_role <> 'owner' and exists (
    select 1 from public.business_members
    where business_id = p_business_id and user_id = p_member_user_id and role = 'owner'
  ) and (select count(*) from public.business_members
         where business_id = p_business_id and role = 'owner') <= 1 then
    raise exception 'LAST_OWNER';
  end if;

  update public.business_members
  set role = p_new_role
  where business_id = p_business_id and user_id = p_member_user_id;

  perform public.log_audit(p_business_id, 'member.role_changed', 'member', p_member_user_id::text,
                           jsonb_build_object('new_role', p_new_role));
end;
$$;

create or replace function public.remove_business_member(
  p_business_id uuid,
  p_member_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role
  from public.business_members
  where business_id = p_business_id and user_id = auth.uid();

  if v_caller_role is null then
    raise exception 'NOT_A_MEMBER';
  end if;
  if v_caller_role <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;
  if (select count(*) from public.business_members
      where business_id = p_business_id and role = 'owner') <= 1
     and exists (select 1 from public.business_members
                 where business_id = p_business_id and user_id = p_member_user_id and role = 'owner') then
    raise exception 'LAST_OWNER';
  end if;

  delete from public.business_members
  where business_id = p_business_id and user_id = p_member_user_id;

  perform public.log_audit(p_business_id, 'member.removed', 'member', p_member_user_id::text, '{}');
end;
$$;

-- Trigger-level backstop: an owner can never demote themselves or
-- remove the last owner, even through a direct table update.
create or replace function public.guard_membership_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.user_id = auth.uid() and old.role = 'owner' and new.role <> 'owner' then
    raise exception 'CANNOT_CHANGE_OWN_ROLE';
  end if;
  if tg_op = 'DELETE' and old.role = 'owner' and
     (select count(*) from public.business_members
      where business_id = old.business_id and role = 'owner') <= 1 then
    raise exception 'LAST_OWNER';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger business_members_guard
  before update or delete on public.business_members
  for each row execute function public.guard_membership_changes();

-- ─────────────────────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────────────────────

create or replace function public.create_product(
  p_business_id uuid,
  p_name text,
  p_sku text,
  p_description text default '',
  p_category text default '',
  p_price numeric default 0,
  p_cost numeric default 0,
  p_minimum_stock int default 0,
  p_initial_stock int default 0,
  p_channels text[] default array['webshop']
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'NOT_A_MEMBER';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'INVALID_NAME';
  end if;
  if p_sku is null or length(trim(p_sku)) = 0 then
    raise exception 'INVALID_SKU';
  end if;
  if p_price < 0 or p_cost < 0 or p_minimum_stock < 0 or p_initial_stock < 0 then
    raise exception 'INVALID_VALUE';
  end if;
  if p_channels is null or cardinality(p_channels) = 0 then
    raise exception 'INVALID_CHANNELS';
  end if;
  if exists (select 1 from unnest(p_channels) c where c not in ('olx', 'instagram', 'facebook', 'webshop')) then
    raise exception 'INVALID_CHANNELS';
  end if;

  insert into public.products (business_id, name, sku, description, category, price, cost, minimum_stock, channels)
  values (p_business_id, trim(p_name), trim(p_sku), p_description, p_category, p_price, p_cost, p_minimum_stock, p_channels)
  returning * into v_product;

  -- Inventory row created atomically; never a client-visible gap.
  insert into public.inventory_items (business_id, product_id, stock)
  values (p_business_id, v_product.id, p_initial_stock);

  if p_initial_stock > 0 then
    insert into public.inventory_movements (business_id, product_id, type, quantity_change, previous_stock, new_stock, reason, actor_id)
    values (p_business_id, v_product.id, 'restock', p_initial_stock, 0, p_initial_stock, 'initial stock', auth.uid());
  end if;

  perform public.log_audit(p_business_id, 'product.created', 'product', v_product.id::text,
                           jsonb_build_object('sku', p_sku));
  return v_product;
end;
$$;

create or replace function public.delete_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  select * into v_product from public.products where id = p_product_id;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;
  -- Deletion is sensitive: owner/admin only.
  if not public.is_business_admin(v_product.business_id) then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.products set deleted_at = now() where id = p_product_id;

  perform public.log_audit(v_product.business_id, 'product.deleted', 'product', p_product_id::text,
                           jsonb_build_object('name', v_product.name));
end;
$$;

create or replace function public.delete_customer(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer public.customers;
begin
  select * into v_customer from public.customers where id = p_customer_id;
  if not found then
    raise exception 'CUSTOMER_NOT_FOUND';
  end if;
  if not public.is_business_member(v_customer.business_id) then
    raise exception 'NOT_A_MEMBER';
  end if;

  update public.customers set deleted_at = now() where id = p_customer_id;

  perform public.log_audit(v_customer.business_id, 'customer.deleted', 'customer', p_customer_id::text,
                           jsonb_build_object('name', v_customer.name));
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Orders
--
-- create_order is the ONLY way orders enter the system:
--  * validates every item against the business's own catalog,
--  * snapshots name/price at creation time,
--  * computes the total server-side (the client's numbers are
--    never trusted for totals),
--  * reserves stock atomically (row locks prevent overselling).
-- ─────────────────────────────────────────────────────────────

create or replace function public.create_order(
  p_business_id uuid,
  p_customer_id uuid,
  p_channel text,
  p_payment_method text,
  p_shipping_amount numeric,
  p_address text,
  p_phone text,
  p_email text,
  p_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_unit_price numeric;
  v_variant text;
  v_product public.products;
  v_inv public.inventory_items;
  v_subtotal numeric := 0;
  v_number int;
  v_manifest uuid[];
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'NOT_A_MEMBER';
  end if;
  if p_channel not in ('olx', 'instagram', 'facebook', 'webshop', 'manual') then
    raise exception 'INVALID_CHANNEL';
  end if;
  if p_payment_method not in ('cod', 'paid', 'card', 'other') then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;
  if p_shipping_amount is null or p_shipping_amount < 0 then
    raise exception 'INVALID_SHIPPING';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ITEMS';
  end if;

  -- Customer must belong to this business (if provided).
  if p_customer_id is not null and not exists (
    select 1 from public.customers
    where id = p_customer_id and business_id = p_business_id and deleted_at is null
  ) then
    raise exception 'INVALID_CUSTOMER';
  end if;

  -- Lock every affected inventory row in deterministic order so
  -- concurrent orders can never deadlock.
  select array_agg(distinct (i ->> 'product_id')::uuid order by (i ->> 'product_id')::uuid)
    into v_manifest
    from jsonb_array_elements(p_items) i
    where (i ->> 'product_id') is not null;

  if v_manifest is null or cardinality(v_manifest) = 0 then
    raise exception 'EMPTY_ITEMS';
  end if;

  perform 1
    from public.inventory_items
    where product_id = any (v_manifest) and business_id = p_business_id
    order by product_id
    for update;

  -- Validate items against the business's catalog.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::int;
    v_variant := v_item ->> 'variant';
    if v_product_id is null or v_qty is null or v_qty <= 0 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select * into v_product
    from public.products
    where id = v_product_id and business_id = p_business_id and deleted_at is null;
    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;

    v_unit_price := (v_item ->> 'unit_price')::numeric;
    if v_unit_price is null then
      v_unit_price := v_product.price;
    end if;
    if v_unit_price < 0 then
      raise exception 'INVALID_UNIT_PRICE';
    end if;

    select * into v_inv
    from public.inventory_items
    where product_id = v_product_id and business_id = p_business_id;
    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
    if v_inv.stock - v_inv.reserved < v_qty then
      raise exception 'INSUFFICIENT_STOCK';
    end if;
  end loop;

  -- Next human-facing number, serialized per business.
  perform pg_advisory_xact_lock(hashtextextended(p_business_id::text, 0));
  select coalesce(max(display_number), 0) + 1 into v_number
  from public.orders where business_id = p_business_id;

  insert into public.orders (
    business_id, customer_id, channel, display_id, display_number,
    status, payment_method, shipping_amount, total_amount,
    address, phone, email, note
  )
  values (
    p_business_id, p_customer_id, p_channel, '#' || v_number, v_number,
    'pending', p_payment_method, p_shipping_amount, 0,
    p_address, p_phone, p_email, p_note
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::int;
    v_variant := v_item ->> 'variant';

    select * into v_product
    from public.products
    where id = v_product_id and business_id = p_business_id;
    v_unit_price := coalesce((v_item ->> 'unit_price')::numeric, v_product.price);

    select * into v_inv
    from public.inventory_items
    where product_id = v_product_id and business_id = p_business_id;

    insert into public.order_items (business_id, order_id, product_id, product_name_snapshot, variant_snapshot, quantity, unit_price)
    values (p_business_id, v_order.id, v_product_id, v_product.name, v_variant, v_qty, v_unit_price);

    v_subtotal := v_subtotal + v_qty * v_unit_price;

    -- Reserve stock (rows already locked above).
    update public.inventory_items
    set reserved = reserved + v_qty
    where id = v_inv.id;

    insert into public.inventory_movements (business_id, product_id, type, quantity_change, previous_stock, new_stock, reason, actor_id)
    values (p_business_id, v_product_id, 'reservation', v_qty, v_inv.stock, v_inv.stock, 'order ' || v_order.display_id, auth.uid());
  end loop;

  update public.orders
  set total_amount = v_subtotal + p_shipping_amount
  where id = v_order.id;

  insert into public.order_status_history (business_id, order_id, status, changed_by)
  values (p_business_id, v_order.id, 'received', auth.uid());
  insert into public.order_status_history (business_id, order_id, status, changed_by)
  values (p_business_id, v_order.id, 'pending', auth.uid());

  return jsonb_build_object(
    'id', v_order.id,
    'display_id', '#' || v_number,
    'display_number', v_number,
    'total_amount', v_subtotal + p_shipping_amount
  );
exception
  when others then
    if sqlstate = 'P0001' then
      raise;  -- our own safe error codes pass through
    end if;
    if sqlstate in ('22P02', '22003', '22007', '22008', '23514', '23502') then
      raise exception 'INVALID_ITEM_DATA';
    end if;
    raise exception 'OPERATION_FAILED';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Order status workflow
--
-- Only allowed transitions, every change recorded in
-- order_status_history, inventory kept consistent inside the same
-- transaction:
--   shipped  → reservation becomes a sale (stock -= qty, reserved -= qty)
--   cancelled → reservation released
-- ─────────────────────────────────────────────────────────────

create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
  v_inv public.inventory_items;
begin
  if p_new_status not in ('confirmed', 'ready', 'shipped', 'delivered', 'cancelled') then
    raise exception 'INVALID_STATUS';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if not public.is_business_member(v_order.business_id) then
    raise exception 'NOT_A_MEMBER';
  end if;

  if not (
    (v_order.status = 'pending' and p_new_status in ('confirmed', 'cancelled')) or
    (v_order.status = 'confirmed' and p_new_status in ('ready', 'cancelled')) or
    (v_order.status = 'ready' and p_new_status in ('shipped', 'cancelled')) or
    (v_order.status = 'shipped' and p_new_status = 'delivered')
  ) then
    raise exception 'INVALID_TRANSITION';
  end if;

  if p_new_status = 'shipped' then
    for v_item in select * from public.order_items where order_id = v_order.id loop
      if v_item.product_id is not null then
        select * into v_inv
        from public.inventory_items
        where product_id = v_item.product_id
        for update;
        if not found then
          raise exception 'PRODUCT_NOT_FOUND';
        end if;
        if v_inv.stock < v_item.quantity then
          raise exception 'INSUFFICIENT_STOCK';
        end if;
        update public.inventory_items
        set stock = v_inv.stock - v_item.quantity,
            reserved = v_inv.reserved - v_item.quantity
        where id = v_inv.id;
        insert into public.inventory_movements (business_id, product_id, type, quantity_change, previous_stock, new_stock, reason, actor_id)
        values (v_order.business_id, v_item.product_id, 'sale', -v_item.quantity, v_inv.stock, v_inv.stock - v_item.quantity, 'order ' || v_order.display_id, auth.uid());
      end if;
    end loop;
  end if;

  if p_new_status = 'cancelled' then
    for v_item in select * from public.order_items where order_id = v_order.id loop
      if v_item.product_id is not null then
        select * into v_inv
        from public.inventory_items
        where product_id = v_item.product_id
        for update;
        if not found then
          raise exception 'PRODUCT_NOT_FOUND';
        end if;
        update public.inventory_items
        set reserved = greatest(v_inv.reserved - v_item.quantity, 0)
        where id = v_inv.id;
        insert into public.inventory_movements (business_id, product_id, type, quantity_change, previous_stock, new_stock, reason, actor_id)
        values (v_order.business_id, v_item.product_id, 'release', -v_item.quantity, v_inv.stock, v_inv.stock, 'order ' || v_order.display_id, auth.uid());
      end if;
    end loop;
  end if;

  update public.orders set status = p_new_status where id = v_order.id;

  insert into public.order_status_history (business_id, order_id, status, changed_by)
  values (v_order.business_id, v_order.id, p_new_status, auth.uid());

  if p_new_status = 'cancelled' then
    perform public.log_audit(v_order.business_id, 'order.cancelled', 'order', v_order.id::text,
                             jsonb_build_object('display_id', v_order.display_id));
  end if;

  return (select * from public.orders where id = v_order.id);
exception
  when others then
    if sqlstate = 'P0001' then
      raise;  -- our own safe error codes pass through
    end if;
    raise exception 'OPERATION_FAILED';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Inventory adjustments (manual) — audited, movemented, validated.
-- ─────────────────────────────────────────────────────────────

create or replace function public.adjust_inventory(
  p_product_id uuid,
  p_new_stock int,
  p_reason text default ''
)
returns public.inventory_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.inventory_items;
  v_type text;
begin
  select * into v_inv from public.inventory_items where product_id = p_product_id for update;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;
  if not public.is_business_member(v_inv.business_id) then
    raise exception 'NOT_A_MEMBER';
  end if;
  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'INVALID_STOCK';
  end if;
  if p_new_stock < v_inv.reserved then
    raise exception 'STOCK_BELOW_RESERVED';
  end if;

  if v_inv.stock <> p_new_stock then
    v_type := case when p_new_stock > v_inv.stock then 'restock' else 'manual_adjustment' end;

    insert into public.inventory_movements (business_id, product_id, type, quantity_change, previous_stock, new_stock, reason, actor_id)
    values (v_inv.business_id, p_product_id, v_type, p_new_stock - v_inv.stock, v_inv.stock, p_new_stock, nullif(p_reason, ''), auth.uid());

    update public.inventory_items set stock = p_new_stock where id = v_inv.id;

    perform public.log_audit(v_inv.business_id, 'inventory.adjusted', 'inventory_item', p_product_id::text,
                             jsonb_build_object('previous_stock', v_inv.stock, 'new_stock', p_new_stock, 'reason', p_reason));
  end if;

  return (select * from public.inventory_items where id = v_inv.id);
exception
  when others then
    if sqlstate = 'P0001' then
      raise;  -- our own safe error codes pass through
    end if;
    raise exception 'OPERATION_FAILED';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Invoices — numbers are unique per business, amounts come from
-- the server-computed order total, never from the client.
-- ─────────────────────────────────────────────────────────────

create or replace function public.create_invoice(p_order_id uuid)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_invoice public.invoices;
  v_seq int;
  v_year text;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if not public.is_business_member(v_order.business_id) then
    raise exception 'NOT_A_MEMBER';
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'ORDER_CANCELLED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_order.business_id::text || ':invoice', 0));
  v_year := to_char(now(), 'YYYY');
  select coalesce(max(substring(invoice_number from 'R-[0-9]{4}-([0-9]+)$')::int), 0) + 1
    into v_seq
    from public.invoices
    where business_id = v_order.business_id
      and invoice_number like 'R-' || v_year || '-%';

  insert into public.invoices (business_id, order_id, invoice_number, amount, status, issued_at)
  values (v_order.business_id, v_order.id, 'R-' || v_year || '-' || lpad(v_seq::text, 3, '0'),
          v_order.total_amount, 'draft', now())
  returning * into v_invoice;

  perform public.log_audit(v_order.business_id, 'invoice.created', 'invoice', v_invoice.id::text,
                           jsonb_build_object('invoice_number', v_invoice.invoice_number));
  return v_invoice;
exception
  when others then
    if sqlstate = 'P0001' then
      raise;
    end if;
    raise exception 'OPERATION_FAILED';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Inbox — sending a message atomically updates the conversation
-- ─────────────────────────────────────────────────────────────

create or replace function public.send_message(
  p_conversation_id uuid,
  p_direction text,
  p_content text
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv public.conversations;
  v_msg public.messages;
begin
  select * into v_conv from public.conversations where id = p_conversation_id;
  if not found then
    raise exception 'CONVERSATION_NOT_FOUND';
  end if;
  if not public.is_business_member(v_conv.business_id) then
    raise exception 'NOT_A_MEMBER';
  end if;
  if p_direction not in ('inbound', 'outbound') then
    raise exception 'INVALID_DIRECTION';
  end if;
  if p_content is null or length(trim(p_content)) = 0 then
    raise exception 'EMPTY_MESSAGE';
  end if;

  insert into public.messages (business_id, conversation_id, customer_id, direction, content)
  values (v_conv.business_id, v_conv.id, v_conv.customer_id, p_direction, trim(p_content))
  returning * into v_msg;

  update public.conversations
  set last_message_at = now(), status = 'open'
  where id = v_conv.id;

  return v_msg;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Grants — expose only the RPC surface, least privilege.
-- ─────────────────────────────────────────────────────────────

revoke execute on all functions in schema public from public;

grant execute on function
  public.is_business_member(uuid),
  public.is_business_admin(uuid),
  public.is_business_owner(uuid),
  public.create_business(text),
  public.add_business_member(uuid, text, text),
  public.update_member_role(uuid, uuid, text),
  public.remove_business_member(uuid, uuid),
  public.create_product(uuid, text, text, text, text, numeric, numeric, int, int, text[]),
  public.delete_product(uuid),
  public.delete_customer(uuid),
  public.create_order(uuid, uuid, text, text, numeric, text, text, text, text, jsonb),
  public.update_order_status(uuid, text),
  public.adjust_inventory(uuid, int, text),
  public.create_invoice(uuid),
  public.send_message(uuid, text, text)
to authenticated;
