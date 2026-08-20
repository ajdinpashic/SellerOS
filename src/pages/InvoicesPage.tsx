import { useState, useMemo } from 'react';
import { FileText, Eye, Download, Send, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, type FilterOption } from '@/components/FilterBar';
import { InvoiceStatusBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { Table, THead, TBody, TR, TH, TD } from '@/components/Table';
import { Toast } from '@/components/ui';
import { useI18n } from '@/locales';
import { formatKM, formatDate } from '@/utils/format';
import { mockInvoices } from '@/data/misc';
import type { InvoiceStatus, Invoice } from '@/types';

export function InvoicesPage() {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [toast, setToast] = useState('');

  const statusOptions: FilterOption[] = (['draft', 'sent', 'paid', 'overdue'] as InvoiceStatus[]).map((s) => ({
    value: s, label: t[`inv_${s}` as keyof typeof t] as string,
  }));

  const filtered = useMemo(() => {
    return mockInvoices.filter((inv) => {
      const matchesSearch = !search ||
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
        inv.orderId.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div>
      <PageHeader
        title={t.invoices}
        subtitle={`${filtered.length} ${t.resultsCount}`}
        actions={<button className="btn-primary"><Plus className="h-4 w-4" /> {t.createInvoice}</button>}
      />

      <div className="card">
        <div className="border-b border-border px-3 py-2.5">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={t.search}
            onClear={() => { setSearch(''); setStatusFilter(''); }}
            filters={[
              { key: 'status', value: statusFilter, onChange: setStatusFilter, options: statusOptions, placeholder: t.allStatuses },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title={t.noResults} description={t.noResultsDesc} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t.invoice}</TH>
                <TH>{t.invoiceOrder}</TH>
                <TH>{t.customer}</TH>
                <TH align="right">{t.invoiceAmount}</TH>
                <TH>{t.invoiceStatus}</TH>
                <TH>{t.invoiceDate}</TH>
                <TH align="right">{t.actions}</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((inv) => (
                <TR key={inv.id}>
                  <TD className="font-semibold">{inv.id}</TD>
                  <TD className="text-content-secondary">{inv.orderId}</TD>
                  <TD className="text-content-secondary">{inv.customerName}</TD>
                  <TD align="right" className="font-semibold tnum">{formatKM(inv.amount, lang)}</TD>
                  <TD><InvoiceStatusBadge status={inv.status} /></TD>
                  <TD className="text-content-tertiary">{formatDate(inv.date, lang)}</TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => setPreviewInvoice(inv)} className="rounded-md p-1.5 text-content-tertiary hover:bg-surface-2 hover:text-content" title={t.preview}>
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => showToast(`PDF: ${inv.id}`)} className="rounded-md p-1.5 text-content-tertiary hover:bg-surface-2 hover:text-content" title={t.download}>
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => showToast(`${t.sendInvoice}: ${inv.id}`)} className="rounded-md p-1.5 text-content-tertiary hover:bg-accent-subtle hover:text-accent" title={t.sendInvoice}>
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      {/* Preview modal */}
      <Modal
        open={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        title={previewInvoice?.id}
        description={previewInvoice ? `${previewInvoice.orderId} · ${previewInvoice.customerName}` : ''}
        size="lg"
        footer={
          <>
            <button onClick={() => previewInvoice && showToast(`PDF: ${previewInvoice.id}`)} className="btn-secondary">
              <Download className="h-4 w-4" /> {t.download}
            </button>
            <button onClick={() => previewInvoice && showToast(`${t.sendInvoice}: ${previewInvoice.id}`)} className="btn-primary">
              <Send className="h-4 w-4" /> {t.sendInvoice}
            </button>
          </>
        }
      >
        {previewInvoice && (
          <div className="space-y-4">
            <div className="flex items-start justify-between rounded-md border border-border p-4">
              <div>
                <p className="section-label mb-1">{t.invoice}</p>
                <p className="text-base font-semibold text-content">{previewInvoice.id}</p>
              </div>
              <InvoiceStatusBadge status={previewInvoice.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border p-3.5">
                <p className="section-label mb-1.5">{t.customer}</p>
                <p className="font-medium text-content">{previewInvoice.customerName}</p>
              </div>
              <div className="rounded-md border border-border p-3.5">
                <p className="section-label mb-1.5">{t.invoiceOrder}</p>
                <p className="font-medium text-content">{previewInvoice.orderId}</p>
              </div>
              <div className="rounded-md border border-border p-3.5">
                <p className="section-label mb-1.5">{t.invoiceDate}</p>
                <p className="font-medium text-content">{formatDate(previewInvoice.date, lang)}</p>
              </div>
              <div className="rounded-md border border-accent/20 bg-accent-subtle p-3.5">
                <p className="section-label mb-1.5 !text-accent">{t.invoiceAmount}</p>
                <p className="text-lg font-semibold text-content tnum">{formatKM(previewInvoice.amount, lang)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
