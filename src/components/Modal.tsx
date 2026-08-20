import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { classNames } from '@/utils/format';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Mobile: full-screen sheet. Desktop: centered dialog */}
      <div className={classNames(
        'relative flex max-h-[100dvh] w-full flex-col bg-surface-0 animate-slide-up sm:animate-scale-in sm:max-h-[90vh] sm:rounded-lg sm:border sm:border-border sm:shadow-popover',
        sizeClasses[size],
      )}>
        {/* Mobile: drag handle */}
        <div className="flex justify-center py-2 sm:hidden">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--surface-3)' }} />
        </div>

        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b px-4 py-3 sm:px-5"
            style={{ borderColor: 'var(--border-color)' }}>
            <div>
              {title && <h2 className="text-[15px] font-semibold text-content sm:text-[14px]">{title}</h2>}
              {description && <p className="mt-0.5 text-[13px] text-content-secondary">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8 sm:rounded sm:text-content-tertiary transition-colors"
              style={{ background: 'var(--surface-2)', color: 'var(--content-secondary)' }}
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-3">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t px-4 py-3 sm:px-5"
            style={{
              borderColor: 'var(--border-color)',
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
