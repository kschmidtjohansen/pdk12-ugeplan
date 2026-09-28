import React, { useCallback, useEffect, useState } from 'react';
import { Fingerprint, Trash2, Loader2 } from 'lucide-react';
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

interface BiometricLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PasskeyItem {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
}

export const isWebAuthnSupported = () =>
  typeof window !== 'undefined' &&
  !!window.PublicKeyCredential &&
  typeof window.PublicKeyCredential === 'function';

/**
 * Passkeys er registreret med RP ID "pdk12.dk" i Supabase. Et RP ID uden
 * subdomæne dækker både pdk12.dk, www.pdk12.dk og appen installeret på
 * telefonen (samme origin i standalone-tilstand).
 */
export const PASSKEY_RP_ID = 'pdk12.dk';

export const isPasskeyDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host === PASSKEY_RP_ID ||
    host.endsWith(`.${PASSKEY_RP_ID}`) ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );
};

/** Appen kører som installeret app på telefonen (PWA). */
export const isStandalonePwa = () => {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    nav.standalone === true
  );
};

export const isPasskeyAvailable = () => isWebAuthnSupported() && isPasskeyDomain();

/**
 * Lets the user register the device's biometric unlock (Face ID, fingerprint,
 * PIN) as a passkey. On later logins the device signs the user in directly —
 * no password needed.
 */
const BiometricLoginDialog: React.FC<BiometricLoginDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [supported] = useState(isWebAuthnSupported);
  const [rightDomain] = useState(isPasskeyDomain);
  const [lastError, setLastError] = useState<string | null>(null);

  const loadPasskeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.passkey.list();
      if (error) throw error;
      setPasskeys((data ?? []) as PasskeyItem[]);
    } catch {
      setPasskeys([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadPasskeys();
  }, [open, loadPasskeys]);

  const handleRegister = async () => {
    setIsRegistering(true);
    setLastError(null);
    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) throw error;

      // Giv nøglen et venligt navn, så brugeren kan kende enheden i listen.
      if (data?.id) {
        await supabase.auth.passkey.update({
          passkeyId: data.id,
          friendlyName: `Denne enhed (${new Date().toLocaleDateString('da-DK')})`,
        });
      }

      toast({
        title: 'Hurtig login aktiveret',
        description: 'Næste gang kan du logge ind med Face ID, fingeraftryk eller pinkode — helt uden adgangskode.',
      });
      await loadPasskeys();
    } catch (error) {
      const err = error as { message?: string; code?: string; status?: number; name?: string };
      const msg = err?.message ?? '';
      const code = err?.code ?? '';
      const status = err?.status;

      // Brugeren afbrød, eller enheden gav op.
      const cancelled =
        err?.name === 'NotAllowedError' ||
        err?.name === 'AbortError' ||
        /cancel|abort|not allowed|timed out|timeout/i.test(msg);

      const detail = [msg, code ? `kode: ${code}` : '', status ? `status: ${status}` : '']
        .filter(Boolean)
        .join(' · ');

      const description = cancelled
        ? `Bekræftelsen blev afbrudt på enheden. ${detail}`.trim()
        : detail
          ? `Fejl: ${detail}`
          : 'Registreringen fejlede uden en nærmere forklaring. Prøv igen.';

      setLastError(description);
      toast({
        title: 'Kunne ikke aktivere',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRemove = async (passkeyId: string) => {
    setRemovingId(passkeyId);
    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId });
      if (error) throw error;
      toast({ title: 'Fjernet', description: 'Hurtig login er slået fra på denne enhed.' });
      await loadPasskeys();
    } catch (error) {
      toast({
        title: 'Kunne ikke fjerne',
        description: (error as { message?: string })?.message ?? 'Prøv igen.',
        variant: 'destructive',
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Hurtig login på denne enhed
          </DialogTitle>
          <DialogDescription>
            Brug telefonens Face ID, fingeraftryk eller pinkode til at logge ind — helt uden
            at taste din adgangskode.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!supported && (
            <p className="text-sm text-muted-foreground">
              Denne browser understøtter desværre ikke biometrisk login.
            </p>
          )}

          {supported && !rightDomain && (
            <p className="text-sm text-muted-foreground">
              Hurtig login virker på <strong>pdk12.dk</strong> og <strong>www.pdk12.dk</strong>.
              Åbn siden der, og aktivér det på denne enhed.
            </p>
          )}

          {supported && rightDomain && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-medium text-foreground">Vigtigt: registrér din enhed igen</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hurtig login virker nu på både pdk12.dk og www.pdk12.dk — også når appen er
                installeret på telefonen. Har du aktiveret det tidligere, skal du fjerne den gamle
                registrering herunder og trykke "Aktivér" igen.
              </p>
            </div>
          )}

          {lastError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Kunne ikke aktivere</p>
              <p className="mt-1 break-words text-xs text-destructive/90">{lastError}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Henter enheder…
            </div>
          ) : passkeys.length > 0 ? (
            <ul className="space-y-2">
              {passkeys.map(p => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.friendly_name || 'Biometrisk enhed'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tilføjet {new Date(p.created_at).toLocaleDateString('da-DK')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11 shrink-0"
                    disabled={removingId === p.id}
                    onClick={() => handleRemove(p.id)}
                    aria-label="Fjern hurtig login"
                  >
                    {removingId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            supported && rightDomain && (
              <p className="text-sm text-muted-foreground">
                Ingen enheder registreret endnu.
              </p>
            )
          )}

          {supported && rightDomain && (
            <Button
              type="button"
              onClick={handleRegister}
              disabled={isRegistering}
              className="min-h-11 w-full"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Følg vejledningen på enheden…
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Aktivér Face ID / fingeraftryk på denne enhed
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BiometricLoginDialog;
