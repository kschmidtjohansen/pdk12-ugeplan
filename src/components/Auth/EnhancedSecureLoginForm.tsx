import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { isValidEmail } from '@/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { authLog, secureError } from '@/utils/secureLogger';
import { SecureInput } from '@/components/ui/secure-input';

interface EnhancedSecureLoginFormProps {
  onSuccess?: (user: any) => void;
  onForgotPassword?: () => void;
  initialEmail?: string;
  maxAttempts?: number;
  lockoutDuration?: number;
}

const EnhancedSecureLoginForm: React.FC<EnhancedSecureLoginFormProps> = ({
  onSuccess,
  onForgotPassword,
  initialEmail = '',
  maxAttempts = 5,
  lockoutDuration = 15 * 60 * 1000
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);

  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts') || '0';
    const storedLockoutEnd = localStorage.getItem('lockoutEnd');

    setAttemptCount(parseInt(storedAttempts, 10));
    if (storedLockoutEnd) {
      setLockoutEnd(parseInt(storedLockoutEnd, 10));
    }
  }, []);

  const isLockedOut = lockoutEnd !== null && lockoutEnd > Date.now();

  const recordFailedAttempt = () => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);
    localStorage.setItem('loginAttempts', newAttemptCount.toString());

    if (newAttemptCount >= maxAttempts) {
      const lockoutEndTime = Date.now() + lockoutDuration;
      setLockoutEnd(lockoutEndTime);
      localStorage.setItem('lockoutEnd', lockoutEndTime.toString());
    }
  };

  const clearFailedAttempts = () => {
    setAttemptCount(0);
    setLockoutEnd(null);
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lockoutEnd');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error(t('auth.fillAllFields'));
      }

      if (!isValidEmail(email)) {
        throw new Error(t('auth.invalidEmail'));
      }

      // Check rate limiting
      if (isLockedOut) {
        const remainingTime = Math.ceil((lockoutEnd! - Date.now()) / 1000 / 60);
        throw new Error(t('auth.accountLocked', { minutes: remainingTime }));
      }

      // Use secure logging instead of console.log
      authLog('login_attempt', {
        email: email,
        hasPassword: password.length > 0,
        timestamp: new Date().toISOString()
      });

      // Attempt login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        // Log failed attempt securely
        authLog('login_failed', {
          email: email,
          errorType: error.message,
          attemptNumber: attemptCount + 1
        });

        // Handle different types of authentication errors
        let errorMessage = '';
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = t('auth.invalidCredentials');
            break;
          case 'Email not confirmed':
            errorMessage = t('auth.emailNotConfirmed');
            break;
          case 'Too many requests':
            errorMessage = t('auth.tooManyRequests');
            break;
          default:
            errorMessage = t('auth.loginError');
        }

        // Record failed attempt
        recordFailedAttempt();
        throw new Error(errorMessage);
      }

      if (!data.user) {
        authLog('login_failed_no_user', { email });
        throw new Error(t('auth.loginError'));
      }

      // Successful login - log securely
      authLog('login_success', {
        email: email,
        userId: data.user.id,
        timestamp: new Date().toISOString()
      });

      // Reset failed attempts on successful login
      clearFailedAttempts();

      // Call success callback
      onSuccess?.(data.user);

    } catch (err: any) {
      secureError('Login error', err, { email });
      setError(err.message || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t('auth.login')}</CardTitle>
        <CardDescription>{t('auth.enterCredentials')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <SecureInput
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            disabled={isLoading}
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? t('common.loading') : t('auth.signIn')}
        </Button>
      </CardContent>
      <div className="px-4 pb-4 text-sm">
        <Link to="/forgot-password" className="text-blue-500 hover:underline">
          {t('auth.forgotPassword')}
        </Link>
        <p className="mt-2">
          {t('auth.noAccount')}
          <Link to="/register" className="text-blue-500 hover:underline ml-1">
            {t('auth.createAccount')}
          </Link>
        </p>
      </div>
    </Card>
  );
};

export default EnhancedSecureLoginForm;
