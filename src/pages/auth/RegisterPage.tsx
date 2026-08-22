import { useState, type FormEvent } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { useI18n } from '@/locales';
import { useAuth } from '@/contexts/AuthContext';
import { authErrorMessage } from '@/lib/auth';
import type { Route } from '@/hooks/useRouter';

interface RegisterPageProps {
  navigate: (route: Route) => void;
}

export function RegisterPage({ navigate }: RegisterPageProps) {
  const { t } = useI18n();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      setError(t.auth_error_weak_password);
      return;
    }
    setError('');
    setBusy(true);
    try {
      const err = await signUp(fullName.trim(), email.trim(), password);
      if (err) {
        alert('SIGNUP ERROR: code=' + (err.code || 'none') + ' message=' + (err.message || 'none'));
        setError(authErrorMessage(err, t));
        setBusy(false);
        return;
      }
      setConfirmationEmail(email.trim());
      setConfirmationSent(true);
      setBusy(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert('SIGNUP EXCEPTION: ' + msg);
      setError(t.auth_error_generic);
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResent(false);
    const err = await signUp(fullName.trim(), confirmationEmail, password);
    if (!err) setResent(true);
    setResending(false);
  };

  if (confirmationSent) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate({ name: 'login' })}
          className="flex items-center gap-1.5 text-[13px] text-content-tertiary hover:text-content-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
            <Mail className="h-5 w-5 text-accent" />
          </div>
          <h1 className="mt-4 text-lg font-semibold tracking-tight text-content">
            {t.auth_email_confirmation_title}
          </h1>
          <p className="mt-1 text-[13px] text-content-secondary">
            {t.auth_email_confirmation_desc}
          </p>
          <p className="mt-2 text-[13px] font-medium text-content">
            {confirmationEmail}
          </p>
        </div>

        {resent && (
          <p className="rounded-md border border-success/20 bg-success-subtle px-3 py-2 text-[13px] text-success">
            {t.auth_email_confirmation_resent}
          </p>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="btn-secondary w-full"
          >
            {resending ? t.loading : t.auth_email_confirmation_resend}
          </button>
          <button
            type="button"
            onClick={() => navigate({ name: 'login' })}
            className="btn-primary w-full"
          >
            {t.auth_email_confirmation_back_to_login}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--content)' }}>
          {t.auth_welcomeNew}
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--content-tertiary)' }}>
          {t.auth_signUp} {t.appName}
        </p>
      </div>

      <div>
        <label className="label">{t.auth_fullName}</label>
        <input
          type="text"
          autoComplete="name"
          required
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

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

      <div>
        <label className="label">{t.auth_password}</label>
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-[12px] text-content-tertiary">{t.auth_password_hint}</p>
      </div>

      {error && (
        <p className="rounded-md border border-danger/20 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy || !fullName.trim() || !email.trim() || !password} className="btn-primary w-full">
        {busy ? t.loading : t.auth_submitSignUp}
      </button>

      <p className="pt-1 text-center text-[13px]" style={{ color: 'var(--content-secondary)' }}>
        {t.auth_haveAccount}{' '}
        <button
          type="button"
          onClick={() => navigate({ name: 'login' })}
          className="font-medium text-accent hover:text-accent-hover"
        >
          {t.auth_loginHere}
        </button>
      </p>
    </form>
  );
}
