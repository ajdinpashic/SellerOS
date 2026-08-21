import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { apiAdjustInventory, type ApiError } from '@/lib/api';

export interface StockChange {
  id: string;
  productName: string;
  from: number;
  to: number;
  reason: string; // i18n key or free text
  ts: number;
}

export function useInventoryMovements() {
  const { business } = useBusiness();
  const [changes, setChanges] = useState<StockChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !business) return;
    const { data, error: err } = await supabase
      .from('inventory_movements')
      .select('id, type, quantity_change, previous_stock, new_stock, reason, created_at, products(name)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(8);
    if (err) {
      setError(err.message);
      return;
    }
    setChanges((data ?? []).map((m) => ({
      id: m.id,
      productName: (m.products as { name?: string } | null)?.name ?? '',
      from: m.previous_stock,
      to: m.new_stock,
      reason: movementReasonKey(m.type, m.reason),
      ts: new Date(m.created_at).getTime(),
    })));
    setError(null);
  }, [business]);

  useEffect(() => {
    if (!business) {
      setChanges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh, business]);

  return { changes, loading, error, refresh };
}

/** Maps movement rows to the i18n keys the Inventory UI already uses. */
function movementReasonKey(type: string, reason: string | null): string {
  if (reason && ['reason_new', 'reason_correction', 'reason_damage', 'reason_loss'].includes(reason)) {
    return reason;
  }
  switch (type) {
    case 'restock': return 'reason_new';
    case 'reservation':
    case 'sale':
    case 'release':
    case 'return':
    case 'manual_adjustment':
    default:
      return 'reason_correction';
  }
}

export function useInventory() {
  const { business } = useBusiness();
  const { changes, loading, error, refresh: refreshMovements } = useInventoryMovements();

  const adjust = useCallback(async (productId: string, newStock: number, reason: string): Promise<{ error?: ApiError }> => {
    if (!business) return { error: { message: 'No business' } };
    const result = await apiAdjustInventory(productId, newStock, reason);
    if (!result.error) await refreshMovements();
    return result;
  }, [business, refreshMovements]);

  return { changes, loading, error, refresh: refreshMovements, adjust };
}
