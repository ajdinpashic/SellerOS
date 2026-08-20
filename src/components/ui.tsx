import type { ReactNode } from 'react';
import { classNames } from '@/utils/format';

/* ─── Panel: bordered surface, no shadow ─── */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={classNames('card', className)}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action, className }: { title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={classNames('flex items-center justify-between gap-3 border-b border-border px-4 py-2.5', className)}>
      <h3 className="text-[13px] font-semibold text-content">{title}</h3>
      {action}
    </div>
  );
}

/* ─── StatStrip: compact operational numbers, not decorative metric cards ─── */

export interface StatItem {
  value: string;
  label: string;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  href?: string;
  onClick?: () => void;
}

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div className="card grid grid-cols-2 divide-border overflow-hidden max-lg:gap-y-px lg:grid-cols-4 lg:divide-x">
      {items.map((item, i) => {
        const inner = (
          <>
            <p className={classNames(
              'text-xl font-semibold tracking-tight tnum',
              item.tone === 'danger' ? 'text-danger' :
              item.tone === 'warning' ? 'text-warning' :
              item.tone === 'success' ? 'text-success' :
              item.tone === 'accent' ? 'text-accent' :
              'text-content',
            )}>
              {item.value}
            </p>
            <p className="mt-0.5 text-[12px] text-content-secondary">{item.label}</p>
          </>
        );
        const style = 'px-4 py-3 lg:px-5';
        if (item.onClick) {
          return (
            <button key={i} onClick={item.onClick} className={classNames(style, 'text-left transition-colors hover:bg-surface-1')}>
              {inner}
            </button>
          );
        }
        return <div key={i} className={style}>{inner}</div>;
      })}
    </div>
  );
}

/* ─── Avatar: initials, neutral ─── */

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={classNames(
      'flex shrink-0 items-center justify-center rounded-full font-medium select-none',
      size === 'sm' && 'h-6 w-6 text-[10px]',
      size === 'md' && 'h-8 w-8 text-xs',
      size === 'lg' && 'h-10 w-10 text-sm',
      'bg-surface-2 text-content-secondary',
      className,
    )}>
      {initials}
    </span>
  );
}

/* ─── Toast: single consistent notification style ─── */

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-md bg-content px-4 py-2.5 text-sm font-medium text-surface-0 shadow-popover">
      {message}
    </div>
  );
}

/* ─── Tabs: underline style, counts supported ─── */

export interface TabDef {
  key: string;
  label: string;
  count?: number;
}

export function Tabs({ tabs, active, onChange, className }: {
  tabs: TabDef[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={classNames('flex items-center gap-0.5 overflow-x-auto border-b border-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={classNames(
            '-mb-px flex items-center gap-1 whitespace-nowrap border-b-2 px-2.5 py-1.5 text-[13px] font-medium transition-colors',
            active === tab.key
              ? 'border-accent text-content'
              : 'border-transparent text-content-tertiary hover:text-content-secondary',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={classNames(
              'tnum text-[11px]',
              active === tab.key ? 'text-content-secondary' : 'text-content-tertiary',
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
