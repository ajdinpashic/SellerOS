import { LayoutDashboard, MessageSquare, Package, Boxes, MoreHorizontal } from 'lucide-react';
import { useI18n } from '@/locales';
import type { Route } from '@/hooks/useRouter';

interface MobileNavProps {
  current: Route['name'];
  navigate: (route: Route) => void;
  onMoreClick: () => void;
}

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  route: Route;
}

export function MobileNav({ current, navigate, onMoreClick }: MobileNavProps) {
  const { t } = useI18n();

  const primaryItems: NavItem[] = [
    { icon: LayoutDashboard, label: t.dashboard, route: { name: 'dashboard' } },
    { icon: MessageSquare, label: t.inbox, route: { name: 'inbox' } },
    { icon: Package, label: t.orders, route: { name: 'orders' } },
    { icon: Boxes, label: t.inventory, route: { name: 'inventory' } },
  ];

return (
    <nav
      className="md:hidden"
      style={{
        background: 'var(--surface-0)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch justify-around border-t px-1 pt-1 pb-1"
        style={{ borderColor: 'var(--border-color)' }}>
        {primaryItems.map((item) => {
          const isActive = current === item.route.name;
          return (
            <button
              key={item.route.name}
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 min-w-[56px] min-h-[48px] transition-colors"
              style={{
                color: isActive ? 'var(--accent)' : 'var(--content-tertiary)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
              }}
            >
              <item.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 min-w-[56px] min-h-[48px] transition-colors"
          style={{ color: 'var(--content-tertiary)' }}
        >
          <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={1.8} />
          <span className="text-[10px] font-medium leading-none">Više</span>
        </button>
      </div>
    </nav>
  );
}
