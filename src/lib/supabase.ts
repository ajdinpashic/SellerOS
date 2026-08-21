import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client — the ONLY Supabase client in the app.
 *
 * Uses the publishable (anon) key. RLS is the authorization boundary;
 * the anon key is safe to ship to the browser BECAUSE every table is
 * locked down by Row Level Security.
 *
 * The secret/service-role key never appears in this codebase's client
 * bundle — it is server-side only (edge functions, CI scripts).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function assertSupabase(): NonNullable<typeof supabase> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}
