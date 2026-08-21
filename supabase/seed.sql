-- SellerOS — Full Development Database Reset
--
-- ⚠️ WARNING: This will DELETE ALL data including auth users. Do NOT run in production.
--
-- Usage:
--   Via SQL Editor: Run this file in the Supabase Dashboard SQL Editor
--   After reset: Register a new account through the app.

-- ── Disable owner guard so we can wipe business_members ────────────────

ALTER TABLE public.business_members DISABLE TRIGGER guard_membership_changes;

-- ── Clear application data (order matters due to foreign keys) ──────────

DELETE FROM public.integration_credentials;
DELETE FROM public.integrations;
DELETE FROM public.messages;
DELETE FROM public.conversations;
DELETE FROM public.order_status_history;
DELETE FROM public.order_items;
DELETE FROM public.shipments;
DELETE FROM public.invoices;
DELETE FROM public.orders;
DELETE FROM public.customers;
DELETE FROM public.inventory_items;
DELETE FROM public.inventory_movements;
DELETE FROM public.products;
DELETE FROM public.business_members;
DELETE FROM public.businesses;

-- ── Clear auth users (cascades to profiles via FK) ─────────────────────

DELETE FROM auth.users;

-- ── Re-enable owner guard ──────────────────────────────────────────────

ALTER TABLE public.business_members ENABLE TRIGGER guard_membership_changes;

-- ── Done ───────────────────────────────────────────────────────────────

-- ── Done ───────────────────────────────────────────────────────────────
