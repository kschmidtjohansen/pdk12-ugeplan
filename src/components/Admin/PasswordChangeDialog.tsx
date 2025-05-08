import React, { useState } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@/types/auth';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordChangeDialogProps {
  currentUser: User | null;
  onClose: () => void;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({
  currentUser,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError(t('admin.passwords.passwordsMustMatch'));
      return;
    }
    
    if (newPassword.length < 6) {
      setError(t('admin.passwords.passwordTooShort'));
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      if (currentUser) {
        await resetPassword(newPassword);
        toast({
          title: t('admin.passwords.resetSuccess'),
          description: t('admin.passwords.resetDescription', { name: currentUser.name }),
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('admin.passwords.resetError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{t('admin.passwords.resetPasswordFor', { name: currentUser?.name })}</DialogTitle>
        <DialogDescription>
          {t('admin.passwords.enterNewPassword')}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="grid gap-2">
          <Label htmlFor="newPassword">{t('admin.passwords.newPassword')}</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={toggleShowPassword}
            >
              {showPassword ? 
                <EyeOff className="h-4 w-4" /> : 
                <Eye className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">{t('admin.passwords.confirmPassword')}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={toggleShowPassword}
            >
              {showPassword ? 
                <EyeOff className="h-4 w-4" /> : 
                <Eye className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            className="bg-polygon-blue hover:bg-polygon-darkblue"
            disabled={isLoading}
          >
            {isLoading ? t('admin.passwords.resetting') : t('admin.passwords.resetPassword')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default PasswordChangeDialog;
