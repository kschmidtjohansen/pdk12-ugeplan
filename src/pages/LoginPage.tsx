
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PasswordResetDialog from '@/components/Auth/PasswordResetDialog';
import { useToast } from '@/hooks/use-toast';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user || isAuthenticated) {
      navigate('/dashboard');
    }
  }, [user, isAuthenticated, navigate]);

  // Add a safety timeout to prevent "logging in" state getting stuck forever
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      timeoutId = setTimeout(() => {
        console.log('Login timeout reached, resetting loading state');
        setIsLoading(false);
      }, 10000); // 10 seconds timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting login for:', email);
      const { error } = await login(email, password);
      
      if (error) {
        console.error('Login error:', error);
        
        let errorMessage = t('login.failed');
        
        // More specific error messages based on the error code
        if (error.includes('Invalid login credentials')) {
          errorMessage = t('login.invalidCredentials');
        } else if (error.includes('rate limit')) {
          errorMessage = t('login.tooManyRequests');
        }
        
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        // Success is handled by the useEffect above through the auth state change
        toast({
          title: t('common.success'),
          description: t('login.success'),
        });
        // No need to navigate here, the useEffect will handle it
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: t('common.error'),
        description: t('login.failed'),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setResetDialogOpen(true);
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
            <CardFooter>
              <Button 
                className="w-full bg-polygon-blue hover:bg-polygon-darkblue" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? t('login.buttonLoading') : t('login.button')}
              </Button>
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
