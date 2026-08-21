import { useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/locales';
import { useAuth } from '@/contexts/AuthContext';
import { authErrorMessage } from '@/lib/auth';
import type { Route } from '@/hooks/useRouter';

interface ForgotPasswordPageProps {
  navigate: (route: Route) => void;
}

export function ForgotPasswordPage({ navigate }: ForgotPasswordPageProps) {
  const { t } = useI18n();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError('');
    const err = await resetPassword(email.trim());
    if (err) {
      setError(authErrorMessage(err, t));
    } else {
      setSent(true);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => navigate({ name: 'login' })}
        className="flex items-center gap-1.5 text-[13px] text-content-tertiary hover:text-content-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.back}
      </button>

      <div>
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--content)' }}>
          {t.auth_forgotTitle}
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--content-tertiary)' }}>
          {t.auth_forgotDesc}
        </p>
      </div>

      {sent ? (
        <p className="rounded-md border border-success/20 bg-success-subtle px-3 py-2 text-[13px] text-success">
          {t.auth_resetSent}
        </p>
      ) : (
        <>
          <div>
            <label className="label">{t.auth_email}</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md border border-danger/20 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy || !email.trim()} className="btn-primary w-full">
            {busy ? t.loading : t.auth_sendReset}
          </button>
        </>
      )}
    </form>
  );
}
