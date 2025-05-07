
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface PasswordChangeDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordChange: (userId: string, newPassword: string) => Promise<void>;
}

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({ 
  userId, 
  open, 
  onOpenChange,
  onPasswordChange
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const passwordSchema = z.object({
    password: z.string().min(8, t('admin.passwordMinLength')),
    confirmPassword: z.string()
  }).refine(data => data.password === data.confirmPassword, {
    message: t('admin.passwordsMustMatch'),
    path: ['confirmPassword'],
  });
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema)
  });
  
  const onSubmit = async (data: PasswordForm) => {
    try {
      await onPasswordChange(userId, data.password);
      toast({
        title: t('admin.passwordChanged'),
        description: t('admin.passwordChangedSuccess'),
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('admin.passwordChangeFailed'),
      });
      console.error(error);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.changePassword')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="password">{t('common.newPassword')}</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('common.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeDialog;
