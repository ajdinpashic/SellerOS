import { useMemo, useState } from 'react';
import { ArrowLeft, Mail, MapPin, Phone, Search, Send, ShoppingBag, Plus, Info, X } from 'lucide-react';
import { useI18n } from '@/locales';
import { classNames, formatKM, formatDate, orderTotal } from '@/utils/format';
import { Avatar } from '@/components/ui';
import { ChannelIcon, OrderStatusBadge } from '@/components/Badges';
import { mockConversations, type Conversation } from '@/data/inbox';
import { mockOrders } from '@/data/orders';
import type { Route } from '@/hooks/useRouter';

interface InboxPageProps {
  navigate: (route: Route) => void;
}

export function InboxPage({ navigate }: InboxPageProps) {
  const { t, lang } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeId, setActiveId] = useState<string>(mockConversations[0].id);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [contextOpen, setContextOpen] = useState(false);

  const active = conversations.find((c) => c.id === activeId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.customerName.toLowerCase().includes(q));
  }, [conversations, query]);

  const selectConversation = (id: string) => {
    setActiveId(id);
    setMobileView('thread');
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !active) return;
    const now = new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'bs-BA', { hour: '2-digit', minute: '2-digit' });
    setConversations((prev) => prev.map((c) =>
      c.id === active.id
        ? { ...c, lastTime: now, messages: [...c.messages, { id: `m${Date.now()}`, from: 'me', text, time: now }] }
        : c,
    ));
    setDraft('');
  };

  const cartTotal = (c: Conversation) => c.cart.reduce((s, line) => s + line.qty * line.price, 0);

  return (
    <div className="flex h-full min-h-0">
      {/* ─── Conversation list ─── */}
      <aside className={classNames(
        'w-full shrink-0 flex-col border-r border-border bg-surface-0 md:w-72 md:flex lg:w-80',
        mobileView === 'thread' ? 'hidden' : 'flex',
      )}>
        <div className="border-b border-border px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <h1 className="text-[17px] font-semibold tracking-tight text-content">{t.inbox}</h1>
          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
            <input
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.inboxSearch}
              className="input pl-8"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-content-tertiary">{t.noConversations}</p>
          ) : (
            <ul>
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => selectConversation(c.id)}
                    className={classNames(
                      'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors min-h-[64px]',
                      c.id === activeId ? 'bg-surface-1' : 'hover:bg-surface-1',
                    )}
                  >
                    <div className="relative mt-0.5 shrink-0">
                      <Avatar name={c.customerName} />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-surface-0 bg-surface-0">
                        <ChannelIcon channel={c.channel} className="h-3 w-3 text-content-tertiary" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={classNames('truncate text-[14px] font-medium text-content', c.unread > 0 && 'font-semibold')}>
                          {c.customerName}
                        </p>
                        <span className="shrink-0 text-[11px] text-content-tertiary tnum">{c.lastTime}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-content-secondary">
                        {c.messages[c.messages.length - 1]?.text}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* ─── Thread ─── */}
      <section className={classNames(
        'min-w-0 flex-1 flex-col bg-surface-0 md:flex',
        mobileView === 'list' ? 'hidden' : 'flex',
      )}>
        {active && (
          <>
            {/* Thread header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 md:h-14"
              style={{
                height: 'calc(56px + env(safe-area-inset-top))',
                paddingTop: 'env(safe-area-inset-top)',
                borderColor: 'var(--border-color)',
              }}>
              <button
                onClick={() => setMobileView('list')}
                className="flex h-11 w-11 items-center justify-center rounded-lg md:hidden"
                style={{ color: 'var(--content-secondary)' }}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar name={active.customerName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-content">{active.customerName}</p>
                <p className="flex items-center gap-1 text-[12px] text-content-tertiary">
                  <ChannelIcon channel={active.channel} className="h-3 w-3" />
                  {active.phone}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setContextOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg md:hidden"
                  style={{ color: 'var(--content-secondary)' }}
                >
                  <Info className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate({ name: 'create-order' })}
                  className="btn-primary btn-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.createOrder}</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {active.messages.map((m) => (
                <div key={m.id} className={classNames('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                  <div className={classNames(
                    'max-w-[78%] rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed',
                    m.from === 'me'
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-content',
                  )}>
                    <p>{m.text}</p>
                    <p className={classNames(
                      'mt-1 text-right text-[10px] tnum',
                      m.from === 'me' ? 'text-white/70' : 'text-content-tertiary',
                    )}>
                      {m.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply input */}
            <div className="shrink-0 border-t border-border p-3"
              style={{
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                borderColor: 'var(--border-color)',
              }}>
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={t.replyPlaceholder}
                  className="input flex-1"
                  style={{ minHeight: '44px' }}
                />
                <button onClick={sendMessage} className="btn-primary shrink-0" disabled={!draft.trim()} style={{ minWidth: '44px', minHeight: '44px' }}>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ─── Mobile: Customer context bottom sheet ─── */}
      {active && contextOpen && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => setContextOpen(false)} />
          <div className="bottom-sheet animate-slide-up-full">
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-[16px] font-semibold" style={{ color: 'var(--content)' }}>{t.customerContext}</h2>
              <button onClick={() => setContextOpen(false)} className="rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--surface-2)', color: 'var(--content-secondary)' }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={active.customerName} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-content">{active.customerName}</p>
                  <p className="text-[13px] text-content-tertiary">{active.city}</p>
                </div>
              </div>
              <div className="space-y-3 text-[14px] text-content-secondary">
                <a href={`tel:${active.phone}`} className="flex items-center gap-2.5 min-h-[44px]">
                  <Phone className="h-4 w-4 shrink-0 text-content-tertiary" />
                  {active.phone}
                </a>
                <a href={`mailto:${active.email}`} className="flex items-center gap-2.5 min-h-[44px]">
                  <Mail className="h-4 w-4 shrink-0 text-content-tertiary" />
                  <span className="truncate">{active.email}</span>
                </a>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-content-tertiary" />
                  {active.city}
                </div>
              </div>

              {/* Cart */}
              <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                <p className="section-label mb-2">{t.currentCart}</p>
                {active.cart.length === 0 ? (
                  <p className="text-[13px] text-content-tertiary">{t.emptyCart}</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {active.cart.map((line, i) => (
                        <li key={i} className="flex items-start justify-between gap-3 text-[13px]">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-content">{line.name}</p>
                            {line.variant && <p className="text-xs text-content-tertiary">{line.variant}</p>}
                            <p className="text-xs text-content-tertiary tnum">{line.qty} × {formatKM(line.price, lang)}</p>
                          </div>
                          <span className="shrink-0 font-medium tnum">{formatKM(line.qty * line.price, lang)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-[14px]" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-content-secondary">{t.total}</span>
                      <span className="font-semibold tnum">{formatKM(cartTotal(active), lang)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Previous orders */}
              {active.previousOrderIds.length > 0 && (
                <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="section-label mb-2">{t.previousOrders}</p>
                  <ul className="space-y-1.5">
                    {active.previousOrderIds.map((id) => {
                      const order = mockOrders.find((o) => o.id === id);
                      if (!order) return null;
                      return (
                        <li key={id}>
                          <button
                            onClick={() => { navigate({ name: 'order-detail', id }); setContextOpen(false); }}
                            className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-1 min-h-[44px]"
                          >
                            <span className="min-w-0">
                              <span className="block text-[13px] font-medium text-content">{id}</span>
                              <span className="block text-[11px] text-content-tertiary">{formatDate(order.date, lang)}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-[13px] font-medium tnum">{formatKM(orderTotal(order.items, order.shipping), lang)}</span>
                              <OrderStatusBadge status={order.status} />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {active.note && (
                <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="section-label mb-2">{t.notes}</p>
                  <p className="flex items-start gap-2 text-[13px] leading-relaxed text-content-secondary">
                    <ShoppingBag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                    {active.note}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border-color)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
              <button
                onClick={() => { navigate({ name: 'create-order' }); setContextOpen(false); }}
                className="btn-primary w-full min-h-[48px]"
              >
                <Plus className="h-4 w-4" />
                {t.createOrder}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Desktop: Customer context sidebar ─── */}
      {active && (
        <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface-1 lg:flex xl:w-96">
          <div className="border-b border-border p-4">
            <button
              onClick={() => navigate({ name: 'create-order' })}
              className="btn-primary w-full"
            >
              <Plus className="h-4 w-4" />
              {t.createOrder}
            </button>
          </div>

          <div className="p-4">
            <p className="section-label mb-3">{t.customerContext}</p>
            <div className="flex items-center gap-3">
              <Avatar name={active.customerName} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-content">{active.customerName}</p>
                <p className="text-[13px] text-content-tertiary">{active.city}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2 text-[13px] text-content-secondary">
              <p className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                {active.phone}
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                <span className="truncate">{active.email}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                {active.city}
              </p>
            </div>
          </div>

          <div className="border-t border-border p-4">
            <p className="section-label mb-3">{t.currentCart}</p>
            {active.cart.length === 0 ? (
              <p className="text-[13px] text-content-tertiary">{t.emptyCart}</p>
            ) : (
              <div>
                <ul className="space-y-2">
                  {active.cart.map((line, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 text-[13px]">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-content">{line.name}</p>
                        {line.variant && <p className="text-xs text-content-tertiary">{line.variant}</p>}
                        <p className="text-xs text-content-tertiary tnum">{line.qty} × {formatKM(line.price, lang)}</p>
                      </div>
                      <span className="shrink-0 font-medium tnum">{formatKM(line.qty * line.price, lang)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-sm">
                  <span className="text-content-secondary">{t.total}</span>
                  <span className="font-semibold tnum">{formatKM(cartTotal(active), lang)}</span>
                </div>
              </div>
            )}
          </div>

          {active.previousOrderIds.length > 0 && (
            <div className="border-t border-border p-4">
              <p className="section-label mb-3">{t.previousOrders}</p>
              <ul className="space-y-1.5">
                {active.previousOrderIds.map((id) => {
                  const order = mockOrders.find((o) => o.id === id);
                  if (!order) return null;
                  return (
                    <li key={id}>
                      <button
                        onClick={() => navigate({ name: 'order-detail', id })}
                        className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
                      >
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium text-content">{id}</span>
                          <span className="block text-[11px] text-content-tertiary">{formatDate(order.date, lang)}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-[13px] font-medium tnum">{formatKM(orderTotal(order.items, order.shipping), lang)}</span>
                          <OrderStatusBadge status={order.status} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {active.note && (
            <div className="border-t border-border p-4">
              <p className="section-label mb-2">{t.notes}</p>
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-content-secondary">
                <ShoppingBag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-tertiary" />
                {active.note}
              </p>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
