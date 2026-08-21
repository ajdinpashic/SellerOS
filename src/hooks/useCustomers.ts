import { useCallback, useEffect, useState } from 'react';
import type { Customer } from '@/types';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { customerFromRow, type CustomerRow, type CustomerOrdersAggRow } from '@/lib/mappers';
import { apiCreateCustomer, apiDeleteCustomer, apiUpdateCustomer, type ApiError, type CreateCustomerInput } from '@/lib/api';

export function useCustomers() {
  const { business } = useBusiness();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !business) return;
    const [{ data: rows, error: err }, { data: agg, error: aggErr }] = await Promise.all([
      supabase.from('customers').select('*').eq('business_id', business.id).order('created_at', { ascending: true }),
      supabase.from('orders').select('customer_id, total_amount, channel, created_at').eq('business_id', business.id),
    ]);
    if (err || aggErr) {
      setError((err ?? aggErr)?.message ?? 'Unknown error');
      return;
    }
    const aggRows = (agg ?? []) as CustomerOrdersAggRow[];
    setCustomers((rows ?? []).map((row) => customerFromRow(row as CustomerRow, aggRows)));
    setError(null);
  }, [business]);

  useEffect(() => {
    if (!business) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh, business]);

  const createCustomer = useCallback(async (input: CreateCustomerInput): Promise<{ error?: ApiError; id?: string }> => {
    if (!business) return { error: { message: 'No business' } };
    const result = await apiCreateCustomer(business.id, input);
    if (!result.error) await refresh();
    return result;
  }, [business, refresh]);

  const deleteCustomer = useCallback(async (customerId: string): Promise<{ error?: ApiError }> => {
    const result = await apiDeleteCustomer(customerId);
    if (!result.error) await refresh();
    return result;
  }, [refresh]);

  const updateCustomer = useCallback(async (customerId: string, patch: {
    name?: string; email?: string; phone?: string; address?: string; city?: string; notes?: string;
  }): Promise<{ error?: ApiError }> => {
    const result = await apiUpdateCustomer(customerId, patch);
    if (!result.error) await refresh();
    return result;
  }, [refresh]);

  return { customers, loading, error, refresh, createCustomer, deleteCustomer, updateCustomer };
}
