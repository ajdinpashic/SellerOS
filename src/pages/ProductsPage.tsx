import { useState, useMemo } from 'react';
import { Plus, Package, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, type FilterOption } from '@/components/FilterBar';
import { ChannelIcon, StockBadge } from '@/components/Badges';
import { Table, THead, TBody, TR, TH, TD } from '@/components/Table';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/ui';
import { useI18n } from '@/locales';
import { formatKM, classNames } from '@/utils/format';
import type { Product, SalesChannel } from '@/types';
import type { Route } from '@/hooks/useRouter';

interface ProductsPageProps {
  navigate: (route: Route) => void;
  products: Product[];
  onCreate: (product: Product) => void;
  onDelete: (id: string) => void;
}

type SortField = 'name' | 'price' | 'stock' | 'profit';
type SortDir = 'asc' | 'desc';

const allChannels: SalesChannel[] = ['olx', 'instagram', 'facebook', 'webshop'];

export function ProductsPage({ navigate, products, onCreate, onDelete }: ProductsPageProps) {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toast, setToast] = useState('');

  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newMinStock, setNewMinStock] = useState('10');

  const channelOptions: FilterOption[] = allChannels.map((c) => ({
    value: c, label: t[`ch_${c}` as keyof typeof t] as string,
  }));

  const filtered = useMemo(() => {
    let result: Product[] = products.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesChannel = !channelFilter || p.channels.includes(channelFilter as SalesChannel);
      return matchesSearch && matchesChannel;
    });
    result = result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'price': cmp = a.price - b.price; break;
        case 'stock': cmp = a.stock - b.stock; break;
        case 'profit': cmp = (a.price - a.cost) - (b.price - b.cost); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [products, search, channelFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const clearFilters = () => { setSearch(''); setChannelFilter(''); };

  const handleCreate = () => {
    if (!newName.trim() || !newPrice) return;
    const product: Product = {
      id: `p${Date.now()}`,
      name: newName.trim(),
      sku: newSku.trim() || `SKU-${Date.now()}`,
      description: '',
      price: parseFloat(newPrice) || 0,
      cost: parseFloat(newCost) || 0,
      stock: parseInt(newStock) || 0,
      minimumStock: parseInt(newMinStock) || 10,
      reserved: 0,
      channels: ['webshop'],
      category: newCategory.trim() || 'Ostalo',
    };
    onCreate(product);
    setShowCreate(false);
    setNewName(''); setNewSku(''); setNewPrice(''); setNewCost(''); setNewStock(''); setNewCategory(''); setNewMinStock('10');
    setToast(t.productCreated);
    setTimeout(() => setToast(''), 2500);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader
        title={t.products}
        subtitle={`${filtered.length} ${t.resultsCount}`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> {t.newProduct}
          </button>
        }
      />

      <div className="card">
        <div className="border-b border-border px-3 py-2.5">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={t.search}
            onClear={clearFilters}
            filters={[
              { key: 'channel', value: channelFilter, onChange: setChannelFilter, options: channelOptions, placeholder: t.allChannels },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Package} title={t.noResults} description={t.noResultsDesc}
            action={<button onClick={clearFilters} className="btn-secondary">{t.clearFilters}</button>} />
        ) : (
          <div className="hidden md:block">
            <Table>
              <THead>
                <TR>
                  <TH sortable active={sortField === 'name'} direction={sortDir} onClick={() => handleSort('name')}>{t.product}</TH>
                  <TH>{t.sku}</TH>
                  <TH align="right" sortable active={sortField === 'price'} direction={sortDir} onClick={() => handleSort('price')}>{t.price}</TH>
                  <TH align="right">{t.cost}</TH>
                  <TH align="right" sortable active={sortField === 'profit'} direction={sortDir} onClick={() => handleSort('profit')}>{t.margin}</TH>
                  <TH align="right" sortable active={sortField === 'stock'} direction={sortDir} onClick={() => handleSort('stock')}>{t.stock}</TH>
                  <TH>{t.salesChannels}</TH>
                  <TH>{t.status}</TH>
                  <TH>{' '}</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((p) => {
                  const profit = p.price - p.cost;
                  const margin = p.price > 0 ? Math.round((profit / p.price) * 100) : 0;
                  return (
                    <TR key={p.id} onClick={() => navigate({ name: 'product-detail', id: p.id })}>
                      <TD>
                        <p className="font-medium text-content">{p.name}</p>
                        <p className="text-xs text-content-tertiary">{p.category}</p>
                      </TD>
                      <TD className="font-mono text-xs text-content-tertiary">{p.sku}</TD>
                      <TD align="right" className="font-semibold tnum">{formatKM(p.price, lang)}</TD>
                      <TD align="right" className="text-content-secondary tnum">{formatKM(p.cost, lang)}</TD>
                      <TD align="right">
                        <span className="font-medium tnum">{formatKM(profit, lang)}</span>
                        <span className="ml-1.5 text-xs text-content-tertiary tnum">({margin}%)</span>
                      </TD>
                      <TD align="right" className={classNames('font-semibold tnum', p.stock === 0 ? 'text-danger' : p.stock <= p.minimumStock ? 'text-warning' : 'text-content')}>
                        {p.stock}
                      </TD>
                      <TD>
                        <span className="inline-flex items-center gap-1">
                          {allChannels.filter((c) => p.channels.includes(c)).map((c) => (
                            <ChannelIcon key={c} channel={c} className="h-3.5 w-3.5 text-content-tertiary" />
                          ))}
                        </span>
                      </TD>
                      <TD><StockBadge stock={p.stock} minimum={p.minimumStock} /></TD>
                      <TD onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="rounded-md p-1.5 text-content-tertiary hover:bg-danger-subtle hover:text-danger transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        )}

        {/* Mobile list */}
        <div className="divide-y divide-border md:hidden">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate({ name: 'product-detail', id: p.id })}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-content">{p.name}</p>
                <p className="mt-0.5 text-xs text-content-tertiary">{p.sku} · {p.category}</p>
                <p className="mt-0.5 flex items-center gap-2">
                  <StockBadge stock={p.stock} minimum={p.minimumStock} />
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tnum">{formatKM(p.price, lang)}</p>
                <p className={classNames('mt-0.5 text-xs font-medium tnum', p.stock === 0 ? 'text-danger' : p.stock <= p.minimumStock ? 'text-warning' : 'text-content-tertiary')}>
                  {t.stock}: {p.stock}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t.newProduct} size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">{t.cancelBtn}</button>
            <button onClick={handleCreate} className="btn-primary">{t.save}</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">{t.product}</label>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="npr. Nike Air Max 90" />
          </div>
          <div>
            <label className="label">{t.sku}</label>
            <input className="input" value={newSku} onChange={(e) => setNewSku(e.target.value)} placeholder="npr. NK-AM-90" />
          </div>
          <div>
            <label className="label">{t.category}</label>
            <input className="input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="npr. Obuća" />
          </div>
          <div>
            <label className="label">{t.price}</label>
            <input className="input" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="label">{t.cost}</label>
            <input className="input" type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="label">{t.stock}</label>
            <input className="input" type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="label">{t.minStock}</label>
            <input className="input" type="number" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t.deleteProductTitle} size="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">{t.cancelBtn}</button>
            <button onClick={handleDelete} className="btn-danger">{t.cancel}</button>
          </>
        }
      >
        <p className="text-sm text-content-secondary">
          {t.deleteConfirm} <strong className="text-content">{deleteTarget?.name}</strong>? <span className="text-content-tertiary">{t.irreversible}</span>
        </p>
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
