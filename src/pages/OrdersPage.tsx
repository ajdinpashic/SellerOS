import { useState, useMemo } from 'react';
import { Plus, ShoppingBag, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, type FilterOption } from '@/components/FilterBar';
import { OrderStatusBadge, ChannelBadge, PaymentBadge } from '@/components/Badges';
import { Table, THead, TBody, TR, TH, TD } from '@/components/Table';
import { EmptyState } from '@/components/EmptyState';
import { useI18n } from '@/locales';
import { formatKM, formatDate, orderTotal } from '@/utils/format';
import type { Order, OrderStatus, PaymentMethod, SalesChannel } from '@/types';
import type { Route } from '@/hooks/useRouter';

interface OrdersPageProps {
  navigate: (route: Route) => void;
  orders: Order[];
}

type SortField = 'id' | 'customerName' | 'amount' | 'date';
type SortDir = 'asc' | 'desc';

export function OrdersPage({ navigate, orders }: OrdersPageProps) {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const statusOptions: FilterOption[] = (['pending', 'confirmed', 'ready', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((s) => ({
    value: s,
    label: t[`st_${s}` as keyof typeof t] as string,
  }));
  const channelOptions: FilterOption[] = (['olx', 'instagram', 'facebook', 'webshop'] as SalesChannel[]).map((c) => ({
    value: c,
    label: t[`ch_${c}` as keyof typeof t] as string,
  }));
  const paymentOptions: FilterOption[] = (['cod', 'paid', 'card', 'other'] as PaymentMethod[]).map((p) => ({
    value: p,
    label: t[`pay_${p}` as keyof typeof t] as string,
  }));

  const filtered = useMemo(() => {
    let result: Order[] = orders.filter((o) => {
      const matchesSearch = !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = !statusFilter || o.status === statusFilter;
      const matchesChannel = !channelFilter || o.channel === channelFilter;
      const matchesPayment = !paymentFilter || o.paymentMethod === paymentFilter;
      return matchesSearch && matchesStatus && matchesChannel && matchesPayment;
    });

    result = result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'id': cmp = a.id.localeCompare(b.id); break;
        case 'customerName': cmp = a.customerName.localeCompare(b.customerName); break;
        case 'amount': cmp = orderTotal(a.items, a.shipping) - orderTotal(b.items, b.shipping); break;
        case 'date': cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [orders, search, statusFilter, channelFilter, paymentFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setChannelFilter(''); setPaymentFilter('');
  };

  return (
    <div>
      <PageHeader
        title={t.orders}
        subtitle={`${filtered.length} ${t.resultsCount}`}
        actions={
          <button onClick={() => navigate({ name: 'create-order' })} className="btn-primary">
            <Plus className="h-4 w-4" />
            {t.newOrder}
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
              { key: 'status', value: statusFilter, onChange: setStatusFilter, options: statusOptions, placeholder: t.allStatuses },
              { key: 'channel', value: channelFilter, onChange: setChannelFilter, options: channelOptions, placeholder: t.allChannels },
              { key: 'payment', value: paymentFilter, onChange: setPaymentFilter, options: paymentOptions, placeholder: t.allPayments },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={t.noResults}
            description={t.noResultsDesc}
            action={
              <button onClick={clearFilters} className="btn-secondary">{t.clearFilters}</button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <THead>
                  <TR>
                    <TH sortable active={sortField === 'id'} direction={sortDir} onClick={() => handleSort('id')}>{t.orderId}</TH>
                    <TH sortable active={sortField === 'customerName'} direction={sortDir} onClick={() => handleSort('customerName')}>{t.customer}</TH>
                    <TH>{t.channel}</TH>
                    <TH className="hidden lg:table-cell">{t.productsLabel}</TH>
                    <TH align="right" sortable active={sortField === 'amount'} direction={sortDir} onClick={() => handleSort('amount')}>{t.amount}</TH>
                    <TH>{t.payment}</TH>
                    <TH>{t.status}</TH>
                    <TH sortable active={sortField === 'date'} direction={sortDir} onClick={() => handleSort('date')}>{t.date}</TH>
                  </TR>
                </THead>
                <TBody>
                  {filtered.map((order) => (
                    <TR key={order.id} onClick={() => navigate({ name: 'order-detail', id: order.id })}>
                      <TD className="font-semibold">{order.id}</TD>
                      <TD>{order.customerName}</TD>
                      <TD><ChannelBadge channel={order.channel} /></TD>
                      <TD className="hidden max-w-[220px] truncate text-content-secondary lg:table-cell">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </TD>
                      <TD align="right" className="font-semibold tnum">{formatKM(orderTotal(order.items, order.shipping), lang)}</TD>
                      <TD><PaymentBadge method={order.paymentMethod} /></TD>
                      <TD><OrderStatusBadge status={order.status} /></TD>
                      <TD className="text-content-tertiary">{formatDate(order.date, lang)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {filtered.map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate({ name: 'order-detail', id: order.id })}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{order.id}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 truncate text-[13px] text-content-secondary">{order.customerName}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-content-tertiary">
                      <ChannelBadge channel={order.channel} />
                      <span>·</span>
                      <span>{formatDate(order.date, lang)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold tnum">{formatKM(orderTotal(order.items, order.shipping), lang)}</span>
                    <ChevronRight className="h-4 w-4 text-content-tertiary" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
