import { useState, type FormEvent } from 'react';
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
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
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
    const err = await signUp(fullName.trim(), email.trim(), password);
    if (err) {
      setError(authErrorMessage(err, t));
    } else {
      // If email confirmation is enabled, signUp returns success but the
      // user must confirm first — send them to the sign-in screen.
      navigate({ name: 'login' });
    }
    setBusy(false);
  };

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

      <button type="submit" disabled={busy} className="btn-primary w-full">
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
