# SellerOS — Security documentation

SellerOS is a multi-tenant SaaS for marketplace sellers. This document
describes how the application is secured. The guiding principles are
**secure by design, least privilege, defense in depth, and continuous
testing** — not a claim that the application is "unhackable".

Security is demonstrated through the RLS policies in
`supabase/migrations/20260821000002_rls.sql`, the transactional
functions in `20260821000003_functions.sql`, and the automated
verification in `supabase/tests/cross_tenant.sql`.

---

## 1. Threat model (what we defend against)

| Threat | Defense |
|---|---|
| Cross-tenant access (User A reads/writes Business B's data) | RLS on every business-owned table; SECURITY DEFINER functions re-check membership; verified by tests |
| IDOR (modifying IDs in requests, e.g. `/orders/<uuid>`) | Every object lookup is scoped by RLS; sensitive operations go through functions that verify `is_business_member(business_id)` server-side |
| Client-trusted financial data (fake `total_amount`) | Order totals are computed inside `create_order()` from validated line items; clients never send totals |
| Inventory corruption (negative stock, overselling, double reservation) | Row locks `FOR UPDATE` + CHECK constraints + transactional functions; verified by tests |
| Privilege escalation (staff → owner) | Role checks in functions; owner-only policies; trigger guard blocks self-demotion and last-owner removal |
| Secret leakage (service-role key, provider tokens) | Publishable (anon) key only in the browser; secrets server-side only; credential table has zero client grants |
| Webhook abuse (forged/replayed/duplicate events) | HMAC signature + timestamp validation + idempotency constraints (see §6) |
| Abuse (sign-in brute force, unbounded public writes) | Supabase Auth rate limiting + no public write endpoints (see §7) |

---

## 2. Authentication

- **Supabase Auth** owns credentials (email/password). SellerOS never
  stores or sees passwords; there is no custom password table.
- Browser access uses the **publishable (anon) key** only. The
  **service-role key never appears in client code** — it is used by
  server-side code only (edge functions, CI).
- Session persistence via `supabase-js` (`persistSession`,
  `autoRefreshToken`, `detectSessionInUrl`).
- Flows implemented: sign up, sign in, sign out, forgot password,
  password reset (recovery session), change password.
- The frontend never assumes a user is authenticated: an explicit
  auth loading state gates rendering, and protected routes render the
  app only after session + membership state settles.
- When Supabase is not configured (`VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` missing), the app runs in **demo mode**
  (mock data, local-only) so development and the original frontend
  experience keep working. Demo mode is clearly labelled in the UI.

## 3. Authorization & tenant isolation

Every business-owned row carries `business_id`. RLS is the **final
authorization boundary** — frontend filtering is never a substitute.

Helper functions used by policies and by SECURITY DEFINER functions:

- `is_business_member(business_id)` — any member
- `is_business_admin(business_id)` — owner or admin
- `is_business_owner(business_id)` — owner only

Roles: `owner` > `admin` > `staff`.

| Action | Allowed for |
|---|---|
| Read business data | any member |
| Create customers / shipments / invoices / integrations / conversations / messages | any member (RLS `WITH CHECK` membership) |
| Update products, customers, shipments, invoices, integrations | any member |
| Delete products (soft) | owner/admin (function) |
| Add members | owner (any role); admin (staff only); staff never |
| Change member roles | owner only; never own role; never demote the last owner |
| Rename business | owner only |
| Read/write orders, order status, inventory | through `create_order` / `update_order_status` / `adjust_inventory` functions (any member), which re-check membership inside |
| Server-only tables (`integration_credentials`, `incoming_events`, `audit_logs`) | nobody via the Data API (no grants, no policies) |

`businesses`, `business_members`, `orders`, `order_items`,
`order_status_history`, `inventory_items`, `inventory_movements` and
`products` have no direct INSERT/DELETE grants — writes flow through
SECURITY DEFINER functions so invariants (totals, inventory, history,
audit) are enforced atomically.

## 4. Row Level Security strategy

- RLS enabled on **all 18 business-owned tables** (verified by test).
- `anon` has **zero** grants in the `public` schema (revoked in
  migration 0002, verified by test).
- `authenticated` grants are explicit and minimal (least privilege);
  policies then gate rows.
- **No broad policies** like "authenticated can select everything" —
  every policy references `is_business_member(business_id)`.
- SECURITY DEFINER functions run as the table owner (bypassing RLS)
  and therefore **re-check membership explicitly on every call**; the
  tests prove cross-tenant RPC attempts fail with `NOT_A_MEMBER`.
- `profiles` is user-scoped (`user_id = auth.uid()`), not
  business-scoped.

## 5. Secrets

| Secret | Location | Never in |
|---|---|---|
| Supabase anon/publishable key | `VITE_SUPABASE_ANON_KEY` (client) | — (safe: RLS-protected) |
| Supabase service-role key | `SUPABASE_SERVICE_ROLE_KEY` (edge functions / CI only) | browser bundle, `VITE_*`, public JSON, logs, error messages |
| Provider integration secrets | `WEBHOOK_SECRET_<PROVIDER>` / `INTEGRATION_WEBHOOK_SECRET` (edge function env) | client, database plaintext, logs |
| OAuth/provider tokens | `integration_credentials.token_cipher` (encrypted blob, server-side only) | browser-visible tables, plaintext columns |

Rules:

- `.env*` files are git-ignored; `.env.example` documents the shape
  only. No real secrets are committed.
- The browser build contains only the anon key.
- Error messages returned to clients are safe codes
  (`INSUFFICIENT_STOCK`, `NOT_A_MEMBER`, …); raw database/Supabase
  error text is never surfaced (mapped in `src/lib/api.ts` /
  `src/lib/auth.ts`).

## 6. Webhook security

The receiver edge function (`supabase/functions/integrations-webhook`)
implements the security envelope every provider webhook must pass:

1. **Signature verification** — HMAC-SHA256 over
   `timestamp + "." + rawBody` with the provider's secret, compared
   in constant time.
2. **Timestamp validation** — rejects requests older than ±5 minutes
   (replay protection).
3. **Idempotency** — `incoming_events` has
   `UNIQUE (business_id, provider, external_event_id)`; duplicate
   events are acknowledged but never processed twice.
4. **Payload size limit** (1 MB), provider/business validation, and
   CORS restricted to configured origins.

Provider-specific parsing is intentionally **not** implemented yet
(see BACKEND.md). When it is, order creation from webhooks must go
through `create_order()` with `external_order_id` so the same
`UNIQUE (business_id, external_order_id)` constraint makes order
creation idempotent too.

## 7. Rate limiting / abuse protection

- **Sign-in & password reset**: Supabase Auth applies built-in rate
  limiting (email/password attempts, reset emails). Keep Auth rate
  limits enabled in the dashboard; they are on by default.
- **Public webhook endpoint**: no unlimited unauthenticated writes —
  every request requires a valid signature before any insert; the
  idempotency constraint prevents duplicate ingestion.
- **Future public APIs**: any new public endpoint must be designed
  with provider-side limits or application-side controls; this is a
  review gate, not an afterthought.

## 8. CORS

- Edge functions allow only origins from `ALLOWED_ORIGINS`
  (default `http://localhost:5173`). Never `*` for authenticated
  traffic.
- Production origins: add the deployed frontend origin to
  `ALLOWED_ORIGINS` in the edge function environment.
- Development origins: `http://localhost:5173` (Vite).

## 9. Security headers

Configured at the **hosting layer** (Netlify/Vercel/other):

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
```

Notes:

- A CSP is deliberately **not** hard-coded into `index.html` — the
  app uses Google Fonts and inline styles, and a broken CSP breaks
  the app. Apply the header above at the hosting layer and adjust
  `connect-src` to your project's Supabase URL.
- The app is a static SPA (Vite build in `dist/`); no server-side
  templates exist.

## 10. Logging policy

- Structured, safe server logs (edge function `console.info/error`
  with provider, business id, event id — never payloads).
- Never log: passwords, access/refresh tokens, OAuth client secrets,
  Supabase service-role keys, full authorization headers, provider
  secrets, or payload bodies.
- Database errors are never echoed to clients (safe codes only);
  diagnostic detail stays server-side.
- Correlation: `incoming_events` rows carry `external_event_id` per
  business, which correlates webhook processing.

## 11. Rotating secrets

1. **Supabase anon key**: Dashboard → Settings → API → *Roll anon
   key*. Update `VITE_SUPABASE_ANON_KEY`, redeploy the frontend.
2. **Supabase service-role key**: Dashboard → Settings → API → *Roll
   service_role key*. Update edge function env vars immediately —
   service-role is not versioned; rotation is instant and global.
3. **Provider webhook secrets**: generate a new value, update
   `WEBHOOK_SECRET_<PROVIDER>` in edge function env, redeploy, then
   update the secret on the provider's side.

## 12. Production checklist

- [x] No real secrets committed; `.env*` ignored
- [x] RLS enabled on every exposed table (tested)
- [x] Cross-tenant access tests pass (`supabase/tests/cross_tenant.sql`)
- [x] Staff permission tests pass
- [x] Object-level (IDOR) authorization tested
- [x] Input validation implemented (server-side functions + DB CHECKs)
- [x] Database constraints implemented (NOT NULL / CHECK / UNIQUE / FK)
- [x] Inventory concurrency protected (row locks + constraints)
- [x] Order totals computed server-side
- [x] Secrets server-side only
- [ ] CORS restricted in production edge functions (`ALLOWED_ORIGINS`)
- [ ] Security headers set at the hosting layer (see §9)
- [ ] Error messages sanitized (safe codes — implemented; verify in review)
- [ ] Sensitive values excluded from logs
- [x] Webhook security architecture ready (signature/timestamp/idempotency)
- [x] Idempotency constraints on external orders and events
- [x] Audit trail for sensitive actions (`audit_logs`)
- [x] `npm run typecheck` / `npm run lint` / `npm run build` pass

## 13. Known limitations / honest assessment

- **Security tests have been executed against the hosted project**
  (`supabase db query --linked -f supabase/tests/cross_tenant.sql`)
  and pass end-to-end, including IDOR, staff-role and owner-guard
  probes. Running them in CI is still a follow-up.
- **Edge functions are stubs.** Signature verification and
  idempotency are implemented and testable, but no provider is wired
  up, so end-to-end webhook flow is untested.
- **Rate limiting** relies on Supabase Auth defaults; no custom
  per-IP throttling exists.
- **`incoming_events` and `integration_credentials` encryption**:
  the schema stores an encrypted blob (`token_cipher`) — the
  encryption/decryption implementation for provider tokens is a
  follow-up (edge functions + key in env).
- **Audit logs** are written by the transactional functions; there is
  no UI or query path for them yet (by design — server-side only).
- Direct Data API writes exist for leaf tables (customers,
  shipments, invoices, integrations, conversations, messages) —
  validated by DB constraints and scoped by RLS, but not wrapped in
  functions. Orders and inventory are function-only.
