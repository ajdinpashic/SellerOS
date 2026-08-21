import { useState } from 'react';
import {
  ArrowLeft, Check, MapPin, Phone, Mail, Package, Truck,
  XCircle, StickyNote, ChevronDown, ChevronUp,
} from 'lucide-react';
import { OrderStatusBadge, ChannelBadge } from '@/components/Badges';
import { Panel, SectionHeader, Avatar, Toast } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { Table, THead, TBody, TR, TH, TD } from '@/components/Table';
import { useI18n } from '@/locales';
import { formatKM, formatDate, formatDateTime, orderSubtotal, orderTotal, classNames } from '@/utils/format';
import { apiErrorMessage, type ApiError } from '@/lib/api';
import type { Customer, Order, OrderStatus } from '@/types';
import type { Route } from '@/hooks/useRouter';

interface OrderDetailPageProps {
  orderId: string;
  navigate: (route: Route) => void;
  orders: Order[];
  customers: Customer[];
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<{ error?: ApiError }>;
}

const statusFlow: { status: Order['timeline'][number]['status']; labelKey: string }[] = [
  { status: 'received', labelKey: 'tl_received' },
  { status: 'confirmed', labelKey: 'tl_confirmed' },
  { status: 'ready', labelKey: 'tl_packing' },
  { status: 'shipped', labelKey: 'tl_shipped' },
  { status: 'delivered', labelKey: 'tl_delivered' },
];

const statusOrder: Record<OrderStatus, number> = {
  pending: 0, confirmed: 1, ready: 2, shipped: 3, delivered: 4, cancelled: 1,
};

export function OrderDetailPage({ orderId, navigate, orders, customers, onStatusChange }: OrderDetailPageProps) {
  const { t, lang } = useI18n();
  const order = orders.find((o) => o.id === orderId);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  if (!order) {
    return (
      <div>
        <div className="mb-5">
          <nav className="mb-1.5 flex items-center gap-1.5 text-[13px] text-content-tertiary">
            <button onClick={() => navigate({ name: 'orders' })} className="hover:text-content-secondary">{t.orders}</button>
            <span>/</span>
            <span className="font-medium text-content-secondary">{orderId}</span>
          </nav>
          <h1 className="text-xl font-semibold tracking-tight">{t.orderNumber} {orderId}</h1>
        </div>
        <div className="card p-12 text-center text-[13px] text-content-tertiary">{t.noOrders}</div>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === order.customerId);
  const customerOrders = orders.filter((o) => o.customerId === order.customerId && o.id !== order.id);
  const subtotal = orderSubtotal(order.items);
  const total = orderTotal(order.items, order.shipping);
  const currentStep = statusOrder[order.status];
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  // Status changes go through the backend (RLS + transition rules +
  // inventory + status history). The UI never mutates the order locally.
  const advanceStatus = async (next: OrderStatus) => {
    if (busy) return;
    setBusy(true);
    const result = await onStatusChange(order.id, next);
    setBusy(false);
    if (result.error) setToast(apiErrorMessage(result.error, t));
  };

  const cancelOrder = async () => {
    setCancelModalOpen(false);
    await advanceStatus('cancelled');
  };

  const nextAction = !isCancelled && !isDelivered ? (
    order.status === 'pending' ? { label: t.confirm, icon: Check, run: () => advanceStatus('confirmed') } :
    order.status === 'confirmed' ? { label: t.prepare, icon: Package, run: () => advanceStatus('ready') } :
    order.status === 'ready' ? { label: t.ship, icon: Truck, run: () => advanceStatus('shipped') } :
    order.status === 'shipped' ? { label: t.markDelivered, icon: Check, run: () => advanceStatus('delivered') } :
    null
  ) : null;

  return (
    <div className="pb-24 md:pb-0">
      {/* ─── Mobile header ─── */}
      <div className="mb-3 md:hidden">
        <button
          onClick={() => navigate({ name: 'orders' })}
          className="flex items-center gap-1.5 text-[13px] text-content-tertiary mb-2 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.orders}
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[17px] font-semibold">{t.orderNumber} {order.id}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-content-tertiary">
          <ChannelBadge channel={order.channel} />
          <span>·</span>
          <span>{formatDate(order.date, lang)}</span>
        </div>
      </div>

      {/* ─── Desktop header ─── */}
      <div className="mb-4 hidden md:block">
        <nav className="mb-1 flex items-center gap-1.5 text-[12px] text-content-tertiary">
          <button onClick={() => navigate({ name: 'orders' })} className="hover:text-content-secondary transition-colors">{t.orders}</button>
          <span>/</span>
          <span className="font-medium text-content-secondary">{order.id}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-lg font-semibold tracking-tight text-content">{t.orderNumber} {order.id}</h1>
          <OrderStatusBadge status={order.status} />
          <ChannelBadge channel={order.channel} />
          <span className="text-[12px] text-content-tertiary">{formatDate(order.date, lang)}</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate({ name: 'orders' })} className="btn-secondary btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.backToOrders}
            </button>
            {nextAction && (
              <button onClick={() => void nextAction.run()} disabled={busy} className="btn-primary">
                {(() => { const Icon = nextAction.icon; return <Icon className="h-3.5 w-3.5" />; })()}
                {nextAction.label}
              </button>
            )}
            {!isCancelled && !isDelivered && (
              <button onClick={() => setCancelModalOpen(true)} className="btn-ghost text-danger hover:bg-danger-subtle hover:text-danger">
                <XCircle className="h-3.5 w-3.5" />
                {t.cancel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Workflow stepper */}
      <Panel className="mb-4 px-4 py-3 md:py-4 md:px-6">
        {isCancelled ? (
          <div className="flex items-center gap-2.5 rounded-md border border-danger/20 bg-danger-subtle px-4 py-3">
            <XCircle className="h-4 w-4 shrink-0 text-danger" />
            <span className="text-sm font-medium text-danger">{t.tl_cancelled}</span>
          </div>
        ) : (
          <ol className="flex">
            {statusFlow.map((step, i) => {
              const done = i <= currentStep;
              const prevDone = i > 0 && i - 1 <= currentStep;
              const ts = order.timeline[i];
              return (
                <li key={step.status} className="relative flex flex-1 flex-col items-center">
                  {i > 0 && (
                    <span className={classNames(
                      'absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2 rounded-full',
                      prevDone ? 'bg-accent' : 'bg-border',
                    )} />
                  )}
                  <span className={classNames(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-surface-0',
                    done ? 'border-accent bg-accent' : 'border-border',
                  )}>
                    {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className={classNames(
                    'mt-1.5 text-center text-[11px] font-medium leading-tight md:text-xs',
                    done ? 'text-content' : 'text-content-tertiary',
                  )}>
                    {t[step.labelKey as keyof typeof t] as string}
                  </span>
                  {done && ts?.timestamp && (
                    <span className="mt-0.5 text-center text-[9px] text-content-tertiary tnum md:text-[10px]">
                      {formatDateTime(ts.timestamp, lang)}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: items, pricing, note */}
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <SectionHeader title={t.orderItems} />
            {/* Mobile: item cards */}
            <div className="md:hidden divide-y divide-border">
              {order.items.map((item, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-content">{item.name}</p>
                      {item.variant && <p className="text-[12px] text-content-tertiary">{item.variant}</p>}
                    </div>
                    <span className="text-[14px] font-semibold tnum">{formatKM(item.quantity * item.price, lang)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-content-tertiary">
                    <span>{item.quantity}×</span>
                    <span>{formatKM(item.price, lang)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block">
              <Table>
                <THead>
                  <TR>
                    <TH>{t.product}</TH>
                    <TH align="right">{t.quantity}</TH>
                    <TH align="right">{t.unitPrice}</TH>
                    <TH align="right">{t.amount}</TH>
                  </TR>
                </THead>
                <TBody>
                  {order.items.map((item, i) => (
                    <TR key={i}>
                      <TD>
                        <p className="font-medium text-content">{item.name}</p>
                        {item.variant && <p className="text-xs text-content-tertiary">{item.variant}</p>}
                      </TD>
                      <TD align="right" className="text-content-secondary tnum">{item.quantity}</TD>
                      <TD align="right" className="text-content-secondary tnum">{formatKM(item.price, lang)}</TD>
                      <TD align="right" className="font-semibold tnum">{formatKM(item.quantity * item.price, lang)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="border-t border-border bg-surface-1 px-4 py-3.5">
              <div className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-content-secondary">
                  <span>{t.subtotal}</span>
                  <span className="tnum">{formatKM(subtotal, lang)}</span>
                </div>
                <div className="flex justify-between text-content-secondary">
                  <span>{t.shippingCost}</span>
                  <span className="tnum">{formatKM(order.shipping, lang)}</span>
                </div>
                <div className="flex justify-between text-content-secondary">
                  <span>{t.paymentMethod}</span>
                  <span>{t[`pay_${order.paymentMethod}` as keyof typeof t] as string}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-[15px] font-semibold text-content">
                  <span>{t.total}</span>
                  <span className="tnum">{formatKM(total, lang)}</span>
                </div>
              </div>
            </div>
          </Panel>

          {order.note && (
            <Panel className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="text-[13px] font-medium text-content">{t.orderNote}</p>
                  <p className="mt-0.5 text-[13px] text-content-secondary">{order.note}</p>
                </div>
              </div>
            </Panel>
          )}
        </div>

        {/* Right: customer, previous orders */}
        <div className="space-y-4">
          {/* Mobile: collapsible customer panel */}
          <div className="md:hidden">
            <button
              onClick={() => setCustomerExpanded((v) => !v)}
              className="card flex w-full items-center justify-between p-3.5 text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar name={order.customerName} size="md" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-content">{order.customerName}</p>
                  {customer && <p className="text-[12px] text-content-tertiary">{customer.city}</p>}
                </div>
              </div>
              {customerExpanded ? <ChevronUp className="h-5 w-5 text-content-tertiary" /> : <ChevronDown className="h-5 w-5 text-content-tertiary" />}
            </button>
            {customerExpanded && (
              <div className="card mt-1 p-4 animate-slide-up">
                <div className="space-y-3 text-[14px] text-content-secondary">
                  <a href={`tel:${order.phone}`} className="flex items-center gap-2.5 min-h-[44px]">
                    <Phone className="h-4 w-4 shrink-0 text-content-tertiary" />
                    {order.phone}
                  </a>
                  <a href={`mailto:${order.email}`} className="flex items-center gap-2.5 min-h-[44px]">
                    <Mail className="h-4 w-4 shrink-0 text-content-tertiary" />
                    <span className="truncate">{order.email}</span>
                  </a>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-content-tertiary" />
                    {order.address}
                  </div>
                </div>
                {customer && (
                  <button
                    onClick={() => navigate({ name: 'customer-detail', id: customer.id })}
                    className="mt-3 w-full text-center text-[13px] font-medium text-accent"
                  >
                    {t.viewDetails}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop: static customer panel */}
          <Panel className="hidden md:block p-4">
            <p className="section-label mb-3">{t.customerInfo}</p>
            <div className="flex items-center gap-3">
              <Avatar name={order.customerName} size="lg" />
              <div className="min-w-0">
                <button
                  onClick={() => customer && navigate({ name: 'customer-detail', id: customer.id })}
                  className="block truncate text-sm font-semibold text-content hover:text-accent"
                >
                  {order.customerName}
                </button>
                {customer && <p className="text-[13px] text-content-tertiary">{customer.city}</p>}
              </div>
            </div>
            <div className="mt-3 space-y-2 text-[13px] text-content-secondary">
              <p className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                {order.phone}
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                <span className="truncate">{order.email}</span>
              </p>
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                {order.address}
              </p>
            </div>
          </Panel>

          {customerOrders.length > 0 && (
            <Panel>
              <SectionHeader title={t.previousOrders} />
              <div className="divide-y divide-border">
                {customerOrders.slice(0, 4).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate({ name: 'order-detail', id: o.id })}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-1 min-h-[44px]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-content">{o.id}</span>
                      <span className="block text-xs text-content-tertiary">{formatDate(o.date, lang)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-[13px] font-medium tnum">{formatKM(orderTotal(o.items, o.shipping), lang)}</span>
                      <OrderStatusBadge status={o.status} />
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {customer?.notes && (
            <Panel className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-content-tertiary" />
                <div>
                  <p className="text-[13px] font-medium text-content">{t.notes}</p>
                  <p className="mt-0.5 text-[13px] text-content-secondary">{customer.notes}</p>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* ─── Mobile: Fixed bottom CTA ─── */}
      {nextAction && (
        <div className="fixed inset-x-0 bottom-0 z-30 md:hidden border-t bg-surface-0"
          style={{
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            paddingLeft: 'max(16px, env(safe-area-inset-left))',
            paddingRight: 'max(16px, env(safe-area-inset-right))',
            paddingTop: '12px',
            borderColor: 'var(--border-color)',
          }}>
          <div className="flex gap-2">
            {!isCancelled && !isDelivered && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="btn-ghost text-danger min-h-[48px] px-4"
              >
                <XCircle className="h-4 w-4" />
                {t.cancel}
              </button>
            )}
            <button onClick={() => void nextAction.run()} disabled={busy} className="btn-primary flex-1 min-h-[48px] text-[15px]">
              {(() => { const Icon = nextAction.icon; return <Icon className="h-5 w-5" />; })()}
              {nextAction.label}
            </button>
          </div>
        </div>
      )}

      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={t.cancel}
        description={`${t.orderNumber} ${order.id}`}
        footer={
          <>
            <button onClick={() => setCancelModalOpen(false)} className="btn-secondary">{t.cancelBtn}</button>
            <button onClick={() => void cancelOrder()} disabled={busy} className="btn-danger">{t.cancel}</button>
          </>
        }
      >
        <p className="text-sm text-content-secondary">
          {t.cancelOrderConfirm} <span className="text-content-tertiary">{t.irreversible}</span>
        </p>
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
