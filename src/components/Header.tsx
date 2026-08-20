import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { useI18n } from '@/locales';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar } from '@/components/ui';
import { currentUser } from '@/data/user';

interface HeaderProps {
  onMenuClick: () => void;
  onCommandOpen: () => void;
}

export function Header({ onMenuClick, onCommandOpen }: HeaderProps) {
  const { t } = useI18n();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
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
      className="z-30 flex shrink-0 items-center gap-2 border-b bg-surface-0"
      style={{
        height: 'calc(48px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Mobile: hamburger */}
      <button
        onClick={onMenuClick}
        className="flex h-11 w-11 items-center justify-center rounded-lg md:hidden"
        style={{ color: 'var(--content-secondary)' }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Brand on mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold text-white"
          style={{ background: 'var(--accent)' }}>
          S
        </div>
        <span className="text-[15px] font-semibold max-[380px]:hidden" style={{ color: 'var(--content)' }}>SellerOS</span>
      </div>

      {/* Search — desktop: flex-1 fills available space, mobile: icon only */}
      <div className="relative hidden flex-1 md:block md:max-w-md md:mx-4">
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
        <span className="kbd absolute right-2 top-1/2 -translate-y-1/2">Ctrl K</span>
      </div>

      {/* Mobile: spacer */}
      <div className="flex-1 md:hidden" />

      {/* Mobile: search icon */}
      <button
        onClick={onCommandOpen}
        className="flex h-11 w-11 items-center justify-center rounded-lg md:hidden"
        style={{ color: 'var(--content-secondary)' }}
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-0.5 pr-2 md:pr-4 lg:pr-6">
        {/* Theme & language live in the mobile sidebar, in the header on desktop */}
        <div className="hidden items-center gap-0.5 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

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

        <button className="flex h-11 w-11 items-center justify-center rounded-lg md:h-8 md:w-8 hover:bg-surface-2">
          <Avatar name={currentUser.name} size="sm" />
        </button>
      </div>
    </header>
  );
}
