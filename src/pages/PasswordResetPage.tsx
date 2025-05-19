
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../components/ui/use-toast';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';

const PasswordResetPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  // Extract the token from the URL or query parameters
  useEffect(() => {
    const extractToken = () => {
      console.log("Starting token extraction...");
      
      // Check if we have a hash fragment in the URL (from redirect)
      if (location.hash) {
        console.log("Found hash fragment in URL:", location.hash);
        try {
          // Parse the hash fragment (remove leading #)
          const hashParams = new URLSearchParams(location.hash.substring(1));
          
          // Check for 'access_token' or 'token' parameter
          const accessToken = hashParams.get('access_token') || hashParams.get('token');
          if (accessToken) {
            console.log("Found token in hash fragment");
            setToken(accessToken);
            return;
          }
        } catch (error) {
          console.error("Error parsing hash fragment:", error);
        }
      }

      // Check if we have query parameters
      try {
        const queryParams = new URLSearchParams(location.search);
        const queryToken = queryParams.get('token');
        if (queryToken) {
          console.log("Found token in query params");
          setToken(queryToken);
          return;
        }
      } catch (error) {
        console.error("Error parsing query parameters:", error);
      }
      
      // If we reach this point, we couldn't find a token
      console.log("No token found in URL");
      setTokenError(t('login.invalidOrExpiredToken'));
    };

    extractToken();
  }, [location, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== confirmPassword) {
      toast({
        title: t('login.passwordsDontMatch'),
        variant: 'destructive',
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: t('login.passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Attempting to update password with token");
      
      if (!token) {
        throw new Error("No token available");
      }
      
      // Update the password using the token
      const { error, data } = await supabase.auth.updateUser({
        password: password
      });
      
      console.log("Update password response:", { error, data });

      if (error) {
        console.error("Error updating password:", error);
        throw error;
      }
      
      // Check if we have a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Session after update:", { sessionData, sessionError });
      
      if (sessionError) {
        console.error("Error getting session after update:", sessionError);
      }
      
      toast({
        title: t('login.passwordUpdated'),
        description: sessionData?.session ? 'You are now logged in.' : 'You can now log in with your new password.',
      });

      // Redirect to dashboard if session exists, otherwise to login
      if (sessionData?.session) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: t('login.passwordError'),
        description: error instanceof Error ? error.message : t('login.unexpectedError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // If we couldn't find a token, show an error
  if (tokenError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('login.resetYourPassword')}</CardTitle>
            <CardDescription className="text-red-500">{tokenError}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/login')}>
              {t('login.backToLogin')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('login.resetYourPassword')}</CardTitle>
          <CardDescription>{t('login.resetPasswordDescriptionPage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.newPassword')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('login.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                t('login.updatePassword')
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="link" className="w-full" onClick={() => navigate('/login')} disabled={loading}>
            {t('login.backToLogin')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PasswordResetPage;
