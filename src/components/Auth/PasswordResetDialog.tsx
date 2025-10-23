
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Requesting password reset for email:', email);
      
      // Try to use the edge function for more reliable delivery
      try {
        const { error: fnError } = await supabase.functions.invoke('admin-reset-password', {
          body: { email }
        });
        
        if (!fnError) {
          console.log('Password reset email sent via edge function');
          toast({
            title: t('login.passwordReset.emailSentTitle'),
            description: t('login.passwordReset.checkEmail'),
          });
          onOpenChange(false);
          return;
        } else {
          console.error('Edge function error, falling back to auth API:', fnError);
        }
      } catch (fnErr) {
        console.error('Error calling edge function, falling back to auth API:', fnErr);
      }
      
      // Fall back to regular auth API if edge function fails
      const { error } = await resetPassword(email);
      
      if (error) {
        console.error('Password reset request failed:', error);
        toast({
          title: t('common.error'),
          description: t('login.passwordReset.emailError'),
          variant: 'destructive',
        });
      } else {
        console.log('Password reset email sent successfully via auth API');
        toast({
          title: t('login.passwordReset.emailSentTitle'),
          description: t('login.passwordReset.checkEmail'),
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: t('common.error'),
        description: t('login.passwordReset.emailError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Added a direct navigate to reset password page for users who have the reset link
  const handleDirectResetPage = () => {
    onOpenChange(false);
    navigate('/reset-password');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('login.passwordReset.title')}</DialogTitle>
          <DialogDescription>
            {t('login.passwordReset.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input
                id="email"
                placeholder={t('login.passwordReset.emailPlaceholder')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="sm:order-1"
            >
              {t('login.passwordReset.backToLogin')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="sm:order-2">
              {isSubmitting 
                ? t('login.passwordReset.buttonLoading') 
                : t('login.passwordReset.sendResetEmail')
              }
            </Button>
            <Button 
              type="button" 
              variant="link" 
              onClick={handleDirectResetPage}
              className="sm:order-3 mt-2 sm:mt-0"
            >
              I already have a reset link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetDialog;
