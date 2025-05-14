
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const PasswordResetPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get token from various possible sources
  const getAccessToken = (): string | null => {
    // Try from direct access_token parameter
    const accessToken = searchParams.get('access_token');
    if (accessToken) return accessToken;
    
    // Try from hash fragment (Supabase sometimes adds it to the URL hash)
    const hash = location.hash;
    if (hash && hash.includes('access_token=')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      return hashParams.get('access_token');
    }

    // Try from type=recovery in case Supabase changed the parameter format
    if (searchParams.get('type') === 'recovery') {
      // The token might be in the hash
      if (location.hash) {
        const hashParams = new URLSearchParams(location.hash.substring(1));
        return hashParams.get('access_token');
      }
    }
    
    return null;
  };

  const accessToken = getAccessToken();

  // Debug info
  useEffect(() => {
    console.log('URL search params:', Object.fromEntries(searchParams.entries()));
    console.log('URL hash:', location.hash);
    console.log('Extracted access token:', accessToken);
  }, [searchParams, location.hash, accessToken]);

  // If no token is present, redirect to login
  useEffect(() => {
    if (!accessToken) {
      console.log('No access token found, redirecting to login');
      toast({
        title: t('common.error'),
        description: t('login.passwordReset.resetError'),
        variant: "destructive",
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [accessToken, navigate, toast, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password and confirm password
    if (password !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('admin.passwords.passwordsMustMatch'),
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: t('common.error'),
        description: t('admin.passwords.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // First make sure we have a session with the access token
      if (accessToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        });
      }

      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password 
      });
      
      if (error) throw error;
      
      toast({
        title: t('common.success'),
        description: t('login.passwordReset.passwordUpdated'),
      });
      
      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: t('common.error'),
        description: t('login.passwordReset.resetError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If no token, redirect to login (render loading while redirecting)
  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-polygon-lightgray p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{t('common.loading')}</h2>
          <p>{t('login.passwordReset.resetError')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-polygon-lightgray p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg" 
            alt="Polygon Logo" 
            className="mx-auto mb-6 h-16"
          />
          <h1 className="text-2xl font-bold text-gray-800">{t('login.passwordReset.title')}</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('login.passwordReset.title')}</CardTitle>
            <CardDescription>
              {t('login.passwordReset.enterNewPassword')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('admin.passwords.newPassword')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('admin.passwords.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full bg-polygon-blue hover:bg-polygon-darkblue" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? t('common.loading') : t('login.passwordReset.resetButton')}
              </Button>
              <Button 
                variant="outline"
                className="w-full" 
                type="button"
                onClick={() => navigate('/login')}
              >
                {t('login.passwordReset.backToLogin')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PasswordResetPage;
