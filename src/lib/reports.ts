import type { Order, OrderStatus } from '@/types';
import { orderTotal } from '@/utils/format';

/**
 * Analytics derived from trusted order data. All figures are
 * computed from server-validated totals — never from client input.
 */

export type SalesRange = 'today' | '7days' | '30days' | 'thisMonth' | 'thisYear';

export interface SalesPoint { label: string; value: number }

const dayLabels = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function salesSeries(orders: Order[], range: SalesRange): SalesPoint[] {
  const now = new Date();
  const today = startOfDay(now);
  const fmtDay = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`;

  const buckets = new Map<string, number>();
  const add = (key: string, value: number) => buckets.set(key, (buckets.get(key) ?? 0) + value);

  const include = (date: Date): boolean => {
    const diffDays = Math.floor((today.getTime() - startOfDay(date).getTime()) / 86_400_000);
    switch (range) {
      case 'today': return startOfDay(date).getTime() === today.getTime();
      case '7days': return diffDays >= 0 && diffDays < 7;
      case '30days': return diffDays >= 0 && diffDays < 30;
      case 'thisMonth': return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      case 'thisYear': return date.getFullYear() === now.getFullYear();
    }
  };

  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const date = new Date(o.date);
    if (!include(date)) continue;
    const value = orderTotal(o.items, o.shipping);
    switch (range) {
      case 'today':
        add(`${String(date.getHours()).padStart(2, '0')}:00`, value);
        break;
      case '7days':
        add(dayLabels[date.getDay()], value);
        break;
      case '30days':
        add(fmtDay(date), value);
        break;
      case 'thisMonth':
        add(fmtDay(date), value);
        break;
      case 'thisYear':
        add(monthLabels[date.getMonth()], value);
        break;
    }
  }
  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

export interface ChannelDatum { channel: string; value: number; color: string }

const channelColors: Record<string, string> = {
  OLX: '#8b5cf6',
  Instagram: '#ec4899',
  Facebook: '#2563eb',
  Webshop: '#0891b2',
  Manual: '#868e96',
};

export function salesByChannel(orders: Order[]): ChannelDatum[] {
  const totals = new Map<string, number>();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const key = o.channel.charAt(0).toUpperCase() + o.channel.slice(1);
    totals.set(key, (totals.get(key) ?? 0) + orderTotal(o.items, o.shipping));
  }
  const sum = Array.from(totals.values()).reduce((s, v) => s + v, 0) || 1;
  return Array.from(totals.entries()).map(([channel, value]) => ({
    channel,
    value: Math.round((value / sum) * 100),
    color: channelColors[channel] ?? '#868e96',
  }));
}

export interface TopProduct { name: string; sold: number; revenue: number }

export function topProducts(orders: Order[], limit = 6): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    for (const item of o.items) {
      const cur = map.get(item.name) ?? { name: item.name, sold: 0, revenue: 0 };
      cur.sold += item.quantity;
      cur.revenue += item.quantity * item.price;
      map.set(item.name, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export interface StatusDatum { status: string; count: number; color: string }

const statusColors: Record<OrderStatus, string> = {
  pending: '#a1a1aa',
  confirmed: '#2563eb',
  ready: '#b45309',
  shipped: '#2563eb',
  delivered: '#16a34a',
  cancelled: '#dc2626',
};

export function orderStatuses(orders: Order[]): StatusDatum[] {
  const counts = new Map<OrderStatus, number>();
  for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
  const order = ['pending', 'confirmed', 'ready', 'shipped', 'delivered', 'cancelled'] as const;
  return order
    .filter((s) => counts.has(s))
    .map((s) => ({ status: s, count: counts.get(s)!, color: statusColors[s] }));
}
