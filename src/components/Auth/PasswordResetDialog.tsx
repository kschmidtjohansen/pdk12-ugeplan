
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { requestPasswordReset } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
      toast({
        title: t('login.passwordReset.emailSentTitle'),
        description: t('login.passwordReset.emailSentDescription'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('login.passwordReset.emailError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('login.passwordReset.title')}</DialogTitle>
          <DialogDescription>
            {isSubmitted 
              ? t('login.passwordReset.successMessage') 
              : t('login.passwordReset.description')}
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading 
                  ? t('login.passwordReset.buttonLoading') 
                  : t('login.passwordReset.button')
                }
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 pt-4">
            <p className="text-center text-muted-foreground">
              {t('login.passwordReset.checkEmail')}
            </p>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleClose}
              type="button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('login.passwordReset.backToLogin')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetDialog;
