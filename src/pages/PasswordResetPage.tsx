
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
  const [tokenDebug, setTokenDebug] = useState<string>('');
  
  // Enhanced token extraction with multiple fallbacks and debug info
  useEffect(() => {
    const extractToken = async () => {
      try {
        console.log("Starting enhanced token extraction on path:", location.pathname);
        console.log("URL hash:", location.hash);
        console.log("URL search params:", location.search);
        
        // Token sources in order of priority:
        
        // 1. Check hash parameters (Supabase's recovery flow format)
        let foundToken = null;
        const hashParams = location.hash ? new URLSearchParams(location.hash.substring(1)) : null;
        
        if (hashParams) {
          console.log("Hash parameters found, keys:", Array.from(hashParams.keys()));
          const accessToken = hashParams.get('access_token');
          const type = hashParams.get('type');
          
          if (accessToken && type === 'recovery') {
            console.log("Found recovery access token in hash");
            foundToken = accessToken;
            setTokenDebug('From hash fragment with type=recovery');
            
            // Set the access token in Supabase session
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            });
          }
        }

        // 2. Check query parameters (older format or manual redirect)
        if (!foundToken) {
          const queryParams = new URLSearchParams(location.search);
          const queryToken = queryParams.get('token') || queryParams.get('access_token');
          
          if (queryToken) {
            console.log("Found token in query params");
            foundToken = queryToken;
            setTokenDebug('From URL query parameters');
            
            // Try to set session if we have a token
            if (queryParams.get('refresh_token')) {
              try {
                await supabase.auth.setSession({
                  access_token: queryToken,
                  refresh_token: queryParams.get('refresh_token') || '',
                });
              } catch (err) {
                console.error("Failed to set session from query params:", err);
              }
            }
          }
        }
        
        // 3. Check existing session as last resort
        if (!foundToken) {
          console.log("Checking for existing session");
          const { data } = await supabase.auth.getSession();
          
          if (data.session?.access_token) {
            console.log("Found token in existing session");
            foundToken = data.session.access_token;
            setTokenDebug('From existing Supabase session');
          } else {
            console.log("No session found", data);
          }
        }
        
        // Set the token state
        if (foundToken) {
          console.log("Token found and set, length:", foundToken.length);
          setToken(foundToken);
        } else {
          console.log("No token found in URL or session");
          setTokenError(t('login.invalidOrExpiredToken'));
          setTokenDebug('No token found in URL or session');
        }
      } catch (error) {
        console.error("Error in token extraction:", error);
        setTokenError(t('login.invalidOrExpiredToken'));
        setTokenDebug(`Error in extraction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
      console.log("Attempting to update password with token present:", !!token);
      
      const { error, data } = await supabase.auth.updateUser({
        password: password
      });
      
      console.log("Update password response:", { error, data: data ? "data exists" : "no data" });

      if (error) {
        console.error("Error updating password:", error);
        throw error;
      }
      
      // Check if we have a valid session after password update
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Session after update:", { 
        sessionExists: !!sessionData.session, 
        error: sessionError ? "error exists" : "no error" 
      });
      
      if (sessionError) {
        console.error("Error getting session after update:", sessionError);
      }
      
      toast({
        title: t('login.passwordUpdated'),
        description: sessionData?.session ? t('login.passwordReset.successMessage') : t('login.passwordReset.checkEmail'),
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

  // If we couldn't find a token, show an error with debug info
  if (tokenError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('login.resetYourPassword')}</CardTitle>
            <CardDescription className="text-red-500">{tokenError}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('login.passwordReset.resetError')}
            </p>
            {import.meta.env.DEV && (
              <div className="bg-gray-100 p-3 rounded text-xs mt-3 font-mono">
                <p className="font-bold">Debug Information:</p>
                <p>{tokenDebug}</p>
                <p>Path: {location.pathname}</p>
                <p>Search: {location.search}</p>
                <p>Hash: {location.hash}</p>
              </div>
            )}
          </CardContent>
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
