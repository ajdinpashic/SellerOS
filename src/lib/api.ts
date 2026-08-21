import { assertSupabase } from '@/lib/supabase';
import type { OrderStatus, PaymentMethod, SalesChannel } from '@/types';
import type { LocaleDict } from '@/locales/bs';

/**
 * Backend mutations. Everything here goes through SECURITY DEFINER
 * RPC functions or RLS-protected tables — the browser never writes
 * to orders/inventory directly, totals are computed server-side, and
 * every business-owned row is scoped by business_id + RLS.
 */

export interface ApiError {
  /** Safe error code returned by the backend (e.g. 'INSUFFICIENT_STOCK'). */
  code?: string;
  message: string;
}

export interface CreateOrderInput {
  customerId: string | null;
  channel: SalesChannel | 'manual';
  paymentMethod: PaymentMethod;
  shipping: number;
  address: string;
  phone: string;
  email: string;
  note?: string;
  items: { productId: string; quantity: number; price: number; variant?: string }[];
}

export async function apiCreateOrder(businessId: string, input: CreateOrderInput): Promise<{ error?: ApiError; displayId?: string }> {
  const client = assertSupabase();
  const { data, error } = await client.rpc('create_order', {
    p_business_id: businessId,
    p_customer_id: input.customerId,
    p_channel: input.channel,
    p_payment_method: input.paymentMethod,
    p_shipping_amount: input.shipping,
    p_address: input.address,
    p_phone: input.phone,
    p_email: input.email,
    p_note: input.note ?? null,
    p_items: input.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      unit_price: i.price,
      variant: i.variant ?? null,
    })),
  });
  if (error) return { error: { code: error.message, message: error.message } };
  return { displayId: (data as { display_id?: string } | null)?.display_id };
}

export async function apiUpdateOrderStatus(orderId: string, status: OrderStatus): Promise<{ error?: ApiError }> {
  const client = assertSupabase();
  const { error } = await client.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: status,
  });
  if (error) return { error: { code: error.message, message: error.message } };
  return {};
}

export interface CreateProductInput {
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  minimumStock: number;
  initialStock: number;
  channels: SalesChannel[];
}

export async function apiCreateProduct(businessId: string, input: CreateProductInput): Promise<{ error?: ApiError; id?: string }> {
  const client = assertSupabase();
  const { data, error } = await client.rpc('create_product', {
    p_business_id: businessId,
    p_name: input.name,
    p_sku: input.sku,
    p_description: input.description,
    p_category: input.category,
    p_price: input.price,
    p_cost: input.cost,
    p_minimum_stock: input.minimumStock,
    p_initial_stock: input.initialStock,
    p_channels: input.channels,
  });
  if (error) return { error: { code: error.message, message: error.message } };
  return { id: (data as { id?: string } | null)?.id };
}

export async function apiDeleteProduct(productId: string): Promise<{ error?: ApiError }> {
  const client = assertSupabase();
  const { error } = await client.rpc('delete_product', { p_product_id: productId });
  if (error) return { error: { code: error.message, message: error.message } };
  return {};
}

export async function apiUpdateProduct(productId: string, patch: {
  name?: string; sku?: string; description?: string; category?: string;
  price?: number; cost?: number; minimumStock?: number;
}): Promise<{ error?: ApiError }> {
  const client = assertSupabase();
  const { error } = await client
    .from('products')
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.sku !== undefined ? { sku: patch.sku } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.price !== undefined ? { price: patch.price } : {}),
      ...(patch.cost !== undefined ? { cost: patch.cost } : {}),
      ...(patch.minimumStock !== undefined ? { minimum_stock: patch.minimumStock } : {}),
    })
    .eq('id', productId);
  if (error) return { error: { message: error.message } };
  return {};
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export async function apiCreateCustomer(businessId: string, input: CreateCustomerInput): Promise<{ error?: ApiError; id?: string }> {
  const client = assertSupabase();
  const { data, error } = await client
    .from('customers')
    .insert({
      business_id: businessId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      city: input.city || null,
      notes: input.notes || null,
    })
    .select('id')
    .single();
  if (error) return { error: { message: error.message } };
  return { id: data?.id };
}

export async function apiUpdateCustomer(customerId: string, patch: {
  name?: string; email?: string; phone?: string; address?: string; city?: string; notes?: string;
}): Promise<{ error?: ApiError }> {
  const client = assertSupabase();
  const { error } = await client
    .from('customers')
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.email !== undefined ? { email: patch.email || null } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone || null } : {}),
      ...(patch.address !== undefined ? { address: patch.address || null } : {}),
      ...(patch.city !== undefined ? { city: patch.city || null } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes || null } : {}),
    })
    .eq('id', customerId);
  if (error) return { error: { message: error.message } };
  return {};
}

export async function apiDeleteCustomer(customerId: string): Promise<{ error?: ApiError }> {
  const client = assertSupabase();
  const { error } = await client.rpc('delete_customer', { p_customer_id: customerId });
  if (error) return { error: { code: error.message, message: error.message } };
  return {};
}

export async function apiAdjustInventory(productId: string, newStock: number, reason: string): Promise<{ error?: ApiError }> {
  const client = assertSupabase();
  const { error } = await client.rpc('adjust_inventory', {
    p_product_id: productId,
    p_new_stock: newStock,
    p_reason: reason,
  });
  if (error) return { error: { code: error.message, message: error.message } };
  return {};
}

export async function apiCreateInvoice(orderId: string): Promise<{ error?: ApiError; number?: string }> {
  const client = assertSupabase();
  const { data, error } = await client.rpc('create_invoice', { p_order_id: orderId });
  if (error) return { error: { code: error.message, message: error.message } };
  return { number: (data as { invoice_number?: string } | null)?.invoice_number };
}

export async function apiSendMessage(conversationId: string, content: string): Promise<{ error?: ApiError; id?: string }> {
  const client = assertSupabase();
  const { data, error } = await client.rpc('send_message', {
    p_conversation_id: conversationId,
    p_direction: 'outbound',
    p_content: content,
  });
  if (error) return { error: { code: error.message, message: error.message } };
  return { id: (data as { id?: string } | null)?.id };
}

/**
 * Maps backend error codes to safe, localized messages.
 * Raw DB/Supabase error text is never shown to users.
 */
export function apiErrorMessage(error: ApiError | null | undefined, t: LocaleDict): string {
  if (!error) return '';
  switch (error.code) {
    case 'INSUFFICIENT_STOCK': return t.error_insufficient_stock;
    case 'INVALID_TRANSITION': return t.error_invalid_transition;
    case 'STOCK_BELOW_RESERVED': return t.error_stock_below_reserved;
    case 'NOT_ALLOWED': return t.error_not_allowed;
    case 'ORDER_NOT_FOUND':
    case 'PRODUCT_NOT_FOUND':
    case 'CUSTOMER_NOT_FOUND':
    case 'CONVERSATION_NOT_FOUND': return t.error_not_found;
    default: return t.error_generic;
  }
}
