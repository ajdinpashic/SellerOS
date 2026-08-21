import { useState, useMemo } from 'react';
import { Plus, Minus, History, Package } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Panel, SectionHeader, Tabs, Toast } from '@/components/ui';
import { FilterBar } from '@/components/FilterBar';
import { StockBadge } from '@/components/Badges';
import { Table, THead, TBody, TR, TH, TD } from '@/components/Table';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { useI18n } from '@/locales';
import { formatKM, interpolate, classNames } from '@/utils/format';
import { useProducts } from '@/hooks/useProducts';
import { useInventoryMovements } from '@/hooks/useInventory';
import { apiErrorMessage } from '@/lib/api';
import type { Product } from '@/types';

type StockStatus = 'all' | 'low' | 'out';

export function InventoryPage() {
  const { t, lang } = useI18n();
  const { products, adjustStock } = useProducts();
  const { changes: dbChanges, refresh: refreshMovements } = useInventoryMovements();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus>('all');
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState(0);
  const [reason, setReason] = useState('reason_new');
  const [toast, setToast] = useState('');
  // Inventory changes come from the backend ledger.
  const changes = dbChanges;

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const value = products.reduce((s, p) => s + p.stock * p.cost, 0);
    const low = products.filter((p) => p.stock > 0 && p.stock <= p.minimumStock).length;
    const out = products.filter((p) => p.stock === 0).length;
    return { totalProducts, value, low, out };
  }, [products]);

  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'low' ? p.stock > 0 && p.stock <= p.minimumStock :
        p.stock === 0;
      return matchesSearch && matchesStatus;
    });
    // Exceptions first: out of stock → low stock → ok
    const severity = (p: Product) => (p.stock === 0 ? 0 : p.stock <= p.minimumStock ? 1 : 2);
    return result.sort((a, b) => severity(a) - severity(b) || a.name.localeCompare(b.name));
  }, [products, search, statusFilter]);

  const openAdjust = (p: Product) => {
    setAdjustProduct(p);
    setNewStock(p.stock);
    setReason('reason_new');
  };

  const handleAdjust = async () => {
    if (!adjustProduct) return;
    // Server-side adjustment: validates bounds, writes the movement
    // row and the audit log. Stock can never go negative or below
    // the reserved quantity.
    const result = await adjustStock(adjustProduct.id, newStock, reason);
    if (result.error) {
      setAdjustProduct(null);
      setToast(apiErrorMessage(result.error, t));
      setTimeout(() => setToast(''), 2500);
      return;
    }
    void refreshMovements();
    setAdjustProduct(null);
    setToast(t.stockAdjusted);
    setTimeout(() => setToast(''), 2500);
  };

  const timeAgo = (ts: number): string => {
    const mins = Math.floor((Date.now() - ts) / 60_000);
    if (mins < 1) return t.justNow;
    if (mins < 60) return interpolate(t.minutesAgo, { n: mins });
    return interpolate(t.hoursAgo, { n: Math.floor(mins / 60) });
  };

  return (
    <div>
      <PageHeader
        title={t.inventory}
        subtitle={`${stats.totalProducts} ${t.products} · ${t.inventoryValue}: ${formatKM(stats.value, lang)} · ${stats.low} ${t.lowStockCount.toLowerCase()} · ${stats.out} ${t.outOfStock.toLowerCase()}`}
      />

      <div className="card">
        <div className="flex flex-col gap-2 border-b border-border px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={t.search}
            onClear={() => { setSearch(''); setStatusFilter('all'); }}
          />
        </div>
        <Tabs
          className="px-3"
          tabs={[
            { key: 'all', label: t.all, count: stats.totalProducts },
            { key: 'low', label: t.lowStock, count: stats.low },
            { key: 'out', label: t.outOfStock, count: stats.out },
          ]}
          active={statusFilter}
          onChange={(k) => setStatusFilter(k as StockStatus)}
        />

        <div className="grid grid-cols-1 gap-5 p-4 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            {products.length === 0 ? (
              <EmptyState icon={Package} title={t.empty_inventory_title} description={t.empty_inventory_desc} />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>{t.product}</TH>
                    <TH>{t.sku}</TH>
                    <TH align="right">{t.stock}</TH>
                    <TH align="right">{t.reserved}</TH>
                    <TH align="right">{t.available}</TH>
                    <TH align="right">{t.minimum}</TH>
                    <TH>{t.status}</TH>
                    <TH align="right">{t.actions}</TH>
                  </TR>
                </THead>
                <TBody>
                  {filtered.map((p) => {
                  const available = Math.max(p.stock - p.reserved, 0);
                  return (
                    <TR key={p.id}>
                      <TD className="font-medium text-content">{p.name}</TD>
                      <TD className="font-mono text-xs text-content-tertiary">{p.sku}</TD>
                      <TD align="right" className={classNames('font-semibold tnum', p.stock === 0 ? 'text-danger' : p.stock <= p.minimumStock ? 'text-warning' : 'text-content-secondary')}>{p.stock}</TD>
                      <TD align="right" className="text-content-tertiary tnum">{p.reserved}</TD>
                      <TD align="right" className="text-content-secondary tnum">{available}</TD>
                      <TD align="right" className="text-content-tertiary tnum">{p.minimumStock}</TD>
                      <TD><StockBadge stock={p.stock} minimum={p.minimumStock} /></TD>
                      <TD align="right">
                        <button onClick={() => openAdjust(p)} className="btn-secondary btn-sm">
                          {t.adjust}
                        </button>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            )}
          </div>

          {/* Recent changes */}
          <Panel className="h-fit">
            <SectionHeader title={t.recentChanges} />
            {changes.length === 0 ? (
              <p className="flex items-center gap-2 px-4 py-6 text-[13px] text-content-tertiary">
                <History className="h-4 w-4" />
                {t.noRecentChanges}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {changes.map((c) => (
                  <div key={c.id} className="px-4 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[13px] font-medium text-content">{c.productName}</p>
                      <p className="shrink-0 text-[13px] tnum">
                        <span className="text-content-tertiary">{c.from}</span>
                        <span className="mx-1 text-content-tertiary">→</span>
                        <span className={classNames('font-semibold', c.to === 0 ? 'text-danger' : c.to > c.from ? 'text-success' : 'text-content')}>{c.to}</span>
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-content-tertiary">
                      {t[c.reason as keyof typeof t] as string} · {timeAgo(c.ts)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Adjustment modal */}
      <Modal
        open={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        title={t.adjustStock}
        description={adjustProduct?.name}
        footer={
          <>
            <button onClick={() => setAdjustProduct(null)} className="btn-secondary">{t.cancelBtn}</button>
            <button onClick={handleAdjust} className="btn-primary">{t.adjust}</button>
          </>
        }
      >
        {adjustProduct && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md bg-surface-2 px-4 py-3">
              <span className="text-[13px] text-content-tertiary">{t.stock}</span>
              <span className="text-base font-semibold text-content tnum">{adjustProduct.stock}</span>
            </div>
            <div>
              <label className="label">{t.newStock}</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setNewStock((v) => Math.max(0, v - 1))} className="btn-secondary px-2.5">
                  <Minus className="h-4 w-4" />
                </button>
                <input type="number" min={0} className="input tnum text-center" value={newStock} onChange={(e) => setNewStock(parseInt(e.target.value) || 0)} />
                <button onClick={() => setNewStock((v) => v + 1)} className="btn-secondary px-2.5">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="label">{t.adjustmentReason}</label>
              <select className="input select" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="reason_new">{t.reason_new}</option>
                <option value="reason_correction">{t.reason_correction}</option>
                <option value="reason_damage">{t.reason_damage}</option>
                <option value="reason_loss">{t.reason_loss}</option>
              </select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
              <span className="text-[13px] text-content-tertiary">{t.adjustment}</span>
              <span className={classNames('font-semibold tnum', newStock - adjustProduct.stock >= 0 ? 'text-success' : 'text-danger')}>
                {newStock - adjustProduct.stock >= 0 ? '+' : ''}{newStock - adjustProduct.stock}
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
