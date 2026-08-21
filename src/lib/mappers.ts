import type {
  Order, OrderItem, OrderStatus, Product, Customer, Shipment, Invoice, Integration,
} from '@/types';

/**
 * DB row → frontend type mapping (snake_case → camelCase).
 * The frontend data model stays exactly as before; only the source
 * of the data changes. All money comes from NUMERIC columns and is
 * converted with Number() — values are exact up to 2 decimals.
 */

// ─── Orders ──────────────────────────────────────────────────

export interface OrderRow {
  id: string;
  business_id: string;
  customer_id: string | null;
  channel: Order['channel'] | 'manual';
  display_id: string;
  status: OrderStatus;
  payment_method: Order['paymentMethod'];
  shipping_amount: string | number;
  total_amount: string | number;
  address: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  created_at: string;
  customers?: { name: string } | null;
  order_items?: OrderItemRow[];
  order_status_history?: OrderStatusHistoryRow[];
}

export interface OrderItemRow {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  variant_snapshot: string | null;
  quantity: number;
  unit_price: string | number;
}

export interface OrderStatusHistoryRow {
  status: string;
  created_at: string;
}

const timelineSteps: { status: Order['timeline'][number]['status']; key: string }[] = [
  { status: 'received', key: 'tl_received' },
  { status: 'confirmed', key: 'tl_confirmed' },
  { status: 'ready', key: 'tl_packing' },
  { status: 'shipped', key: 'tl_shipped' },
  { status: 'delivered', key: 'tl_delivered' },
];

const statusIndex: Record<OrderStatus, number> = {
  pending: 0, confirmed: 1, ready: 2, shipped: 3, delivered: 4, cancelled: 1,
};

function buildTimeline(createdAt: string, history: OrderStatusHistoryRow[], status: OrderStatus): Order['timeline'] {
  const doneUpTo = statusIndex[status] ?? 0;
  return timelineSteps.map((step, i) => {
    const done = i <= doneUpTo;
    const historyTs = history.find((h) => h.status === step.status)?.created_at;
    return {
      status: step.status,
      label: step.key,
      timestamp: done ? (historyTs ?? createdAt) : '',
      done,
    };
  });
}

export function orderFromRow(row: OrderRow): Order {
  const items: OrderItem[] = (row.order_items ?? []).map((i) => ({
    productId: i.product_id ?? '',
    name: i.product_name_snapshot,
    variant: i.variant_snapshot ?? undefined,
    quantity: i.quantity,
    price: Number(i.unit_price),
  }));
  return {
    id: row.display_id,
    key: row.id,
    customerId: row.customer_id ?? '',
    customerName: row.customers?.name ?? '',
    channel: row.channel === 'manual' ? 'webshop' : row.channel,
    items,
    shipping: Number(row.shipping_amount),
    paymentMethod: row.payment_method,
    status: row.status,
    date: row.created_at,
    address: row.address ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    note: row.note ?? undefined,
    timeline: buildTimeline(row.created_at, row.order_status_history ?? [], row.status),
  };
}

// ─── Products ────────────────────────────────────────────────

export interface ProductRow {
  id: string;
  business_id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: string | number;
  cost: string | number;
  minimum_stock: number;
  channels: string[];
  image_url: string | null;
  inventory_items?: { stock: number; reserved: number } | { stock: number; reserved: number }[] | null;
}

export function productFromRow(row: ProductRow): Product {
  const inv = Array.isArray(row.inventory_items) ? row.inventory_items[0] : row.inventory_items;
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    description: row.description,
    price: Number(row.price),
    cost: Number(row.cost),
    stock: inv?.stock ?? 0,
    minimumStock: row.minimum_stock,
    reserved: inv?.reserved ?? 0,
    channels: row.channels as Product['channels'],
    image: row.image_url ?? undefined,
    category: row.category,
  };
}

// ─── Customers ───────────────────────────────────────────────

export interface CustomerRow {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
}

export interface CustomerOrdersAggRow {
  customer_id: string | null;
  total_amount: string | number;
  channel: string;
  created_at: string;
}

export function customerFromRow(row: CustomerRow, agg: CustomerOrdersAggRow[] = []): Customer {
  const mine = agg.filter((a) => a.customer_id === row.id);
  const channelCounts = new Map<string, number>();
  let total = 0;
  let last = '';
  for (const a of mine) {
    total += Number(a.total_amount);
    channelCounts.set(a.channel, (channelCounts.get(a.channel) ?? 0) + 1);
    if (!last || a.created_at > last) last = a.created_at;
  }
  let primaryChannel: Customer['primaryChannel'] = 'webshop';
  let best = 0;
  channelCounts.forEach((count, ch) => {
    if (ch !== 'manual' && count > best) { best = count; primaryChannel = ch as Customer['primaryChannel']; }
  });
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    primaryChannel,
    orderCount: mine.length,
    totalSpent: total,
    lastOrderDate: last,
    notes: row.notes ?? undefined,
  };
}

// ─── Shipments ───────────────────────────────────────────────

export interface ShipmentRow {
  id: string;
  order_id: string;
  carrier: string;
  tracking_number: string | null;
  status: Shipment['status'];
  estimated_delivery: string | null;
  created_at: string;
  orders?: { display_id: string; customers?: { name: string } | null } | null;
}

const shipmentSteps: { status: Shipment['status']; key: string }[] = [
  { status: 'pending', key: 'shipping_tl_waiting' },
  { status: 'shipped', key: 'shipping_tl_in_transit' },
  { status: 'delivered', key: 'shipping_tl_delivered' },
];

export function shipmentFromRow(row: ShipmentRow): Shipment {
  const statusIdx: Record<Shipment['status'], number> = { pending: 0, shipped: 1, delivered: 2, problem: 1 };
  const doneUpTo = statusIdx[row.status] ?? 0;
  const timeline: Shipment['timeline'] = [
    { label: 'shipping_tl_received', timestamp: row.created_at, done: true },
    ...shipmentSteps.map((step, i) => ({
      label: step.key,
      timestamp: i <= doneUpTo ? row.created_at : '',
      done: i <= doneUpTo,
    })),
  ];
  return {
    id: row.id,
    orderId: row.orders?.display_id ?? row.order_id,
    customerName: row.orders?.customers?.name ?? '',
    carrier: row.carrier,
    trackingNumber: row.tracking_number ?? '',
    status: row.status,
    estimatedDelivery: row.estimated_delivery ?? undefined,
    timeline,
  };
}

// ─── Invoices ────────────────────────────────────────────────

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount: string | number;
  status: Invoice['status'];
  created_at: string;
  orders?: { display_id: string } | null;
}

export function invoiceFromRow(row: InvoiceRow): Invoice {
  return {
    id: row.invoice_number,
    orderId: row.orders?.display_id ?? '',
    customerName: '',
    amount: Number(row.amount),
    status: row.status,
    date: row.created_at.slice(0, 10),
  };
}

// ─── Integrations ────────────────────────────────────────────

export interface IntegrationRow {
  id: string;
  provider: string;
  status: Integration['status'];
}

export function integrationFromRow(row: IntegrationRow, meta: Omit<Integration, 'id' | 'status'> | null): Integration | null {
  if (!meta) return null;
  return {
    id: row.id,
    status: row.status,
    ...meta,
  };
}

// ─── Conversations ───────────────────────────────────────────

export interface ConversationRow {
  id: string;
  channel: 'olx' | 'instagram' | 'facebook' | 'webshop';
  note: string | null;
  last_message_at: string;
  customers?: {
    name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    orders?: { display_id: string }[];
  } | null;
  messages?: ConversationMessageRow[];
}

export interface ConversationMessageRow {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  channel: 'olx' | 'instagram' | 'facebook' | 'webshop';
  customerName: string;
  phone: string;
  email: string;
  city: string;
  unread: number;
  lastTime: string;
  messages: { id: string; from: 'customer' | 'me'; text: string; time: string }[];
  cart: { name: string; variant?: string; qty: number; price: number }[];
  previousOrderIds: string[];
  note?: string;
}

export function conversationFromRow(row: ConversationRow): Conversation {
  const cust = row.customers;
  return {
    id: row.id,
    channel: row.channel,
    customerName: cust?.name ?? '',
    phone: cust?.phone ?? '',
    email: cust?.email ?? '',
    city: cust?.city ?? '',
    unread: 0,
    lastTime: row.last_message_at,
    messages: (row.messages ?? []).map((m) => ({
      id: m.id,
      from: m.direction === 'inbound' ? 'customer' : 'me',
      text: m.content,
      time: m.created_at,
    })),
    cart: [],
    previousOrderIds: (cust?.orders ?? []).map((o) => o.display_id),
    note: row.note ?? undefined,
  };
}
