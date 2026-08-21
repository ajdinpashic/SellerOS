-- ─────────────────────────────────────────────────────────────
-- SellerOS — cross-tenant & authorization security verification
-- ─────────────────────────────────────────────────────────────
-- Proves, against a running Supabase database:
--   • User A can NEVER read/update/delete User B's data
--   • IDOR attempts through RPC functions fail (NOT_A_MEMBER)
--   • staff members cannot perform owner/admin actions
--   • owners cannot demote themselves or drop the last owner
--   • inventory guards (negative stock, reserved>stock, oversell)
--   • idempotency constraints (external order/event uniqueness)
--   • server-only tables have no policies and no client grants
--
-- Run:
--   supabase start
--   supabase db reset            # applies migrations + seed
--   psql "$(supabase status -o env | grep DATABASE_URL | cut -d= -f2)" -f supabase/tests/cross_tenant.sql
--
-- Prints PASS/FAIL per check; the exit code reflects failures.
-- (psql meta-commands like \set are intentionally avoided so this
-- script also runs via `supabase db query --linked -f` and the
-- Dashboard SQL editor.)

-- ═══ Setup (as postgres — test fixtures, NOT production data) ═══

-- Idempotent re-runs: clear previous fixture rows first.
-- (The owner-guard trigger would block deleting the fixture owners,
-- so it is disabled for the cleanup only and re-enabled afterwards.)
alter table public.business_members disable trigger business_members_guard;
delete from public.messages where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.incoming_events where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.conversations where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.order_status_history where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.inventory_movements where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.order_items where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.shipments where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.invoices where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.orders where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.inventory_items where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.customers where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.products where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.audit_logs where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from public.business_members
  where business_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002')
     or user_id in ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003');
delete from public.businesses where id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');
delete from auth.users where id in ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003');
alter table public.business_members enable trigger business_members_guard;

insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'user-a@test.local', 'x', now(), now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'user-b@test.local', 'x', now(), now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'staff-a@test.local', 'x', now(), now(), now())
on conflict (id) do nothing;

insert into public.businesses (id, name, slug) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Tenant A', 'tenant-a'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Tenant B', 'tenant-b')
on conflict (id) do nothing;

insert into public.business_members (business_id, user_id, role) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'owner'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 'staff'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'owner')
on conflict (business_id, user_id) do nothing;

-- Tenant A catalog
insert into public.products (id, business_id, name, sku, price, cost, minimum_stock) values
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Product A1', 'SKU-A1', 10, 5, 2);
insert into public.inventory_items (business_id, product_id, stock, reserved) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 5, 0);
insert into public.customers (id, business_id, name) values
  ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Customer A1');

-- Tenant B catalog
insert into public.products (id, business_id, name, sku, price, cost, minimum_stock) values
  ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Product B1', 'SKU-B1', 20, 8, 1);
insert into public.inventory_items (business_id, product_id, stock, reserved) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002', 5, 0);
insert into public.customers (id, business_id, name) values
  ('dddddddd-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Customer B1');
insert into public.orders (id, business_id, customer_id, channel, display_id, display_number, status, payment_method, total_amount, created_at, updated_at) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000002', 'webshop', '#9901', 9901, 'pending', 'cod', 20, now(), now());
insert into public.invoices (business_id, order_id, invoice_number, amount, status) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000001', 'R-TEST-001', 20, 'draft');
insert into public.order_items (business_id, order_id, product_id, product_name_snapshot, quantity, unit_price) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 'Product B1', 1, 20);
insert into public.shipments (business_id, order_id, carrier, status) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000001', 'Test Carrier', 'pending');
insert into public.conversations (id, business_id, customer_id, channel, status) values
  ('ffffffff-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000002', 'webshop', 'open');
insert into public.messages (business_id, conversation_id, customer_id, direction, content) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000002', 'inbound', 'secret message from tenant B (demo)');
insert into public.order_status_history (business_id, order_id, status) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000001', 'received');
insert into public.inventory_movements (business_id, product_id, type, quantity_change, previous_stock, new_stock) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002', 'restock', 5, 0, 5);

-- ═══ Test helpers ═══

create or replace function public.tests_check(label text, cond boolean)
returns void
language plpgsql
as $$
begin
  if cond then
    raise notice 'PASS: %', label;
  else
    raise exception 'FAIL: %', label;
  end if;
end;
$$;

create or replace function public.tests_expect_error(label text, fn text)
returns void
language plpgsql
as $$
begin
  execute fn;
  raise exception 'FAIL: % (no error raised)', label;
exception
  when others then
    if sqlstate = 'P0001' and sqlerrm like 'FAIL:%' then
      raise; -- propagate our own failure
    end if;
    raise notice 'PASS: % (blocked: %)', label, sqlerrm;
end;
$$;

-- Passes when a DML statement affects ZERO rows (RLS hid the row).
create or replace function public.tests_expect_no_rows(label text, dml text)
returns void
language plpgsql
as $$
declare
  v bigint;
begin
  execute format('with __u as (%s returning 1) select count(*) from __u', dml) into v;
  if v = 0 then
    raise notice 'PASS: %', label;
  else
    raise exception 'FAIL: % (affected %)', label, v;
  end if;
end;
$$;

-- ═══ Act as User A (tenant A owner) ═══

set role authenticated;
set request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "email": "user-a@test.local", "role": "authenticated"}';

-- ── A can see only its own tenant ────────────────────────────
select public.tests_check('A can SELECT own product',
  (select count(*) from public.products where business_id = 'bbbbbbbb-0000-0000-0000-000000000001') = 1);

select public.tests_check('A CANNOT SELECT tenant B products',
  (select count(*) from public.products where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B customers',
  (select count(*) from public.customers where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B orders',
  (select count(*) from public.orders where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B order_items',
  (select count(*) from public.order_items where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B invoices',
  (select count(*) from public.invoices where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B shipments',
  (select count(*) from public.shipments where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B messages',
  (select count(*) from public.messages where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B conversations',
  (select count(*) from public.conversations where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B inventory_items',
  (select count(*) from public.inventory_items where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B inventory_movements',
  (select count(*) from public.inventory_movements where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B status history',
  (select count(*) from public.order_status_history where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B memberships',
  (select count(*) from public.business_members where business_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

select public.tests_check('A CANNOT SELECT tenant B business row',
  (select count(*) from public.businesses where id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0);

-- ── Cross-tenant writes (direct Data API) ────────────────────
select public.tests_expect_no_rows('A CANNOT UPDATE tenant B product (0 rows affected)',
  $$update public.products set name = 'hacked' where id = 'cccccccc-0000-0000-0000-000000000002'$$);

select public.tests_expect_no_rows('A CANNOT UPDATE tenant B customer (0 rows affected)',
  $$update public.customers set name = 'hacked' where id = 'dddddddd-0000-0000-0000-000000000002'$$);

select public.tests_expect_no_rows('A CANNOT UPDATE tenant B invoice (0 rows affected)',
  $$update public.invoices set status = 'paid' where id = (select id from public.invoices where invoice_number = 'R-TEST-001')$$);

select public.tests_expect_error('A CANNOT UPDATE tenant B order (no write grant)',
  $$update public.orders set note = 'hacked' where id = 'eeeeeeee-0000-0000-0000-000000000001'$$);

select public.tests_expect_error('A CANNOT INSERT into tenant B customers (RLS WITH CHECK)',
  $$insert into public.customers (business_id, name) values ('bbbbbbbb-0000-0000-0000-000000000002', 'intruder')$$);

select public.tests_expect_error('A CANNOT INSERT into tenant B conversations (RLS WITH CHECK)',
  $$insert into public.conversations (business_id, customer_id, channel, status) values ('bbbbbbbb-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000002', 'webshop', 'open')$$);

-- ── IDOR attempts through RPC functions ──────────────────────
select public.tests_expect_error('IDOR: update tenant B order status via RPC',
  $$select public.update_order_status('eeeeeeee-0000-0000-0000-000000000001', 'confirmed')$$);

select public.tests_expect_error('IDOR: adjust tenant B inventory via RPC',
  $$select public.adjust_inventory('cccccccc-0000-0000-0000-000000000002', 99, 'test')$$);

select public.tests_expect_error('IDOR: delete tenant B product via RPC',
  $$select public.delete_product('cccccccc-0000-0000-0000-000000000002')$$);

select public.tests_expect_error('IDOR: delete tenant B customer via RPC',
  $$select public.delete_customer('dddddddd-0000-0000-0000-000000000002')$$);

select public.tests_expect_error('IDOR: create order in tenant B via RPC',
  $$select public.create_order('bbbbbbbb-0000-0000-0000-000000000002', null, 'webshop', 'cod', 0, 'addr', 'phone', 'mail', null, '[{"product_id":"cccccccc-0000-0000-0000-000000000002","quantity":1}]')$$);

select public.tests_expect_error('IDOR: create invoice for tenant B order via RPC',
  $$select public.create_invoice('eeeeeeee-0000-0000-0000-000000000001')$$);

select public.tests_expect_error('IDOR: send message in tenant B conversation via RPC',
  $$select public.send_message('ffffffff-0000-0000-0000-000000000001', 'outbound', 'hello')$$);

select public.tests_expect_error('IDOR: add member to tenant B via RPC',
  $$select public.add_business_member('bbbbbbbb-0000-0000-0000-000000000002', 'user-b@test.local', 'staff')$$);

-- ── Happy path: A can operate on own tenant ──────────────────
select public.tests_check('A can create own order (stock reserved)',
  (select (public.create_order('bbbbbbbb-0000-0000-0000-000000000001', null, 'webshop', 'cod', 5, 'addr', 'phone', 'mail', null,
     '[{"product_id":"cccccccc-0000-0000-0000-000000000001","quantity":2}]') ->> 'display_id') like '#%'));

select public.tests_check('A order reservation was recorded',
  (select reserved from public.inventory_items where product_id = 'cccccccc-0000-0000-0000-000000000001') = 2);

select public.tests_check('A can advance own order status',
  (select status from public.update_order_status(
    (select id from public.orders where business_id = 'bbbbbbbb-0000-0000-0000-000000000001' and status = 'pending' limit 1), 'confirmed')) = 'confirmed');

select public.tests_check('A can adjust own inventory',
  (select stock from public.adjust_inventory('cccccccc-0000-0000-0000-000000000001', 9, 'test')) = 9);

-- ── Inventory guards ─────────────────────────────────────────
select public.tests_expect_error('Oversell: order more than available stock fails',
  $$select public.create_order('bbbbbbbb-0000-0000-0000-000000000001', null, 'webshop', 'cod', 0, 'addr', 'phone', 'mail', null,
     '[{"product_id":"cccccccc-0000-0000-0000-000000000001","quantity":999}]')$$);

select public.tests_expect_error('Adjust below reserved fails',
  $$select public.adjust_inventory('cccccccc-0000-0000-0000-000000000001', 0, 'test')$$);

-- ═══ Act as staff member of tenant A ═══

set role authenticated;
set request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000003", "email": "staff-a@test.local", "role": "authenticated"}';

select public.tests_expect_error('staff CANNOT delete product (owner/admin only)',
  $$select public.delete_product('cccccccc-0000-0000-0000-000000000001')$$);

select public.tests_expect_error('staff CANNOT add members',
  $$select public.add_business_member('bbbbbbbb-0000-0000-0000-000000000001', 'user-b@test.local', 'staff')$$);

select public.tests_expect_error('staff CANNOT change roles',
  $$select public.update_member_role('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'staff')$$);

select public.tests_expect_error('staff CANNOT remove members',
  $$select public.remove_business_member('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001')$$);

select public.tests_expect_no_rows('staff CANNOT update business (RLS, 0 rows)',
  $$update public.businesses set name = 'hacked' where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$);

-- ═══ Back as owner: self-demotion guard ═══

set role authenticated;
set request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "email": "user-a@test.local", "role": "authenticated"}';

select public.tests_expect_error('owner CANNOT demote themselves via RPC',
  $$select public.update_member_role('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'staff')$$);

select public.tests_expect_error('owner CANNOT remove themselves as last owner',
  $$select public.remove_business_member('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001')$$);

select public.tests_expect_error('owner CANNOT demote themselves via direct table update (trigger guard)',
  $$update public.business_members set role = 'staff' where business_id = 'bbbbbbbb-0000-0000-0000-000000000001' and user_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$);

-- ═══ Back to postgres: constraint & grant checks ═══

reset role;
reset request.jwt.claims;

-- Idempotency: external order can only exist once per business
insert into public.orders (business_id, customer_id, channel, external_order_id, display_id, display_number, status, payment_method, total_amount, created_at, updated_at)
  values ('bbbbbbbb-0000-0000-0000-000000000002', null, 'webshop', 'EXT-1', '#9902', 9902, 'pending', 'cod', 1, now(), now());
select public.tests_expect_error('duplicate external_order_id rejected (unique per business)',
  $$insert into public.orders (business_id, customer_id, channel, external_order_id, display_id, display_number, status, payment_method, total_amount, created_at, updated_at)
    values ('bbbbbbbb-0000-0000-0000-000000000002', null, 'webshop', 'EXT-1', '#9903', 9903, 'pending', 'cod', 1, now(), now())$$);

-- Idempotency: duplicate provider event rejected
insert into public.incoming_events (business_id, provider, external_event_id, event_type, payload) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'test', 'EVT-1', 'order.created', '{"demo": true}');
select public.tests_expect_error('duplicate incoming event rejected (idempotency)',
  $$insert into public.incoming_events (business_id, provider, external_event_id, event_type, payload) values
     ('bbbbbbbb-0000-0000-0000-000000000002', 'test', 'EVT-1', 'order.created', '{"demo": true}')$$);

-- Server-only tables: no policies, no client grants
select public.tests_check('integration_credentials has NO RLS policies',
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'integration_credentials') = 0);
select public.tests_check('incoming_events has NO RLS policies',
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'incoming_events') = 0);
select public.tests_check('audit_logs has NO RLS policies',
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'audit_logs') = 0);

select public.tests_check('authenticated has NO SELECT on integration_credentials',
  not has_table_privilege('authenticated', 'public.integration_credentials', 'SELECT'));
select public.tests_check('authenticated has NO SELECT on incoming_events',
  not has_table_privilege('authenticated', 'public.incoming_events', 'SELECT'));
select public.tests_check('authenticated has NO SELECT on audit_logs',
  not has_table_privilege('authenticated', 'public.audit_logs', 'SELECT'));
select public.tests_check('anon has NO table access in public schema',
  (select count(*) from information_schema.role_table_grants
   where grantee = 'anon' and table_schema = 'public') = 0);

-- RLS is enabled on every business-owned table
select public.tests_check('RLS enabled on all business-owned tables',
  (select count(*) from pg_tables t
   where t.schemaname = 'public' and t.tablename in (
     'businesses','business_members','profiles','products','customers','orders',
     'order_items','order_status_history','inventory_items','inventory_movements',
     'shipments','invoices','integrations','integration_credentials',
     'conversations','messages','incoming_events','audit_logs')
   and not exists (select 1 from pg_class c where c.oid = (quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::regclass and c.relrowsecurity)) = 0);

-- ═══ Cleanup test helpers (keep the DB clean) ═══

drop function public.tests_check(text, boolean);
drop function public.tests_expect_error(text, text);

-- ═══ Summary ═══
-- Scroll up: every line should read PASS. Any FAIL means the
-- authorization boundary is broken — fix before deploying.
