import { useState, type FormEvent } from 'react';
import { Check, Building2 } from 'lucide-react';
import { useI18n } from '@/locales';
import { useBusiness } from '@/contexts/BusinessContext';
import { interpolate } from '@/utils/format';

type Channel = 'olx' | 'instagram' | 'facebook' | 'webshop' | 'other';

const channels: Channel[] = ['olx', 'instagram', 'facebook', 'webshop', 'other'];

/**
 * 3-step onboarding:
 * 1. Shop name → creates business
 * 2. Sales channel preferences (multi-select)
 * 3. Ready screen → open SellerOS
 */
export function OnboardingPage() {
  const { t } = useI18n();
  const { createBusiness } = useBusiness();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleChannel = (ch: Channel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const handleStep1 = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2 || busy) {
      setError(t.error_generic);
      return;
    }
    setBusy(true);
    setError('');
    const result = await createBusiness(trimmed);
    if (result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    setBusy(false);
    setStep(2);
  };

  const handleStep2 = () => {
    setStep(3);
  };

  const handleFinish = () => {
    window.location.hash = '#/dashboard';
  };

  const channelLabels: Record<Channel, string> = {
    olx: t.onboarding_step2_olx,
    instagram: t.onboarding_step2_instagram,
    facebook: t.onboarding_step2_facebook,
    webshop: t.onboarding_step2_webshop,
    other: t.onboarding_step2_other,
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-center gap-1.5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s <= step ? 'w-8 bg-accent' : 'w-1.5 bg-content-tertiary/30'
            }`}
          />
        ))}
      </div>

      <p className="text-center text-[12px] text-content-tertiary">
        {interpolate(t.onboarding_progress, { current: String(step), total: '3' })}
      </p>

      {/* Step 1: Shop name */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-content">
              {t.onboarding_step1_title}
            </h1>
          </div>

          <div>
            <label className="label">{t.onboarding_step1_field}</label>
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
            {busy ? t.loading : t.onboarding_continue}
          </button>
        </form>
      )}

      {/* Step 2: Sales channels */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-content">
              {t.onboarding_step2_title}
            </h1>
          </div>

          <div className="space-y-2">
            {channels.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-[14px] transition-colors ${
                  selectedChannels.includes(ch)
                    ? 'border-accent bg-accent-subtle text-accent'
                    : 'border-border bg-surface-0 text-content hover:bg-surface-1'
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    selectedChannels.includes(ch)
                      ? 'border-accent bg-accent text-white'
                      : 'border-border-strong'
                  }`}
                >
                  {selectedChannels.includes(ch) && <Check className="h-3 w-3" />}
                </div>
                {channelLabels[ch]}
              </button>
            ))}
          </div>

          <button type="button" onClick={handleStep2} className="btn-primary w-full">
            {t.onboarding_continue}
          </button>
        </div>
      )}

      {/* Step 3: Ready */}
      {step === 3 && (
        <div className="space-y-4 text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle">
              <Check className="h-6 w-6 text-success" />
            </div>
            <h1 className="mt-4 text-lg font-semibold tracking-tight text-content">
              {t.onboarding_step3_title}
            </h1>
            <p className="mt-1 text-[13px] text-content-secondary">
              {t.onboarding_step3_desc}
            </p>
          </div>

          <button type="button" onClick={handleFinish} className="btn-primary w-full">
            {t.onboarding_step3_cta}
          </button>
        </div>
      )}
    </div>
  );
}
