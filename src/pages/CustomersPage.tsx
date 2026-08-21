import { useState, useMemo } from 'react';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, type FilterOption } from '@/components/FilterBar';
import { ChannelBadge } from '@/components/Badges';
import { Table, THead, TBody, TR, TH, TD } from '@/components/Table';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Avatar, Toast } from '@/components/ui';
import { useI18n } from '@/locales';
import { formatKM, formatDate } from '@/utils/format';
import { apiErrorMessage, type ApiError, type CreateCustomerInput } from '@/lib/api';
import type { Customer, SalesChannel } from '@/types';
import type { Route } from '@/hooks/useRouter';

interface CustomersPageProps {
  navigate: (route: Route) => void;
  customers: Customer[];
  onCreate: (input: CreateCustomerInput) => Promise<{ error?: ApiError; id?: string }>;
  onDelete: (id: string) => Promise<{ error?: ApiError }>;
}

type SortField = 'name' | 'orderCount' | 'totalSpent' | 'lastOrderDate';
type SortDir = 'asc' | 'desc';

export function CustomersPage({ navigate, customers, onCreate, onDelete }: CustomersPageProps) {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalSpent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [toast, setToast] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newChannel, setNewChannel] = useState<SalesChannel>('webshop');

  const channelOptions: FilterOption[] = (['olx', 'instagram', 'facebook', 'webshop'] as SalesChannel[]).map((c) => ({
    value: c, label: t[`ch_${c}` as keyof typeof t] as string,
  }));

  const filtered = useMemo(() => {
    let result: Customer[] = customers.filter((c) => {
      const matchesSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase());
      const matchesChannel = !channelFilter || c.primaryChannel === channelFilter;
      return matchesSearch && matchesChannel;
    });
    result = result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'orderCount': cmp = a.orderCount - b.orderCount; break;
        case 'totalSpent': cmp = a.totalSpent - b.totalSpent; break;
        case 'lastOrderDate': cmp = new Date(a.lastOrderDate).getTime() - new Date(b.lastOrderDate).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [customers, search, channelFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const clearFilters = () => { setSearch(''); setChannelFilter(''); };

  const handleCreate = async () => {
    if (!newName.trim() || busy) return;
    setBusy(true);
    setFormError('');
    // Backend validates and scopes the customer to the active business.
    const result = await onCreate({
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
      city: newCity.trim(),
      notes: undefined,
    });
    setBusy(false);
    if (result.error) {
      setFormError(apiErrorMessage(result.error, t));
      return;
    }
    setShowCreate(false);
    setNewName(''); setNewEmail(''); setNewPhone(''); setNewAddress(''); setNewCity(''); setNewChannel('webshop');
    setToast(t.customerCreated);
    setTimeout(() => setToast(''), 2500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    const result = await onDelete(deleteTarget.id);
    setBusy(false);
    setDeleteTarget(null);
    if (result.error) {
      setToast(apiErrorMessage(result.error, t));
      setTimeout(() => setToast(''), 2500);
    }
  };

  return (
    <div>
      <PageHeader
        title={t.customers}
        subtitle={`${filtered.length} ${t.resultsCount}`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <UserPlus className="h-4 w-4" /> {t.newCustomer}
          </button>
        }
      />

      <div className="card">
        <div className="border-b border-border px-3 py-2.5">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={t.search}
            onClear={clearFilters}
            filters={[
              { key: 'channel', value: channelFilter, onChange: setChannelFilter, options: channelOptions, placeholder: t.allChannels },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Users}
            title={customers.length === 0 ? t.empty_customers_title : t.noResults}
            description={customers.length === 0 ? t.empty_customers_desc : t.noResultsDesc}
            action={customers.length === 0
              ? <button onClick={() => setShowCreate(true)} className="btn-primary">{t.newCustomer}</button>
              : <button onClick={clearFilters} className="btn-secondary">{t.clearFilters}</button>
            } />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH sortable active={sortField === 'name'} direction={sortDir} onClick={() => handleSort('name')}>{t.customer}</TH>
                <TH>{t.contact}</TH>
                <TH align="right" sortable active={sortField === 'orderCount'} direction={sortDir} onClick={() => handleSort('orderCount')}>{t.orderCount}</TH>
                <TH align="right" sortable active={sortField === 'totalSpent'} direction={sortDir} onClick={() => handleSort('totalSpent')}>{t.totalSpent}</TH>
                <TH sortable active={sortField === 'lastOrderDate'} direction={sortDir} onClick={() => handleSort('lastOrderDate')}>{t.lastOrder}</TH>
                <TH>{t.primaryChannel}</TH>
                <TH>{' '}</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((c) => (
                <TR key={c.id} onClick={() => navigate({ name: 'customer-detail', id: c.id })}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div className="min-w-0">
                        <p className="font-medium text-content">{c.name}</p>
                        <p className="text-xs text-content-tertiary">{c.city}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <p className="text-[13px] text-content-secondary">{c.email}</p>
                    <p className="text-xs text-content-tertiary">{c.phone}</p>
                  </TD>
                  <TD align="right" className="font-medium tnum">{c.orderCount}</TD>
                  <TD align="right" className="font-semibold tnum">{formatKM(c.totalSpent, lang)}</TD>
                  <TD className="text-content-tertiary">{formatDate(c.lastOrderDate, lang)}</TD>
                  <TD><ChannelBadge channel={c.primaryChannel} /></TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="rounded-md p-1.5 text-content-tertiary hover:bg-danger-subtle hover:text-danger transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t.newCustomer} size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">{t.cancelBtn}</button>
            <button onClick={handleCreate} className="btn-primary">{t.save}</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">{t.customerName}</label>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.customerPlaceholder} />
          </div>
          <div>
            <label className="label">{t.emailAddress}</label>
            <input className="input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label className="label">{t.phone}</label>
            <input className="input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+387 61 000 000" />
          </div>
          <div>
            <label className="label">{t.address}</label>
            <input className="input" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder={t.address} />
          </div>
          <div>
            <label className="label">{t.city}</label>
            <input className="input" value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Sarajevo" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t.primaryChannel}</label>
            <select className="input select" value={newChannel} onChange={(e) => setNewChannel(e.target.value as SalesChannel)}>
              {channelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        {formError && (
          <p className="mt-3 rounded-md border border-danger/20 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
            {formError}
          </p>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t.deleteCustomerTitle} size="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">{t.cancelBtn}</button>
            <button onClick={handleDelete} className="btn-danger">{t.cancel}</button>
          </>
        }
      >
        <p className="text-sm text-content-secondary">
          {t.deleteConfirm} <strong className="text-content">{deleteTarget?.name}</strong>? <span className="text-content-tertiary">{t.irreversible}</span>
        </p>
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
