import { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut } from 'lucide-react';
import { useI18n } from '@/locales';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import type { Route } from '@/hooks/useRouter';

interface HeaderProps {
  onCommandOpen: () => void;
  navigate?: (route: Route) => void;
}

export function Header({ onCommandOpen, navigate }: HeaderProps) {
  const { t } = useI18n();
  const { profile, signOut } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onCommandOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCommandOpen]);

  const notifications = [
    { id: 1, text: t.notif_new_order, time: t.notif_5min },
    { id: 2, text: t.notif_low_stock, time: t.notif_1h },
    { id: 3, text: t.notif_shipment, time: t.notif_2h },
  ];

  return (
    <header
      className="z-30 flex shrink-0 items-center gap-1 border-b bg-surface-0 sm:gap-2"
      style={{
        height: 'calc(48px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Left zone — brand on mobile, empty spacer on desktop (balances the search) */}
      <div className="flex min-w-0 flex-1 items-center pl-2 md:pl-0">
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold text-white"
            style={{ background: 'var(--accent)' }}>
            S
          </div>
          <span className="hidden text-[15px] font-semibold sm:inline" style={{ color: 'var(--content)' }}>SellerOS</span>
        </div>
      </div>

      {/* Center zone — desktop/tablet search input; mobile search lives in the bottom nav */}
      <div className="flex items-center justify-center">
        <div className="relative hidden w-full max-w-md md:block md:mx-4">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
          <input
            id="global-search"
            type="search"
            inputMode="search"
            placeholder={t.search}
            onFocus={(e) => { e.target.blur(); onCommandOpen(); }}
            readOnly
            className="input cursor-pointer pl-7 pr-10"
          />
          <span className="kbd absolute right-2 top-1/2 hidden -translate-y-1/2 md:flex">Ctrl K</span>
        </div>
      </div>

      {/* Right zone — actions, right-aligned */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5 pr-2 md:pr-4 lg:pr-6">
        {/* Theme & language live in the mobile "more" sheet, in the header on desktop */}
        <div className="hidden items-center gap-0.5 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Mobile search icon — right next to notifications */}
        <button
          onClick={onCommandOpen}
          aria-label={t.search}
          className="flex h-11 w-11 items-center justify-center rounded-lg md:hidden"
          style={{ color: 'var(--content-secondary)' }}
        >
          <Search className="h-5 w-5" />
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg md:h-8 md:w-8"
            style={{ color: 'var(--content-secondary)' }}
          >
            <Bell className="h-5 w-5 md:h-4 md:w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface-0 md:right-1 md:top-1 md:h-1.5 md:w-1.5" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-50 mt-1 w-72 animate-slide-up rounded-md border bg-surface-0 py-1 shadow-popover"
              style={{ borderColor: 'var(--border-color)' }}>
              <div className="border-b px-3 py-2" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--content)' }}>{t.notifications}</span>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className="cursor-pointer px-3 py-2.5 hover:bg-surface-1 transition-colors">
                  <p className="text-[13px]" style={{ color: 'var(--content)' }}>{n.text}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--content-tertiary)' }}>{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            aria-label={t.profile}
            className="flex h-11 w-11 items-center justify-center rounded-lg md:h-8 md:w-8 hover:bg-surface-2 transition-colors"
          >
            <Avatar name={profile?.fullName || t.profile} size="sm" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-50 mt-1 w-60 animate-slide-up rounded-md border bg-surface-0 py-1 shadow-popover"
              style={{ borderColor: 'var(--border-color)' }}>
              <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--border-color)' }}>
                <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--content)' }}>
                  {profile?.fullName || t.profile}
                </p>
                <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--content-tertiary)' }}>
                  {t.account}
                </p>
              </div>
              <button
                onClick={() => { setProfileOpen(false); navigate?.({ name: 'settings' }); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-content-secondary hover:bg-surface-2 hover:text-content transition-colors"
              >
                {t.settings}
              </button>
              <div className="my-1 border-t" style={{ borderColor: 'var(--border-color)' }} />
              <button
                onClick={() => { void signOut(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-danger hover:bg-danger-subtle transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}