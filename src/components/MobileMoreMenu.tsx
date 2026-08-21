import { X, ShoppingCart, Users, Truck, FileText, BarChart3, Plug, Settings, PackagePlus } from 'lucide-react';
import { useI18n } from '@/locales';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import type { Route } from '@/hooks/useRouter';

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
  navigate: (route: Route) => void;
}

export function MobileMoreMenu({ open, onClose, navigate }: MobileMoreMenuProps) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const displayName = profile?.fullName || t.profile;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '?';

  const items: { icon: typeof ShoppingCart; label: string; route: Route }[] = [
    { icon: PackagePlus, label: t.orders + ' +', route: { name: 'create-order' } },
    { icon: ShoppingCart, label: t.products, route: { name: 'products' } },
    { icon: Users, label: t.customers, route: { name: 'customers' } },
    { icon: Truck, label: t.shipping, route: { name: 'shipping' } },
    { icon: FileText, label: t.invoices, route: { name: 'invoices' } },
    { icon: BarChart3, label: t.reports, route: { name: 'reports' } },
    { icon: Plug, label: t.integrations, route: { name: 'integrations' } },
    { icon: Settings, label: t.settings, route: { name: 'settings' } },
  ];

  if (!open) return null;

  return (
    <>
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet animate-slide-up-full">
        <div className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-[16px] font-semibold" style={{ color: 'var(--content)' }}>
            Navigacija
          </h2>
          <button onClick={onClose} className="rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ background: 'var(--surface-2)', color: 'var(--content-secondary)' }}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-2 py-2">
          {items.map((item) => (
            <button
              key={item.route.name}
              onClick={() => { navigate(item.route); onClose(); }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors active:bg-surface-2 min-h-[48px]"
              style={{ color: 'var(--content)' }}
            >
              <item.icon className="h-5 w-5" style={{ color: 'var(--content-tertiary)' }} />
              <span className="text-[15px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Footer: language + profile + theme */}
        <div className="flex items-center gap-1 border-t px-4 py-1.5"
          style={{ borderColor: 'var(--border-color)' }}>
          <LanguageSwitcher />
          <button
            onClick={() => { navigate({ name: 'settings' }); onClose(); }}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2 active:bg-surface-2"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold text-content-secondary">
              {initials}
            </span>
            <span className="truncate text-[12px] font-medium" style={{ color: 'var(--content)' }}>{displayName}</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
