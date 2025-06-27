import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTranslation } from '@/context/TranslationContext';
import { isValidEmail } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { authLog, secureError } from '@/utils/secureLogger';

interface PasswordResetDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  email?: string;
}

const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({
  open,
  setOpen,
  email: initialEmail = ''
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!email) {
        throw new Error(t('auth.emailRequired'));
      }

      if (!isValidEmail(email)) {
        throw new Error(t('auth.invalidEmail'));
      }

      // Use secure logging
      authLog('password_reset_requested', {
        email: email,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        authLog('password_reset_failed', {
          email: email,
          errorType: error.message
        });
        throw error;
      }

      authLog('password_reset_sent', {
        email: email,
        timestamp: new Date().toISOString()
      });

      setSuccess(true);
      
      // Auto close dialog after 3 seconds
      setTimeout(() => {
        setOpen(false);
        setEmail('');
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      secureError('Password reset error', err, { email });
      setError(err.message || t('auth.resetError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('auth.resetPassword')}</DialogTitle>
          <DialogDescription>
            {t('auth.resetDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              {t('auth.email')}
            </Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        {error && (
          <div className="p-3 bg-red-100 text-red-500 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-100 text-green-500 rounded-md">
            {t('auth.resetSuccess')}
          </div>
        )}
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? t('common.loading') : t('auth.resetButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetDialog;
