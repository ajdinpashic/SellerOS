// SellerOS — generic integration webhook receiver (architecture stub)
//
// Future marketplace integrations (OLX, Instagram, …) will deliver
// events here. This function implements the security envelope that
// EVERY provider webhook must pass before anything is processed:
//
//   1. HMAC-SHA256 signature verification (per-provider secret)
//   2. Timestamp validation (reject stale/replayed requests, ±5 min)
//   3. Idempotency — incoming_events has a unique constraint on
//      (business_id, provider, external_event_id); duplicate events
//      are acknowledged but never processed twice
//   4. Payload stored server-side only; never returned to the caller
//
// No provider is wired up yet — this is the security boundary that
// provider handlers will be built behind. Provider-specific parsing
// is intentionally NOT implemented here (see BACKEND.md).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsFor } from '../_shared/cors.ts';

const MAX_AGE_SECONDS = 300;

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** Constant-time HMAC comparison (timing-safe). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifySignature(secret: string, rawBody: string, timestamp: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return safeEqual(expected, signature);
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (!cors) {
    return jsonResponse(403, { error: 'origin_not_allowed' });
  }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' }, cors);
  }

  const url = new URL(req.url);
  const provider = (url.searchParams.get('provider') ?? '').toLowerCase();
  const businessId = url.searchParams.get('business_id') ?? '';

  // ── 1. Provider + business must be resolvable ──────────────
  if (!provider || !/^[a-z0-9-]{1,40}$/.test(provider)) {
    return jsonResponse(400, { error: 'invalid_provider' }, cors);
  }
  if (!businessId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId)) {
    return jsonResponse(400, { error: 'invalid_business_id' }, cors);
  }

  const secret = Deno.env.get(`WEBHOOK_SECRET_${provider.toUpperCase()}`) ?? Deno.env.get('INTEGRATION_WEBHOOK_SECRET');
  if (!secret) {
    // Misconfiguration — never a leak, just a safe error.
    return jsonResponse(500, { error: 'server_not_configured' }, cors);
  }

  // ── 2. Signature + timestamp ───────────────────────────────
  const signature = req.headers.get('x-provider-signature');
  const timestamp = req.headers.get('x-provider-timestamp');
  const eventId = req.headers.get('x-provider-event-id');
  const eventType = req.headers.get('x-provider-event-type') ?? 'unknown';

  if (!signature || !timestamp || !eventId) {
    return jsonResponse(401, { error: 'missing_signature' }, cors);
  }
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_AGE_SECONDS) {
    return jsonResponse(401, { error: 'stale_timestamp' }, cors);
  }
  if (eventId.length > 200) {
    return jsonResponse(400, { error: 'invalid_event_id' }, cors);
  }

  const rawBody = await req.text();
  if (rawBody.length > 1_000_000) {
    return jsonResponse(413, { error: 'payload_too_large' }, cors);
  }

  const valid = await verifySignature(secret, rawBody, timestamp, signature);
  if (!valid) {
    return jsonResponse(401, { error: 'invalid_signature' }, cors);
  }

  // ── 3. Idempotent ingestion ────────────────────────────────
  // Service-role client only — this function runs server-side.
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse(500, { error: 'server_not_configured' }, cors);
  }
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: 'invalid_json' }, cors);
  }

  const { data, error } = await sb
    .from('incoming_events')
    .upsert(
      {
        business_id: businessId,
        provider,
        external_event_id: eventId,
        event_type: eventType,
        payload,
        status: 'received',
      },
      { onConflict: 'business_id,provider,external_event_id', ignoreDuplicates: true },
    )
    .select('id')
    .maybeSingle();

  if (error) {
    // Never echo database error details to the caller.
    console.error('webhook:ingest_failed', { provider, businessId, eventId, error: error.message });
    return jsonResponse(500, { error: 'ingest_failed' }, cors);
  }

  // Duplicate event (upsert ignored the conflict) → acknowledge, do nothing.
  const isDuplicate = data === null;

  // ── 4. Provider processing hook ────────────────────────────
  // TODO(integrations): dispatch to a provider handler by
  // (provider, event_type). Orders created from here must go through
  // create_order() with external_order_id for idempotency.

  console.info('webhook:received', { provider, businessId, eventId, eventType, isDuplicate });
  return jsonResponse(200, { ok: true, duplicate: isDuplicate }, cors);
});
