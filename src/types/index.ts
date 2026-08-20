export type SalesChannel = 'olx' | 'instagram' | 'facebook' | 'webshop';

export type OrderStatus =
  | 'pending'      // Čeka potvrdu
  | 'confirmed'    // Potvrđeno
  | 'ready'        // Spremno
  | 'shipped'      // Poslano
  | 'delivered'    // Dostavljeno
  | 'cancelled';   // Otkazano

export type PaymentMethod = 'cod' | 'paid' | 'card' | 'other';
// Pouzećem | Uplaćeno | Kartica | Drugo

export interface OrderItem {
  productId: string;
  name: string;
  variant?: string;     // e.g. "M, Crna"
  quantity: number;
  price: number;        // unit price in KM
}

export interface Order {
  id: string;           // display id e.g. "#1042"
  customerId: string;
  customerName: string;
  channel: SalesChannel;
  items: OrderItem[];
  shipping: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  date: string;         // ISO
  address: string;
  phone: string;
  email: string;
  note?: string;
  timeline: OrderTimelineEvent[];
}

export interface OrderTimelineEvent {
  status: OrderStatus | 'received';
  label: string;        // localized key handled in UI
  timestamp: string;    // ISO
  done: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  minimumStock: number;
  reserved: number;
  channels: SalesChannel[];
  image?: string;       // optional url
  category: string;
}

export interface InventoryItem {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  reserved: number;
  minimum: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  primaryChannel: SalesChannel;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  notes?: string;
}

export type ShipmentStatus = 'pending' | 'shipped' | 'delivered' | 'problem';

export interface Shipment {
  id: string;
  orderId: string;
  customerName: string;
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  estimatedDelivery?: string;
  timeline: ShipmentEvent[];
}

export interface ShipmentEvent {
  label: string;
  timestamp: string;
  done: boolean;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;           // e.g. "R-2024-001"
  orderId: string;
  customerName: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
}

export interface Integration {
  id: string;
  name: string;
  category: 'sales' | 'shipping';
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'needs_auth';
  icon: string;         // lucide icon name
  color: string;        // tailwind classes for icon bg
}

export type LanguageCode = 'bs' | 'hr' | 'sr' | 'en';
