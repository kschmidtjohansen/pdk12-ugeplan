
import React, { useState } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { PasswordInput } from '@/components/ui/password-input';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  jobTitle?: string;
}

interface PasswordChangeDialogProps {
  currentUser: AdminUser | null;
  onClose: () => void;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({
  currentUser,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const { validateAdminAccess, user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const validateForm = () => {
    if (!isPasswordValid) {
      toast({
        title: t('common.error'),
        description: 'Password must be at least 8 characters long and contain uppercase, lowercase, and number',
        variant: "destructive",
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('admin.passwords.passwordsMustMatch'),
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !validateForm()) return;
    
    // Validate admin access first
    if (!validateAdminAccess()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Use supabase.functions.invoke instead of hardcoded fetch
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: currentUser.id,
          newPassword: newPassword
        }
      });

      if (error) {
        throw new Error(error.message || `Request failed`);
      }
      
      toast({
        title: t('admin.passwords.resetSuccess'),
        description: t('admin.passwords.resetDescription', { name: currentUser.name }),
      });
      
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      console.error('[PasswordChangeDialog] Password reset failed:', error instanceof Error ? error.message : 'Unknown error');
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        const errorText = error.message;
        
        if (errorText.includes('Failed to fetch') || errorText.includes('NetworkError')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (errorText.includes('403') || errorText.includes('Forbidden')) {
          errorMessage = 'Access denied. Please check your permissions or try refreshing the page.';
        } else if (errorText.includes('401') || errorText.includes('Unauthorized')) {
          errorMessage = 'Your session has expired. Please refresh the page and try again.';
        } else if (errorText.includes('404') || errorText.includes('Not Found')) {
          errorMessage = 'The password reset service is not available. Please contact support.';
        } else if (errorText.includes('500') || errorText.includes('Internal Server Error')) {
          errorMessage = 'Server error occurred. Please try again in a few moments.';
        } else {
          errorMessage = errorText;
        }
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {currentUser && t('admin.passwords.resetPasswordFor', { name: currentUser.name })}
        </DialogTitle>
        <DialogDescription>
          {t('admin.passwords.enterNewPassword')}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <PasswordInput
              label={t('admin.passwords.newPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showStrengthIndicator={true}
              onValidationChange={setIsPasswordValid}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {t('admin.passwords.confirmPassword')}
            </Label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting || !isPasswordValid}>
            {isSubmitting ? t('admin.passwords.resetting') : t('admin.passwords.resetPassword')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default PasswordChangeDialog;
