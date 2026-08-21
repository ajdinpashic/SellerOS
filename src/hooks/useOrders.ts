import { useCallback, useEffect, useState } from 'react';
import type { Order, OrderStatus } from '@/types';
import { supabase, DEMO_MODE } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { orderFromRow, type OrderRow } from '@/lib/mappers';
import { apiCreateOrder, apiUpdateOrderStatus, type ApiError, type CreateOrderInput } from '@/lib/api';
import { mockOrders } from '@/data/orders';
import { mockProducts } from '@/data/products';

let demoOrderSeq = 0;

function demoOrderFromInput(input: CreateOrderInput): Order {
  demoOrderSeq += 1;
  const displayId = `#${1043 + mockOrders.length + demoOrderSeq}`;
  const now = new Date().toISOString();
  return {
    id: displayId,
    key: displayId,
    customerId: input.customerId ?? '',
    customerName: input.customerId
      ? (mockOrders.find((o) => o.customerId === input.customerId)?.customerName ?? '')
      : input.address,
    channel: input.channel === 'manual' ? 'webshop' : input.channel,
    items: input.items.map((i) => ({
      productId: i.productId,
      name: mockProducts.find((p) => p.id === i.productId)?.name ?? '',
      variant: i.variant,
      quantity: i.quantity,
      price: i.price,
    })),
    shipping: input.shipping,
    paymentMethod: input.paymentMethod,
    status: 'pending',
    date: now,
    address: input.address,
    phone: input.phone,
    email: input.email,
    note: input.note,
    timeline: [
      { status: 'received', label: 'tl_received', timestamp: now, done: true },
      { status: 'confirmed', label: 'tl_confirmed', timestamp: '', done: false },
      { status: 'ready', label: 'tl_packing', timestamp: '', done: false },
      { status: 'shipped', label: 'tl_shipped', timestamp: '', done: false },
      { status: 'delivered', label: 'tl_delivered', timestamp: '', done: false },
    ],
  };
}

function demoAdvanceStatus(order: Order, next: OrderStatus): Order {
  const orderIdx: Record<OrderStatus, number> = { pending: 0, confirmed: 1, ready: 2, shipped: 3, delivered: 4, cancelled: 1 };
  return {
    ...order,
    status: next,
    timeline: order.timeline.map((e, i) => ({
      ...e,
      done: i <= orderIdx[next],
      timestamp: i <= orderIdx[next] && !e.done ? new Date().toISOString() : e.timestamp,
    })),
  };
}

export function useOrders() {
  const { business } = useBusiness();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !business) return;
    const { data, error: err } = await supabase
      .from('orders')
      .select('*, order_items(*), order_status_history(status, created_at), customers(name)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      return;
    }
    setOrders((data ?? []).map((row) => orderFromRow(row as OrderRow)));
    setError(null);
  }, [business]);

  useEffect(() => {
    if (DEMO_MODE) {
      setOrders(mockOrders);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh]);

  const createOrder = useCallback(async (input: CreateOrderInput): Promise<{ error?: ApiError; displayId?: string }> => {
    if (DEMO_MODE) {
      const order = demoOrderFromInput(input);
      setOrders((prev) => [order, ...prev]);
      return { displayId: order.id };
    }
    if (!business) return { error: { message: 'No business' } };
    const result = await apiCreateOrder(business.id, input);
    if (result.error) return result;
    await refresh();
    return result;
  }, [business, refresh]);

  const changeStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<{ error?: ApiError }> => {
    if (DEMO_MODE) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? demoAdvanceStatus(o, status) : o)));
      return {};
    }
    // Resolve the backend uuid from the display id.
    const order = orders.find((o) => o.id === orderId);
    const key = order?.key ?? orderId;
    const result = await apiUpdateOrderStatus(key, status);
    if (!result.error) await refresh();
    return result;
  }, [orders, refresh]);

  return { orders, loading, error, refresh, createOrder, changeStatus };
}
