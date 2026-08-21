import { useCallback, useEffect, useState } from 'react';
import type { Shipment } from '@/types';
import { supabase, DEMO_MODE } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { shipmentFromRow, type ShipmentRow } from '@/lib/mappers';
import { mockShipments } from '@/data/misc';

export function useShipments() {
  const { business } = useBusiness();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !business) return;
    const { data, error: err } = await supabase
      .from('shipments')
      .select('*, orders(display_id, customers(name))')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      return;
    }
    setShipments((data ?? []).map((row) => shipmentFromRow(row as ShipmentRow)));
    setError(null);
  }, [business]);

  useEffect(() => {
    if (DEMO_MODE) {
      setShipments(mockShipments);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh]);

  return { shipments, loading, error, refresh };
}
