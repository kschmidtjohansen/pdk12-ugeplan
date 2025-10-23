
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { KeyRound } from 'lucide-react';

const PasswordResetPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingToken, setProcessingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [recoveryMode, setRecoveryMode] = useState<'token' | 'email' | null>(null);
  const [email, setEmail] = useState('');
  
  // Enhanced token extraction with multiple fallbacks, debugging, and validation
  useEffect(() => {
    const processPasswordReset = async () => {
      try {
        setProcessingToken(true);
        console.log("Starting password reset processing on path:", location.pathname);
        
        // Collect debug information
        const debugData: Record<string, any> = {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
          origin: window.location.origin,
          timestamp: new Date().toISOString(),
        };
        
        // Check if we have recovery token in different formats
        let recoveryToken = null;
        let recoveryType = '';
        let recoveryEmail = '';
        
        // Try to extract token from hash (standard Supabase format)
        if (location.hash && location.hash.includes('access_token')) {
          const hashParams = new URLSearchParams(location.hash.substring(1));
          const token = hashParams.get('access_token');
          const type = hashParams.get('type');
          
          if (token && type === 'recovery') {
            console.log("✓ Found recovery token in hash params");
            recoveryToken = token;
            recoveryType = 'hash';
            
            // Try to set session immediately
            try {
              await supabase.auth.setSession({
                access_token: token,
                refresh_token: hashParams.get('refresh_token') || '',
              });
              console.log("✓ Set session from hash params");
              debugData.sessionSet = 'from_hash';
            } catch (err) {
              console.error("✗ Failed to set session from hash:", err);
              debugData.hashSessionError = err instanceof Error ? err.message : String(err);
            }
          } else {
            console.log("✗ Hash params found but not recovery token:", { token, type });
            debugData.hashParamsFound = { hasToken: !!token, type };
          }
        }
        
        // Try to extract token from query params (alternative format)
        if (!recoveryToken && location.search) {
          const searchParams = new URLSearchParams(location.search);
          const token = searchParams.get('token') || searchParams.get('access_token');
          
          if (token) {
            console.log("✓ Found token in query params");
            recoveryToken = token;
            recoveryType = 'query';
            
            // Try to set session if refresh token also exists
            const refreshToken = searchParams.get('refresh_token');
            if (refreshToken) {
              try {
                await supabase.auth.setSession({
                  access_token: token,
                  refresh_token: refreshToken,
                });
                console.log("✓ Set session from query params");
                debugData.sessionSet = 'from_query';
              } catch (err) {
                console.error("✗ Failed to set session from query:", err);
                debugData.querySessionError = err instanceof Error ? err.message : String(err);
              }
            }
          } else {
            console.log("✗ No token found in query params");
            debugData.queryParams = Object.fromEntries(searchParams.entries());
          }
        }
        
        // Check the URL for a code parameter (used in pkce flow)
        const extractCodeFromUrl = () => {
          const searchParams = new URLSearchParams(location.search);
          return searchParams.get('code');
        };
        
        const code = extractCodeFromUrl();
        if (code) {
          console.log("✓ Found code in URL, might be PKCE flow");
          debugData.codeFound = true;
          // The SDK should handle PKCE exchange automatically
        } else {
          debugData.codeFound = false;
        }
        
        // Check if we already have a valid session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          console.log("✓ Found existing valid session");
          recoveryToken = 'session_exists';
          recoveryType = 'session';
          debugData.existingSession = {
            userId: sessionData.session.user?.id,
            expires: sessionData.session.expires_at,
          };
        } else {
          console.log("✗ No existing session found");
          debugData.existingSession = false;
        }
        
        // Check if we can get the email from the URL (for email-based recovery)
        if (location.search) {
          const searchParams = new URLSearchParams(location.search);
          const urlEmail = searchParams.get('email');
          if (urlEmail) {
            console.log("✓ Found email in URL:", urlEmail);
            recoveryEmail = urlEmail;
            debugData.emailInUrl = urlEmail;
          }
        }
        
        // Update state with debug info
        setDebugInfo(debugData);
        
        // Determine recovery mode
        if (recoveryToken) {
          console.log("Using token-based recovery flow");
          setRecoveryMode('token');
        } else if (recoveryEmail) {
          console.log("Using email-based recovery flow");
          setRecoveryMode('email');
          setEmail(recoveryEmail);
        } else {
          console.log("No recovery mechanism found, showing email-based recovery form");
          setRecoveryMode('email');
          setTokenError(t('login.invalidOrExpiredToken'));
        }
        
        setProcessingToken(false);
      } catch (error) {
        console.error("Error during password reset initialization:", error);
        setTokenError(t('login.invalidOrExpiredToken'));
        setDebugInfo(prev => ({ 
          ...prev, 
          processingError: error instanceof Error ? error.message : String(error)
        }));
        setProcessingToken(false);
        setRecoveryMode('email');
      }
    };

    processPasswordReset();
  }, [location, t]);

  // Handle token-based password reset
  const handleTokenBasedReset = async (e: React.FormEvent) => {
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
      console.log("Attempting to update password with token flow");
      
      const { error, data } = await supabase.auth.updateUser({
        password: password
      });
      
      console.log("Update password response:", { 
        success: !error, 
        hasData: !!data,
        error: error ? error.message : null
      });

      if (error) {
        throw error;
      }
      
      // Check if we have a valid session after password update
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session after update:", sessionError);
      }
      
      toast({
        title: t('login.passwordUpdated'),
        description: t('login.passwordReset.successMessage'),
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

  // Handle email-based reset request
  const handleEmailBasedReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log("Requesting password reset for email:", email);
      
      // Use edge function for reliable email delivery
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: { email }
      });
      
      if (error) throw error;
      
      toast({
        title: t('login.passwordReset.emailSentTitle'),
        description: t('login.passwordReset.checkEmail'),
      });
      
      // Redirect to login page after sending email
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('login.passwordReset.emailError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (processingToken) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Modern Page Header */}
          <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {t('login.resetYourPassword')}
                </h1>
                <p className="text-sm text-gray-600">
                  {t('login.passwordReset.description')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-12">
              <Card className="border-0 shadow-none max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-center">{t('login.resetYourPassword')}</CardTitle>
                  <CardDescription className="text-center">{t('login.passwordReset.description')}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we couldn't find a token, show email-based recovery form
  if (recoveryMode === 'email') {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Modern Page Header */}
          <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {t('login.passwordReset.title')}
                </h1>
                <p className="text-sm text-gray-600">
                  {tokenError ? tokenError : t('login.passwordReset.description')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Email Reset Form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-12">
              <Card className="border-0 shadow-none max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-center">{t('login.passwordReset.title')}</CardTitle>
                  <CardDescription className="text-center">
                    {tokenError ? (
                      <span className="text-red-500">{tokenError}</span>
                    ) : (
                      t('login.passwordReset.description')
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEmailBasedReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('common.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('login.passwordReset.emailPlaceholder')}
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
                          {t('login.passwordReset.buttonLoading')}
                        </span>
                      ) : (
                        t('login.passwordReset.sendResetEmail')
                      )}
                    </Button>
                  </form>
                  
                  {import.meta.env.DEV && Object.keys(debugInfo).length > 0 && (
                    <div className="bg-gray-100 p-3 rounded text-xs mt-5 font-mono">
                      <p className="font-bold">Debug Information:</p>
                      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="w-full" onClick={() => navigate('/login')} disabled={loading}>
                    {t('login.backToLogin')}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show password reset form for token-based flow
  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Modern Page Header */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                {t('login.resetYourPassword')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('login.resetPasswordDescriptionPage')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Password Reset Form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-12">
            <Card className="border-0 shadow-none max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center">{t('login.resetYourPassword')}</CardTitle>
                <CardDescription className="text-center">{t('login.resetPasswordDescriptionPage')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTokenBasedReset} className="space-y-4">
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
                        {t('login.buttonLoading')}
                      </span>
                    ) : (
                      t('login.updatePassword')
                    )}
                  </Button>
                </form>
                
                {import.meta.env.DEV && Object.keys(debugInfo).length > 0 && (
                  <div className="bg-gray-100 p-3 rounded text-xs mt-5 font-mono">
                    <p className="font-bold">Debug Information:</p>
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="link" className="w-full" onClick={() => navigate('/login')}>
                  {t('login.backToLogin')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
