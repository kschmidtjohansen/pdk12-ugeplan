
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
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { PasswordInput } from '@/components/ui/password-input';

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
  const { adminResetPassword, validateAdminAccess } = useAuth();
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
      console.log('[PasswordChangeDialog] Attempting password reset for user:', currentUser.id);
      
      const { error } = await adminResetPassword(currentUser.id, newPassword);
      
      if (error) {
        console.error('[PasswordChangeDialog] Password reset failed:', error);
        
        // Enhanced error handling with more specific messages
        let errorMessage = t('admin.passwords.resetError');
        
        if (error.includes('Origin not allowed')) {
          errorMessage = 'Access denied: Origin not allowed. Please check your connection.';
        } else if (error.includes('Rate limit exceeded')) {
          errorMessage = 'Too many requests. Please wait before trying again.';
        } else if (error.includes('Missing or invalid authorization')) {
          errorMessage = 'Your session has expired. Please refresh the page and try again.';
        } else if (error.includes('Invalid authentication token')) {
          errorMessage = 'Authentication failed. Please log out and log back in.';
        } else if (error.includes('Insufficient privileges')) {
          errorMessage = 'You do not have permission to reset passwords.';
        } else if (error.includes('Invalid user ID format')) {
          errorMessage = 'Invalid user selected. Please try selecting the user again.';
        } else if (error.includes('Password must')) {
          errorMessage = error; // Use the specific password validation error
        } else if (error.includes('Password reset failed:')) {
          errorMessage = error; // Use the specific Supabase error
        } else if (error.includes('Network') || error.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      console.log('[PasswordChangeDialog] Password reset successful');
      
      toast({
        title: t('admin.passwords.resetSuccess'),
        description: t('admin.passwords.resetDescription', { name: currentUser.name }),
      });
      
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      console.error('[PasswordChangeDialog] Unexpected error:', error);
      
      // More specific error handling for different error types
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
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
