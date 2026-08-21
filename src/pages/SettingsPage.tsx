import { useEffect, useState } from 'react';
import {
  User, Building2, Globe, Bell, Users as UsersIcon, CreditCard, Shield,
  Check, Mail, Smartphone, Crown,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Panel, Toast, Avatar } from '@/components/ui';
import { useI18n } from '@/locales';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { classNames } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { supabase } from '@/lib/supabase';

type SettingsTab = 'profile' | 'company' | 'language' | 'notifications' | 'users' | 'subscription' | 'security';

const tabs: { key: SettingsTab; labelKey: string; icon: typeof User }[] = [
  { key: 'profile', labelKey: 'profileSettings', icon: User },
  { key: 'company', labelKey: 'companySettings', icon: Building2 },
  { key: 'language', labelKey: 'languageSettings', icon: Globe },
  { key: 'notifications', labelKey: 'notificationSettings', icon: Bell },
  { key: 'users', labelKey: 'usersSettings', icon: UsersIcon },
  { key: 'subscription', labelKey: 'subscriptionSettings', icon: CreditCard },
  { key: 'security', labelKey: 'securitySettings', icon: Shield },
];

interface TeamMember {
  name: string;
  email: string;
  role: string;
}

export function SettingsPage() {
  const { t } = useI18n();
  const { profile, user, updateProfile, updatePassword } = useAuth();
  const { business, refresh } = useBusiness();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [notifPrefs, setNotifPrefs] = useState({ email: true, push: false, orders: true, lowStock: true });
  const [savedToast, setSavedToast] = useState('');

  // Profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  // Company form
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('Ferhadija 12, 71000 Sarajevo');
  const [vatNumber, setVatNumber] = useState('1234567890123');
  // Password form
  const [newPassword, setNewPassword] = useState('');
  // Team
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    setFullName(profile?.fullName ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  useEffect(() => {
    setCompanyName(business?.name ?? '');
  }, [business]);

  // Team members are read through RLS — only this business's members.
  useEffect(() => {
    if (!supabase || !business) {
      setTeamMembers([]);
      return;
    }
    void supabase
      .from('business_members')
      .select('role, user_id, profiles(full_name)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setTeamMembers((data ?? []).map((m) => ({
          name: (m.profiles as { full_name?: string } | null)?.full_name || '',
          email: m.user_id,
          role: m.role,
        })));
      });
  }, [business]);

  const handleSave = () => {
    setSavedToast(t.saved);
    setTimeout(() => setSavedToast(''), 2500);
  };

  const handleSaveProfile = async () => {
    const err = await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
    if (!err) handleSave();
  };

  const handleSaveCompany = async () => {
    if (!supabase || !business) {
      handleSave();
      return;
    }
    const { error } = await supabase
      .from('businesses')
      .update({ name: companyName.trim() })
      .eq('id', business.id);
    if (!error) {
      await refresh();
      handleSave();
    }
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 6) return;
    const err = await updatePassword(newPassword);
    if (!err) {
      setNewPassword('');
      handleSave();
    }
  };

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSwitch = (enabled: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={classNames(
        'relative h-5 w-10 rounded-full transition-colors',
        enabled ? 'bg-accent' : 'bg-surface-3',
      )}
    >
      <span className={classNames(
        'absolute top-0.5 h-4 w-4 rounded-full bg-surface-0 shadow-xs transition-transform',
        enabled ? 'translate-x-5' : 'translate-x-0.5',
      )} />
    </button>
  );

  return (
    <div>
      <PageHeader title={t.settings} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Tab nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-px border-b border-border pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={classNames(
                    'group relative flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-surface-2 text-content'
                      : 'text-content-secondary hover:bg-surface-1 hover:text-content',
                  )}
                >
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />}
                  <Icon className={classNames('h-4 w-4', active ? 'text-accent' : 'text-content-tertiary group-hover:text-content-secondary')} />
                  {t[tab.labelKey as keyof typeof t] as string}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="lg:col-span-3">
          <Panel className="p-5">
            {activeTab === 'profile' && (
              <div className="max-w-lg space-y-4">
                <h3 className="text-sm font-semibold text-content">{t.profileSettings}</h3>
                <div className="flex items-center gap-3">
                  <Avatar name={fullName || t.profile} size="lg" />
                </div>
                <div>
                  <label className="label">{t.fullName}</label>
                  <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <label className="label">{t.emailAddress}</label>
                  <input className="input" value={user?.email ?? ''} readOnly disabled />
                </div>
                <div>
                  <label className="label">{t.phone}</label>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <button onClick={() => void handleSaveProfile()} className="btn-primary">{t.saveChanges}</button>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="max-w-lg space-y-4">
                <h3 className="text-sm font-semibold text-content">{t.companySettings}</h3>
                <div>
                  <label className="label">{t.companyName}</label>
                  <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div>
                  <label className="label">{t.companyAddress}</label>
                  <input className="input" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
                </div>
                <div>
                  <label className="label">{t.vatNumber}</label>
                  <input className="input" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                </div>
                <button onClick={() => void handleSaveCompany()} className="btn-primary">{t.saveChanges}</button>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="max-w-lg space-y-4">
                <h3 className="text-sm font-semibold text-content">{t.languageSettings}</h3>
                <p className="text-[13px] text-content-tertiary">{t.selectLanguage}</p>
                <div className="flex items-center gap-3">
                  <LanguageSwitcher />
                </div>
                <div className="rounded-md border border-border bg-surface-1 p-3.5 text-[13px] text-content-tertiary">
                  {t.saved}: localStorage
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="max-w-lg space-y-3">
                <h3 className="text-sm font-semibold text-content">{t.notificationSettings}</h3>
                {[
                  { key: 'email' as const, label: t.emailNotifications, icon: Mail },
                  { key: 'push' as const, label: t.pushNotifications, icon: Smartphone },
                  { key: 'orders' as const, label: t.orderNotifications, icon: Bell },
                  { key: 'lowStock' as const, label: t.lowStockAlerts, icon: Bell },
                ].map((item) => {
                  const Icon = item.icon;
                  const enabled = notifPrefs[item.key];
                  return (
                    <div key={item.key} className="flex items-center justify-between rounded-md border border-border px-3.5 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-content-tertiary" />
                        <span className="text-[13px] font-medium text-content-secondary">{item.label}</span>
                      </div>
                      {toggleSwitch(enabled, () => toggleNotif(item.key))}
                    </div>
                  );
                })}
                <button onClick={handleSave} className="btn-primary">{t.saveChanges}</button>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-content">{t.teamMembers}</h3>
                </div>
                <div className="space-y-2">
                  {teamMembers.length === 0 ? (
                    <p className="rounded-md border border-border bg-surface-1 px-3.5 py-4 text-center text-[13px] text-content-tertiary">
                      {t.noResults}
                    </p>
                  ) : (
                    teamMembers.map((m, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border border-border px-3.5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name || m.email} />
                          <div>
                            <p className="text-[13px] font-medium text-content">{m.name || t.teamMembers}</p>
                            <p className="text-xs text-content-tertiary">{m.email}</p>
                          </div>
                        </div>
                        <span className={classNames(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                          m.role === 'owner' || m.role === 'admin'
                            ? 'border-accent/20 bg-accent-subtle text-accent'
                            : 'border-border bg-surface-2 text-content-tertiary',
                        )}>
                          {m.role === 'owner' || m.role === 'admin' ? t.admin : t.staff}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="max-w-lg space-y-4">
                <h3 className="text-sm font-semibold text-content">{t.subscriptionSettings}</h3>
                <div className="rounded-md border border-accent/25 bg-accent-subtle p-5">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold text-content">{t.currentPlan}: Pro</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-content">
                    49 KM <span className="text-sm font-normal text-content-tertiary">/ mjesec</span>
                  </p>
                  <ul className="mt-4 space-y-1.5 text-[13px] text-content-secondary">
                    {['Neograničene narudžbe', 'Sve integracije', 'Neograničeni kupci', 'Prioritetna podrška'].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-success" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={handleSave} className="btn-primary mt-4">{t.upgrade}</button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-lg space-y-3">
                <h3 className="text-sm font-semibold text-content">{t.securitySettings}</h3>
                <div className="flex items-center justify-between rounded-md border border-border px-3.5 py-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-content-tertiary" />
                    <span className="text-[13px] font-medium text-content-secondary">{t.twoFactor}</span>
                  </div>
                  {toggleSwitch(false, () => {})}
                </div>
                <div>
                  <label className="label">{t.changePassword}</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <button onClick={() => void handleSavePassword()} disabled={newPassword.length < 6} className="btn-primary">
                  {t.saveChanges}
                </button>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Toast message={savedToast} />
    </div>
  );
}
