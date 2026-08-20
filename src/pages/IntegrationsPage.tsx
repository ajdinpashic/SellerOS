import { useState } from 'react';
import {
  ShoppingBag, Instagram, Facebook, ShoppingCart, Store,
  Truck, Package, Mail, Zap, Plug, BellRing, AlertTriangle, Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Panel, Toast } from '@/components/ui';
import { IntegrationStatusBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { useI18n } from '@/locales';
import { classNames } from '@/utils/format';
import { mockIntegrations } from '@/data/misc';
import type { Integration } from '@/types';

export function IntegrationsPage() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Integration | null>(null);
  const [notifyToast, setNotifyToast] = useState('');

  const iconMap: Record<string, LucideIcon> = {
    ShoppingBag, Instagram, Facebook, ShoppingCart, Store,
    Truck, Package, Mail, Zap,
  };

  const salesIntegrations = mockIntegrations.filter((i) => i.category === 'sales');
  const shippingIntegrations = mockIntegrations.filter((i) => i.category === 'shipping');

  const renderRow = (int: Integration) => {
    const Icon = iconMap[int.icon] || Plug;
    const connected = int.status === 'connected';
    return (
      <div key={int.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-1 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className={classNames('flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white', int.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-content">{int.name}</h3>
              <IntegrationStatusBadge status={int.status} />
            </div>
            <p className="mt-0.5 text-[13px] text-content-secondary">{int.description}</p>
          </div>
        </div>
        <div className="shrink-0 sm:pl-4">
          {connected ? (
            <button onClick={() => setSelected(int)} className="btn-secondary">
              {t.configure}
            </button>
          ) : (
            <button onClick={() => setSelected(int)} className="btn-primary">
              <Plug className="h-4 w-4" /> {t.connect}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t.integrations} subtitle={t.tagline} />

      <Panel>
        <div className="px-4 py-3">
          <p className="section-label mb-1">{t.nav_connect}</p>
          <h2 className="text-base font-semibold text-content">{t.salesChannelsInt}</h2>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {salesIntegrations.map(renderRow)}
        </div>
      </Panel>

      <Panel>
        <div className="px-4 py-3">
          <p className="section-label mb-1">{t.nav_connect}</p>
          <h2 className="text-base font-semibold text-content">{t.shippingProviders}</h2>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {shippingIntegrations.map(renderRow)}
        </div>
      </Panel>

      {/* Integration modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${t.integrationModalTitle} ${selected.name}` : ''}
        footer={
          <>
            <button onClick={() => setSelected(null)} className="btn-secondary">{t.close}</button>
            <button
              onClick={() => { setSelected(null); setNotifyToast(`${t.notifyMe} — ${t.saved}`); setTimeout(() => setNotifyToast(''), 2500); }}
              className="btn-primary"
            >
              <BellRing className="h-4 w-4" /> {t.notifyMe}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={classNames('flex h-10 w-10 items-center justify-center rounded-md text-white', selected.color)}>
                {(() => {
                  const Icon = iconMap[selected.icon] || Plug;
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
              <div>
                <p className="text-sm font-semibold text-content">{selected.name}</p>
                <IntegrationStatusBadge status={selected.status} />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-warning/20 bg-warning-subtle p-3.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-medium text-content">{t.integrationModalMsg}</p>
                <p className="mt-0.5 text-[13px] text-content-secondary">{t.integrationModalDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-content-tertiary">
              <Check className="h-4 w-4 text-success" />
              <span>{t.integrationModalDesc.split('.')[0]}.</span>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={notifyToast} />
    </div>
  );
}
