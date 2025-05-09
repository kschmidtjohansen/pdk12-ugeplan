
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PasswordResetDialog from '@/components/Auth/PasswordResetDialog';
import { supabase } from '@/integrations/supabase/client';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in and redirect if they are
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: t('common.success'),
        description: t('login.success'),
      });
      navigate('/dashboard');
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: t('common.error'),
        description: t('login.failed'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setResetDialogOpen(true);
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    
    // Auto submit after a short delay to let the user see the form being filled
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 500);
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
          <h1 className="text-2xl font-bold text-gray-800">{t('login.welcomeMessage')}</h1>
          <p className="text-gray-600">{t('login.internalSystem')}</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('login.title')}</CardTitle>
            <CardDescription>
              {t('login.description')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">{t('common.password')}</Label>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm" 
                    onClick={handleForgotPassword}
                    type="button"
                  >
                    {t('login.passwordReset.forgotPassword')}
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button 
                className="w-full bg-polygon-blue hover:bg-polygon-darkblue" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? t('login.buttonLoading') : t('login.button')}
              </Button>
              
              <div className="w-full text-center">
                <p className="text-sm text-gray-500 mb-2">{t('login.testCredentials')}</p>
                <div className="flex flex-col md:flex-row justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('kasper.johansen@polygongroup.com')}
                    type="button"
                  >
                    Administrator Login
                  </Button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      <PasswordResetDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
      />
    </div>
  );
};

export default LoginPage;
