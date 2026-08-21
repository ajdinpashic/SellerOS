-- SellerOS — Development Database Reset
--
-- This script clears ALL application data while preserving schema, RLS policies,
-- database functions, and extensions. It is intended for development only.
--
-- ⚠️ WARNING: This will DELETE all application data. Do NOT run in production.
--
-- Usage:
--   Via Supabase CLI: supabase db reset
--   Via SQL Editor:   Run this file in the Supabase Dashboard SQL Editor
--
-- After reset, register a new account through the app. The database will be empty.
-- New users will see proper empty states.

-- ── Clear application data (order matters due to foreign keys) ──────────

-- Messages & conversations (depend on customers, business)
DELETE FROM public.messages;
DELETE FROM public.conversations;

-- Order status history, order items, orders (depend on customers, products)
DELETE FROM public.order_status_history;
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- Inventory movements (depend on products)
DELETE FROM public.inventory_movements;

-- Shipments (depend on orders)
DELETE FROM public.shipments;

-- Invoices (depend on orders)
DELETE FROM public.invoices;

-- Integrations (depend on businesses)
DELETE FROM public.integrations;

-- Customers (depend on businesses)
DELETE FROM public.customers;

-- Inventory items (depend on products)
DELETE FROM public.inventory_items;

-- Products (depend on businesses)
DELETE FROM public.products;

-- Business members (depend on businesses, auth.users)
DELETE FROM public.business_members;

-- Profiles (depend on auth.users)
DELETE FROM public.profiles;

-- Businesses
DELETE FROM public.businesses;

-- ── Done ───────────────────────────────────────────────────────────────
-- The database schema, RLS policies, functions, and extensions are preserved.
-- Register a fresh account through the app to start with a clean state.
