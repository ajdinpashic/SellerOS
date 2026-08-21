import { useCallback, useEffect, useState } from 'react';
import type { Product, SalesChannel } from '@/types';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { productFromRow, type ProductRow } from '@/lib/mappers';
import { apiAdjustInventory, apiCreateProduct, apiDeleteProduct, apiUpdateProduct, type ApiError, type CreateProductInput } from '@/lib/api';

export function useProducts() {
  const { business } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !business) return;
    const { data, error: err } = await supabase
      .from('products')
      .select('*, inventory_items(stock, reserved)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: true });
    if (err) {
      setError(err.message);
      return;
    }
    setProducts((data ?? []).map((row) => productFromRow(row as ProductRow)));
    setError(null);
  }, [business]);

  useEffect(() => {
    if (!business) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh, business]);

  const createProduct = useCallback(async (input: CreateProductInput): Promise<{ error?: ApiError; id?: string }> => {
    if (!business) return { error: { message: 'No business' } };
    const result = await apiCreateProduct(business.id, input);
    if (!result.error) await refresh();
    return result;
  }, [business, refresh]);

  const deleteProduct = useCallback(async (productId: string): Promise<{ error?: ApiError }> => {
    const result = await apiDeleteProduct(productId);
    if (!result.error) await refresh();
    return result;
  }, [refresh]);

  const updateProduct = useCallback(async (productId: string, patch: {
    name?: string; sku?: string; description?: string; category?: string;
    price?: number; cost?: number; minimumStock?: number;
  }): Promise<{ error?: ApiError }> => {
    const result = await apiUpdateProduct(productId, patch);
    if (!result.error) await refresh();
    return result;
  }, [refresh]);

  const adjustStock = useCallback(async (productId: string, newStock: number, reason: string): Promise<{ error?: ApiError }> => {
    if (!business) return { error: { message: 'No business' } };
    const result = await apiAdjustInventory(productId, newStock, reason);
    if (!result.error) await refresh();
    return result;
  }, [business, refresh]);

  return { products, loading, error, refresh, createProduct, deleteProduct, updateProduct, adjustStock };
}

export type { SalesChannel };
