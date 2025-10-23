
import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface PasswordChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [errors, setErrors] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // FIXED: Enhanced password validation
  const validatePasswords = () => {
    const newErrors = { current: '', new: '', confirm: '' };
    let isValid = true;

    if (!passwords.current.trim()) {
      newErrors.current = t('profile.currentPasswordRequired');
      isValid = false;
    }

    if (!passwords.new.trim()) {
      newErrors.new = t('profile.newPasswordRequired');
      isValid = false;
    } else if (passwords.new.length < 8) {
      newErrors.new = t('profile.passwordTooShort');
      isValid = false;
    }

    if (!passwords.confirm.trim()) {
      newErrors.confirm = t('profile.confirmPasswordRequired');
      isValid = false;
    } else if (passwords.new !== passwords.confirm) {
      newErrors.confirm = t('profile.passwordsDoNotMatch');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // FIXED: Enhanced error handling for password change
  const handlePasswordChange = async () => {
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    setErrors({ current: '', new: '', confirm: '' });

    try {
      console.log('[PasswordChangeDialog] Starting password change process');

      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: passwords.current
      });

      if (signInError) {
        console.error('[PasswordChangeDialog] Current password verification failed:', signInError);
        setErrors({ ...errors, current: t('profile.incorrectCurrentPassword') });
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (updateError) {
        console.error('[PasswordChangeDialog] Password update failed:', updateError);
        
        // Enhanced error message handling
        let errorMessage = t('profile.passwordChangeError');
        
        if (updateError.message.includes('weak')) {
          errorMessage = t('profile.passwordTooWeak');
        } else if (updateError.message.includes('same')) {
          errorMessage = t('profile.passwordSameAsCurrent');
        } else if (updateError.message.includes('invalid')) {
          errorMessage = t('profile.invalidPassword');
        }
        
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      console.log('[PasswordChangeDialog] Password updated successfully');
      
      toast({
        title: t('profile.passwordChanged'),
        description: t('profile.passwordChangedSuccessfully'),
      });

      // Reset form and close dialog
      setPasswords({ current: '', new: '', confirm: '' });
      setErrors({ current: '', new: '', confirm: '' });
      onClose();
      
    } catch (error) {
      console.error('[PasswordChangeDialog] Unexpected error:', error);
      toast({
        title: t('common.error'),
        description: t('profile.unexpectedError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (field: 'current' | 'new' | 'confirm', value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('profile.changePassword')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">{t('profile.currentPassword')}</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => handleInputChange('current', e.target.value)}
                placeholder={t('profile.enterCurrentPassword')}
                className={errors.current ? 'border-red-500' : ''}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
                disabled={loading}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.current && (
              <p className="text-sm text-red-500">{errors.current}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">{t('profile.newPassword')}</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => handleInputChange('new', e.target.value)}
                placeholder={t('profile.enterNewPassword')}
                className={errors.new ? 'border-red-500' : ''}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
                disabled={loading}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.new && (
              <p className="text-sm text-red-500">{errors.new}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('profile.confirmPassword')}</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => handleInputChange('confirm', e.target.value)}
                placeholder={t('profile.confirmNewPassword')}
                className={errors.confirm ? 'border-red-500' : ''}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={loading}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirm && (
              <p className="text-sm text-red-500">{errors.confirm}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handlePasswordChange}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('profile.changePassword')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeDialog;
