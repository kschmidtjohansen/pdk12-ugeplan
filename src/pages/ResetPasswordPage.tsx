
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // If already authenticated and not in reset flow, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !window.location.hash.includes('#access_token')) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('login.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(password);
      setIsSuccess(true);
      toast({
        title: t('common.success'),
        description: t('login.passwordReset.resetSuccess'),
      });
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('login.passwordReset.resetError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-polygon-lightgray p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg" 
            alt="Polygon Logo" 
            className="mx-auto mb-6 h-16"
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('login.passwordReset.setNewPassword')}</CardTitle>
            <CardDescription>
              {isSuccess 
                ? t('login.passwordReset.passwordUpdated')
                : t('login.passwordReset.enterNewPassword')}
            </CardDescription>
          </CardHeader>
          
          {!isSuccess ? (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('login.passwordReset.newPassword')}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">{t('login.confirmPassword')}</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-polygon-blue hover:bg-polygon-darkblue"
                  disabled={isLoading}
                >
                  {isLoading ? t('login.passwordReset.updating') : t('login.passwordReset.updatePassword')}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="pt-4 pb-6">
              <div className="text-center text-green-600 font-medium">
                {t('login.passwordReset.redirecting')}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
