import { useMemo } from 'react';

export type Route =
  | { name: 'landing' }
  | { name: 'dashboard' }
  | { name: 'inbox' }
  | { name: 'orders' }
  | { name: 'order-detail'; id: string }
  | { name: 'create-order' }
  | { name: 'products' }
  | { name: 'product-detail'; id: string }
  | { name: 'inventory' }
  | { name: 'customers' }
  | { name: 'customer-detail'; id: string }
  | { name: 'shipping' }
  | { name: 'invoices' }
  | { name: 'reports' }
  | { name: 'integrations' }
  | { name: 'settings' }
  // Public auth routes
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'forgot-password' }
  | { name: 'reset-password' }
  | { name: 'onboarding' };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);
  // Supabase password-recovery links land as "#access_token=...&type=recovery".
  // Treat any recovery token as the reset-password route.
  if (/^(access_token|type=recovery)/.test(clean)) return { name: 'reset-password' };
  if (parts.length === 0) return { name: 'landing' };
  const [p0, p1] = parts;
  switch (p0) {
    case 'login': return { name: 'login' };
    case 'register': return { name: 'register' };
    case 'forgot-password': return { name: 'forgot-password' };
    case 'reset-password': return { name: 'reset-password' };
    case 'onboarding': return { name: 'onboarding' };
    case 'dashboard': return { name: 'dashboard' };
    case 'inbox': return { name: 'inbox' };
    case 'orders':
      if (p1 === 'new') return { name: 'create-order' };
      if (p1) return { name: 'order-detail', id: p1 };
      return { name: 'orders' };
    case 'products':
      if (p1) return { name: 'product-detail', id: p1 };
      return { name: 'products' };
    case 'inventory': return { name: 'inventory' };
    case 'customers':
      if (p1) return { name: 'customer-detail', id: p1 };
      return { name: 'customers' };
    case 'shipping': return { name: 'shipping' };
    case 'invoices': return { name: 'invoices' };
    case 'reports': return { name: 'reports' };
    case 'integrations': return { name: 'integrations' };
    case 'settings': return { name: 'settings' };
    default: return { name: 'landing' };
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'landing': return '#/';
    case 'dashboard': return '#/dashboard';
    case 'inbox': return '#/inbox';
    case 'orders': return '#/orders';
    case 'create-order': return '#/orders/new';
    case 'order-detail': return `#/orders/${route.id}`;
    case 'products': return '#/products';
    case 'product-detail': return `#/products/${route.id}`;
    case 'inventory': return '#/inventory';
    case 'customers': return '#/customers';
    case 'customer-detail': return `#/customers/${route.id}`;
    case 'shipping': return '#/shipping';
    case 'invoices': return '#/invoices';
    case 'reports': return '#/reports';
    case 'integrations': return '#/integrations';
    case 'settings': return '#/settings';
    case 'login': return '#/login';
    case 'register': return '#/register';
    case 'forgot-password': return '#/forgot-password';
    case 'reset-password': return '#/reset-password';
    case 'onboarding': return '#/onboarding';
  }
}

export function useRouter() {
  const hash = useStateHash();
  const route = useMemo(() => parseHash(hash), [hash]);
  const navigate = (to: Route) => {
    window.location.hash = routeToHash(to);
  };
  return { route, navigate };
}

import { useState, useEffect } from 'react';

function useStateHash() {
  const [hash, setHashState] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const handler = () => {
      setHashState(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return hash;
}
