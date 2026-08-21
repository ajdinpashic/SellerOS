import { useState, type FormEvent } from 'react';
import { useI18n } from '@/locales';
import { useAuth } from '@/contexts/AuthContext';
import { authErrorMessage } from '@/lib/auth';
import type { Route } from '@/hooks/useRouter';

interface LoginPageProps {
  navigate: (route: Route) => void;
}

export function LoginPage({ navigate }: LoginPageProps) {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || busy) return;
    setBusy(true);
    setError('');
    const err = await signIn(email.trim(), password);
    if (err) setError(authErrorMessage(err, t));
    setBusy(false);
    // On success AuthContext flips to signed-in and AppShell re-renders.
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--content)' }}>
          {t.auth_welcomeBack}
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--content-tertiary)' }}>
          {t.auth_signIn} {t.appName}
        </p>
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
        <div className="flex items-center justify-between">
          <label className="label">{t.auth_password}</label>
          <button
            type="button"
            onClick={() => navigate({ name: 'forgot-password' })}
            className="text-[12px] font-medium text-accent hover:text-accent-hover"
          >
            {t.auth_forgot}
          </button>
        </div>
        <input
          type="password"
          autoComplete="current-password"
          required
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-md border border-danger/20 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy || !email.trim() || !password} className="btn-primary w-full">
        {busy ? t.loading : t.auth_submitSignIn}
      </button>

      <p className="pt-1 text-center text-[13px]" style={{ color: 'var(--content-secondary)' }}>
        {t.auth_noAccount}{' '}
        <button
          type="button"
          onClick={() => navigate({ name: 'register' })}
          className="font-medium text-accent hover:text-accent-hover"
        >
          {t.auth_createOne}
        </button>
      </p>
    </form>
  );
}
