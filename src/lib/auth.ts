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

  // Rate limit
  if (code.includes('rate_limit') || code.includes('429') || msg.includes('rate limit')) {
    return t.auth_error_rate_limit;
  }

  if (code.includes('invalid_credentials') || msg.includes('invalid login credentials')) {
    return t.auth_error_invalid_credentials;
  }
  if (code.includes('email_not_confirmed') || msg.includes('email not confirmed')) {
    return t.auth_error_email_not_confirmed;
  }
  if (code.includes('weak_password') || msg.includes('password should be at least')) {
    return t.auth_error_weak_password;
  }
  if (code.includes('user_already_exists') || code.includes('email_exists') || code.includes('duplicate') || msg.includes('already registered') || msg.includes('already exists')) {
    return t.auth_error_email_exists;
  }
  if (code.includes('email_address_invalid') || code.includes('invalid_email') || msg.includes('invalid email') || msg.includes('email address invalid')) {
    return t.auth_error_invalid_email;
  }
  if (code.includes('network') || code.includes('fetch') || msg.includes('fetch') || msg.includes('network')) {
    return t.auth_error_network;
  }
  if (code.includes('signup_disabled') || msg.includes('signup disabled')) {
    return t.auth_error_generic;
  }
  return t.auth_error_generic;
}
