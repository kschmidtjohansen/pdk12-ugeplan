import { useState } from 'react';
import { Download, Share, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useTranslation } from '@/context/TranslationContext';

export const PwaInstallButton = () => {
  const { installed, canPrompt, isIos, promptInstall } = usePwaInstall();
  const { currentLanguage } = useTranslation();
  const [helpOpen, setHelpOpen] = useState(false);
  const isDa = currentLanguage === 'da';

  if (installed) return null;

  const label = isDa ? 'Installer som app på telefonen' : 'Install as an app on your phone';

  const handleClick = async () => {
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') return;
    }
    setHelpOpen(true);
  };

  const steps = isIos
    ? [
        {
          icon: Share,
          text: isDa
            ? 'Tryk på Del-ikonet i browserens menulinje.'
            : 'Tap the Share icon in the browser menu bar.',
        },
        {
          icon: Plus,
          text: isDa
            ? 'Vælg "Føj til hjemmeskærm".'
            : 'Choose "Add to Home Screen".',
        },
        {
          icon: Download,
          text: isDa ? 'Bekræft med "Tilføj".' : 'Confirm with "Add".',
        },
      ]
    : [
        {
          icon: MoreVertical,
          text: isDa
            ? 'Åbn browsermenuen (⋯ i Edge nederst, ⋮ i Chrome øverst).'
            : 'Open the browser menu (⋯ in Edge, ⋮ in Chrome).',
        },
        {
          icon: Download,
          text: isDa
            ? 'Vælg "Installer app" eller "Føj til telefon".'
            : 'Choose "Install app" or "Add to phone".',
        },
        {
          icon: Plus,
          text: isDa ? 'Bekræft med "Installer".' : 'Confirm with "Install".',
        },
      ];

  return (
    <>
      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          className="min-h-[44px] gap-2 rounded-full border-border/60 bg-card/70 px-5 text-xs font-semibold text-muted-foreground backdrop-blur hover:text-primary"
        >
          <Download className="h-4 w-4 text-polygon-blue" aria-hidden />
          {label}
        </Button>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-2xl">
          <DialogHeader>
            <DialogTitle>{isDa ? 'Installer Ugeplanen' : 'Install the planner'}</DialogTitle>
            <DialogDescription>
              {isDa
                ? 'Følg de tre trin, så ligger Ugeplanen som en app på din startskærm.'
                : 'Follow these three steps to add the planner to your home screen.'}
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <step.icon className="h-4 w-4 text-polygon-blue" aria-hidden />
                </span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PwaInstallButton;
