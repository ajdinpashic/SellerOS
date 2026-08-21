-- SellerOS — 0006: remove leftover SELECT grants on server-only tables
--
-- Supabase's default privileges granted SELECT (alongside the other
-- DML) on integration_credentials, incoming_events and audit_logs.
-- Migration 0004 revoked INSERT/UPDATE/DELETE; this one removes the
-- SELECT grant too, so the Data API has NO access to these tables at
-- all. RLS already blocked reads (no policies); this removes the
-- grant surface entirely (defense in depth).

revoke select on
  public.integration_credentials,
  public.incoming_events,
  public.audit_logs
from authenticated;
