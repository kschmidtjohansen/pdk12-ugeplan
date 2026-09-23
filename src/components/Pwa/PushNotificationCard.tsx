import { Bell, BellOff, BellRing, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTranslation } from '@/context/TranslationContext';

export const PushNotificationCard = () => {
  const { status, busy, enable, disable, sendTest } = usePushNotifications();
  const { currentLanguage } = useTranslation();
  const { toast } = useToast();
  const isDa = currentLanguage === 'da';

  if (status === 'unsupported') return null;

  const handleEnable = async () => {
    const result = await enable();
    if (result === 'enabled') {
      toast({
        title: isDa ? 'Notifikationer slået til' : 'Notifications enabled',
        description: isDa
          ? 'Du får nu besked på denne enhed.'
          : 'You will now get alerts on this device.',
      });
    } else if (result === 'denied') {
      toast({
        variant: 'destructive',
        title: isDa ? 'Tilladelse afvist' : 'Permission denied',
        description: isDa
          ? 'Tillad notifikationer i browserens indstillinger for dette websted.'
          : 'Allow notifications for this site in your browser settings.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: isDa ? 'Kunne ikke slås til' : 'Could not enable',
        description: isDa ? 'Prøv igen om et øjeblik.' : 'Please try again in a moment.',
      });
    }
  };

  const handleTest = async () => {
    try {
      const result = await sendTest();
      toast({
        title: isDa ? 'Test sendt' : 'Test sent',
        description: isDa
          ? `Sendt til ${result?.sent ?? 0} enhed(er).`
          : `Sent to ${result?.sent ?? 0} device(s).`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: isDa ? 'Test mislykkedes' : 'Test failed',
        description: isDa ? 'Prøv igen om et øjeblik.' : 'Please try again in a moment.',
      });
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
          {status === 'on' ? (
            <BellRing className="h-4 w-4 text-primary" aria-hidden />
          ) : (
            <Bell className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {isDa ? 'Beskeder på telefonen' : 'Alerts on your phone'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {status === 'on'
              ? isDa
                ? 'Du får besked om ferieansøgninger, vagtbytte, sygemelding og beskeder på sager.'
                : 'You get alerts for leave requests, duty swaps, sick days and case messages.'
              : status === 'blocked'
                ? isDa
                  ? 'Notifikationer er blokeret for dette websted. Tillad dem i browserens indstillinger og prøv igen.'
                  : 'Notifications are blocked for this site. Allow them in your browser settings and try again.'
                : status === 'ios-needs-install'
                  ? isDa
                    ? 'På iPhone skal appen først lægges på hjemmeskærmen via Safari → Del → "Føj til hjemmeskærm". Derefter kan notifikationer slås til.'
                    : 'On iPhone you must first add the app to your home screen via Safari → Share → "Add to Home Screen".'
                  : isDa
                    ? 'Slå til, så får du besked, også når appen er lukket.'
                    : 'Turn on to get alerts even when the app is closed.'}
          </p>

          {status !== 'ios-needs-install' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {status === 'on' ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] gap-2"
                    onClick={handleTest}
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    {isDa ? 'Send test' : 'Send test'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] gap-2 text-muted-foreground"
                    onClick={disable}
                    disabled={busy}
                  >
                    <BellOff className="h-4 w-4" aria-hidden />
                    {isDa ? 'Slå fra' : 'Turn off'}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="min-h-[44px] gap-2"
                  onClick={handleEnable}
                  disabled={busy || status === 'blocked'}
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  {isDa ? 'Slå notifikationer til' : 'Turn on notifications'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PushNotificationCard;
