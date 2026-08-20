import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ShoppingCart, Package, Users, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import { useI18n } from '@/locales';
import { classNames } from '@/utils/format';
import type { Route } from '@/hooks/useRouter';
import type { Order, Product, Customer } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  navigate: (route: Route) => void;
  orders: Order[];
  products: Product[];
  customers: Customer[];
}

interface ResultItem {
  id: string;
  label: string;
  sublabel: string;
  route: Route;
  category: 'order' | 'product' | 'customer';
}

export function CommandPalette({ open, onClose, navigate, orders, products, customers }: CommandPaletteProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { orders: [] as ResultItem[], products: [] as ResultItem[], customers: [] as ResultItem[] };

    const matchedOrders: ResultItem[] = orders
      .filter((o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        label: `${o.id} — ${o.customerName}`,
        sublabel: o.items.map((i) => i.name).join(', '),
        route: { name: 'order-detail' as const, id: o.id },
        category: 'order' as const,
      }));

    const matchedProducts: ResultItem[] = products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        label: p.name,
        sublabel: p.sku,
        route: { name: 'product-detail' as const, id: p.id },
        category: 'product' as const,
      }));

    const matchedCustomers: ResultItem[] = customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        label: c.name,
        sublabel: c.email,
        route: { name: 'customer-detail' as const, id: c.id },
        category: 'customer' as const,
      }));

    return { orders: matchedOrders, products: matchedProducts, customers: matchedCustomers };
  }, [query, orders, products, customers]);

  const allResults = useMemo(() => [
    ...results.orders,
    ...results.products,
    ...results.customers,
  ], [results]);

  const categoryHeaders = useMemo(() => {
    const headers: { category: string; label: string; count: number }[] = [];
    if (results.orders.length > 0) headers.push({ category: 'order', label: t.orders, count: results.orders.length });
    if (results.products.length > 0) headers.push({ category: 'product', label: t.products, count: results.products.length });
    if (results.customers.length > 0) headers.push({ category: 'customer', label: t.customers, count: results.customers.length });
    return headers;
  }, [results, t]);

  const totalResults = allResults.length;

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(totalResults, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + totalResults) % Math.max(totalResults, 1));
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        e.preventDefault();
        navigate(allResults[selectedIndex].route);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, allResults, selectedIndex, totalResults, navigate, onClose]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const categoryIcons = {
    order: ShoppingCart,
    product: Package,
    customer: Users,
  };

  let globalIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] animate-fade-in">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex w-full max-w-lg flex-col animate-scale-in rounded-lg border border-border bg-surface-0 shadow-popover overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-content-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.cmd_placeholder}
            className="h-11 flex-1 bg-transparent text-[13px] text-content outline-none placeholder:text-content-tertiary"
          />
          <kbd className="kbd">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
          {query.trim() === '' ? (
            <div className="px-3 py-8 text-center text-[13px] text-content-tertiary">
              {t.cmd_hint}
            </div>
          ) : totalResults === 0 ? (
            <div className="px-3 py-8 text-center text-[13px] text-content-tertiary">
              {t.cmd_no_results}
            </div>
          ) : (
            <div className="space-y-0.5">
              {categoryHeaders.map((header) => {
                const Icon = categoryIcons[header.category as keyof typeof categoryIcons];
                return (
                  <div key={header.category}>
                    <div className="flex items-center gap-2 px-2.5 py-1.5">
                      <Icon className="h-3 w-3 text-content-tertiary" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                        {header.label}
                      </span>
                      <span className="text-[10px] text-content-tertiary">({header.count})</span>
                    </div>
                    {allResults
                      .filter((r) => r.category === header.category)
                      .map((item) => {
                        globalIndex++;
                        const idx = globalIndex;
                        const isSelected = idx === selectedIndex;
                        return (
                          <button
                            key={`${item.category}-${item.id}`}
                            data-selected={isSelected}
                            onClick={() => {
                              navigate(item.route);
                              onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={classNames(
                              'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors',
                              isSelected ? 'bg-surface-2' : 'hover:bg-surface-1',
                            )}
                          >
                            <div className={classNames(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded',
                              isSelected ? 'bg-accent/10 text-accent' : 'bg-surface-2 text-content-tertiary',
                            )}>
                              {(() => {
                                const ItemIcon = categoryIcons[item.category];
                                return <ItemIcon className="h-3.5 w-3.5" />;
                              })()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-content">{item.label}</p>
                              <p className="truncate text-[11px] text-content-tertiary">{item.sublabel}</p>
                            </div>
                            {isSelected && (
                              <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-3 py-1.5 text-[10px] text-content-tertiary">
          <span className="flex items-center gap-1"><ArrowUp className="h-2.5 w-2.5" /><ArrowDown className="h-2.5 w-2.5" /> {t.cmd_navigate}</span>
          <span className="flex items-center gap-1"><CornerDownLeft className="h-2.5 w-2.5" /> {t.cmd_select}</span>
          <span className="flex items-center gap-1"><kbd className="kbd !h-4 !min-w-4 !text-[9px]">ESC</kbd> {t.cmd_close}</span>
        </div>
      </div>
    </div>
  );
}
