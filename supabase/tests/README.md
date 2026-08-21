# Security verification

These scripts prove — against a real database — that the RLS and
authorization boundaries work. They attempt unauthorized queries
explicitly; they do not stop at happy-path tests.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Docker running (for `supabase start`)

## Run

```bash
supabase start
supabase db reset          # applies migrations + seed data

# Local connection string
export DATABASE_URL="$(supabase status -o env | grep '^DATABASE_URL' | cut -d'=' -f2-)"

psql "$DATABASE_URL" -f supabase/tests/cross_tenant.sql
```

Every check prints `PASS: …` or `FAIL: …`. The script does not stop
on failure — read the whole output. Any `FAIL` means the
authorization boundary is broken; do not deploy until it is fixed.

## What is covered

| Area | Checks |
|---|---|
| Tenant isolation | User A cannot SELECT/UPDATE/INSERT anything owned by tenant B (12 read + 5 write probes) |
| IDOR | Order status, inventory, product delete, customer delete, order create, invoice create, message send, member add — all attempted against tenant B objects via RPC, all must fail |
| Roles | staff cannot delete products, add/remove members, change roles, rename the business |
| Owner guard | owner cannot demote themselves (RPC + direct table update trigger), cannot remove the last owner |
| Inventory | oversell rejected, adjust-below-reserved rejected, reservation ledger recorded |
| Idempotency | duplicate `external_order_id` rejected; duplicate provider event rejected |
| Server-only tables | `integration_credentials`, `incoming_events`, `audit_logs` have zero RLS policies and zero authenticated grants; `anon` has zero table grants |
| RLS coverage | RLS enabled on every business-owned table |

## True concurrency testing

The SQL script covers the sequential guards. To prove the
inventory locks hold under real parallelism, run two simultaneous
order creations against the same product:

```bash
# Terminal 1
psql "$DATABASE_URL" -c "select create_order('<biz>', null, 'webshop', 'cod', 0, 'a','p','e', null, '[{\"product_id\":\"<p1>\",\"quantity\":4}]');"

# Terminal 2 (at the same time)
psql "$DATABASE_URL" -c "select create_order('<biz>', null, 'webshop', 'cod', 0, 'a','p','e', null, '[{\"product_id\":\"<p1>\",\"quantity\":4}]');"
```

With 5 units on hand: exactly one order succeeds, the other fails
with `INSUFFICIENT_STOCK`. Stock can never go negative because the
inventory rows are locked `FOR UPDATE` inside the transaction and
`reserved <= stock` is a CHECK constraint.
