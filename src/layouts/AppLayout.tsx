import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { MobileMoreMenu } from '@/components/MobileMoreMenu';
import { CommandPalette } from '@/components/CommandPalette';
import { InstallBanner } from '@/components/InstallBanner';
import type { Route } from '@/hooks/useRouter';

interface AppLayoutProps {
  route: Route;
  navigate: (route: Route) => void;
  children: ReactNode;
}

const fullBleedRoutes: Route['name'][] = ['inbox'];

export function AppLayout({ route, navigate, children }: AppLayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const fullBleed = fullBleedRoutes.includes(route.name);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-1">
      {/* Desktop/tablet sidebar — hidden on phones */}
      <div className="hidden md:flex md:flex-col md:w-56 md:shrink-0">
        <Sidebar
          current={route.name}
          navigate={navigate}
        />
      </div>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onCommandOpen={() => setCmdOpen(true)}
          navigate={navigate}
        />

        <main className="flex-1 overflow-y-auto overscroll-contain pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-0">
          {fullBleed ? (
            <div className="h-full min-h-full">{children}</div>
          ) : (
            <div className="mx-auto max-w-[1280px] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6 lg:py-5">
              {children}
            </div>
          )}
        </main>

        {/* Mobile bottom nav — fixed to viewport bottom */}
        <MobileNav current={route.name} navigate={navigate} onMoreClick={() => setMoreOpen(true)} />
      </div>

      {/* Mobile more menu */}
      <MobileMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} navigate={navigate} />

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        navigate={navigate}
      />

      {/* PWA install prompt (mobile only) */}
      <InstallBanner />
    </div>
  );
}