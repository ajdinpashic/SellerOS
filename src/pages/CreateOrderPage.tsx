import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Check, User as UserIcon, Package as PackageIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { useI18n } from '@/locales';
import { formatKM, classNames } from '@/utils/format';
import { apiErrorMessage, type ApiError, type CreateOrderInput } from '@/lib/api';
import type { Customer, OrderItem, PaymentMethod, Product, SalesChannel } from '@/types';
import type { Route } from '@/hooks/useRouter';

interface CreateOrderPageProps {
  navigate: (route: Route) => void;
  products: Product[];
  customers: Customer[];
  onCreate: (input: CreateOrderInput) => Promise<{ error?: ApiError; displayId?: string }>;
}

const channels: { value: SalesChannel | 'manual'; labelKey: string }[] = [
  { value: 'olx', labelKey: 'ch_olx' },
  { value: 'instagram', labelKey: 'ch_instagram' },
  { value: 'facebook', labelKey: 'ch_facebook' },
  { value: 'webshop', labelKey: 'ch_webshop' },
  { value: 'manual', labelKey: 'manualEntry' },
];

const payments: { value: PaymentMethod; labelKey: string }[] = [
  { value: 'cod', labelKey: 'pay_cod' },
  { value: 'paid', labelKey: 'pay_paid' },
  { value: 'card', labelKey: 'pay_card' },
  { value: 'other', labelKey: 'pay_other' },
];

export function CreateOrderPage({ navigate, products, customers, onCreate }: CreateOrderPageProps) {
  const { t, lang } = useI18n();
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [channel, setChannel] = useState<SalesChannel | 'manual'>('webshop');
  const [items, setItems] = useState<OrderItem[]>([{ productId: '', name: '', quantity: 1, price: 0 }]);
  const [shipping, setShipping] = useState(8);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = subtotal + shipping;

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c) {
      setCustomerName(c.name);
      setAddress(c.address ? `${c.address}, ${c.city}`.replace(/, $/, '') : c.city);
      setPhone(c.phone);
      setEmail(c.email);
    }
  };

  const handleProductSelect = (idx: number, pid: string) => {
    const p = products.find((x) => x.id === pid);
    setItems((prev) => prev.map((it, i) =>
      i === idx ? { ...it, productId: pid, name: p?.name || '', price: p?.price || 0 } : it,
    ));
  };

  const updateItem = (idx: number, patch: Partial<OrderItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { productId: '', name: '', quantity: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const canSave = customerName.trim() && items.some((i) => i.productId) && address.trim() && !saving;

  const handleSave = async () => {
    if (saving) return;
    const validItems = items.filter((i) => i.productId);
    setSaving(true);
    setError('');
    // The server validates items, snapshots prices and computes the
    // total — the client never sends a total_amount.
    const result = await onCreate({
      customerId: customerId || null,
      channel,
      paymentMethod,
      shipping,
      address,
      phone,
      email,
      note: note || undefined,
      items: validItems.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price, variant: i.variant })),
    });
    setSaving(false);
    if (result.error) {
      setError(apiErrorMessage(result.error, t));
      return;
    }
    setCreatedId(result.displayId ?? '');
    setSuccessOpen(true);
  };

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title={t.createOrder}
        breadcrumb={[{ label: t.orders, onClick: () => navigate({ name: 'orders' }) }, { label: t.createOrder }]}
        actions={
          <button onClick={() => navigate({ name: 'orders' })} className="btn-secondary">
            <ArrowLeft className="h-4 w-4" /> {t.backToOrders}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Customer + channel */}
          <div className="card p-5">
            <h3 className="text-base font-semibold text-content mb-4">{t.customerInfo}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t.selectCustomer}</label>
                <select className="input cursor-pointer" value={customerId} onChange={(e) => handleCustomerSelect(e.target.value)}>
                  <option value="">—</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t.customerName}</label>
                <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t.customerPlaceholder} />
              </div>
              <div>
                <label className="label">{t.channelLabel}</label>
                <select className="input cursor-pointer" value={channel} onChange={(e) => setChannel(e.target.value as SalesChannel | 'manual')}>
                  {channels.map((c) => <option key={c.value} value={c.value}>{t[c.labelKey as keyof typeof t] as string}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t.paymentLabel}</label>
                <select className="input cursor-pointer" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  {payments.map((p) => <option key={p.value} value={p.value}>{t[p.labelKey as keyof typeof t] as string}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">{t.address}</label>
                <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <label className="label">{t.phone}</label>
                <input className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">{t.email}</label>
                <input className="input" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-content">{t.orderItems}</h3>
              <button onClick={addItem} className="btn-secondary text-sm">
                <Plus className="h-4 w-4" /> {t.addItem}
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="label">{t.selectProduct}</label>
                    <select className="input cursor-pointer" value={item.productId} onChange={(e) => handleProductSelect(idx, e.target.value)}>
                      <option value="">—</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatKM(p.price, lang)}</option>)}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="label">{t.quantityLabel}</label>
                    <input type="number" inputMode="numeric" min={1} className="input tnum" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="w-28">
                    <label className="label">{t.priceLabel}</label>
                    <input type="number" className="input tnum" value={item.price} onChange={(e) => updateItem(idx, { price: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="w-24 text-right">
                    <label className="label">{t.amount}</label>
                    <p className="py-2 text-sm font-semibold text-content tnum">{formatKM(item.quantity * item.price, lang)}</p>
                  </div>
                  <button onClick={() => removeItem(idx)} className="btn-ghost text-red-500 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4 space-y-2">
              <div className="flex items-center gap-3">
                <label className="label mb-0 flex-1">{t.shippingCost}</label>
                <input type="number" className="input w-32 tnum" value={shipping} onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between text-sm text-content-secondary">
                <span>{t.subtotal}</span>
                <span className="tnum">{formatKM(subtotal, lang)}</span>
              </div>
              <div className="flex justify-between text-[15px] font-semibold text-content">
                <span>{t.total}</span>
                <span className="tnum">{formatKM(total, lang)}</span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="card p-5">
            <label className="label">{t.noteLabel}</label>
            <textarea className="input min-h-[80px] resize-y" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error && (
            <p className="rounded-md border border-danger/20 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-6">
            <h3 className="text-base font-semibold text-content mb-4">{t.createOrder}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-content-secondary">
                <UserIcon className="h-4 w-4 text-content-tertiary" />
                <span className={classNames(!customerName && 'text-content-tertiary')}>{customerName || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-content-secondary">
                <PackageIcon className="h-4 w-4 text-content-tertiary" />
                <span>{items.filter((i) => i.productId).length} {t.products}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-semibold text-content">
                <span>{t.total}</span>
                <span className="tnum">{formatKM(total, lang)}</span>
              </div>
            </div>
            <button onClick={handleSave} disabled={!canSave} className="btn-primary w-full mt-4">
              <Check className="h-4 w-4" /> {t.save}
            </button>
            <button onClick={() => navigate({ name: 'orders' })} className="btn-secondary w-full mt-2">
              {t.cancelBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Fixed bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 md:hidden border-t bg-surface-0"
        style={{
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
          paddingTop: '12px',
          borderColor: 'var(--border-color)',
        }}>
        <button onClick={handleSave} disabled={!canSave} className="btn-primary w-full min-h-[48px] text-[15px]">
          <Check className="h-5 w-5" /> {t.save} — {formatKM(total, lang)}
        </button>
      </div>

      <Modal
        open={successOpen}
        onClose={() => navigate({ name: 'order-detail', id: createdId })}
        title={t.orderCreated}
        footer={
          <>
            <button onClick={() => navigate({ name: 'orders' })} className="btn-secondary">{t.backToOrders}</button>
            <button onClick={() => navigate({ name: 'order-detail', id: createdId })} className="btn-primary">{t.viewDetails}</button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-subtle">
            <Check className="h-5 w-5 text-success" />
          </div>
          <p className="text-sm text-content-secondary">{t.orderNumber} {createdId} — {customerName}</p>
        </div>
      </Modal>
    </div>
  );
}
