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

interface BiometricFactor {
  id: string;
  friendly_name?: string;
  status: string;
  created_at: string;
}

const isWebAuthnSupported = () =>
  typeof window !== 'undefined' &&
  !!window.PublicKeyCredential &&
  typeof window.PublicKeyCredential === 'function';

/**
 * Lets the user register the device's biometric unlock (Face ID, fingerprint,
 * PIN) as a WebAuthn factor. On later logins the device confirms with
 * biometrics instead of an extra typed step.
 */
const BiometricLoginDialog: React.FC<BiometricLoginDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [factors, setFactors] = useState<BiometricFactor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [supported] = useState(isWebAuthnSupported);
  const [lastError, setLastError] = useState<string | null>(null);


  const loadFactors = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(
        (data?.webauthn ?? []).filter(f => f.status === 'verified') as BiometricFactor[]
      );
    } catch {
      setFactors([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadFactors();
  }, [open, loadFactors]);

  const handleRegister = async () => {
    setIsRegistering(true);
    setLastError(null);
    try {
      const { error } = await supabase.auth.mfa.webauthn.register({
        friendlyName: `Denne enhed (${new Date().toLocaleDateString('da-DK')})`,
      });
      if (error) throw error;
      toast({
        title: 'Biometrisk login aktiveret',
        description: 'Næste login på denne enhed bekræfter du med Face ID, fingeraftryk eller pinkode.',
      });
      await loadFactors();
    } catch (error) {
      const err = error as { message?: string; code?: string; status?: number; name?: string };
      const msg = err?.message ?? '';
      const code = err?.code ?? '';
      const status = err?.status;

      // Serveren afviser tilmelding når WebAuthn ikke er slået til som MFA-faktor.
      const serverDisabled =
        code === 'mfa_webauthn_enroll_not_enabled' ||
        status === 422 ||
        /disabled|not enabled|not supported|factor type/i.test(msg);

      // Brugeren afbrød, eller enheden gav op.
      const cancelled =
        err?.name === 'NotAllowedError' ||
        err?.name === 'AbortError' ||
        /cancel|abort|not allowed|timed out|timeout/i.test(msg);

      const detail = [msg, code ? `kode: ${code}` : '', status ? `status: ${status}` : '']
        .filter(Boolean)
        .join(' · ');

      let description: string;
      if (serverDisabled) {
        description = `Serveren afviste tilmeldingen. Face ID / fingeraftryk skal slås til som MFA-faktor i Supabase. Svar fra serveren: ${detail || 'MFA enroll is disabled for WebAuthn'}`;
      } else if (cancelled) {
        description = `Bekræftelsen blev afbrudt på enheden. ${detail}`.trim();
      } else {
        description = detail
          ? `Fejl: ${detail}`
          : 'Registreringen fejlede uden en nærmere forklaring. Prøv igen.';
      }

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


  const handleRemove = async (factorId: string) => {
    setRemovingId(factorId);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast({ title: 'Fjernet', description: 'Biometrisk login er slået fra på denne enhed.' });
      await loadFactors();
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
            Brug telefonens Face ID, fingeraftryk eller pinkode til at bekræfte login — så slipper
            du for at taste mere end din adgangskode.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!supported && (
            <p className="text-sm text-muted-foreground">
              Denne browser understøtter desværre ikke biometrisk login.
            </p>
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
          ) : factors.length > 0 ? (
            <ul className="space-y-2">
              {factors.map(f => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {f.friendly_name || 'Biometrisk enhed'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tilføjet {new Date(f.created_at).toLocaleDateString('da-DK')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11 shrink-0"
                    disabled={removingId === f.id}
                    onClick={() => handleRemove(f.id)}
                    aria-label="Fjern biometrisk login"
                  >
                    {removingId === f.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            supported && (
              <p className="text-sm text-muted-foreground">
                Ingen enheder registreret endnu.
              </p>
            )
          )}

          {supported && (
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
