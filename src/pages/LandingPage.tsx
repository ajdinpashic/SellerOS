import { useState, useRef, useEffect } from 'react';
import {
  ArrowDown, ShoppingCart, Package, Users, Truck, BarChart3, Inbox,
  Check, ChevronRight, Globe, Menu, X,
} from 'lucide-react';
import { useI18n } from '@/locales';
import type { LanguageCode } from '@/types';
import type { Route } from '@/hooks/useRouter';

interface LandingPageProps {
  navigate: (route: Route) => void;
}

const languages: { code: LanguageCode; label: string }[] = [
  { code: 'bs', label: 'BS' },
  { code: 'hr', label: 'HR' },
  { code: 'sr', label: 'SR' },
  { code: 'en', label: 'EN' },
];

export function LandingPage({ navigate }: LandingPageProps) {
  const { t, lang, setLang } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) root.style.overflowY = 'auto';
    return () => { if (root) root.style.overflowY = ''; };
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  const currentLang = languages.find((l) => l.code === lang)!;

  const navLinks = [
    { label: t.landing_footer_product, href: '#features' },
    { label: t.landing_footer_how, href: '#how' },
    { label: t.landing_footer_pricing, href: '#cta' },
  ];

  return (
    <div className="min-h-dvh bg-surface-1">
      <nav className="sticky top-0 z-40 border-b border-border bg-surface-0/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-[13px] font-bold text-white">S</div>
            <span className="text-[16px] font-semibold tracking-tight text-content">SellerOS</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-[13px] font-medium text-content-secondary transition-colors hover:text-content">{link.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={langRef}>
              <button onClick={() => setLangOpen((v) => !v)} className="flex h-9 items-center gap-1 rounded-md px-2.5 text-[13px] font-medium text-content-secondary transition-colors hover:bg-surface-2 hover:text-content">
                <Globe className="h-4 w-4" />
                {currentLang.label}
              </button>
              {langOpen && (
                <div className="absolute right-0 z-50 mt-1 w-40 animate-slide-up rounded-md border border-border bg-surface-0 py-0.5 shadow-popover">
                  {languages.map((l) => (
                    <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-[13px] transition-colors min-h-[40px] ${l.code === lang ? 'text-accent' : 'text-content hover:bg-surface-1'}`}>
                      <span className="font-medium">{l.label}</span>
                      {l.code === lang && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => navigate({ name: 'login' })} className="btn-secondary h-9 px-3 text-[13px]">{t.landing_cta_primary}</button>
            <button onClick={() => navigate({ name: 'register' })} className="btn-primary h-9 px-3 text-[13px]">{t.landing_cta_secondary}</button>
            <button onClick={() => setMobileMenuOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-2 md:hidden">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-border bg-surface-0 px-4 pb-4 pt-2 md:hidden">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-[14px] font-medium text-content-secondary transition-colors hover:text-content">{link.label}</a>
            ))}
            <div className="mt-2 flex gap-2">
              <button onClick={() => { navigate({ name: 'login' }); setMobileMenuOpen(false); }} className="btn-secondary h-10 flex-1 text-[14px]">{t.landing_cta_primary}</button>
              <button onClick={() => { navigate({ name: 'register' }); setMobileMenuOpen(false); }} className="btn-primary h-10 flex-1 text-[14px]">{t.landing_cta_secondary}</button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-14 text-center md:pb-20 md:pt-24">
          <h1 className="mx-auto max-w-3xl text-[32px] font-bold leading-tight tracking-tight text-content sm:text-[40px] md:text-[48px]">{t.landing_hero_title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-content-secondary md:text-[17px]">{t.landing_hero_desc}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={() => navigate({ name: 'register' })} className="btn-primary h-12 px-8 text-[15px] font-semibold">{t.landing_cta_secondary}<ChevronRight className="h-4 w-4" /></button>
            <a href="#how" className="btn-secondary h-12 px-8 text-[15px]">{t.landing_secondary_cta}</a>
          </div>
          <div className="mx-auto mt-14 max-w-2xl md:mt-20">
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {['OLX', 'Instagram', 'Facebook', 'Webshop'].map((ch) => (
                  <span key={ch} className="rounded-full border border-border bg-surface-0 px-4 py-2 text-[13px] font-medium text-content shadow-xs">{ch}</span>
                ))}
              </div>
              <div className="flex h-10 items-center"><ArrowDown className="h-5 w-5 text-content-tertiary" /></div>
              <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent-subtle px-6 py-3 shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-white">S</div>
                <span className="text-[16px] font-semibold text-accent">SellerOS</span>
              </div>
              <div className="flex h-10 items-center"><ArrowDown className="h-5 w-5 text-content-tertiary" /></div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: t.orders, icon: ShoppingCart },
                  { label: t.customers, icon: Users },
                  { label: t.inventory, icon: Package },
                  { label: t.shipping, icon: Truck },
                  { label: t.reports, icon: BarChart3 },
                ].map(({ label, icon: Icon }) => (
                  <span key={label} className="flex items-center gap-1.5 rounded-full border border-border bg-surface-0 px-4 py-2 text-[13px] font-medium text-content shadow-xs">
                    <Icon className="h-3.5 w-3.5 text-content-tertiary" />{label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-0">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-20">
          <h2 className="text-[22px] font-bold tracking-tight text-content sm:text-[26px]">{t.landing_problem_title}</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {['Instagram', 'Facebook', 'OLX', 'Webshop', 'Viber', 'Excel'].map((ch) => (
              <span key={ch} className="rounded-full border border-border bg-surface-1 px-4 py-2 text-[13px] font-medium text-content-secondary">{ch}</span>
            ))}
          </div>
          <p className="mt-8 text-[16px] font-semibold text-accent">{t.landing_problem_desc}</p>
        </div>
      </section>

      <section className="border-t border-border" id="how">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <h2 className="text-center text-[22px] font-bold tracking-tight text-content sm:text-[26px]">{t.landing_how_title}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { num: '01', title: t.landing_how_step1_title, desc: t.landing_how_step1_desc },
              { num: '02', title: t.landing_how_step2_title, desc: t.landing_how_step2_desc },
              { num: '03', title: t.landing_how_step3_title, desc: t.landing_how_step3_desc },
            ].map((step) => (
              <div key={step.num} className="card p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent text-[14px] font-bold text-white">{step.num}</div>
                <h3 className="mt-4 text-[15px] font-semibold text-content">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-content-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-content-tertiary">{t.landing_soon}</p>
        </div>
      </section>

      <section className="border-t border-border bg-surface-0" id="features">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <h2 className="text-center text-[22px] font-bold tracking-tight text-content sm:text-[26px]">{t.landing_features_title}</h2>
          <div className="mt-12 grid items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-[18px] font-semibold text-content">{t.landing_showcase_orders}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-content-secondary">{t.landing_feature_orders_desc}</p>
            </div>
            <div className="card overflow-hidden">
              {[
                { id: '#1042', name: 'Emir Hadžić', ch: 'OLX', st: t.st_pending, amt: '89 KM' },
                { id: '#1041', name: 'Amira Kovač', ch: 'Instagram', st: t.st_confirmed, amt: '156 KM' },
                { id: '#1040', name: 'Faris Begić', ch: 'Facebook', st: t.st_delivered, amt: '245 KM' },
              ].map((o, i) => (
                <div key={o.id} className={`flex items-center gap-3 px-4 py-3 ${i < 2 ? 'border-b border-border' : ''}`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-subtle text-[11px] font-bold text-accent">{o.id}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-content">{o.name}</p>
                    <p className="text-[11px] text-content-tertiary">{o.ch} · {o.st}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-content">{o.amt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16 grid items-center gap-8 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <div className="card overflow-hidden">
                {[
                  { initials: 'EH', name: 'Emir Hadžić', msg: 'Imate li još veličina?', time: '2 min' },
                  { initials: 'AK', name: 'Amira Kovač', msg: 'Hvala, porudžba je stigla!', time: '15 min' },
                  { initials: 'FB', name: 'Faris Begić', msg: 'Kada će biti dostupno?', time: '1 h' },
                ].map((c, i) => (
                  <div key={c.initials} className={`flex items-center gap-3 px-4 py-3 ${i < 2 ? 'border-b border-border' : ''}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[11px] font-bold text-content">{c.initials}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-content">{c.name}</p>
                      <p className="text-[11px] text-content-tertiary truncate">{c.msg}</p>
                    </div>
                    <span className="text-[11px] text-content-tertiary">{c.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-[18px] font-semibold text-content">{t.landing_showcase_inbox}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-content-secondary">{t.landing_feature_inbox_desc}</p>
            </div>
          </div>
          <div className="mt-16 grid items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-[18px] font-semibold text-content">{t.landing_showcase_inventory}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-content-secondary">{t.landing_feature_inventory_desc}</p>
            </div>
            <div className="card overflow-hidden">
              {[
                { name: 'Adidas Hoodie', sku: 'ADI-HOD-BLK', stock: 4, min: 10, tone: 'warning' },
                { name: 'Nike Air Max', sku: 'NKE-AMX-WHT', stock: 12, min: 5, tone: '' },
                { name: 'Samsung Galaxy Case', sku: 'SAM-GC-BLK', stock: 0, min: 15, tone: 'danger' },
              ].map((p, i) => (
                <div key={p.sku} className={`flex items-center justify-between px-4 py-3 ${i < 2 ? 'border-b border-border' : ''}`}>
                  <div>
                    <p className="text-[13px] font-medium text-content">{p.name}</p>
                    <p className="text-[11px] text-content-tertiary">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[13px] font-semibold ${p.tone === 'danger' ? 'text-danger' : p.tone === 'warning' ? 'text-warning' : 'text-content'}`}>{p.stock}</span>
                    <span className="text-[11px] text-content-tertiary"> / {p.min}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Inbox, title: t.landing_feature_inbox, desc: t.landing_feature_inbox_desc },
              { icon: ShoppingCart, title: t.landing_feature_orders, desc: t.landing_feature_orders_desc },
              { icon: Package, title: t.landing_feature_inventory, desc: t.landing_feature_inventory_desc },
              { icon: Users, title: t.landing_feature_customers, desc: t.landing_feature_customers_desc },
              { icon: Truck, title: t.landing_feature_shipping, desc: t.landing_feature_shipping_desc },
              { icon: BarChart3, title: t.landing_feature_reports, desc: t.landing_feature_reports_desc },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card flex gap-4 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-subtle">
                  <Icon className="h-4.5 w-4.5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-content">{title}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-content-secondary">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-0" id="cta">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-20">
          <h2 className="text-[22px] font-bold tracking-tight text-content sm:text-[26px]">{t.landing_cta_title}</h2>
          <p className="mt-3 text-[15px] text-content-secondary">{t.landing_cta_desc}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={() => navigate({ name: 'register' })} className="btn-primary h-12 px-8 text-[15px] font-semibold">{t.landing_cta_button}<ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => navigate({ name: 'login' })} className="btn-secondary h-12 px-8 text-[15px]">{t.landing_cta_primary}</button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface-0">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-[9px] font-bold text-white">S</div>
              <span className="text-[14px] font-semibold text-content">SellerOS</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[13px] text-content-secondary">
              <a href="#features" className="hover:text-content transition-colors">{t.landing_footer_product}</a>
              <a href="#how" className="hover:text-content transition-colors">{t.landing_footer_how}</a>
              <span className="hover:text-content transition-colors cursor-default">{t.landing_footer_pricing}</span>
              <span className="hover:text-content transition-colors cursor-default">{t.landing_footer_help}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-content-tertiary">
              <span className="cursor-default">{t.landing_footer_terms}</span>
              <span className="cursor-default">{t.landing_footer_privacy}</span>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-[11px] text-content-tertiary">{t.landing_footer_copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
