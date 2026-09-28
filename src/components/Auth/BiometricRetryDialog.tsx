import React from 'react';
import { Fingerprint, ArrowRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BiometricRetryDialogProps {
  open: boolean;
  busy: boolean;
  /** Short, friendly explanation of what went wrong. */
  reason?: string;
  onRetry: () => void;
  onContinue: () => void;
}

/**
 * Shown when the passkey sign-in (Face ID / fingerprint) was cancelled,
 * unavailable or failed. The user can try the device prompt once more — or
 * simply sign in with their password instead.
 */
const BiometricRetryDialog: React.FC<BiometricRetryDialogProps> = ({
  open,
  busy,
  reason,
  onRetry,
  onContinue,
}) => (
  <Dialog open={open} onOpenChange={(next) => { if (!next) onContinue(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Face ID / fingeraftryk blev ikke bekræftet
        </DialogTitle>
        <DialogDescription>
          {reason ??
            'Bekræftelsen blev afbrudt eller er ikke tilgængelig på denne enhed. Prøv igen, eller log ind med din adgangskode.'}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-2 grid gap-2">
        <Button className="h-11 w-full" onClick={onRetry} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
          Prøv Face ID / fingeraftryk igen
        </Button>
        <Button variant="outline" className="h-11 w-full" onClick={onContinue} disabled={busy}>
          Fortsæt med adgangskode-login
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default BiometricRetryDialog;
