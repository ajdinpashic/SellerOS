import { ArrowLeft, Mail, Phone, MapPin, StickyNote } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Panel, SectionHeader, Avatar } from '@/components/ui';
import { ChannelBadge, OrderStatusBadge } from '@/components/Badges';
import { Table, THead, TBody, TR, TH, TD } from '@/components/Table';
import { useI18n } from '@/locales';
import { formatKM, formatDate, orderTotal } from '@/utils/format';
import type { Customer } from '@/types';
import { mockOrders } from '@/data/orders';
import type { Route } from '@/hooks/useRouter';

interface CustomerDetailPageProps {
  customerId: string;
  navigate: (route: Route) => void;
  customers: Customer[];
}

export function CustomerDetailPage({ customerId, navigate, customers }: CustomerDetailPageProps) {
  const { t, lang } = useI18n();
  const customer = customers.find((c) => c.id === customerId);

  if (!customer) {
    return (
      <div>
        <PageHeader title={t.customerDetail} breadcrumb={[{ label: t.customers, onClick: () => navigate({ name: 'customers' }) }, { label: customerId }]} />
        <div className="card p-12 text-center text-[13px] text-content-tertiary">{t.noCustomers}</div>
      </div>
    );
  }

  const orders = mockOrders.filter((o) => o.customerId === customer.id);
  const avgOrder = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;

  return (
    <div>
      <PageHeader
        title={customer.name}
        breadcrumb={[
          { label: t.customers, onClick: () => navigate({ name: 'customers' }) },
          { label: customer.name },
        ]}
        actions={
          <button onClick={() => navigate({ name: 'customers' })} className="btn-secondary">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </button>
        }
      />

      {/* Compact stats */}
      <div className="card mb-5 grid grid-cols-3 divide-x divide-border">
        <div className="px-4 py-3">
          <p className="text-lg font-semibold tracking-tight tnum">{customer.orderCount}</p>
          <p className="text-[13px] text-content-secondary">{t.orderCount}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-lg font-semibold tracking-tight tnum">{formatKM(customer.totalSpent, lang)}</p>
          <p className="text-[13px] text-content-secondary">{t.totalSpent}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-lg font-semibold tracking-tight tnum">{formatKM(avgOrder, lang)}</p>
          <p className="text-[13px] text-content-secondary">{t.averageOrder}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: order history */}
        <div className="min-w-0 lg:col-span-2">
          <Panel>
            <SectionHeader title={t.orderHistory} />
            {orders.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-content-tertiary">{t.noOrders}</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>{t.orderId}</TH>
                    <TH>{t.channel}</TH>
                    <TH align="right">{t.amount}</TH>
                    <TH>{t.status}</TH>
                    <TH>{t.date}</TH>
                  </TR>
                </THead>
                <TBody>
                  {orders.map((o) => (
                    <TR key={o.id} onClick={() => navigate({ name: 'order-detail', id: o.id })}>
                      <TD className="font-semibold">{o.id}</TD>
                      <TD><ChannelBadge channel={o.channel} /></TD>
                      <TD align="right" className="font-medium tnum">{formatKM(orderTotal(o.items, o.shipping), lang)}</TD>
                      <TD><OrderStatusBadge status={o.status} /></TD>
                      <TD className="text-content-tertiary">{formatDate(o.date, lang)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Panel>
        </div>

        {/* Right: profile + contact + notes */}
        <div className="space-y-5">
          <Panel className="p-4">
            <div className="flex items-center gap-3">
              <Avatar name={customer.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-content">{customer.name}</p>
                <p className="text-[13px] text-content-tertiary">{customer.city}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <ChannelBadge channel={customer.primaryChannel} />
            </div>
            <div className="mt-3 space-y-2 text-[13px] text-content-secondary">
              <p className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                <span className="truncate">{customer.email}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                {customer.phone}
              </p>
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                {customer.address}, {customer.city}
              </p>
            </div>
          </Panel>

          {customer.notes && (
            <Panel className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="text-[13px] font-medium text-content">{t.notes}</p>
                  <p className="mt-0.5 text-[13px] text-content-secondary">{customer.notes}</p>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
