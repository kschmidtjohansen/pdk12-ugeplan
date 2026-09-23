import { Bell, BellOff, BellRing, Send, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useTranslation } from '@/context/TranslationContext';

export const PushNotificationCard = () => {
  const { status, busy, installed, permission, enable, disable, sendTest } =
    usePushNotifications();
  const { canPrompt, promptInstall } = usePwaInstall();
  const { currentLanguage } = useTranslation();
  const { toast } = useToast();
  const isDa = currentLanguage === 'da';

  if (status === 'unsupported') return null;

  const needsInstall = status === 'needs-install';

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


  const yes = isDa ? 'Ja' : 'Yes';
  const no = isDa ? 'Nej' : 'No';
  const permissionLabel =
    permission === 'granted'
      ? isDa
        ? 'Givet'
        : 'Granted'
      : permission === 'denied'
        ? isDa
          ? 'Afvist'
          : 'Denied'
        : isDa
          ? 'Ikke spurgt'
          : 'Not asked';

  // Kort, eenliniers tekst. Den lange forklaring og status ses ved hover/tryk.
  const hint =
    status === 'on'
      ? isDa
        ? 'Aktiv på denne enhed'
        : 'Active on this device'
      : status === 'blocked'
        ? isDa
          ? 'Blokeret i telefonens indstillinger'
          : 'Blocked in your phone settings'
        : needsInstall
          ? isDa
            ? 'Appen skal ligge på hjemmeskærmen først'
            : 'Add the app to your home screen first'
          : isDa
            ? 'Få besked, også når appen er lukket'
            : 'Get alerts even when the app is closed';

  const diagnostics = `${isDa ? 'Installeret' : 'Installed'}: ${installed ? yes : no} · ${
    isDa ? 'Tilladelse' : 'Permission'
  }: ${permissionLabel} · ${isDa ? 'Tilmeldt' : 'Subscribed'}: ${status === 'on' ? yes : no}`;

  return (
    <div
      title={diagnostics}
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        {status === 'on' ? (
          <BellRing className="h-4 w-4 text-primary" aria-hidden />
        ) : (
          <Bell className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {isDa ? 'Beskeder på telefonen' : 'Alerts on your phone'}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={hint}>
          {hint}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {needsInstall && canPrompt && (
          <Button
            type="button"
            size="sm"
            className="touch-target gap-1.5 px-2 sm:px-3"
            onClick={() => void promptInstall()}
            aria-label={isDa ? 'Installer app nu' : 'Install app now'}
          >
            <Download className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">
              {isDa ? 'Installer app nu' : 'Install app now'}
            </span>
          </Button>
        )}

        {!needsInstall && status === 'on' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="touch-target gap-1.5 px-2 text-muted-foreground sm:px-3"
            onClick={disable}
            disabled={busy}
            aria-label={isDa ? 'Slå notifikationer fra' : 'Turn notifications off'}
          >
            <BellOff className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{isDa ? 'Slå fra' : 'Turn off'}</span>
          </Button>
        )}

        {!needsInstall && status !== 'on' && (
          <Button
            type="button"
            size="sm"
            className="touch-target gap-1.5 px-2 sm:px-3"
            onClick={handleEnable}
            disabled={busy || status === 'blocked'}
            aria-label={isDa ? 'Slå notifikationer til' : 'Turn on notifications'}
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">
              {isDa ? 'Slå til' : 'Turn on'}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default PushNotificationCard;
