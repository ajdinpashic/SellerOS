import { useCallback, useEffect, useState } from 'react';
import type { Order, OrderStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { orderFromRow, type OrderRow } from '@/lib/mappers';
import { apiCreateOrder, apiUpdateOrderStatus, type ApiError, type CreateOrderInput } from '@/lib/api';

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
    if (!business) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh, business]);

  const createOrder = useCallback(async (input: CreateOrderInput): Promise<{ error?: ApiError; displayId?: string }> => {
    if (!business) return { error: { message: 'No business' } };
    const result = await apiCreateOrder(business.id, input);
    if (result.error) return result;
    await refresh();
    return result;
  }, [business, refresh]);

  const changeStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<{ error?: ApiError }> => {
    const order = orders.find((o) => o.id === orderId);
    const key = order?.key ?? orderId;
    const result = await apiUpdateOrderStatus(key, status);
    if (!result.error) await refresh();
    return result;
  }, [orders, refresh]);

  return { orders, loading, error, refresh, createOrder, changeStatus };
}
