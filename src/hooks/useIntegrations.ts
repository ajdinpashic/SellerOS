import { useCallback, useEffect, useState } from 'react';
import type { Integration } from '@/types';
import { supabase, DEMO_MODE } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { integrationFromRow, type IntegrationRow } from '@/lib/mappers';
import { mockIntegrations } from '@/data/misc';

/** UI metadata per provider (name, icon, color…). Lives in the frontend. */
export const integrationMeta: Record<string, Omit<Integration, 'id' | 'status'>> = Object.fromEntries(
  mockIntegrations.map((i) => [i.id.replace('i-', ''), { name: i.name, category: i.category, description: i.description, icon: i.icon, color: i.color }]),
);

export function useIntegrations() {
  const { business } = useBusiness();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !business) return;
    const { data, error: err } = await supabase
      .from('integrations')
      .select('id, provider, status')
      .eq('business_id', business.id)
      .order('created_at', { ascending: true });
    if (err) {
      setError(err.message);
      return;
    }
    setIntegrations(
      (data ?? [])
        .map((row) => integrationFromRow(row as IntegrationRow, integrationMeta[(row as IntegrationRow).provider] ?? null))
        .filter((i): i is Integration => i !== null),
    );
    setError(null);
  }, [business]);

  useEffect(() => {
    if (DEMO_MODE) {
      setIntegrations(mockIntegrations);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh]);

  /**
   * Ensures a row exists for every known provider on first load
   * (upsert keeps existing statuses untouched).
   */
  useEffect(() => {
    if (!supabase || !business || DEMO_MODE) return;
    const providers = Object.keys(integrationMeta);
    void supabase
      .from('integrations')
      .upsert(providers.map((provider) => ({ business_id: business.id, provider })), { onConflict: 'business_id,provider', ignoreDuplicates: false })
      .then(() => refresh());
  }, [business, refresh]);

  return { integrations, loading, error, refresh };
}
