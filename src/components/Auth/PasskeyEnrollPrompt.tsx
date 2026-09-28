import React, { useEffect, useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { isPasskeyAvailable } from '@/components/Profile/BiometricLoginDialog';

const DISMISS_KEY = 'passkey_enroll_dismissed';

interface PasskeyEnrollPromptProps {
  /** True lige efter et gennemført adgangskode-login. */
  trigger: boolean;
  onDone: () => void;
}

/**
 * Tilbyder hurtig login (Face ID / fingeraftryk) lige efter et almindeligt
 * login, hvis enheden understøtter det og endnu ikke er registreret.
 */
const PasskeyEnrollPrompt: React.FC<PasskeyEnrollPromptProps> = ({ trigger, onDone }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!trigger) return;
      if (!isPasskeyAvailable()) return onDone();
      if (typeof window !== 'undefined' && window.localStorage.getItem(DISMISS_KEY) === '1') {
        return onDone();
      }
      try {
        const { data, error } = await supabase.auth.passkey.list();
        if (cancelled) return;
        if (error || (data && data.length > 0)) return onDone();
        setOpen(true);
      } catch {
        if (!cancelled) onDone();
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [trigger, onDone]);

  const close = () => {
    setOpen(false);
    onDone();
  };

  const handleEnable = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      if (data?.id) {
        await supabase.auth.passkey.update({
          passkeyId: data.id,
          friendlyName: `Denne enhed (${new Date().toLocaleDateString('da-DK')})`,
        });
      }
      toast({
        title: 'Hurtig login aktiveret',
        description: 'Næste gang logger du ind med Face ID, fingeraftryk eller pinkode.',
      });
      close();
    } catch (error) {
      const err = error as { message?: string; code?: string; status?: number };
      toast({
        title: 'Kunne ikke aktivere',
        description:
          [err?.message, err?.code ? `kode: ${err.code}` : '', err?.status ? `status: ${err.status}` : '']
            .filter(Boolean)
            .join(' · ') || 'Prøv igen fra profilmenuen.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') window.localStorage.setItem(DISMISS_KEY, '1');
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Gør dit næste login lynhurtigt
          </DialogTitle>
          <DialogDescription>
            Aktivér Face ID, fingeraftryk eller pinkode på denne enhed, så slipper du for at taste
            din adgangskode næste gang.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Button type="button" onClick={handleEnable} disabled={busy} className="h-11 w-full">
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Følg vejledningen på enheden…
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Aktivér Face ID / fingeraftryk
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={busy}
            className="h-11 w-full"
          >
            Ikke nu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasskeyEnrollPrompt;
