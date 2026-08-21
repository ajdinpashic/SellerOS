# SellerOS — Backend documentation

## 1. Architecture

```
┌─────────────────────────┐      ┌──────────────────────────────────────┐
│  React SPA (Vite)       │      │  Supabase platform                   │
│  src/lib/supabase.ts    │      │  ┌────────────────────────────────┐  │
│  (anon key, RLS-guarded)│      │  │ PostgreSQL + RLS (all tables)  │  │
│                         │─────▶│  │ SECURITY DEFINER functions:    │  │
│  hooks (useOrders, …)   │ RPC/ │  │  create_order,                 │  │
│  src/lib/api.ts         │ REST │  │  update_order_status,          │  │
│  src/lib/mappers.ts     │      │  │  adjust_inventory, …           │  │
│                         │      │  └────────────────────────────────┘  │
│                         │      │  ┌────────────────────────────────┐  │
│                         │      │  │ Supabase Auth (email/password) │  │
│                         │      │  └────────────────────────────────┘  │
│                         │      │  ┌────────────────────────────────┐  │
│                         │      │  │ Edge Functions (server-side):  │  │
│                         │      │  │  integrations-webhook (stub)   │  │
│                         │      │  └────────────────────────────────┘  │
└─────────────────────────┘      └──────────────────────────────────────┘
```

- **Frontend**: React 18 + Vite + Tailwind, hand-rolled hash router,
  flat locale dictionaries (bs/hr/sr/en). Presentation components
  stay separated from data access: pages receive data via props, and
  all fetching lives in `src/hooks/` + `src/lib/`.
- **Backend**: Supabase only — Auth, PostgreSQL with RLS, Edge
  Functions for server-side secrets. No Express/Nest layer: the
  database functions *are* the business layer.
- **Demo mode**: when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  are not set, the app uses the original mock data with local state —
  the frontend keeps working standalone.

## 2. Database schema

All migrations live in `supabase/migrations/` (reproducible, applied
in order by the Supabase CLI). Tables:

| Table | Purpose | Writes via |
|---|---|---|
| `businesses` | tenants (name, slug) | `create_business()` only |
| `business_members` | membership + role (owner/admin/staff) | functions + owner RLS |
| `profiles` | user profile (no credentials) | RLS (own row), trigger on signup |
| `products` | catalog; `deleted_at` soft delete; `UNIQUE(business_id, sku)` | `create_product()` / `delete_product()`; update via RLS |
| `inventory_items` | stock + reserved per product; `reserved <= stock` CHECK | functions only |
| `inventory_movements` | ledger for every stock change (sale, reservation, release, manual_adjustment, return, restock) | functions only |
| `customers` | `deleted_at` soft delete | RLS insert/update, `delete_customer()` |
| `orders` | `display_id` per business, `UNIQUE(business_id, external_order_id)` partial (idempotency) | `create_order()` / `update_order_status()` only |
| `order_items` | name/price **snapshots** — history never changes when catalog prices change | `create_order()` only |
| `order_status_history` | timeline events (received, pending, confirmed, …) | `create_order()` / `update_order_status()` |
| `shipments` | carrier/tracking/status | RLS |
| `invoices` | `UNIQUE(business_id, invoice_number)`; amount from server-computed order total | `create_invoice()` + RLS status updates |
| `integrations` | provider connection status | RLS |
| `integration_credentials` | **encrypted** token blob; server-side only (no grants/policies) | service role / edge functions |
| `conversations` / `messages` | inbox; idempotency via partial unique on external ids | RLS insert, `send_message()` |
| `incoming_events` | webhook idempotency + replay protection; server-side only | edge functions |
| `audit_logs` | sensitive actions (product deleted, order cancelled, member changes, inventory adjustments); server-side only | functions |

Key invariants (constraints, not just application checks):
`price/cost/shipping/amount >= 0`, `quantity > 0`, `stock >= 0`,
`reserved >= 0`, `reserved <= stock`, enum CHECKs on every status
column, `UNIQUE(business_id, sku)`, `UNIQUE(business_id, display_id)`,
`UNIQUE(business_id, display_number)`, `UNIQUE(business_id,
invoice_number)`, partial unique indexes for external ids.

**Delete behavior**: products and customers are soft-deleted so
order/invoice history survives; `order_items.product_id` is
`ON DELETE SET NULL` as a backstop; invoices `RESTRICT` order
deletion; business deletion is restricted (no UI/function exposes it).

## 3. Migrations

| File | Contents |
|---|---|
| `20260821000001_schema.sql` | tables, constraints, indexes, triggers |
| `20260821000002_rls.sql` | membership helpers, grants (least privilege), RLS on all tables, policies |
| `20260821000003_functions.sql` | transactional SECURITY DEFINER functions + RPC grants |
| `20260821000004_harden_grants.sql` | strips Supabase default `ALL` grants down to the intended surface |
| `20260821000005_fix_composite_returns.sql` | fixes `RETURN (SELECT * …)` → row variable returns in `update_order_status` / `adjust_inventory` |
| `20260821000006_revoke_select_server_tables.sql` | removes leftover SELECT grants on `integration_credentials` / `incoming_events` / `audit_logs` |
| `supabase/seed.sql` | demo data (clearly marked, no credentials) |
| `supabase/config.toml` | local CLI configuration |

All migrations are applied to the hosted project (`supabase db push`).

**Rollback**: migrations are not retro-edited. To revert, drop the
schema (`drop schema public cascade; create schema public;`) and
re-apply — or `supabase db reset` in development. Never hand-edit a
migration that has been applied to a shared environment.

## 4. Local development

```bash
# 1. Install the Supabase CLI (one-time)
#    https://supabase.com/docs/guides/cli

# 2. Start the local stack (Postgres, Auth, Studio, Edge runtime)
supabase start

# 3. Apply migrations + seed
supabase db reset

# 4. Frontend env — from `supabase status -o env`
cp .env.example .env.local
# set VITE_SUPABASE_URL=http://localhost:54321
# set VITE_SUPABASE_ANON_KEY=<anon key from supabase status>

# 5. Run the app
npm install
npm run dev          # http://localhost:5173
```

First login: create a user via the Register page (email confirmations
are on for local — check Inbucket at http://localhost:54324), then the
onboarding flow creates your business. To instead use the demo shop
data, link your user:

```sql
insert into public.business_members (business_id, user_id, role)
values ('00000000-0000-0000-0000-000000000001', '<your-auth-user-id>', 'owner');
```

### Environment variables

| Variable | Client/Server | Required | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | client | yes (real mode) | publishable |
| `VITE_SUPABASE_ANON_KEY` | client | yes (real mode) | publishable, RLS-guarded |
| `SUPABASE_SERVICE_ROLE_KEY` | server (edge) | for webhooks | **never** in client |
| `INTEGRATION_WEBHOOK_SECRET` | server (edge) | for webhooks | or per-provider `WEBHOOK_SECRET_<PROVIDER>` |
| `ALLOWED_ORIGINS` | server (edge) | production | comma-separated frontend origins |

`.env.example` documents all of these. Never commit `.env*`.

## 5. Frontend ↔ backend data flow

```
Page (props only)
   ▲
   │ typed data (Order, Product, Customer, …)
   ▼
src/hooks/use*        — fetch + cache + refetch (demo mode: mock data)
   ▲
   │ DB rows (snake_case)
   ▼
src/lib/mappers.ts    — row → frontend type (snapshots, timeline build)
   ▲
   ▼
src/lib/api.ts        — RPC calls (create_order, update_order_status, …)
   ▼
src/lib/supabase.ts   — single anon-key client
```

- Orders list: `orders.select('*, order_items(*), order_status_history(*), customers(name)')`
  — RLS applies to every nested table.
- Customers: list + order aggregates computed in the hook (orderCount,
  totalSpent, lastOrderDate, primaryChannel).
- Order totals: displayed from line items; authoritative `total_amount`
  is server-computed and re-validated on every status change.
- Dashboard/reports analytics derive from the same order stream.

## 6. Auth & onboarding flow

1. `AuthProvider` loads session → loading screen while unsettled.
2. Signed out → `#/login` (register / forgot-password / reset).
3. Signed in with no businesses → onboarding (`create_business`
   makes the user owner).
4. Business chosen → active business persisted in localStorage
   (`shopos-business`); data hooks scope every query to it.
5. Logout from the header/sidebar profile menus.

Password recovery: Supabase sends a link with `#access_token=…&type=recovery`;
`supabase-js` detects the session, the router treats recovery hashes
as the reset-password route, and the user sets a new password.

## 7. Deployment

1. Create a Supabase project (dashboard), run migrations against it:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   supabase db seed --local      # optional demo data
   ```
2. Frontend build:
   ```bash
   npm ci
   npm run build        # dist/
   ```
3. Deploy `dist/` to the hosting platform (Netlify/Vercel/static).
   Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` for the build.
4. Edge functions:
   ```bash
   supabase functions deploy integrations-webhook
   supabase secrets set INTEGRATION_WEBHOOK_SECRET=<random> ALLOWED_ORIGINS=https://your-app.example
   ```
5. Set security headers at the hosting layer (see SECURITY.md §9),
   restrict CORS origins, keep Auth rate limits on.
6. Run `supabase/tests/cross_tenant.sql` against the deployed
   database before/after migrating (SECURITY.md §12).

## 8. Integration strategy (future)

- **Provider webhooks** → `integrations-webhook` edge function:
  HMAC verify → timestamp check → idempotent `incoming_events`
  insert → provider handler → `create_order()` with
  `external_order_id` (idempotent by constraint).
- **OAuth / tokens** → edge function exchanges the code with the
  provider; the token is encrypted (`token_cipher` blob) and stored in
  `integration_credentials` — never visible to the browser.
- **Order/status sync from marketplaces** → `create_order` /
  `update_order_status` with per-provider mapping; statuses that
  arrive out of order are rejected by the transition rules.
- Nothing here is implemented yet — the schema and security envelope
  are what make those integrations safe to add.
