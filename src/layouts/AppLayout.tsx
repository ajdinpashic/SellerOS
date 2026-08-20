import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { MobileMoreMenu } from '@/components/MobileMoreMenu';
import { CommandPalette } from '@/components/CommandPalette';
import type { Route } from '@/hooks/useRouter';
import type { Order, Product, Customer } from '@/types';

interface AppLayoutProps {
  route: Route;
  navigate: (route: Route) => void;
  children: ReactNode;
  orders: Order[];
  products: Product[];
  customers: Customer[];
}

const fullBleedRoutes: Route['name'][] = ['inbox'];

export function AppLayout({ route, navigate, children, orders, products, customers }: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const fullBleed = fullBleedRoutes.includes(route.name);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-1">
      {/* Desktop sidebar — direct flex child, no wrapper */}
      <div className="hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0">
        <Sidebar
          current={route.name}
          navigate={navigate}
          mobileOpen={false}
          onCloseMobile={() => {}}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative h-full w-64" style={{ background: 'var(--surface-0)' }}>
            <Sidebar
              current={route.name}
              navigate={(r) => { navigate(r); setMobileSidebarOpen(false); }}
              mobileOpen={true}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setMobileSidebarOpen(true)}
          onCommandOpen={() => setCmdOpen(true)}
        />

        <main className="flex-1 overflow-y-auto overscroll-contain pb-20 md:pb-0">
          {fullBleed ? (
            <div className="h-full min-h-full">{children}</div>
          ) : (
            <div className="mx-auto max-w-[1280px] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6 lg:py-5">
              {children}
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <MobileNav current={route.name} navigate={navigate} onMoreClick={() => setMoreOpen(true)} />

      {/* Mobile more menu */}
      <MobileMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} navigate={navigate} />

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        navigate={navigate}
        orders={orders}
        products={products}
        customers={customers}
      />
    </div>
  );
}
