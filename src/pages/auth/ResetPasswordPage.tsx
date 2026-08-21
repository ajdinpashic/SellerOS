import { useState, type FormEvent } from 'react';
import { useI18n } from '@/locales';
import { useAuth } from '@/contexts/AuthContext';
import { authErrorMessage } from '@/lib/auth';

/**
 * Shown when the user opens the password-recovery link from email.
 * Supabase has already exchanged the recovery token for a session
 * (PASSWORD_RECOVERY event); this page lets them set a new password.
 */
export function ResetPasswordPage() {
  const { t } = useI18n();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      setError(t.auth_passwords_mismatch);
      return;
    }
    setError('');
    setBusy(true);
    const err = await updatePassword(password);
    if (err) {
      setError(authErrorMessage(err, t));
    } else {
      setDone(true);
    }
    setBusy(false);
  };

  if (done) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-success/20 bg-success-subtle px-3 py-2 text-[13px] text-success">
          {t.auth_passwordUpdated}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--content)' }}>
          {t.auth_resetTitle}
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--content-tertiary)' }}>
          {t.auth_resetDesc}
        </p>
      </div>

      <div>
        <label className="label">{t.auth_password}</label>
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="label">{t.auth_confirmPassword}</label>
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className="input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-md border border-danger/20 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy || !password} className="btn-primary w-full">
        {busy ? t.loading : t.auth_submitReset}
      </button>
    </form>
  );
}
