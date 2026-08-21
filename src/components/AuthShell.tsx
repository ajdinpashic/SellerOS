import { type ReactNode } from 'react';
import { useI18n } from '@/locales';

/**
 * Layout for public auth screens (login, register, forgot/reset
 * password, onboarding). Uses the existing SellerOS design system —
 * no redesign, just a centered card.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col bg-surface-1">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="mb-6 flex flex-col items-center">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-md text-base font-bold text-white"
              style={{ background: 'var(--accent)' }}
            >
              S
            </div>
            <p className="mt-3 text-lg font-semibold tracking-tight" style={{ color: 'var(--content)' }}>
              {t.appName}
            </p>
            <p className="mt-0.5 text-center text-[13px]" style={{ color: 'var(--content-tertiary)' }}>
              {t.tagline}
            </p>
          </div>

          <div className="card p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
