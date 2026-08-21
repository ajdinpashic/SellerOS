import type { Order, OrderStatus } from '@/types';

function makeTimeline(status: OrderStatus, baseDate: string): Order['timeline'] {
  const steps: { status: Order['timeline'][number]['status']; key: string }[] = [
    { status: 'received', key: 'tl_received' },
    { status: 'confirmed', key: 'tl_confirmed' },
    { status: 'ready', key: 'tl_packing' },
    { status: 'shipped', key: 'tl_shipped' },
    { status: 'delivered', key: 'tl_delivered' },
  ];
  const order: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    ready: 2,
    shipped: 3,
    delivered: 4,
    cancelled: 1,
  };
  const doneUpTo = status === 'cancelled' ? 1 : order[status];
  const base = new Date(baseDate).getTime();
  return steps.map((s, i) => ({
    status: s.status,
    label: s.key,
    timestamp: new Date(base + i * 3600_000 * 6).toISOString(),
    done: i <= doneUpTo,
  }));
}

function mk(
  id: string,
  customerId: string,
  customerName: string,
  channel: Order['channel'],
  items: Order['items'],
  shipping: number,
  paymentMethod: Order['paymentMethod'],
  status: OrderStatus,
  date: string,
  address: string,
  phone: string,
  email: string,
  note?: string,
): Order {
  return {
    id, key: id, customerId, customerName, channel, items, shipping, paymentMethod,
    status, date, address, phone, email, note,
    timeline: makeTimeline(status, date),
  };
}

export const mockOrders: Order[] = [
  mk('#1042', 'c1', 'Emir Hadžić', 'facebook',
    [{ productId: 'p1', name: 'Adidas Hoodie', variant: 'M, Crna', quantity: 1, price: 80 }],
    8, 'cod', 'confirmed', '2024-08-16T10:30:00',
    'Ferhadija 12, Sarajevo', '+387 61 234 567', 'emir.hadzic@gmail.com', 'Kupac želi prije podne dostavu.'),

  mk('#1041', 'c2', 'Ajla Smajić', 'instagram',
    [{ productId: 'p8', name: 'Ray-Ban Wayfarer', quantity: 1, price: 130 },
     { productId: 'p5', name: 'Leather Wallet Tan', quantity: 1, price: 45 }],
    7, 'card', 'delivered', '2024-08-14T14:20:00',
    'Bulevar Meše Selimovića 45, Sarajevo', '+387 62 345 678', 'ajla.smajic@hotmail.com'),

  mk('#1040', 'c4', 'Lejla Begović', 'instagram',
    [{ productId: 'p11', name: 'Backpack Urban 20L', quantity: 2, price: 65 }],
    10, 'paid', 'shipped', '2024-08-15T16:45:00',
    'Ali-paše Šantića 23, Mostar', '+387 61 567 890', 'lejla.begovic@gmail.com', 'Poklon za sestru.'),

  mk('#1039', 'c3', 'Marko Petrović', 'olx',
    [{ productId: 'p3', name: 'iPhone 13 128GB', quantity: 1, price: 850 }],
    15, 'cod', 'ready', '2024-08-15T09:15:00',
    'Kralja Tvrtka 8, Banja Luka', '+387 63 456 789', 'marko.petrovic@yahoo.com'),

  mk('#1038', 'c7', 'Mia Kovačević', 'facebook',
    [{ productId: 'p2', name: 'Nike Air Max 90', variant: 'Veličina 39', quantity: 1, price: 150 }],
    8, 'cod', 'pending', '2024-08-16T08:20:00',
    'Maršala Tita 56, Tuzla', '+387 61 890 123', 'mia.kovacevic@gmail.com', 'Molim potvrditi dostupnost veličine 39.'),

  mk('#1037', 'c6', 'Nikola Jovanović', 'olx',
    [{ productId: 'p7', name: 'PlayStation 5 Controller', quantity: 1, price: 95 }],
    7, 'paid', 'delivered', '2024-08-10T13:30:00',
    'Kralja Aleksandra 34, Bijeljina', '+387 65 789 012', 'nikola.jovanovic@gmail.com'),

  mk('#1036', 'c5', 'Tarik Kovač', 'webshop',
    [{ productId: 'p12', name: 'JBL Flip 6 Speaker', quantity: 1, price: 110 },
     { productId: 'p9', name: 'Coffee Mug Ceramic', quantity: 2, price: 15 }],
    9, 'card', 'shipped', '2024-08-13T11:00:00',
    'Zmaja od Bosne 7, Sarajevo', '+387 62 678 901', 'tarik.kovac@outlook.com'),

  mk('#1035', 'c9', 'Hana Nuhanović', 'instagram',
    [{ productId: 'p15', name: 'Denim Jacket Blue', variant: 'M', quantity: 1, price: 70 }],
    7, 'cod', 'delivered', '2024-08-11T11:30:00',
    'Kazine 89, Sarajevo', '+387 63 012 345', 'hana.nuhanovic@gmail.com'),

  mk('#1034', 'c11', 'Selma Imamović', 'facebook',
    [{ productId: 'p6', name: 'Puma T-shirt Black', variant: 'S', quantity: 3, price: 35 }],
    8, 'cod', 'confirmed', '2024-08-14T17:45:00',
    'Grbavička 67, Sarajevo', '+387 61 234 567', 'selma.imamovic@gmail.com'),

  mk('#1033', 'c12', 'Denis Avdić', 'webshop',
    [{ productId: 'p14', name: 'Xiaomi Redmi Note 12', quantity: 1, price: 230 }],
    12, 'paid', 'delivered', '2024-08-09T09:00:00',
    'Kemalbegova 22, Tuzla', '+387 62 345 678', 'denis.avdic@outlook.com'),

  mk('#1032', 'c8', 'Amar Delić', 'webshop',
    [{ productId: 'p10', name: 'Apple Watch SE 44mm', quantity: 1, price: 320 }],
    12, 'card', 'pending', '2024-08-16T15:10:00',
    'Splitska 14, Zenica', '+387 62 901 234', 'amar.delic@hotmail.com'),

  mk('#1031', 'c4', 'Lejla Begović', 'instagram',
    [{ productId: 'p13', name: 'Wool Scarf Grey', quantity: 2, price: 25 },
     { productId: 'p9', name: 'Coffee Mug Ceramic', quantity: 1, price: 15 }],
    7, 'paid', 'delivered', '2024-08-05T11:30:00',
    'Ali-paše Šantića 23, Mostar', '+387 61 567 890', 'lejla.begovic@gmail.com'),

  mk('#1030', 'c1', 'Emir Hadžić', 'facebook',
    [{ productId: 'p2', name: 'Nike Air Max 90', variant: 'Veličina 42', quantity: 1, price: 150 }],
    8, 'cod', 'cancelled', '2024-08-07T10:30:00',
    'Ferhadija 12, Sarajevo', '+387 61 234 567', 'emir.hadzic@gmail.com', 'Kupac je otkazao narudžbu.'),

  mk('#1029', 'c2', 'Ajla Smajić', 'instagram',
    [{ productId: 'p1', name: 'Adidas Hoodie', variant: 'S, Siva', quantity: 1, price: 80 }],
    7, 'card', 'delivered', '2024-08-03T14:20:00',
    'Bulevar Meše Selimovića 45, Sarajevo', '+387 62 345 678', 'ajla.smajic@hotmail.com'),

  mk('#1028', 'c7', 'Mia Kovačević', 'facebook',
    [{ productId: 'p11', name: 'Backpack Urban 20L', quantity: 1, price: 65 }],
    8, 'cod', 'delivered', '2024-08-04T08:20:00',
    'Maršala Tita 56, Tuzla', '+387 61 890 123', 'mia.kovacevic@gmail.com'),

  mk('#1027', 'c6', 'Nikola Jovanović', 'olx',
    [{ productId: 'p12', name: 'JBL Flip 6 Speaker', quantity: 1, price: 110 }],
    7, 'paid', 'shipped', '2024-08-12T13:30:00',
    'Kralja Aleksandra 34, Bijeljina', '+387 65 789 012', 'nikola.jovanovic@gmail.com'),

  mk('#1026', 'c10', 'Filip Marković', 'olx',
    [{ productId: 'p3', name: 'iPhone 13 128GB', quantity: 1, price: 850 }],
    15, 'cod', 'ready', '2024-08-12T10:00:00',
    'Vuka Karadžića 3, Banja Luka', '+387 65 123 456', 'filip.markovic@yahoo.com'),

  mk('#1025', 'c9', 'Hana Nuhanović', 'instagram',
    [{ productId: 'p5', name: 'Leather Wallet Tan', quantity: 2, price: 45 },
     { productId: 'p8', name: 'Ray-Ban Wayfarer', quantity: 1, price: 130 }],
    7, 'card', 'delivered', '2024-08-02T11:30:00',
    'Kazine 89, Sarajevo', '+387 63 012 345', 'hana.nuhanovic@gmail.com'),

  mk('#1024', 'c3', 'Marko Petrović', 'olx',
    [{ productId: 'p7', name: 'PlayStation 5 Controller', quantity: 2, price: 95 }],
    10, 'cod', 'delivered', '2024-07-28T09:15:00',
    'Kralja Tvrtka 8, Banja Luka', '+387 63 456 789', 'marko.petrovic@yahoo.com'),

  mk('#1023', 'c12', 'Denis Avdić', 'webshop',
    [{ productId: 'p14', name: 'Xiaomi Redmi Note 12', quantity: 1, price: 230 },
     { productId: 'p6', name: 'Puma T-shirt Black', variant: 'L', quantity: 2, price: 35 }],
    12, 'paid', 'delivered', '2024-07-25T09:00:00',
    'Kemalbegova 22, Tuzla', '+387 62 345 678', 'denis.avdic@outlook.com'),

  mk('#1022', 'c5', 'Tarik Kovač', 'webshop',
    [{ productId: 'p2', name: 'Nike Air Max 90', variant: 'Veličina 43', quantity: 1, price: 150 }],
    8, 'card', 'delivered', '2024-07-22T11:00:00',
    'Zmaja od Bosne 7, Sarajevo', '+387 62 678 901', 'tarik.kovac@outlook.com'),

  mk('#1021', 'c11', 'Selma Imamović', 'facebook',
    [{ productId: 'p15', name: 'Denim Jacket Blue', variant: 'M', quantity: 1, price: 70 }],
    7, 'cod', 'delivered', '2024-07-20T17:45:00',
    'Grbavička 67, Sarajevo', '+387 61 234 567', 'selma.imamovic@gmail.com'),

  mk('#1020', 'c8', 'Amar Delić', 'webshop',
    [{ productId: 'p9', name: 'Coffee Mug Ceramic', quantity: 4, price: 15 }],
    9, 'paid', 'delivered', '2024-07-18T15:10:00',
    'Splitska 14, Zenica', '+387 62 901 234', 'amar.delic@hotmail.com'),

  mk('#1019', 'c4', 'Lejla Begović', 'instagram',
    [{ productId: 'p1', name: 'Adidas Hoodie', variant: 'L, Crna', quantity: 1, price: 80 },
     { productId: 'p13', name: 'Wool Scarf Grey', quantity: 1, price: 25 }],
    7, 'card', 'delivered', '2024-07-15T16:45:00',
    'Ali-paše Šantića 23, Mostar', '+387 61 567 890', 'lejla.begovic@gmail.com'),
];
