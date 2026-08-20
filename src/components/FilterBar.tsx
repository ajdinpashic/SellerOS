import { useState, type ReactNode } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/locales';
import { classNames } from '@/utils/format';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: {
    key: string;
    value: string;
    onChange: (v: string) => void;
    options: FilterOption[];
    placeholder?: string;
  }[];
  onClear?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue, onSearchChange, searchPlaceholder,
  filters = [], onClear, actions, className,
}: FilterBarProps) {
  const { t } = useI18n();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const hasActiveFilters = searchValue || filters.some((f) => f.value);
  const activeFilterCount = filters.filter((f) => f.value).length;

  return (
    <div className={classNames('flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between', className)}>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
          <input
            type="search"
            inputMode="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || t.search}
            className="input pl-8"
          />
        </div>

        {/* Desktop: inline filters */}
        <div className="hidden sm:flex sm:items-center sm:gap-1.5">
          {filters.map((f) => (
            <select
              key={f.key}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className={classNames('input select w-auto', !f.value && 'text-content-tertiary')}
            >
              <option value="">{f.placeholder || f.key}</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
        </div>

        {/* Mobile: filter button */}
        <button
          onClick={() => setFilterSheetOpen(true)}
          className="flex items-center gap-2 sm:hidden btn-secondary min-h-[44px]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filteri</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {hasActiveFilters && onClear && (
          <button onClick={onClear} className="btn-ghost text-[12px]">
            <X className="h-3 w-3" />
            {t.clearFilters}
          </button>
        )}
      </div>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}

      {/* Mobile filter sheet */}
      {filterSheetOpen && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => setFilterSheetOpen(false)} />
          <div className="bottom-sheet animate-slide-up-full">
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-[16px] font-semibold" style={{ color: 'var(--content)' }}>Filteri</h2>
              <button onClick={() => setFilterSheetOpen(false)} className="rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: 'var(--surface-2)', color: 'var(--content-secondary)' }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              {filters.map((f) => (
                <div key={f.key}>
                  <label className="label mb-1.5">{f.placeholder || f.key}</label>
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="select w-full"
                  >
                    <option value="">Sve</option>
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t px-4 py-3" style={{ borderColor: 'var(--border-color)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
              {hasActiveFilters && onClear && (
                <button onClick={() => { onClear(); setFilterSheetOpen(false); }} className="btn-secondary flex-1 min-h-[48px]">
                  Obriši sve
                </button>
              )}
              <button onClick={() => setFilterSheetOpen(false)} className="btn-primary flex-1 min-h-[48px]">
                Primijeni
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
