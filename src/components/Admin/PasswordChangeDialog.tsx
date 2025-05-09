
import React, { useState } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/context/AuthContext';
import { Employee } from '@/types/employee';

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
  const { adminResetPassword } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const validateForm = () => {
    if (newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('admin.passwords.passwordTooShort'),
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
    
    setIsSubmitting(true);

    try {
      const { error } = await adminResetPassword(currentUser.id, newPassword);
      
      if (error) {
        throw new Error(error);
      }
      
      toast({
        title: t('admin.passwords.resetSuccess'),
        description: t('admin.passwords.resetDescription', { name: currentUser.name }),
      });
      
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: t('common.error'),
        description: t('admin.passwords.resetError'),
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-password" className="text-right">
              {t('admin.passwords.newPassword')}
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="col-span-3"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirm-password" className="text-right">
              {t('admin.passwords.confirmPassword')}
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="col-span-3"
              required
              autoComplete="new-password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('admin.passwords.resetting') : t('admin.passwords.resetPassword')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default PasswordChangeDialog;
