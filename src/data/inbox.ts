import type { SalesChannel } from '@/types';

export interface InboxMessage {
  id: string;
  from: 'customer' | 'me';
  text: string;
  time: string; // display time, e.g. "09:42"
}

export interface CartLine {
  name: string;
  variant?: string;
  qty: number;
  price: number;
}

export interface Conversation {
  id: string;
  channel: SalesChannel;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  unread: number;
  lastTime: string;
  messages: InboxMessage[];
  cart: CartLine[];
  previousOrderIds: string[];
  note?: string;
}

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    channel: 'instagram',
    customerName: 'Emir Hadžić',
    phone: '+387 61 234 567',
    email: 'emir.hadzic@gmail.com',
    city: 'Sarajevo',
    unread: 2,
    lastTime: '09:42',
    messages: [
      { id: 'm1', from: 'customer', text: 'Zdravo! Imate li crnu Nike trenerku u veličini L?', time: '09:38' },
      { id: 'm2', from: 'me', text: 'Zdravo! Provjeravam stanje lagera, javljam za minut.', time: '09:40' },
      { id: 'm3', from: 'customer', text: 'Super, hvala. Ako ima, mogu odmah naručiti.', time: '09:42' },
    ],
    cart: [
      { name: 'Adidas Hoodie', variant: 'L, Crna', qty: 1, price: 80 },
    ],
    previousOrderIds: ['#1030', '#1042'],
    note: 'Preferira dostavu prije podne.',
  },
  {
    id: 'conv-2',
    channel: 'facebook',
    customerName: 'Ajla Smajić',
    phone: '+387 62 345 678',
    email: 'ajla.smajic@hotmail.com',
    city: 'Sarajevo',
    unread: 1,
    lastTime: '09:15',
    messages: [
      { id: 'm1', from: 'customer', text: 'Vidjela sam objavu za naočale. Koja je cijena?', time: '09:05' },
      { id: 'm2', from: 'me', text: 'Ray-Ban Wayfarer su 130 KM, imamo ih na stanju.', time: '09:10' },
      { id: 'm3', from: 'customer', text: 'Uzet ću dva komada. Može li danas slanje?', time: '09:15' },
    ],
    cart: [
      { name: 'Ray-Ban Wayfarer', qty: 2, price: 130 },
    ],
    previousOrderIds: ['#1029', '#1041'],
    note: 'VIP kupac, uvijek plaća karticom.',
  },
  {
    id: 'conv-3',
    channel: 'olx',
    customerName: 'Marko Petrović',
    phone: '+387 63 456 789',
    email: 'marko.petrovic@yahoo.com',
    city: 'Banja Luka',
    unread: 0,
    lastTime: 'Jučer',
    messages: [
      { id: 'm1', from: 'customer', text: 'Zdravo, interesuje me iPhone 13 iz oglasa. Koje je stanje baterije?', time: '18:20' },
      { id: 'm2', from: 'me', text: 'Baterija 89%, stanje 9/10. Ispravan, bez ijedne ogrebotine.', time: '18:32' },
      { id: 'm3', from: 'customer', text: 'Može pouzećem?', time: '18:40' },
      { id: 'm4', from: 'me', text: 'Može. Pošaljite adresu za dostavu.', time: '18:45' },
    ],
    cart: [
      { name: 'iPhone 13 128GB', qty: 1, price: 850 },
    ],
    previousOrderIds: ['#1024', '#1039'],
  },
  {
    id: 'conv-4',
    channel: 'webshop',
    customerName: 'Amina Delić',
    phone: '+387 61 555 021',
    email: 'amina.delic@gmail.com',
    city: 'Zenica',
    unread: 0,
    lastTime: 'Jučer',
    messages: [
      { id: 'm1', from: 'customer', text: 'Zdravo, narudžba #1032 — da li je paket poslan?', time: '16:10' },
      { id: 'm2', from: 'me', text: 'Zdravo! Paket ide sutra ujutro, tracking broj dobijate na email.', time: '16:25' },
    ],
    cart: [],
    previousOrderIds: ['#1032'],
  },
  {
    id: 'conv-5',
    channel: 'instagram',
    customerName: 'Lejla Begović',
    phone: '+387 61 567 890',
    email: 'lejla.begovic@gmail.com',
    city: 'Mostar',
    unread: 0,
    lastTime: 'Pon',
    messages: [
      { id: 'm1', from: 'customer', text: 'Naprtnjača je stigla, hvala! Naručujem još jednu za sestru.', time: '12:05' },
      { id: 'm2', from: 'me', text: 'Drago nam je! Spremamo paket.', time: '12:20' },
    ],
    cart: [
      { name: 'Backpack Urban 20L', qty: 1, price: 65 },
    ],
    previousOrderIds: ['#1031', '#1040'],
    note: 'Često dijeli proizvode na story-ju.',
  },
  {
    id: 'conv-6',
    channel: 'facebook',
    customerName: 'Selma Imamović',
    phone: '+387 61 234 567',
    email: 'selma.imamovic@gmail.com',
    city: 'Sarajevo',
    unread: 0,
    lastTime: 'Pon',
    messages: [
      { id: 'm1', from: 'customer', text: 'Da li majice dolaze u bijeloj boji?', time: '10:50' },
      { id: 'm2', from: 'me', text: 'Trenutno samo crna, ali stiže nova tura sljedeće sedmice.', time: '11:05' },
    ],
    cart: [],
    previousOrderIds: ['#1021', '#1034'],
  },
];

export interface DashboardSummary {
  newOrders: number;
  awaitingConfirmation: number;
  awaitingShipping: number;
  problems: number;
}

export const dashboardSummary: DashboardSummary = {
  newOrders: 12,
  awaitingConfirmation: 3,
  awaitingShipping: 5,
  problems: 2,
};
