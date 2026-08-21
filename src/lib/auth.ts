import type { LocaleDict } from '@/locales/bs';
import type { AuthError } from '@/contexts/AuthContext';

/**
 * Maps Supabase auth errors to safe, localized messages.
 * Raw Supabase error strings are never shown to users directly.
 */
export function authErrorMessage(error: AuthError | null | undefined, t: LocaleDict): string {
  if (!error) return '';
  const code = error.code?.toLowerCase() ?? '';
  const msg = error.message.toLowerCase();

  if (code.includes('invalid_credentials') || msg.includes('invalid login credentials')) {
    return t.auth_error_invalid_credentials;
  }
  if (code.includes('email_not_confirmed') || msg.includes('email not confirmed')) {
    return t.auth_error_email_not_confirmed;
  }
  if (code.includes('weak_password') || msg.includes('password should be at least')) {
    return t.auth_error_weak_password;
  }
  if (code.includes('user_already_exists') || code.includes('email_exists') || msg.includes('already registered')) {
    return t.auth_error_email_exists;
  }
  if (code.includes('network') || msg.includes('fetch') || msg.includes('network')) {
    return t.auth_error_network;
  }
  return t.auth_error_generic;
}
