import { useMemo } from 'react';

export type Route =
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
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'dashboard' };
  const [p0, p1] = parts;
  switch (p0) {
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
    default: return { name: 'dashboard' };
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'dashboard': return '#/';
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
