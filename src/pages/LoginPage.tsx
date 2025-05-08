
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PasswordResetDialog from '@/components/Auth/PasswordResetDialog';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

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
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t('login.testCredentials')}</p>
          <ul className="mt-2 space-y-1">
            <li>Admin: admin@polygongroup.com / password</li>
            <li>Skadeleder: skadeleder@polygongroup.com / password</li>
            <li>Service: service@polygongroup.com / password</li>
          </ul>
        </div>
      </div>

      <PasswordResetDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
      />
    </div>
  );
};

export default LoginPage;
