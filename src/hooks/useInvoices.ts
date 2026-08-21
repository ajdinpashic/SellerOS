import { useCallback, useEffect, useState } from 'react';
import type { Invoice } from '@/types';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { invoiceFromRow, type InvoiceRow } from '@/lib/mappers';

export function useInvoices() {
  const { business } = useBusiness();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !business) return;
    const { data, error: err } = await supabase
      .from('invoices')
      .select('*, orders(display_id, customers(name))')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      return;
    }
    // customerName comes from the embedded order → customer.
    const rows = (data ?? []) as (InvoiceRow & { orders?: { display_id: string; customers?: { name: string } | null } | null })[];
    setInvoices(rows.map((row) => ({
      ...invoiceFromRow(row),
      customerName: row.orders?.customers?.name ?? '',
    })));
    setError(null);
  }, [business]);

  useEffect(() => {
    if (!business) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh, business]);

  return { invoices, loading, error, refresh };
}
