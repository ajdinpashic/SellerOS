import { useMemo, useState } from 'react';
import { Package, ArrowLeft, Trash2, Boxes } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Panel, SectionHeader } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { ChannelIcon, StockBadge } from '@/components/Badges';
import { useI18n } from '@/locales';
import { formatKM, formatNumber, classNames } from '@/utils/format';
import type { Product, SalesChannel } from '@/types';
import type { Route } from '@/hooks/useRouter';

interface ProductDetailPageProps {
  productId: string;
  navigate: (route: Route) => void;
  products: Product[];
  onDelete: (id: string) => void;
}

const allChannels: SalesChannel[] = ['olx', 'instagram', 'facebook', 'webshop'];

export function ProductDetailPage({ productId, navigate, products, onDelete }: ProductDetailPageProps) {
  const { t, lang } = useI18n();
  const [showDelete, setShowDelete] = useState(false);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-content-secondary">{t.noProducts}</p>
        <button onClick={() => navigate({ name: 'products' })} className="btn-primary mt-4">{t.back}</button>
      </div>
    );
  }

  const profit = product.price - product.cost;
  const margin = product.price > 0 ? Math.round((profit / product.price) * 100) : 0;
  const available = product.stock - product.reserved;

  const handleDelete = () => {
    onDelete(product.id);
    navigate({ name: 'products' });
  };

  return (
    <div>
      <PageHeader
        title={product.name}
        breadcrumb={[
          { label: t.products, onClick: () => navigate({ name: 'products' }) },
          { label: product.sku },
        ]}
        actions={
          <>
            <button onClick={() => navigate({ name: 'products' })} className="btn-secondary">
              <ArrowLeft className="h-4 w-4" /> {t.back}
            </button>
            <button onClick={() => setShowDelete(true)} className="btn-ghost text-danger hover:bg-danger-subtle hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: info + channels */}
        <div className="space-y-5 lg:col-span-2">
          <Panel className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-surface-1">
                <Package className="h-6 w-6 text-content-tertiary" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-content">{product.name}</h2>
                  <StockBadge stock={product.stock} minimum={product.minimumStock} />
                </div>
                <p className="mt-0.5 font-mono text-xs text-content-tertiary">{product.sku}</p>
                <p className="mt-0.5 text-[13px] text-content-tertiary">{product.category}</p>
                {product.description && (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-content-secondary">{product.description}</p>
                )}
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionHeader title={t.salesChannels} />
            <div className="divide-y divide-border">
              {allChannels.map((ch) => {
                const enabled = product.channels.includes(ch);
                return (
                  <div key={ch} className="flex items-center justify-between px-4 py-2.5">
                    <span className={classNames('flex items-center gap-2.5 text-sm', enabled ? 'text-content' : 'text-content-tertiary')}>
                      <ChannelIcon channel={ch} className="h-4 w-4" />
                      {t[`ch_${ch}` as keyof typeof t] as string}
                    </span>
                    <span className={classNames('text-[13px] font-medium', enabled ? 'text-success' : 'text-content-tertiary')}>
                      {enabled ? t.active : t.inactive}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Right: price + stock */}
        <div className="space-y-5">
          <Panel>
            <SectionHeader title={t.priceAndMargin} />
            <div className="px-4 py-2">
              <dl>
                <div className="dl-row">
                  <dt>{t.price}</dt>
                  <dd className="font-semibold">{formatKM(product.price, lang)}</dd>
                </div>
                <div className="dl-row">
                  <dt>{t.cost}</dt>
                  <dd>{formatKM(product.cost, lang)}</dd>
                </div>
                <div className="dl-row">
                  <dt>{t.margin}</dt>
                  <dd>
                    <span className="font-semibold text-success">{formatKM(profit, lang)}</span>
                    <span className="ml-1.5 text-xs text-content-tertiary">({margin}%)</span>
                  </dd>
                </div>
              </dl>
            </div>
          </Panel>

          <Panel>
            <SectionHeader
              title={t.stockInfo}
              action={
                <button
                  onClick={() => navigate({ name: 'inventory' })}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent-hover"
                >
                  <Boxes className="h-3.5 w-3.5" />
                  {t.goToInventory}
                </button>
              }
            />
            <div className="px-4 py-2">
              <dl>
                <div className="dl-row">
                  <dt>{t.stock}</dt>
                  <dd className="font-semibold">{formatNumber(product.stock, lang)}</dd>
                </div>
                <div className="dl-row">
                  <dt>{t.reserved}</dt>
                  <dd>{formatNumber(product.reserved, lang)}</dd>
                </div>
                <div className="dl-row border-t border-border pt-3">
                  <dt className="font-medium text-content">{t.available}</dt>
                  <dd className={classNames('font-semibold', available <= 0 ? 'text-danger' : 'text-success')}>
                    {formatNumber(available, lang)}
                  </dd>
                </div>
                <div className="dl-row">
                  <dt>{t.minStock}</dt>
                  <dd>{formatNumber(product.minimumStock, lang)}</dd>
                </div>
              </dl>
            </div>
          </Panel>
        </div>
      </div>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title={t.deleteProductTitle} size="sm"
        footer={
          <>
            <button onClick={() => setShowDelete(false)} className="btn-secondary">{t.cancelBtn}</button>
            <button onClick={handleDelete} className="btn-danger">{t.cancel}</button>
          </>
        }
      >
        <p className="text-sm text-content-secondary">
          {t.deleteConfirm} <strong className="text-content">{product.name}</strong>? <span className="text-content-tertiary">{t.irreversible}</span>
        </p>
      </Modal>
    </div>
  );
}
