import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: { label: string; href?: string; onClick?: () => void }[];
}

export function PageHeader({ title, subtitle, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && (
          <nav className="mb-1 flex items-center gap-1.5 text-[12px] text-content-tertiary">
            {breadcrumb.map((bc, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {bc.onClick ? (
                  <button onClick={bc.onClick} className="hover:text-content-secondary transition-colors">
                    {bc.label}
                  </button>
                ) : (
                  <span className={i === breadcrumb.length - 1 ? 'text-content-secondary font-medium' : ''}>{bc.label}</span>
                )}
                {i < breadcrumb.length - 1 && <span className="text-content-tertiary">/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="truncate text-lg font-semibold tracking-tight text-content">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[12px] text-content-tertiary">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
