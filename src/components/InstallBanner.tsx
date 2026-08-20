import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useI18n } from '@/locales';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
}

export function InstallBanner() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    if (!isMobile()) return;

    const d = localStorage.getItem('selleros-install-dismissed');
    if (d) { setDismissed(true); return; }

    setIsMobileDevice(true);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('selleros-install-dismissed', '1');
  };

  if (!isMobileDevice || dismissed) return null;

  if (isIOS && !show) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-4">
        <div className="card shadow-popover border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-subtle">
              <Download className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-content">{t.installApp || 'Instalirajte SellerOS'}</p>
              <p className="text-xs text-content-secondary mt-1">
                {t.iosInstallHint || 'Dodajte na početni ekran: dijelite → Dodajte na početni ekran'}
              </p>
            </div>
            <button onClick={handleDismiss} className="rounded-lg p-1 text-content-tertiary hover:text-content">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="card shadow-popover border border-border p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-subtle">
            <Download className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-content">{t.installApp || 'Instalirajte SellerOS'}</p>
            <p className="text-xs text-content-secondary mt-1">
              {t.installHint || 'Dodajte na početni ekran za brži pristup'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleInstall} className="btn-primary text-xs px-3 py-1.5">
              {t.install || 'Instaliraj'}
            </button>
            <button onClick={handleDismiss} className="rounded-lg p-1 text-content-tertiary hover:text-content">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
