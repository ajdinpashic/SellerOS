import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { classNames } from '@/utils/format';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={classNames('overflow-x-auto', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-1">
      {children}
    </thead>
  );
}

export function TH({ children, className, onClick, sortable, active, direction, align }: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  sortable?: boolean;
  active?: boolean;
  direction?: 'asc' | 'desc';
  align?: 'left' | 'right';
}) {
  return (
    <th
      onClick={onClick}
      className={classNames(
        'px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-content-tertiary whitespace-nowrap',
        align === 'right' && 'text-right',
        onClick && 'cursor-pointer select-none hover:text-content-secondary',
        className,
      )}
    >
      <span className={classNames('inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse')}>
        {children}
        {sortable && active && (
          <span className="text-accent">
            {direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          </span>
        )}
      </span>
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TR({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={classNames(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-surface-1',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TD({ children, className, onClick, align }: {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
  align?: 'left' | 'right';
}) {
  return (
    <td
      onClick={onClick}
      className={classNames(
        'px-3 py-2.5 align-middle text-[13px] text-content whitespace-nowrap',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </td>
  );
}
