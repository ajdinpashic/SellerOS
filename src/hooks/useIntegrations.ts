import { useCallback, useEffect, useState } from 'react';
import type { Integration } from '@/types';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { integrationFromRow, type IntegrationRow } from '@/lib/mappers';

/** UI metadata per provider (name, icon, color…). Lives in the frontend. */
const defaultMeta: Record<string, Omit<Integration, 'id' | 'status'>> = {
  olx: { name: 'OLX', category: 'sales', description: 'Povežite vaš OLX oglas i sinhronizujte narudžbe automatski.', icon: 'ShoppingBag', color: 'bg-purple-500' },
  instagram: { name: 'Instagram', category: 'sales', description: 'Upravljajte narudžbama iz Instagram prodavnice i DM-ova.', icon: 'Instagram', color: 'bg-pink-500' },
  facebook: { name: 'Facebook', category: 'sales', description: 'Povežite Facebook Marketplace i stranice za prodaju.', icon: 'Facebook', color: 'bg-blue-600' },
  woocommerce: { name: 'WooCommerce', category: 'sales', description: 'Sinhronizujte proizvode i narudžbe sa WooCommerce webshopom.', icon: 'ShoppingCart', color: 'bg-violet-600' },
  shopify: { name: 'Shopify', category: 'sales', description: 'Povežite Shopify prodavnicu za dvosmjernu sinhronizaciju.', icon: 'Store', color: 'bg-green-600' },
  brzaposhta: { name: 'Brza pošta', category: 'shipping', description: 'Automatsko generisanje pošiljki i tracking brojeva.', icon: 'Truck', color: 'bg-orange-500' },
  gls: { name: 'GLS', category: 'shipping', description: 'Integrisano slanje paketa i praćenje pošiljki u realnom vremenu.', icon: 'Package', color: 'bg-red-500' },
  bhposta: { name: 'BH Pošta', category: 'shipping', description: 'Slanje putem BH Pošte sa automatskim tracking-om.', icon: 'Mail', color: 'bg-yellow-600' },
  expressone: { name: 'Express One', category: 'shipping', description: 'Brza dostava sa integracijom za Express One kurirsku službu.', icon: 'Zap', color: 'bg-cyan-600' },
};

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
        .map((row) => integrationFromRow(row as IntegrationRow, defaultMeta[(row as IntegrationRow).provider] ?? null))
        .filter((i): i is Integration => i !== null),
    );
    setError(null);
  }, [business]);

  useEffect(() => {
    if (!business) {
      setIntegrations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh, business]);

  /**
   * Ensures a row exists for every known provider on first load
   * (upsert keeps existing statuses untouched).
   */
  useEffect(() => {
    if (!supabase || !business) return;
    const providers = Object.keys(defaultMeta);
    void supabase
      .from('integrations')
      .upsert(providers.map((provider) => ({ business_id: business.id, provider })), { onConflict: 'business_id,provider', ignoreDuplicates: false })
      .then(() => refresh());
  }, [business, refresh]);

  return { integrations, loading, error, refresh };
}
