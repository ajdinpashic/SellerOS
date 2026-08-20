import type { Shipment, Invoice, Integration } from '@/types';

export const mockShipments: Shipment[] = [
  {
    id: 's1', orderId: '#1040', customerName: 'Lejla Begović',
    carrier: 'Brza pošta', trackingNumber: 'BP-2024-55432',
    status: 'shipped', estimatedDelivery: '2024-08-18',
    timeline: [
      { label: 'Narudžba zaprimljena', timestamp: '2024-08-15T16:45:00', done: true },
      { label: 'Paket preuzet', timestamp: '2024-08-16T09:00:00', done: true },
      { label: 'U tranzitu — Sarajevo', timestamp: '2024-08-16T14:00:00', done: true },
      { label: 'U tranzitu — Mostar', timestamp: '2024-08-17T08:00:00', done: false },
      { label: 'Dostavljeno', timestamp: '2024-08-18T12:00:00', done: false },
    ],
  },
  {
    id: 's2', orderId: '#1036', customerName: 'Tarik Kovač',
    carrier: 'GLS', trackingNumber: 'GLS-8891234',
    status: 'shipped', estimatedDelivery: '2024-08-17',
    timeline: [
      { label: 'Narudžba zaprimljena', timestamp: '2024-08-13T11:00:00', done: true },
      { label: 'Paket preuzet', timestamp: '2024-08-14T10:00:00', done: true },
      { label: 'U tranzitu', timestamp: '2024-08-14T18:00:00', done: true },
      { label: 'Dostavljeno', timestamp: '2024-08-17T11:00:00', done: false },
    ],
  },
  {
    id: 's3', orderId: '#1037', customerName: 'Nikola Jovanović',
    carrier: 'BH Pošta', trackingNumber: 'BH-7745521',
    status: 'delivered', estimatedDelivery: '2024-08-13',
    timeline: [
      { label: 'Narudžba zaprimljena', timestamp: '2024-08-10T13:30:00', done: true },
      { label: 'Paket preuzet', timestamp: '2024-08-11T09:00:00', done: true },
      { label: 'U tranzitu', timestamp: '2024-08-11T15:00:00', done: true },
      { label: 'Dostavljeno', timestamp: '2024-08-12T14:30:00', done: true },
    ],
  },
  {
    id: 's4', orderId: '#1039', customerName: 'Marko Petrović',
    carrier: 'Express One', trackingNumber: 'EO-3321567',
    status: 'pending', estimatedDelivery: '2024-08-19',
    timeline: [
      { label: 'Narudžba zaprimljena', timestamp: '2024-08-15T09:15:00', done: true },
      { label: 'Spremno za slanje', timestamp: '2024-08-16T08:00:00', done: true },
      { label: 'Paket preuzet', timestamp: '', done: false },
      { label: 'Dostavljeno', timestamp: '', done: false },
    ],
  },
  {
    id: 's5', orderId: '#1027', customerName: 'Nikola Jovanović',
    carrier: 'Brza pošta', trackingNumber: 'BP-2024-55401',
    status: 'shipped', estimatedDelivery: '2024-08-14',
    timeline: [
      { label: 'Narudžba zaprimljena', timestamp: '2024-08-12T13:30:00', done: true },
      { label: 'Paket preuzet', timestamp: '2024-08-13T09:00:00', done: true },
      { label: 'U tranzitu', timestamp: '2024-08-13T16:00:00', done: true },
      { label: 'Dostavljeno', timestamp: '2024-08-14T13:00:00', done: false },
    ],
  },
  {
    id: 's6', orderId: '#1026', customerName: 'Filip Marković',
    carrier: 'GLS', trackingNumber: 'GLS-8891102',
    status: 'pending', estimatedDelivery: '2024-08-18',
    timeline: [
      { label: 'Narudžba zaprimljena', timestamp: '2024-08-12T10:00:00', done: true },
      { label: 'Spremno za slanje', timestamp: '2024-08-13T08:00:00', done: true },
      { label: 'Paket preuzet', timestamp: '', done: false },
      { label: 'Dostavljeno', timestamp: '', done: false },
    ],
  },
  {
    id: 's7', orderId: '#1033', customerName: 'Denis Avdić',
    carrier: 'BH Pošta', trackingNumber: 'BH-7745498',
    status: 'delivered', estimatedDelivery: '2024-08-12',
    timeline: [
      { label: 'Narudžba zaprimljena', timestamp: '2024-08-09T09:00:00', done: true },
      { label: 'Paket preuzet', timestamp: '2024-08-10T09:00:00', done: true },
      { label: 'U tranzitu', timestamp: '2024-08-10T14:00:00', done: true },
      { label: 'Dostavljeno', timestamp: '2024-08-11T16:00:00', done: true },
    ],
  },
  {
    id: 's8', orderId: '#1035', customerName: 'Hana Nuhanović',
    carrier: 'Express One', trackingNumber: 'EO-3321098',
    status: 'delivered', estimatedDelivery: '2024-08-13',
    timeline: [
      { label: 'Narudžba zaprimljena', timestamp: '2024-08-11T11:30:00', done: true },
      { label: 'Paket preuzet', timestamp: '2024-08-12T09:00:00', done: true },
      { label: 'Dostavljeno', timestamp: '2024-08-12T17:00:00', done: true },
    ],
  },
  {
    id: 's9', orderId: '#1042', customerName: 'Emir Hadžić',
    carrier: 'Brza pošta', trackingNumber: 'BP-2024-55499',
    status: 'problem', estimatedDelivery: '2024-08-20',
    timeline: [
      { label: 'Narudžba zaprimljena', timestamp: '2024-08-16T10:30:00', done: true },
      { label: 'Problem sa adresom', timestamp: '2024-08-17T08:00:00', done: true },
      { label: 'Čeka potvrdu adrese', timestamp: '', done: false },
      { label: 'Dostavljeno', timestamp: '', done: false },
    ],
  },
];

export const mockInvoices: Invoice[] = [
  { id: 'R-2024-042', orderId: '#1041', customerName: 'Ajla Smajić', amount: 182, status: 'paid', date: '2024-08-14' },
  { id: 'R-2024-041', orderId: '#1037', customerName: 'Nikola Jovanović', amount: 102, status: 'paid', date: '2024-08-10' },
  { id: 'R-2024-040', orderId: '#1035', customerName: 'Hana Nuhanović', amount: 77, status: 'paid', date: '2024-08-11' },
  { id: 'R-2024-039', orderId: '#1033', customerName: 'Denis Avdić', amount: 242, status: 'paid', date: '2024-08-09' },
  { id: 'R-2024-038', orderId: '#1042', customerName: 'Emir Hadžić', amount: 88, status: 'draft', date: '2024-08-16' },
  { id: 'R-2024-037', orderId: '#1040', customerName: 'Lejla Begović', amount: 140, status: 'sent', date: '2024-08-15' },
  { id: 'R-2024-036', orderId: '#1039', customerName: 'Marko Petrović', amount: 865, status: 'sent', date: '2024-08-15' },
  { id: 'R-2024-035', orderId: '#1036', customerName: 'Tarik Kovač', amount: 149, status: 'sent', date: '2024-08-13' },
  { id: 'R-2024-034', orderId: '#1038', customerName: 'Mia Kovačević', amount: 158, status: 'draft', date: '2024-08-16' },
  { id: 'R-2024-033', orderId: '#1031', customerName: 'Lejla Begović', amount: 72, status: 'paid', date: '2024-08-05' },
  { id: 'R-2024-032', orderId: '#1029', customerName: 'Ajla Smajić', amount: 87, status: 'paid', date: '2024-08-03' },
  { id: 'R-2024-031', orderId: '#1024', customerName: 'Marko Petrović', amount: 200, status: 'overdue', date: '2024-07-28' },
  { id: 'R-2024-030', orderId: '#1023', customerName: 'Denis Avdić', amount: 312, status: 'paid', date: '2024-07-25' },
  { id: 'R-2024-029', orderId: '#1025', customerName: 'Hana Nuhanović', amount: 227, status: 'paid', date: '2024-08-02' },
  { id: 'R-2024-028', orderId: '#1032', customerName: 'Amar Delić', amount: 332, status: 'draft', date: '2024-08-16' },
];

export const mockIntegrations: Integration[] = [
  // Sales channels
  { id: 'i-olx', name: 'OLX', category: 'sales', description: 'Povežite vaš OLX oglas i sinhronizujte narudžbe automatski.', status: 'connected', icon: 'ShoppingBag', color: 'bg-purple-500' },
  { id: 'i-instagram', name: 'Instagram', category: 'sales', description: 'Upravljajte narudžbama iz Instagram prodavnice i DM-ova.', status: 'connected', icon: 'Instagram', color: 'bg-pink-500' },
  { id: 'i-facebook', name: 'Facebook', category: 'sales', description: 'Povežite Facebook Marketplace i stranice za prodaju.', status: 'needs_auth', icon: 'Facebook', color: 'bg-blue-600' },
  { id: 'i-woocommerce', name: 'WooCommerce', category: 'sales', description: 'Sinhronizujte proizvode i narudžbe sa WooCommerce webshopom.', status: 'disconnected', icon: 'ShoppingCart', color: 'bg-violet-600' },
  { id: 'i-shopify', name: 'Shopify', category: 'sales', description: 'Povežite Shopify prodavnicu za dvosmjernu sinhronizaciju.', status: 'disconnected', icon: 'Store', color: 'bg-green-600' },

  // Shipping
  { id: 'i-brzaposhta', name: 'Brza pošta', category: 'shipping', description: 'Automatsko generisanje pošiljki i tracking brojeva.', status: 'connected', icon: 'Truck', color: 'bg-orange-500' },
  { id: 'i-gls', name: 'GLS', category: 'shipping', description: 'Integrisano slanje paketa i praćenje pošiljki u realnom vremenu.', status: 'connected', icon: 'Package', color: 'bg-red-500' },
  { id: 'i-bhposta', name: 'BH Pošta', category: 'shipping', description: 'Slanje putem BH Pošte sa automatskim tracking-om.', status: 'error', icon: 'Mail', color: 'bg-yellow-600' },
  { id: 'i-expressone', name: 'Express One', category: 'shipping', description: 'Brza dostava sa integracijom za Express One kurirsku službu.', status: 'disconnected', icon: 'Zap', color: 'bg-cyan-600' },
];

// Chart data
export const salesOverTime: Record<string, { label: string; value: number }[]> = {
  today: [
    { label: '08:00', value: 120 }, { label: '10:00', value: 280 }, { label: '12:00', value: 450 },
    { label: '14:00', value: 380 }, { label: '16:00', value: 520 }, { label: '18:00', value: 340 },
    { label: '20:00', value: 210 },
  ],
  '7days': [
    { label: 'Pon', value: 980 }, { label: 'Uto', value: 1240 }, { label: 'Sri', value: 850 },
    { label: 'Čet', value: 1450 }, { label: 'Pet', value: 1820 }, { label: 'Sub', value: 1100 },
    { label: 'Ned', value: 760 },
  ],
  '30days': [
    { label: '1', value: 520 }, { label: '5', value: 680 }, { label: '10', value: 920 },
    { label: '15', value: 780 }, { label: '20', value: 1240 }, { label: '25', value: 1050 },
    { label: '30', value: 890 },
  ],
  thisMonth: [
    { label: 'Ned 1', value: 380 }, { label: 'Ned 2', value: 520 }, { label: 'Ned 3', value: 710 },
    { label: 'Ned 4', value: 640 },
  ],
  thisYear: [
    { label: 'Jan', value: 4200 }, { label: 'Feb', value: 3800 }, { label: 'Mar', value: 5100 },
    { label: 'Apr', value: 4600 }, { label: 'Maj', value: 5800 }, { label: 'Jun', value: 6200 },
    { label: 'Jul', value: 5400 }, { label: 'Aug', value: 6800 },
  ],
};

export const salesByChannel: { channel: string; value: number; color: string }[] = [
  { channel: 'OLX', value: 45, color: '#8b5cf6' },
  { channel: 'Instagram', value: 25, color: '#ec4899' },
  { channel: 'Facebook', value: 15, color: '#2563eb' },
  { channel: 'Webshop', value: 15, color: '#0891b2' },
];

export const topProductsReport: { name: string; sold: number; revenue: number }[] = [
  { name: 'Nike Air Max 90', sold: 18, revenue: 2700 },
  { name: 'Adidas Hoodie', sold: 12, revenue: 960 },
  { name: 'iPhone 13 128GB', sold: 5, revenue: 4250 },
  { name: 'Puma T-shirt Black', sold: 22, revenue: 770 },
  { name: 'Backpack Urban 20L', sold: 8, revenue: 520 },
  { name: 'JBL Flip 6 Speaker', sold: 7, revenue: 770 },
];

export const orderStatusReport: { status: string; count: number; color: string }[] = [
  { status: 'Dostavljeno', count: 14, color: '#16a34a' },
  { status: 'Poslano', count: 3, color: '#2563eb' },
  { status: 'Spremno', count: 2, color: '#b45309' },
  { status: 'Potvrđeno', count: 2, color: '#2563eb' },
  { status: 'Čeka potvrdu', count: 2, color: '#a1a1aa' },
  { status: 'Otkazano', count: 1, color: '#dc2626' },
];
