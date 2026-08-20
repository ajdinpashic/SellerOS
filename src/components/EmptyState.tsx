import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { classNames } from '@/utils/format';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={classNames('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <Icon className="h-5 w-5 text-content-tertiary" strokeWidth={1.5} />
      <h3 className="mt-2.5 text-[13px] font-semibold text-content">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[12px] text-content-secondary">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
