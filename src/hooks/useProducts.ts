import { useCallback, useEffect, useState } from 'react';
import type { Product, SalesChannel } from '@/types';
import { supabase, DEMO_MODE } from '@/lib/supabase';
import { useBusiness } from '@/contexts/BusinessContext';
import { productFromRow, type ProductRow } from '@/lib/mappers';
import { apiAdjustInventory, apiCreateProduct, apiDeleteProduct, apiUpdateProduct, type ApiError, type CreateProductInput } from '@/lib/api';
import { mockProducts } from '@/data/products';

let demoProductSeq = 0;

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
    if (DEMO_MODE) {
      setProducts(mockProducts);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().then(() => setLoading(false));
  }, [refresh]);

  const createProduct = useCallback(async (input: CreateProductInput): Promise<{ error?: ApiError; id?: string }> => {
    if (DEMO_MODE) {
      demoProductSeq += 1;
      const product: Product = {
        id: `p${Date.now()}${demoProductSeq}`,
        name: input.name,
        sku: input.sku,
        description: input.description,
        price: input.price,
        cost: input.cost,
        stock: input.initialStock,
        minimumStock: input.minimumStock,
        reserved: 0,
        channels: input.channels.length ? input.channels : ['webshop'],
        category: input.category,
      };
      setProducts((prev) => [product, ...prev]);
      return { id: product.id };
    }
    if (!business) return { error: { message: 'No business' } };
    const result = await apiCreateProduct(business.id, input);
    if (!result.error) await refresh();
    return result;
  }, [business, refresh]);

  const deleteProduct = useCallback(async (productId: string): Promise<{ error?: ApiError }> => {
    if (DEMO_MODE) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      return {};
    }
    const result = await apiDeleteProduct(productId);
    if (!result.error) await refresh();
    return result;
  }, [refresh]);

  const updateProduct = useCallback(async (productId: string, patch: {
    name?: string; sku?: string; description?: string; category?: string;
    price?: number; cost?: number; minimumStock?: number;
  }): Promise<{ error?: ApiError }> => {
    if (DEMO_MODE) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...patch } : p)));
      return {};
    }
    const result = await apiUpdateProduct(productId, patch);
    if (!result.error) await refresh();
    return result;
  }, [refresh]);

  const adjustStock = useCallback(async (productId: string, newStock: number, reason: string): Promise<{ error?: ApiError }> => {
    if (DEMO_MODE) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));
      return {};
    }
    if (!business) return { error: { message: 'No business' } };
    const result = await apiAdjustInventory(productId, newStock, reason);
    if (!result.error) await refresh();
    return result;
  }, [business, refresh]);

  return { products, loading, error, refresh, createProduct, deleteProduct, updateProduct, adjustStock };
}

export type { SalesChannel };
