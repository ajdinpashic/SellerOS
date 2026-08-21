import { useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowRight, Plus, Truck, ChevronRight, Package, ShoppingCart, Plug } from 'lucide-react';
import { Panel, SectionHeader, StatStrip, type StatItem } from '@/components/ui';
import { OrderStatusBadge, ChannelBadge, ShipmentStatusBadge } from '@/components/Badges';
import { Table, THead, TBody, TR, TH, TD } from '@/components/Table';
import { useI18n } from '@/locales';
import { formatKM, formatDate, orderTotal, classNames, interpolate } from '@/utils/format';
import { useProducts } from '@/hooks/useProducts';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/contexts/AuthContext';
import { salesSeries } from '@/lib/reports';
import type { Order } from '@/types';
import type { Route } from '@/hooks/useRouter';

interface DashboardProps {
  navigate: (route: Route) => void;
  orders: Order[];
}

const rangeKeys = ['7days', '30days', 'thisMonth', 'thisYear'] as const;
type RangeKey = typeof rangeKeys[number];

export function DashboardPage({ navigate, orders }: DashboardProps) {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { products } = useProducts();
  const { shipments } = useShipments();
  const [range, setRange] = useState<RangeKey>('30days');

  const firstName = useMemo(() => profile?.fullName.trim().split(/\s+/)[0] || t.profile, [profile, t]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t.greetingMorning;
    if (h < 18) return t.greetingAfternoon;
    return t.greetingEvening;
  }, [t]);

  const lowStockProducts = useMemo(() =>
    products.filter((p) => p.stock > 0 && p.stock <= p.minimumStock).slice(0, 5),
  [products]);

  const attention = useMemo(() => ({
    toConfirm: orders.filter((o) => o.status === 'pending').slice(0, 3),
    toShip: orders.filter((o) => o.status === 'ready').slice(0, 3),
    problems: shipments.filter((s) => s.status === 'problem').slice(0, 2),
  }), [orders, shipments]);

  const latestOrders = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
  [orders]);

  const summary = useMemo(() => {
    const today = new Date().toDateString();
    return {
      newOrders: orders.filter((o) => new Date(o.date).toDateString() === today).length,
      awaitingConfirmation: orders.filter((o) => o.status === 'pending').length,
      awaitingShipping: orders.filter((o) => o.status === 'ready').length,
      problems: shipments.filter((s) => s.status === 'problem').length,
    };
  }, [orders, shipments]);

  const chartData = useMemo(() => salesSeries(orders, range), [orders, range]);

  const stats: StatItem[] = [
    { value: `${summary.newOrders}`, label: t.newOrdersToday, onClick: () => navigate({ name: 'orders' }) },
    { value: `${summary.awaitingConfirmation}`, label: t.awaitingConfirmation, tone: 'warning', onClick: () => navigate({ name: 'orders' }) },
    { value: `${summary.awaitingShipping}`, label: t.awaitingShipping, tone: 'accent', onClick: () => navigate({ name: 'orders' }) },
    { value: `${summary.problems}`, label: t.problemsLabel, tone: 'danger', onClick: () => navigate({ name: 'shipping' }) },
  ];

  const rangeLabels: Record<RangeKey, string> = {
    '7days': t['7days'],
    '30days': t['30days'],
    thisMonth: t.thisMonth,
    thisYear: t.thisYear,
  };

  // Empty state for new accounts
  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        {/* Greeting */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-content md:text-xl">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-0.5 text-[13px] text-content-secondary">
              {t.empty_dashboard_desc}
            </p>
          </div>
        </div>

        {/* Empty dashboard state */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate({ name: 'orders' })}
            className="card flex flex-col items-center p-6 text-center transition-colors hover:bg-surface-1"
          >
            <ShoppingCart className="h-8 w-8 text-content-tertiary" />
            <p className="mt-2 text-[24px] font-semibold text-content">0</p>
            <p className="text-[12px] text-content-secondary">{t.orders}</p>
          </button>
          <button
            onClick={() => navigate({ name: 'products' })}
            className="card flex flex-col items-center p-6 text-center transition-colors hover:bg-surface-1"
          >
            <Package className="h-8 w-8 text-content-tertiary" />
            <p className="mt-2 text-[24px] font-semibold text-content">0</p>
            <p className="text-[12px] text-content-secondary">{t.products}</p>
          </button>
          <button
            onClick={() => navigate({ name: 'customers' })}
            className="card flex flex-col items-center p-6 text-center transition-colors hover:bg-surface-1"
          >
            <svg className="h-8 w-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="mt-2 text-[24px] font-semibold text-content">0</p>
            <p className="text-[12px] text-content-secondary">{t.customers}</p>
          </button>
          <div className="card flex flex-col items-center p-6 text-center">
            <p className="text-[24px] font-semibold text-content">0 KM</p>
            <p className="text-[12px] text-content-secondary">{t.totalSales}</p>
          </div>
        </div>

        {/* Getting started guide */}
        <Panel>
          <SectionHeader title={t.empty_dashboard_title} />
          <div className="divide-y divide-border">
            <button
              onClick={() => navigate({ name: 'integrations' })}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-1"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-subtle">
                <Plug className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-content">{t.empty_connect_channel}</p>
                <p className="mt-0.5 text-[12px] text-content-secondary">{t.landing_how_step1_desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-content-tertiary" />
            </button>
            <button
              onClick={() => navigate({ name: 'products' })}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-1"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-subtle">
                <Package className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-content">{t.empty_add_product}</p>
                <p className="mt-0.5 text-[12px] text-content-secondary">{t.landing_how_step2_desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-content-tertiary" />
            </button>
            <button
              onClick={() => navigate({ name: 'create-order' })}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-1"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-subtle">
                <ShoppingCart className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-content">{t.empty_create_order}</p>
                <p className="mt-0.5 text-[12px] text-content-secondary">{t.landing_how_step3_desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-content-tertiary" />
            </button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-content md:text-xl">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-0.5 text-[13px] text-content-secondary">
            {interpolate(t.summarySentence, {
              orders: summary.newOrders,
              low: lowStockProducts.length,
            })}
          </p>
        </div>
        <button onClick={() => navigate({ name: 'create-order' })} className="btn-primary">
          <Plus className="h-4 w-4" />
          {t.newOrder}
        </button>
      </div>

      {/* Stats */}
      <StatStrip items={stats} />

      {/* ─── Mobile: Focused cards ─── */}
      <div className="md:hidden space-y-4">
        {/* Attention cards */}
        {(attention.toConfirm.length + attention.toShip.length + attention.problems.length > 0) && (
          <div className="space-y-2">
            <p className="section-label px-1">{t.attentionNeeded}</p>
            {attention.toConfirm.map((o) => (
              <button
                key={o.id}
                onClick={() => navigate({ name: 'order-detail', id: o.id })}
                className="card flex w-full items-center gap-3 p-3.5 text-left active:bg-surface-1 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold">{o.id}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-[14px] text-content-secondary">{o.customerName}</p>
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-content-tertiary">
                    <ChannelBadge channel={o.channel} />
                    <span>{formatDate(o.date, lang)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[15px] font-semibold tnum">{formatKM(orderTotal(o.items, o.shipping), lang)}</span>
                  <span className="btn-secondary btn-sm text-[12px]">{t.confirm}</span>
                </div>
              </button>
            ))}
            {attention.toShip.map((o) => (
              <button
                key={o.id}
                onClick={() => navigate({ name: 'order-detail', id: o.id })}
                className="card flex w-full items-center gap-3 p-3.5 text-left active:bg-surface-1 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold">{o.id}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-[14px] text-content-secondary">{o.customerName}</p>
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-content-tertiary">
                    <ChannelBadge channel={o.channel} />
                    <span>{formatDate(o.date, lang)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[15px] font-semibold tnum">{formatKM(orderTotal(o.items, o.shipping), lang)}</span>
                  <span className="btn-secondary btn-sm text-[12px]">{t.ship}</span>
                </div>
              </button>
            ))}
            {attention.problems.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate({ name: 'shipping' })}
                className="card flex w-full items-center gap-3 p-3.5 text-left active:bg-surface-1 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold">{s.orderId}</span>
                    <ShipmentStatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 text-[14px] text-content-secondary">{s.customerName}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-content-tertiary">
                    <Truck className="h-3 w-3" /> {s.carrier} · {s.trackingNumber}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-content-tertiary" />
              </button>
            ))}
          </div>
        )}

        {/* Latest orders as cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="section-label">{t.latestOrders}</p>
            <button onClick={() => navigate({ name: 'orders' })} className="flex items-center gap-1 text-[12px] font-medium text-accent">
              {t.viewAll} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {latestOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate({ name: 'order-detail', id: order.id })}
              className="card flex w-full items-center gap-3 p-3.5 text-left active:bg-surface-1 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold">{order.id}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-[14px] text-content-secondary">{order.customerName}</p>
                <div className="mt-1 flex items-center gap-2 text-[12px] text-content-tertiary">
                  <ChannelBadge channel={order.channel} />
                  <span>{formatDate(order.date, lang)}</span>
                </div>
              </div>
              <span className="text-[15px] font-semibold tnum">{formatKM(orderTotal(order.items, order.shipping), lang)}</span>
            </button>
          ))}
        </div>

        {/* Low stock */}
        {lowStockProducts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="section-label">{t.lowStock}</p>
              <button onClick={() => navigate({ name: 'inventory' })} className="flex items-center gap-1 text-[12px] font-medium text-accent">
                {t.goToInventory} <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {lowStockProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate({ name: 'product-detail', id: p.id })}
                className="card flex w-full items-center justify-between gap-3 p-3.5 text-left active:bg-surface-1 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium text-content">{p.name}</span>
                  <span className="block text-[12px] text-content-tertiary">{p.sku}</span>
                </span>
                <span className="shrink-0 text-[14px] tnum">
                  <span className={classNames('font-semibold', p.stock === 0 ? 'text-danger' : 'text-warning')}>{p.stock}</span>
                  <span className="text-content-tertiary"> / {p.minimumStock}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Desktop: Grid layout ─── */}
      <div className="hidden md:grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Attention */}
          <Panel>
            <SectionHeader title={t.attentionNeeded} />
            <div className="divide-y divide-border">
              {attention.toConfirm.length + attention.toShip.length + attention.problems.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-content-tertiary">{t.noResults}</p>
              ) : (
                <>
                  {attention.toConfirm.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px]">
                          <button onClick={() => navigate({ name: 'order-detail', id: o.id })} className="font-semibold text-content hover:text-accent transition-colors">{o.id}</button>
                          <span className="text-content-secondary"> · {o.customerName}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-content-tertiary">{t.awaitingConfirmation} · {formatDate(o.date, lang)}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <ChannelBadge channel={o.channel} />
                        <span className="text-[13px] font-semibold tnum">{formatKM(orderTotal(o.items, o.shipping), lang)}</span>
                        <button onClick={() => navigate({ name: 'order-detail', id: o.id })} className="btn-secondary btn-sm">
                          {t.confirm}
                        </button>
                      </div>
                    </div>
                  ))}
                  {attention.toShip.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px]">
                          <button onClick={() => navigate({ name: 'order-detail', id: o.id })} className="font-semibold text-content hover:text-accent transition-colors">{o.id}</button>
                          <span className="text-content-secondary"> · {o.customerName}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-content-tertiary">{t.awaitingShipping} · {formatDate(o.date, lang)}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <ChannelBadge channel={o.channel} />
                        <span className="text-[13px] font-semibold tnum">{formatKM(orderTotal(o.items, o.shipping), lang)}</span>
                        <button onClick={() => navigate({ name: 'order-detail', id: o.id })} className="btn-secondary btn-sm">
                          {t.ship}
                        </button>
                      </div>
                    </div>
                  ))}
                  {attention.problems.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px]">
                          <button onClick={() => navigate({ name: 'order-detail', id: s.orderId })} className="font-semibold text-content hover:text-accent transition-colors">{s.orderId}</button>
                          <span className="text-content-secondary"> · {s.customerName}</span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-content-tertiary">
                          <Truck className="h-3 w-3" /> {s.carrier} · {s.trackingNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ShipmentStatusBadge status={s.status} />
                        <button onClick={() => navigate({ name: 'shipping' })} className="btn-secondary btn-sm">
                          {t.review}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Panel>

          {/* Latest orders table */}
          <Panel>
            <SectionHeader
              title={t.latestOrders}
              action={
                <button onClick={() => navigate({ name: 'orders' })} className="flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-hover transition-colors">
                  {t.viewAll}
                  <ArrowRight className="h-3 w-3" />
                </button>
              }
            />
            <Table>
              <THead>
                <TR>
                  <TH>{t.orderId}</TH>
                  <TH>{t.customer}</TH>
                  <TH>{t.channel}</TH>
                  <TH align="right">{t.amount}</TH>
                  <TH>{t.status}</TH>
                  <TH>{t.date}</TH>
                </TR>
              </THead>
              <TBody>
                {latestOrders.map((order) => (
                  <TR key={order.id} onClick={() => navigate({ name: 'order-detail', id: order.id })}>
                    <TD className="font-semibold">{order.id}</TD>
                    <TD>{order.customerName}</TD>
                    <TD><ChannelBadge channel={order.channel} /></TD>
                    <TD align="right" className="font-semibold tnum">{formatKM(orderTotal(order.items, order.shipping), lang)}</TD>
                    <TD><OrderStatusBadge status={order.status} /></TD>
                    <TD className="text-content-tertiary">{formatDate(order.date, lang)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Panel>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Panel>
            <SectionHeader
              title={t.lowStock}
              action={
                <button onClick={() => navigate({ name: 'inventory' })} className="flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-hover transition-colors">
                  {t.goToInventory}
                  <ArrowRight className="h-3 w-3" />
                </button>
              }
            />
            <div className="divide-y divide-border">
              {lowStockProducts.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-content-tertiary">{t.noLowStock}</p>
              ) : (
                lowStockProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate({ name: 'product-detail', id: p.id })}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors hover:bg-surface-1"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-content">{p.name}</span>
                      <span className="block text-[11px] text-content-tertiary">{p.sku}</span>
                    </span>
                    <span className="shrink-0 text-[13px] tnum">
                      <span className={classNames('font-semibold', p.stock === 0 ? 'text-danger' : 'text-warning')}>{p.stock}</span>
                      <span className="text-content-tertiary"> / {p.minimumStock}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <SectionHeader
              title={t.salesTrend}
              action={
                <div className="flex items-center gap-0.5 rounded bg-surface-2 p-0.5">
                  {rangeKeys.map((k) => (
                    <button
                      key={k}
                      onClick={() => setRange(k)}
                      className={classNames(
                        'rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap',
                        range === k ? 'bg-surface-0 text-content shadow-xs' : 'text-content-tertiary hover:text-content-secondary',
                      )}
                    >
                      {rangeLabels[k]}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="px-2 pb-3 pt-2">
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--content-tertiary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--content-tertiary)' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip
                      cursor={{ stroke: 'var(--border-strong)' }}
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 12, background: 'var(--surface-0)', color: 'var(--content)', boxShadow: 'var(--shadow-popover)' }}
                      formatter={(v) => [formatKM(Number(v), lang), t.revenue]}
                    />
                    <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={1.5} fill="var(--accent)" fillOpacity={0.06} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <button
                onClick={() => navigate({ name: 'reports' })}
                className="mt-1 flex w-full items-center justify-center gap-1 rounded py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent-subtle"
              >
                {t.goToReports}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
