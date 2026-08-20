import type { OrderStatus, PaymentMethod, SalesChannel, InvoiceStatus, ShipmentStatus } from '@/types';
import { useI18n } from '@/locales';
import { classNames } from '@/utils/format';
import { channelIcons } from '@/components/channelIcons';

/* ─── Base badge: muted, dot optional ─── */

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-border bg-surface-2 text-content-secondary',
  accent: 'border-accent/20 bg-accent-subtle text-accent',
  success: 'border-success/20 bg-success-subtle text-success',
  warning: 'border-warning/20 bg-warning-subtle text-warning',
  danger: 'border-danger/20 bg-danger-subtle text-danger',
};

export function Badge({ tone = 'neutral', dot, children, className }: {
  tone?: BadgeTone;
  dot?: string; // css color class for the status dot
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={classNames(
      'inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[11px] font-medium whitespace-nowrap leading-normal',
      toneClasses[tone],
      className,
    )}>
      {dot && <span className={classNames('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  );
}

/* ─── Order status ─── */

const orderStatusConfig: Record<OrderStatus, { key: string; tone: BadgeTone; dot: string }> = {
  pending:    { key: 'st_pending',   tone: 'neutral', dot: 'bg-content-tertiary' },
  confirmed:  { key: 'st_confirmed', tone: 'accent',  dot: 'bg-accent' },
  ready:      { key: 'st_ready',     tone: 'warning', dot: 'bg-warning' },
  shipped:    { key: 'st_shipped',   tone: 'accent',  dot: 'bg-accent' },
  delivered:  { key: 'st_delivered', tone: 'success', dot: 'bg-success' },
  cancelled:  { key: 'st_cancelled', tone: 'danger',  dot: 'bg-danger' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  const cfg = orderStatusConfig[status];
  return (
    <Badge tone={cfg.tone} dot={cfg.dot}>
      {t[cfg.key as keyof typeof t] as string}
    </Badge>
  );
}

/* ─── Channel: icon + name, no pill ─── */

export function ChannelIcon({ channel, className }: { channel: SalesChannel; className?: string }) {
  const Icon = channelIcons[channel];
  return <Icon className={classNames('h-3.5 w-3.5', className)} />;
}

export function ChannelBadge({ channel }: { channel: SalesChannel }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-content-secondary whitespace-nowrap">
      <ChannelIcon channel={channel} className="h-3 w-3 text-content-tertiary" />
      {t[`ch_${channel}` as keyof typeof t] as string}
    </span>
  );
}

/* ─── Payment ─── */

const paymentConfig: Record<PaymentMethod, string> = {
  cod: 'pay_cod',
  paid: 'pay_paid',
  card: 'pay_card',
  other: 'pay_other',
};

export function PaymentBadge({ method }: { method: PaymentMethod }) {
  const { t } = useI18n();
  return (
    <Badge tone="neutral">{t[paymentConfig[method] as keyof typeof t] as string}</Badge>
  );
}

/* ─── Invoice status ─── */

const invoiceStatusConfig: Record<InvoiceStatus, { key: string; tone: BadgeTone }> = {
  draft:   { key: 'inv_draft',   tone: 'neutral' },
  sent:    { key: 'inv_sent',    tone: 'accent' },
  paid:    { key: 'inv_paid',    tone: 'success' },
  overdue: { key: 'inv_overdue', tone: 'danger' },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useI18n();
  const cfg = invoiceStatusConfig[status];
  return (
    <Badge tone={cfg.tone}>{t[cfg.key as keyof typeof t] as string}</Badge>
  );
}

/* ─── Shipment status ─── */

const shipmentStatusConfig: Record<ShipmentStatus, { key: string; tone: BadgeTone; dot: string }> = {
  pending:   { key: 'awaitingShipment', tone: 'warning', dot: 'bg-warning' },
  shipped:   { key: 'shippedTab',       tone: 'accent',  dot: 'bg-accent' },
  delivered: { key: 'deliveredTab',     tone: 'success', dot: 'bg-success' },
  problem:   { key: 'problem',          tone: 'danger',  dot: 'bg-danger' },
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  const { t } = useI18n();
  const cfg = shipmentStatusConfig[status];
  return (
    <Badge tone={cfg.tone} dot={cfg.dot}>
      {t[cfg.key as keyof typeof t] as string}
    </Badge>
  );
}

/* ─── Integration status ─── */

const integrationStatusConfig: Record<string, { key: string; tone: BadgeTone; dot: string }> = {
  connected:    { key: 'int_connected',    tone: 'success', dot: 'bg-success' },
  disconnected: { key: 'int_disconnected', tone: 'neutral', dot: 'bg-content-tertiary' },
  error:        { key: 'int_error',        tone: 'danger',  dot: 'bg-danger' },
  needs_auth:   { key: 'int_needs_auth',   tone: 'warning', dot: 'bg-warning' },
};

export function IntegrationStatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const cfg = integrationStatusConfig[status];
  if (!cfg) return null;
  return (
    <Badge tone={cfg.tone} dot={cfg.dot}>
      {t[cfg.key as keyof typeof t] as string}
    </Badge>
  );
}

/* ─── Stock badge (products / inventory) ─── */

export function StockBadge({ stock, minimum }: { stock: number; minimum: number }) {
  const { t } = useI18n();
  if (stock === 0) {
    return <Badge tone="danger" dot="bg-danger">{t.outOfStock}</Badge>;
  }
  if (stock <= minimum) {
    return <Badge tone="warning" dot="bg-warning">{t.lowStock}</Badge>;
  }
  return <Badge tone="success" dot="bg-success">{t.active}</Badge>;
}
