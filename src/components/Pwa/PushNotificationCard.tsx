import { Bell, BellOff, BellRing, Send, Share, Plus, MoreVertical, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useTranslation } from '@/context/TranslationContext';

export const PushNotificationCard = () => {
  const { status, busy, isIos, browser, installed, permission, enable, disable, sendTest } =
    usePushNotifications();
  const { canPrompt, promptInstall } = usePwaInstall();
  const { currentLanguage } = useTranslation();
  const { toast } = useToast();
  const isDa = currentLanguage === 'da';

  if (status === 'unsupported') return null;

  const needsInstall = status === 'needs-install';
  const iosWrongBrowser = isIos && browser !== 'safari';

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

  const installSteps = isIos
    ? iosWrongBrowser
      ? [
          {
            icon: Share,
            text: isDa
              ? 'Åbn pdk12.dk i Safari — installation virker kun fra Safari på iPhone.'
              : 'Open pdk12.dk in Safari — installing only works from Safari on iPhone.',
          },
          {
            icon: Plus,
            text: isDa
              ? 'Tryk på Del-ikonet og vælg "Føj til hjemmeskærm".'
              : 'Tap the Share icon and choose "Add to Home Screen".',
          },
        ]
      : [
          {
            icon: Share,
            text: isDa
              ? 'Tryk på Del-ikonet nederst i Safari.'
              : 'Tap the Share icon at the bottom of Safari.',
          },
          {
            icon: Plus,
            text: isDa ? 'Vælg "Føj til hjemmeskærm" → "Tilføj".' : 'Choose "Add to Home Screen" → "Add".',
          },
          {
            icon: Bell,
            text: isDa
              ? 'Åbn appen fra hjemmeskærmen og slå notifikationer til her.'
              : 'Open the app from your home screen and turn on notifications here.',
          },
        ]
    : [
        {
          icon: MoreVertical,
          text:
            browser === 'edge'
              ? isDa
                ? 'Åbn menuen (⋯) nederst i Edge.'
                : 'Open the (⋯) menu at the bottom of Edge.'
              : isDa
                ? 'Åbn menuen (⋮) øverst i Chrome.'
                : 'Open the (⋮) menu at the top of Chrome.',
        },
        {
          icon: Download,
          text: isDa
            ? 'Vælg "Installer app" eller "Føj til telefon".'
            : 'Choose "Install app" or "Add to phone".',
        },
        {
          icon: Bell,
          text: isDa
            ? 'Åbn appen fra startskærmen og slå notifikationer til her.'
            : 'Open the app from your home screen and turn on notifications here.',
        },
      ];

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
                  ? 'Notifikationer er blokeret for dette websted. Tillad dem i telefonens indstillinger for appen og prøv igen.'
                  : 'Notifications are blocked. Allow them in your phone settings for this app and try again.'
                : needsInstall
                  ? isDa
                    ? 'Appen skal først ligge på hjemmeskærmen, før telefonen kan sende dig beskeder.'
                    : 'The app must be on your home screen before your phone can send you alerts.'
                  : isDa
                    ? 'Slå til, så får du besked, også når appen er lukket.'
                    : 'Turn on to get alerts even when the app is closed.'}
          </p>

          {needsInstall && (
            <>
              <ol className="mt-3 space-y-2">
                {installSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-foreground">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      <step.icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                    </span>
                    <span className="pt-0.5">{step.text}</span>
                  </li>
                ))}
              </ol>
              {canPrompt && (
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-[44px] gap-2"
                    onClick={() => void promptInstall()}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    {isDa ? 'Installer app nu' : 'Install app now'}
                  </Button>
                </div>
              )}
            </>
          )}

          {!needsInstall && (
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

          <p className="mt-3 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
            {isDa ? 'Installeret' : 'Installed'}: {installed ? yes : no} ·{' '}
            {isDa ? 'Tilladelse' : 'Permission'}: {permissionLabel} ·{' '}
            {isDa ? 'Tilmeldt' : 'Subscribed'}: {status === 'on' ? yes : no}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationCard;
