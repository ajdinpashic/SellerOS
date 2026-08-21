import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Inbox as InboxIcon, ShoppingCart, Package, Users, Truck, Check,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/locales';
import { classNames } from '@/utils/format';

/**
 * First-login guided tour.
 *
 * Desktop: dims the app, draws a highlight around the current nav
 * element and shows an anchored tooltip. Mobile: full-width cards.
 *
 * Shows once (localStorage flag); can be re-opened anytime by
 * dispatching the 'shopos:tour' window event (see Dashboard).
 */

const TOUR_KEY = 'shopos-tour-done';
const TOUR_EVENT = 'shopos:tour';

/** Re-opens the tour on demand (used by the Dashboard "Vodič" button). */
export function openTour() {
  window.dispatchEvent(new Event(TOUR_EVENT));
}

interface TourStep {
  icon: LucideIcon;
  title: string;
  body: string;
  /** CSS selector of the element to highlight; undefined = centered card. */
  target?: string;
}

const TOOLTIP_WIDTH = 300;

function computeTooltipPos(rect: DOMRect, above: boolean): { left: number; top: number } {
  const vw = window.innerWidth;
  const left = Math.min(Math.max(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, 12), vw - TOOLTIP_WIDTH - 12);
  const top = above ? rect.top - 12 - 12 - 140 : rect.bottom + 14;
  return { left, top: Math.max(12, top) };
}

export function OnboardingTour() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0); // forces recompute on resize

  const steps = useMemo<TourStep[]>(() => [
    { icon: Sparkles, title: t.tour_hello_title, body: t.tour_hello_body },
    { icon: InboxIcon, title: t.tour_inbox_title, body: t.tour_inbox_body, target: '[data-tour="nav-inbox"]' },
    { icon: ShoppingCart, title: t.tour_orders_title, body: t.tour_orders_body, target: '[data-tour="nav-orders"]' },
    { icon: Package, title: t.tour_products_title, body: t.tour_products_body, target: '[data-tour="nav-products"]' },
    { icon: Users, title: t.tour_customers_title, body: t.tour_customers_body, target: '[data-tour="nav-customers"]' },
    { icon: Truck, title: t.tour_shipping_title, body: t.tour_shipping_body, target: '[data-tour="nav-shipping"]' },
    { icon: Check, title: t.tour_done_title, body: t.tour_done_body },
  ], [t]);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
  }, []);

  // Auto-show on first login (once the app shell has settled).
  useEffect(() => {
    if (localStorage.getItem(TOUR_KEY)) return;
    const id = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(id);
  }, []);

  // Manual re-open (Dashboard "Vodič" button).
  useEffect(() => {
    const handler = () => {
      setStepIndex(0);
      setVisible(true);
    };
    window.addEventListener(TOUR_EVENT, handler);
    return () => window.removeEventListener(TOUR_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setStepIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, finish, steps.length]);

  // Locate the target element for the current step.
  useLayoutEffect(() => {
    if (!visible) return;
    const step = steps[stepIndex];
    if (!step.target) {
      setRect(null);
      setPos(null);
      return;
    }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) {
      setRect(null);
      setPos(null);
      return;
    }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const id = setTimeout(() => {
      const r = el.getBoundingClientRect();
      const placeAbove = r.bottom + 170 > window.innerHeight;
      setRect(r);
      setPos(computeTooltipPos(r, placeAbove));
    }, 400);
    return () => clearTimeout(id);
  }, [visible, stepIndex, steps, tick]);

  useEffect(() => {
    if (!visible) return;
    const onResize = () => setTick((x) => x + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visible]);

  if (!visible) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const StepIcon = step.icon;

  const controls = (
    <div className="flex items-center gap-2">
      <button onClick={finish} className="btn-ghost btn-sm text-content-tertiary">
        {t.tour_skip}
      </button>
      {stepIndex > 0 && (
        <button onClick={() => setStepIndex((i) => i - 1)} className="btn-secondary btn-sm" aria-label={t.tour_back}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}
      {isLast ? (
        <button onClick={finish} className="btn-primary btn-sm">
          <Check className="h-3.5 w-3.5" />
          {t.tour_done}
        </button>
      ) : (
        <button onClick={() => setStepIndex((i) => i + 1)} className="btn-primary btn-sm">
          {t.tour_next}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const progress = (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-content-tertiary tnum">
        {stepIndex + 1} {t.of} {steps.length}
      </span>
      <div className="flex items-center gap-1">
        {steps.map((_, i) => (
          <span
            key={i}
            className={classNames('h-1.5 rounded-full transition-all', i === stepIndex ? 'w-4 bg-accent' : 'w-1.5 bg-surface-3')}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Desktop: overlay + highlight + anchored tooltip ─── */}
      <div className="hidden md:block">
        <div className="fixed inset-0 z-[70] bg-black/40" onClick={finish} />
        {rect && (
          <div
            className="fixed z-[71] pointer-events-none"
            style={{
              left: rect.left - 4,
              top: rect.top - 4,
              width: rect.width + 8,
              height: rect.height + 8,
              borderRadius: 10,
              outline: '2px solid var(--accent)',
              outlineOffset: 2,
              boxShadow: '0 0 0 6px var(--accent-subtle)',
            }}
          />
        )}
        <div
          ref={tooltipRef}
          className="fixed z-[72] w-[300px] animate-scale-in rounded-lg border bg-surface-0 p-4 shadow-popover"
          style={{ left: pos?.left ?? 12, top: pos?.top ?? 12, borderColor: 'var(--border-color)' }}
        >
          <button
            onClick={finish}
            aria-label={t.close}
            className="absolute right-2 top-2 rounded p-1 text-content-tertiary hover:bg-surface-2 hover:text-content"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-subtle">
              <StepIcon className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-content">{step.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-content-secondary">{step.body}</p>
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
            {progress}
            {controls}
          </div>
        </div>
      </div>

      {/* ─── Mobile: full-width card ─── */}
      <div className="md:hidden">
        <div className="fixed inset-0 z-[70] bg-black/40" onClick={finish} />
        <div
          className="fixed inset-x-0 bottom-0 z-[72] rounded-t-xl border-t bg-surface-0 animate-slide-up-full"
          style={{ borderColor: 'var(--border-color)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-subtle">
                <StepIcon className="h-4 w-4 text-accent" />
              </div>
              <p className="text-[15px] font-semibold text-content">{step.title}</p>
            </div>
            <button onClick={finish} aria-label={t.close} className="rounded-full p-1.5 text-content-tertiary hover:bg-surface-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-4 py-4">
            <p className="text-[14px] leading-relaxed text-content-secondary">{step.body}</p>
            <div className="mt-4 flex items-center justify-between">
              {progress}
              {controls}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
