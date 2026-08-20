import { useState, useMemo } from 'react';
import { Truck, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Tabs } from '@/components/ui';
import { ShipmentStatusBadge } from '@/components/Badges';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Table, THead, TBody, TR, TH, TD } from '@/components/Table';
import { useI18n } from '@/locales';
import { formatDate, formatDateTime, classNames } from '@/utils/format';
import { mockShipments } from '@/data/misc';
import type { ShipmentStatus, Shipment } from '@/types';

const tabs: { key: ShipmentStatus | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'pending', labelKey: 'awaitingShipment' },
  { key: 'shipped', labelKey: 'shippedTab' },
  { key: 'delivered', labelKey: 'deliveredTab' },
  { key: 'problem', labelKey: 'problem' },
];

export function ShippingPage() {
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState<ShipmentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Shipment | null>(null);

  const filtered = useMemo(() => {
    return mockShipments.filter((s) => {
      const matchesTab = activeTab === 'all' || s.status === activeTab;
      const matchesSearch = !search ||
        s.orderId.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName.toLowerCase().includes(search.toLowerCase()) ||
        s.trackingNumber.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  const counts = useMemo(() => ({
    all: mockShipments.length,
    pending: mockShipments.filter((s) => s.status === 'pending').length,
    shipped: mockShipments.filter((s) => s.status === 'shipped').length,
    delivered: mockShipments.filter((s) => s.status === 'delivered').length,
    problem: mockShipments.filter((s) => s.status === 'problem').length,
  }), []);

  return (
    <div>
      <PageHeader title={t.shipping} subtitle={`${filtered.length} ${t.resultsCount}`} />

      <div className="card">
        <div className="border-b border-border px-3 py-2.5">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="input pl-8"
            />
          </div>
        </div>
        <Tabs
          className="px-3"
          tabs={tabs.map((tab) => ({
            key: tab.key,
            label: t[tab.labelKey as keyof typeof t] as string,
            count: counts[tab.key],
          }))}
          active={activeTab}
          onChange={(k) => setActiveTab(k as ShipmentStatus | 'all')}
        />

        {filtered.length === 0 ? (
          <EmptyState icon={Truck} title={t.noShipments} description={t.noResultsDesc} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t.invoiceOrder}</TH>
                <TH>{t.customer}</TH>
                <TH>{t.carrier}</TH>
                <TH>{t.tracking}</TH>
                <TH>{t.status}</TH>
                <TH>{t.estimatedDelivery}</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((s) => (
                <TR key={s.id} onClick={() => setSelected(s)}>
                  <TD className="font-semibold">{s.orderId}</TD>
                  <TD>{s.customerName}</TD>
                  <TD className="text-content-secondary">{s.carrier}</TD>
                  <TD className="font-mono text-xs text-content-tertiary">{s.trackingNumber}</TD>
                  <TD><ShipmentStatusBadge status={s.status} /></TD>
                  <TD className="text-content-tertiary">{s.estimatedDelivery ? formatDate(s.estimatedDelivery, lang) : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      {/* Tracking detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${t.tracking} — ${selected.trackingNumber}` : ''}
        description={selected ? `${selected.orderId} · ${selected.customerName}` : ''}
        size="lg"
        footer={<button onClick={() => setSelected(null)} className="btn-secondary">{t.close}</button>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
              <Truck className="h-4 w-4 text-content-tertiary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-content">{selected.carrier}</p>
                <p className="text-xs text-content-tertiary font-mono">{selected.trackingNumber}</p>
              </div>
              <ShipmentStatusBadge status={selected.status} />
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-content">{t.trackingTimeline}</h4>
              <div className="relative">
                {selected.timeline.map((event, i) => {
                  const isLast = i === selected.timeline.length - 1;
                  const isProblem = selected.status === 'problem' && !event.done && event.label.includes('adres');
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {event.done ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : isProblem ? (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-border" />
                        )}
                        {!isLast && <div className={classNames('w-0.5 flex-1 min-h-[1.5rem]', event.done ? 'bg-success/30' : 'bg-border')} />}
                      </div>
                      <div className="pb-4 min-h-[2rem]">
                        <p className={classNames('text-sm font-medium', event.done ? 'text-content' : 'text-content-tertiary')}>
                          {event.label}
                        </p>
                        {event.timestamp && (
                          <p className="mt-0.5 text-xs text-content-tertiary">{formatDateTime(event.timestamp, lang)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
