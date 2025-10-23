import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
interface EnhancedSecureLoginFormProps {
  onSuccess?: () => void;
}
export const EnhancedSecureLoginForm: React.FC<EnhancedSecureLoginFormProps> = ({
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loginTimeout, setLoginTimeout] = useState(false);
  const {
    login
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    t
  } = useTranslation();
  const maxAttempts = 5;
  const isBlocked = attempts >= maxAttempts;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginTimeout(false);
    if (isBlocked) {
      setError(t('login.lockedMessage'));
      return;
    }
    if (!email || !password) {
      setError(t('login.requiredFields'));
      return;
    }
    console.log('[LoginForm] FIXED - Attempting login for:', email);
    setIsLoading(true);

    // FIXED: Add login timeout protection (15 seconds)
    const loginTimeoutId = setTimeout(() => {
      setLoginTimeout(true);
      setIsLoading(false);
      setError(t('login.timeout'));
      console.warn('[LoginForm] FIXED - Login timeout reached');
    }, 15000);
    try {
      const result = await login(email, password);

      // Clear timeout if login completes
      clearTimeout(loginTimeoutId);
      if (result.error) {
        console.log('[LoginForm] FIXED - Login failed:', result.error);
        setAttempts(prev => prev + 1);
        setError(t('login.invalidCredentials'));
        if (attempts >= 3) {
          toast({
            title: t('auth.tooManyAttempts'),
            description: `${maxAttempts - attempts - 1} ${t('login.tooManyAttempts')}`,
            variant: "destructive"
          });
        }
      } else {
        console.log('[LoginForm] FIXED - Login successful, waiting for auth state change');
        setAttempts(0);
        setError('');

        // Call success callback - toast will be shown by AuthContext
        onSuccess?.();
        
        // Add fallback auto-refresh to ensure user lands on dashboard
        setTimeout(() => {
          console.log('[LoginForm] Auto-refresh fallback triggered');
          if (window.location.pathname !== '/dashboard') {
            window.location.replace('/dashboard');
          } else {
            // Already on dashboard, force refresh to load data
            window.location.reload();
          }
        }, 800);
      }
    } catch (error) {
      clearTimeout(loginTimeoutId);
      console.error('[LoginForm] FIXED - Login error:', error);
      setAttempts(prev => prev + 1);
      setError(t('login.unexpectedError'));
    } finally {
      if (!loginTimeout) {
        setIsLoading(false);
      }
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        
        <CardDescription>
          {t('login.description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isBlocked && <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('login.tooManyAttemptsLock')}
            </AlertDescription>
          </Alert>}

        {loginTimeout && <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('login.timeoutMessage')}
              <button onClick={() => window.location.reload()} className="ml-2 underline hover:no-underline">
                {t('login.refreshPage')}
              </button>
            </AlertDescription>
          </Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} required disabled={isLoading || isBlocked} autoComplete="email" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')} required disabled={isLoading || isBlocked} autoComplete="current-password" />
              <Button type="button" variant="ghost" size="sm" onClick={togglePasswordVisibility} className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" disabled={isLoading || isBlocked} tabIndex={-1}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>}

          {attempts > 0 && !isBlocked && <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {attempts} failed attempt{attempts > 1 ? 's' : ''}. 
                {maxAttempts - attempts} attempt{maxAttempts - attempts > 1 ? 's' : ''} remaining.
              </AlertDescription>
            </Alert>}

          <Button type="submit" className="w-full" disabled={isLoading || isBlocked || loginTimeout}>
            {isLoading ? <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                {t('login.buttonLoading')}
              </div> : t('login.button')}
          </Button>
        </form>

        
      </CardContent>
    </Card>;
};