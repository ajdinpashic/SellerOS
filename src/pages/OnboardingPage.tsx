import { useState, type FormEvent } from 'react';
import { Check, Building2 } from 'lucide-react';
import { useI18n } from '@/locales';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * First-run onboarding: create your business. The user becomes the
 * owner of the business (create_business does both atomically).
 */
export function OnboardingPage() {
  const { t } = useI18n();
  const { createBusiness } = useBusiness();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2 || busy) {
      setError(t.error_generic);
      return;
    }
    setBusy(true);
    setError('');
    const result = await createBusiness(trimmed);
    if (result.error) setError(result.error);
    // On success BusinessContext exposes the new business and AppShell
    // re-renders into the app.
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--content)' }}>
          {t.onboarding_title}
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--content-tertiary)' }}>
          {t.onboarding_desc}
        </p>
      </div>

      {profile && (
        <div className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-[13px] text-content-secondary">
          <Check className="h-4 w-4 text-success" />
          {profile.fullName || profile.userId}
        </div>
      )}

      <div>
        <label className="label">{t.onboarding_businessName}</label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
          <input
            className="input pl-9"
            placeholder={t.onboarding_placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            autoFocus
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-danger/20 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy || name.trim().length < 2} className="btn-primary w-full">
        {busy ? t.loading : t.onboarding_cta}
      </button>
    </form>
  );
}
