import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';

/**
 * Full-screen offline fallback overlay.
 * Renders when `navigator.onLine === false` and listens to online/offline events.
 * Includes a manual "Prøv igen" button that re-checks connectivity.
 */
const OfflineFallback = () => {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [checking, setChecking] = useState(false);

  let language: 'da' | 'en' = 'da';
  try {
    const { currentLanguage } = useTranslation();
    language = (currentLanguage === 'en' ? 'en' : 'da');
  } catch {
    // Translation provider may not be ready — default to Danish
  }

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!isOffline) return null;

  const handleRetry = async () => {
    setChecking(true);
    try {
      // Small no-store HEAD request to confirm real connectivity
      await fetch(`${window.location.origin}/favicon.ico?_=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setChecking(false);
    }
  };

  const t = {
    da: {
      title: 'Du er offline',
      desc: 'Vi kan ikke nå serveren lige nu. Tjek din internetforbindelse og prøv igen. Dine ændringer gemmes ikke før forbindelsen er tilbage.',
      retry: 'Prøv igen',
      checking: 'Tjekker forbindelse…',
      hint: 'Tip: Genopretter forbindelsen sig selv, forsvinder denne side automatisk.',
    },
    en: {
      title: 'You are offline',
      desc: 'We can\u2019t reach the server right now. Check your internet connection and try again. Your changes won\u2019t be saved until you\u2019re back online.',
      retry: 'Try again',
      checking: 'Checking connection…',
      hint: 'Tip: This screen disappears automatically once the connection is restored.',
    },
  }[language];

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-labelledby="offline-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm p-6"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <WifiOff className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h1 id="offline-title" className="text-lg font-semibold text-foreground">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.desc}
          </p>
        </div>
        <Button
          onClick={handleRetry}
          disabled={checking}
          size="sm"
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          {checking ? t.checking : t.retry}
        </Button>
        <p className="text-xs text-muted-foreground">{t.hint}</p>
      </div>
    </div>
  );
};

export default OfflineFallback;
