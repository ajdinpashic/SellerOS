-- SellerOS — 0004: tighten default grants (least privilege)
--
-- Supabase applies default privileges that grant ALL on newly created
-- tables to anon/authenticated. Migration 0002 revoked `anon`
-- entirely and added explicit grants, but the default ALL grants for
-- `authenticated` remained on tables where only specific operations
-- are allowed. RLS always blocked the unwanted paths; this migration
-- removes the grants too, so the Data API surface matches the
-- intended authorization model exactly.
--
-- Net effect after this migration (all row-level gated by RLS):
--   SELECT only:  orders, order_items, order_status_history,
--                 inventory_items, inventory_movements
--   INSERT/UPDATE only where explicitly granted in 0002
--   nothing:      integration_credentials, incoming_events, audit_logs

revoke insert, update, delete on
  public.orders,
  public.order_items,
  public.order_status_history,
  public.inventory_items,
  public.inventory_movements,
  public.integration_credentials,
  public.incoming_events,
  public.audit_logs
from authenticated;

revoke insert, delete on
  public.businesses,
  public.products
from authenticated;

revoke delete on
  public.customers,
  public.shipments,
  public.invoices,
  public.integrations,
  public.conversations,
  public.messages
from authenticated;
