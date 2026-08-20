import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Inbox, ShoppingCart, Package, Boxes, Users,
  Truck, FileText, BarChart3, Plug, Settings, LifeBuoy,
  Download, ChevronRight, User, LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/locales';
import type { Route } from '@/hooks/useRouter';
import { classNames } from '@/utils/format';
import { currentUser } from '@/data/user';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SidebarProps {
  current: Route['name'];
  navigate: (route: Route) => void;
}

interface NavItem {
  route: Route;
  icon: LucideIcon;
  labelKey: keyof ReturnType<typeof useI18n>['t'];
  count?: number;
}

interface NavGroup {
  labelKey: keyof ReturnType<typeof useI18n>['t'];
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: 'nav_sales',
    items: [
      { route: { name: 'dashboard' }, icon: LayoutDashboard, labelKey: 'dashboard' },
      { route: { name: 'inbox' }, icon: Inbox, labelKey: 'inbox', count: 3 },
      { route: { name: 'orders' }, icon: ShoppingCart, labelKey: 'orders', count: 2 },
    ],
  },
  {
    labelKey: 'nav_catalog',
    items: [
      { route: { name: 'products' }, icon: Package, labelKey: 'products' },
      { route: { name: 'inventory' }, icon: Boxes, labelKey: 'inventory', count: 7 },
      { route: { name: 'customers' }, icon: Users, labelKey: 'customers' },
    ],
  },
  {
    labelKey: 'nav_operations',
    items: [
      { route: { name: 'shipping' }, icon: Truck, labelKey: 'shipping' },
      { route: { name: 'invoices' }, icon: FileText, labelKey: 'invoices' },
    ],
  },
  {
    labelKey: 'nav_analytics',
    items: [
      { route: { name: 'reports' }, icon: BarChart3, labelKey: 'reports' },
    ],
  },
  {
    labelKey: 'nav_connect',
    items: [
      { route: { name: 'integrations' }, icon: Plug, labelKey: 'integrations' },
    ],
  },
];

export function Sidebar({ current, navigate }: SidebarProps) {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setCanInstall(false);
  };

  const isActive = (name: Route['name']) => {
    if (current === 'order-detail' && name === 'orders') return true;
    if (current === 'create-order' && name === 'orders') return true;
    if (current === 'product-detail' && name === 'products') return true;
    if (current === 'customer-detail' && name === 'customers') return true;
    return current === name;
  };

  const handleNav = (item: NavItem) => {
    navigate(item.route);
  };

  const showInstall = canInstall || isIOS;

  return (
    <aside className="flex h-full flex-col border-r border-border bg-surface-0">
      {/* Brand */}
      <div className="flex h-12 shrink-0 items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-[10px] font-bold text-white tracking-tight">
            S
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-content">SellerOS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-2">
        {navGroups.map((group) => (
          <div key={group.labelKey} className="mt-3 first:mt-1">
            <p className="section-label px-2 pb-1">{t[group.labelKey] as string}</p>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const active = isActive(item.route.name);
                const Icon = item.icon;
                return (
                  <li key={item.route.name}>
                    <button
                      onClick={() => handleNav(item)}
                      className={classNames(
                        'group relative flex h-[30px] w-full items-center gap-2 rounded px-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-accent-subtle text-accent'
                          : 'text-content-secondary hover:bg-surface-2 hover:text-content',
                      )}
                    >
                      <Icon className={classNames(
                        'h-4 w-4 shrink-0',
                        active ? 'text-accent' : 'text-content-tertiary group-hover:text-content-secondary',
                      )} />
                      <span className="flex-1 truncate text-left">{t[item.labelKey] as string}</span>
                      {item.count !== undefined && (
                        <span className={classNames(
                          'tnum text-[11px] font-medium',
                          active ? 'text-accent/70' : 'text-content-tertiary',
                        )}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 border-t border-border px-2.5 py-2">
        <div className="space-y-px">
          {([
            { route: { name: 'settings' } as Route, icon: Settings, labelKey: 'settings' as const },
            { route: { name: 'settings' } as Route, icon: LifeBuoy, labelKey: 'help' as const },
          ]).map((item) => {
            const active = isActive(item.route.name) && item.labelKey === 'settings';
            const Icon = item.icon;
            return (
              <button
                key={item.labelKey}
                onClick={() => handleNav(item)}
                className={classNames(
                  'group relative flex h-[30px] w-full items-center gap-2 rounded px-2 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-accent-subtle text-accent'
                    : 'text-content-secondary hover:bg-surface-2 hover:text-content',
                )}
              >
                <Icon className={classNames(
                  'h-4 w-4 shrink-0',
                  active ? 'text-accent' : 'text-content-tertiary group-hover:text-content-secondary',
                )} />
                {t[item.labelKey] as string}
              </button>
            );
          })}
        </div>

        {showInstall && (
          <button
            onClick={handleInstall}
            className="group flex h-[30px] w-full items-center gap-2 rounded px-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent-subtle"
          >
            <Download className="h-4 w-4 text-accent" />
            {t.installApp}
          </button>
        )}

        {/* Profile */}
        <div className="mt-1 border-t border-border pt-1.5" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold text-content-secondary shrink-0">
              {currentUser.initials}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-[13px] font-medium text-content">{currentUser.name}</span>
              <span className="block truncate text-[11px] text-content-tertiary">{t.admin}</span>
            </span>
            <ChevronRight className={classNames('h-3 w-3 text-content-tertiary transition-transform', profileOpen && 'rotate-90')} />
          </button>

          {profileOpen && (
            <div className="mt-1 animate-slide-up rounded-md border border-border bg-surface-0 py-1 shadow-popover">
              <button
                onClick={() => { navigate({ name: 'settings' }); setProfileOpen(false); }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[13px] text-content-secondary hover:bg-surface-2 hover:text-content transition-colors"
              >
                <User className="h-4 w-4" />
                {t.profile}
              </button>
              <button
                onClick={() => { navigate({ name: 'settings' }); setProfileOpen(false); }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[13px] text-content-secondary hover:bg-surface-2 hover:text-content transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t.settings}
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => { setProfileOpen(false); }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger hover:bg-danger-subtle transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
