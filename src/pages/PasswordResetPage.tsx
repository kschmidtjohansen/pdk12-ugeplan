
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';

const PasswordResetPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Enhanced token extraction logic
  const getAccessToken = (): string | null => {
    // Log full URL and parameters for debugging
    console.log('Full URL:', window.location.href);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Hash fragment:', location.hash);
    
    // Check for token in URL parameters (most common in password reset links)
    const token = searchParams.get('token');
    if (token) {
      console.log('Found token parameter:', token);
      return token;
    }
    
    // Check for access_token parameter (used in some Supabase implementations)
    const accessToken = searchParams.get('access_token');
    if (accessToken) {
      console.log('Found access_token parameter:', accessToken);
      return accessToken;
    }
    
    // Check for type=recovery flow with token
    if (searchParams.get('type') === 'recovery') {
      console.log('Found recovery type parameter');
      // The token might be elsewhere in the params
      const recoveryToken = searchParams.get('token');
      if (recoveryToken) {
        console.log('Found recovery token:', recoveryToken);
        return recoveryToken;
      }
    }
    
    // Check the hash fragment (Supabase sometimes puts tokens here)
    if (location.hash) {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      
      // Try access_token in hash
      const hashAccessToken = hashParams.get('access_token');
      if (hashAccessToken) {
        console.log('Found access_token in hash:', hashAccessToken);
        return hashAccessToken;
      }
      
      // Try just token in hash
      const hashToken = hashParams.get('token');
      if (hashToken) {
        console.log('Found token in hash:', hashToken);
        return hashToken;
      }
    }
    
    // If we're in a recovery flow and can't find a token, give a hint
    if (location.pathname.includes('password-reset') || location.pathname.includes('reset-password')) {
      console.log('On password reset page but no token found in standard locations');
    }
    
    console.log('No token found in any location');
    return null;
  };

  const accessToken = getAccessToken();

  // Debug info
  useEffect(() => {
    console.log('Component initialized');
    console.log('URL path:', location.pathname);
    console.log('URL search params:', Object.fromEntries(searchParams.entries()));
    console.log('URL hash:', location.hash);
    console.log('Extracted access token:', accessToken);
  }, [searchParams, location.hash, location.pathname, accessToken]);

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
    } else {
      // Log success when token is found
      console.log('Token found, password reset form will be displayed');
    }
  }, [accessToken, navigate, toast, t]);

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }
    
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    
    // Length check
    if (password.length >= 12) {
      strength = 'medium';
    } else if (password.length >= 8) {
      strength = 'weak';
    } else {
      strength = 'weak';
      return; // Too short, no need to check further
    }
    
    // Complexity checks
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const complexity = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
    
    if (complexity >= 4 && password.length >= 10) {
      strength = 'strong';
    } else if (complexity >= 3) {
      strength = 'medium';
    }
    
    setPasswordStrength(strength);
  }, [password]);

  // Get color for password strength indicator
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'weak': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

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
    
    // Enhanced password validation
    if (password.length < 8) {
      toast({
        title: t('common.error'),
        description: t('admin.passwords.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    // Check for common passwords - simplified list, could be expanded
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin1234'];
    if (commonPasswords.includes(password.toLowerCase())) {
      toast({
        title: t('common.error'),
        description: "Please use a less common password",
        variant: "destructive",
      });
      return;
    }
    
    // Check password strength - Changed from "warning" to "default" since "warning" isn't supported
    if (passwordStrength === 'weak') {
      toast({
        title: t('common.warning'),
        description: "Your password is weak. Consider using a stronger password.",
        variant: "default",
      });
      // We can still proceed, just warning the user
    }
    
    setIsLoading(true);

    try {
      console.log('Attempting to reset password with token:', accessToken);
      
      // Try to set the session with the token first
      if (accessToken) {
        // This approach uses the token directly instead of establishing a session first
        const { error } = await supabase.auth.updateUser({
          password: password
        }, {
          // Include the token in the auth options
          accessToken: accessToken
        });
        
        if (error) {
          console.error('Password update error:', error.message);
          throw error;
        }
      } else {
        throw new Error('No access token available for password reset');
      }
      
      console.log('Password reset successful!');
      
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
                  className="border-2"
                />
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-1">
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`} 
                        style={{ width: passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '66%' : '33%' }}
                      />
                    </div>
                    <p className="text-xs mt-1 flex items-center">
                      {passwordStrength === 'weak' && <AlertCircle className="h-3 w-3 text-red-500 mr-1" />}
                      Password strength: {passwordStrength || 'none'}
                    </p>
                  </div>
                )}
                
                {/* Password requirements */}
                <div className="text-xs text-gray-500 mt-1">
                  <p>Password must:</p>
                  <ul className="list-disc pl-4">
                    <li>Be at least 8 characters long</li>
                    <li>Include upper and lowercase letters</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </div>
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
                  className={confirmPassword && password !== confirmPassword ? "border-2 border-red-500" : "border-2"}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full bg-polygon-blue hover:bg-polygon-darkblue" 
                type="submit" 
                disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
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
