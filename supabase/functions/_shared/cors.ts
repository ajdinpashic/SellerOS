// Shared CORS helpers for SellerOS edge functions.
//
// Never `*` for authenticated traffic. Allowed origins come from the
// ALLOWED_ORIGINS environment variable (comma-separated) and default
// to the local dev origin only.

export const corsHeaders = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provider-signature, x-provider-timestamp, x-provider-event-id',
  'Access-Control-Max-Age': '86400',
};

export function allowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Returns CORS headers for a request, or null when the origin is not allowed. */
export function corsFor(req: Request): Record<string, string> | null {
  const origin = req.headers.get('origin');
  if (!origin) return corsHeaders; // non-browser caller (webhook provider)
  const origins = allowedOrigins();
  if (origins.includes('*')) return { ...corsHeaders, 'Access-Control-Allow-Origin': '*' };
  if (!origins.includes(origin)) return null;
  return { ...corsHeaders, 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' };
}
