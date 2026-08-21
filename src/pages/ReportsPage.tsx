import { useState, useMemo } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { Panel, SectionHeader, StatStrip, type StatItem } from '@/components/ui';
import { useI18n } from '@/locales';
import { formatKM, classNames } from '@/utils/format';
import { useOrders } from '@/hooks/useOrders';
import { salesSeries, salesByChannel as channelData, topProducts as topProductsData, orderStatuses as statusData, type SalesRange } from '@/lib/reports';
import { orderTotal } from '@/utils/format';

const rangeKeys = ['7days', '30days', 'thisMonth', 'thisYear'] as const;
type RangeKey = (typeof rangeKeys)[number];

export function ReportsPage() {
  const { t, lang } = useI18n();
  const { orders } = useOrders();
  const [range, setRange] = useState<RangeKey>('30days');

  const chartData = useMemo(() => salesSeries(orders, range as SalesRange), [orders, range]);
  const byChannel = useMemo(() => channelData(orders), [orders]);
  const topProducts = useMemo(() => topProductsData(orders), [orders]);
  const orderStatuses = useMemo(() => statusData(orders), [orders]);

  const totalRevenue = useMemo(() => {
    let sum = 0;
    for (const o of orders) {
      if (o.status !== 'cancelled') sum += orderTotal(o.items, o.shipping);
    }
    return sum;
  }, [orders]);

  const totalProfit = useMemo(() => {
    let sum = 0;
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      for (const i of o.items) sum += i.quantity * i.price;
    }
    return sum;
  }, [orders]);

  const activeOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);
  const totalOrderCount = activeOrders.length;
  const avgOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;

  const maxRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);

  const stats: StatItem[] = [
    { value: formatKM(totalRevenue, lang), label: t.revenue },
    { value: `${totalOrderCount}`, label: t.ordersLabel },
    { value: formatKM(totalProfit, lang), label: t.profitLabel },
    { value: formatKM(avgOrderValue, lang), label: t.avgOrderValue },
  ];

  const rangeLabels: Record<RangeKey, string> = {
    '7days': t['7days'],
    '30days': t['30days'],
    thisMonth: t.thisMonth,
    thisYear: t.thisYear,
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t.reports} />

      <StatStrip items={stats} />

      {/* Sales trend */}
      <Panel>
        <SectionHeader
          title={`${t.salesTrend} · ${t.revenue}: ${formatKM(totalRevenue, lang)}`}
          action={
            <div className="flex items-center gap-0.5 rounded-md bg-surface-2 p-0.5">
              {rangeKeys.map((k) => (
                <button
                  key={k}
                  onClick={() => setRange(k)}
                  className={classNames(
                    'rounded px-1.5 py-1 text-xs font-medium transition-colors whitespace-nowrap',
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
          <div className="h-56">
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
                <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="var(--accent)" fillOpacity={0.07} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Sales by channel */}
        <Panel>
          <SectionHeader title={t.salesByChannel} />
          <div className="space-y-3.5 px-4 py-4">
            {byChannel.map((ch) => (
              <div key={ch.channel}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="font-medium text-content">{ch.channel}</span>
                  <span className="font-semibold tnum">{ch.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${ch.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Order statuses */}
        <Panel>
          <SectionHeader title={t.orderStatuses} />
          <div className="space-y-3.5 px-4 py-4">
            {orderStatuses.map((s) => {
              const statusLabel = (t[`st_${s.status}` as keyof typeof t] as string) ?? s.status;
              const maxCount = Math.max(...orderStatuses.map((x) => x.count), 1);
              return (
                <div key={s.status}>
                  <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                    <span className="font-medium text-content">{statusLabel}</span>
                    <span className="font-semibold tnum">{s.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${Math.max((s.count / maxCount) * 100, 6)}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Top products */}
      <Panel>
        <SectionHeader title={t.topProducts} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-1">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-content-tertiary">{t.product}</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-content-tertiary">{t.unitsSold}</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-content-tertiary">{t.revenue}</th>
                <th className="w-1/3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-content-tertiary">{t.share}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topProducts.map((p) => (
                <tr key={p.name} className="transition-colors hover:bg-surface-1">
                  <td className="px-4 py-3 font-medium text-content">{p.name}</td>
                  <td className="px-4 py-3 text-right text-content-secondary tnum">{p.sold}</td>
                  <td className="px-4 py-3 text-right font-semibold tnum">{formatKM(p.revenue, lang)}</td>
                  <td className="px-4 py-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max((p.revenue / maxRevenue) * 100, 4)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
