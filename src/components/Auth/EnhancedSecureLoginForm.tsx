import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
      setError('Account temporarily locked due to too many failed attempts. Please try again later.');
      return;
    }
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    console.log('[LoginForm] FIXED - Attempting login for:', email);
    setIsLoading(true);

    // FIXED: Add login timeout protection (15 seconds)
    const loginTimeoutId = setTimeout(() => {
      setLoginTimeout(true);
      setIsLoading(false);
      setError('Login is taking longer than expected. Please try again.');
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
            title: "Security Warning",
            description: `${maxAttempts - attempts - 1} attempts remaining before temporary lockout.`,
            variant: "destructive"
          });
        }
      } else {
        console.log('[LoginForm] FIXED - Login successful, waiting for auth state change');
        setAttempts(0);
        setError('');

        // FIXED: Show success message only once
        toast({
          title: t('login.success'),
          description: "Welcome back!"
        });

        // Call success callback immediately
        onSuccess?.();
      }
    } catch (error) {
      clearTimeout(loginTimeoutId);
      console.error('[LoginForm] FIXED - Login error:', error);
      setAttempts(prev => prev + 1);
      setError('An unexpected error occurred. Please try again.');
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
              Account temporarily locked due to too many failed login attempts. 
              Please wait 15 minutes before trying again.
            </AlertDescription>
          </Alert>}

        {loginTimeout && <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Login is taking longer than expected. This might be a connectivity issue.
              <button onClick={() => window.location.reload()} className="ml-2 underline hover:no-underline">
                Refresh page
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