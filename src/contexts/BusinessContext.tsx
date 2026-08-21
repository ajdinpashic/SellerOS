import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { supabase, DEMO_MODE } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type BusinessRole = 'owner' | 'admin' | 'staff';

export interface Business {
  id: string;
  name: string;
  slug: string;
  role: BusinessRole;
}

interface BusinessContextValue {
  /** 'loading' until memberships are fetched for the signed-in user. */
  status: 'loading' | 'ready';
  businesses: Business[];
  /** The active business; null until the user creates/joins one. */
  business: Business | null;
  role: BusinessRole | null;
  setActiveBusiness: (id: string) => void;
  createBusiness: (name: string) => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

const STORAGE_KEY = 'shopos-business';

const demoBusiness: Business = {
  id: 'demo',
  name: 'Demo Shop',
  slug: 'demo-shop',
  role: 'owner',
};

interface MembershipRow {
  role: BusinessRole;
  business_id: string;
  businesses: { id: string; name: string; slug: string } | null;
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  const fetchMemberships = useCallback(async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from('business_members')
      .select('role, business_id, businesses(id, name, slug)')
      .eq('user_id', user.id);
    if (error || !data) return;

    const list: Business[] = (data ?? [])
      .map((row) => {
        // supabase-js types embedded FK relations generically as arrays.
        const embedded = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
        const b = embedded as MembershipRow['businesses'];
        if (!b) return null;
        return { id: b.id, name: b.name, slug: b.slug, role: row.role as BusinessRole };
      })
      .filter((b): b is Business => b !== null);

    setBusinesses(list);

    const stored = localStorage.getItem(STORAGE_KEY);
    const active = list.find((b) => b.id === stored) ?? list[0] ?? null;
    setBusiness(active);
    if (active) localStorage.setItem(STORAGE_KEY, active.id);
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  useEffect(() => {
    if (DEMO_MODE) {
      setBusinesses([demoBusiness]);
      setBusiness(demoBusiness);
      setStatus('ready');
      return;
    }
    if (authStatus === 'signed-in') {
      setStatus('loading');
      void fetchMemberships().then(() => setStatus('ready'));
    } else if (authStatus === 'signed-out' || authStatus === 'loading') {
      setBusinesses([]);
      setBusiness(null);
      setStatus(authStatus === 'loading' ? 'loading' : 'ready');
    }
  }, [authStatus, fetchMemberships]);

  const setActiveBusiness = useCallback((id: string) => {
    const next = businesses.find((b) => b.id === id) ?? null;
    setBusiness(next);
    if (next) localStorage.setItem(STORAGE_KEY, next.id);
  }, [businesses]);

  const createBusiness = useCallback(async (name: string): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase not configured' };
    const trimmed = name.trim();
    if (trimmed.length < 2) return { error: 'INVALID_BUSINESS_NAME' };

    const { data, error } = await supabase.rpc('create_business', { p_name: trimmed });
    if (error) return { error: error.message };

    await fetchMemberships();
    if (data?.id) setActiveBusiness(data.id as string);
    return {};
  }, [fetchMemberships, setActiveBusiness]);

  const refresh = useCallback(async () => {
    if (user) await fetchMemberships();
  }, [user, fetchMemberships]);

  const value = useMemo<BusinessContextValue>(() => ({
    status,
    businesses,
    business,
    role: business?.role ?? null,
    setActiveBusiness,
    createBusiness,
    refresh,
  }), [status, businesses, business, setActiveBusiness, createBusiness, refresh]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
