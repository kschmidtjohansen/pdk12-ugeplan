
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSecurity } from '@/context/SecurityContext';
import { useTranslation } from '@/context/TranslationContext';
import { SecureInput } from '@/components/ui/secure-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateEmailFormat, validatePasswordStrength } from '@/utils/securityValidation';
import { logAuthAttempt, logInputValidationError } from '@/utils/securityLogger';

interface EnhancedSecureLoginFormProps {
  onSuccess?: () => void;
}

export const EnhancedSecureLoginForm: React.FC<EnhancedSecureLoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{ valid: boolean; score: number; errors: string[] } | null>(null);

  const { login } = useAuth();
  const { checkRateLimit, csrfToken, isSecureContext } = useSecurity();
  const { toast } = useToast();
  const { t } = useTranslation();

  const maxAttempts = 5;
  const isBlocked = attempts >= maxAttempts;

  // Real-time email validation
  useEffect(() => {
    if (email) {
      const isValid = validateEmailFormat(email);
      setEmailValid(isValid);
      if (!isValid && email.length > 5) {
        logInputValidationError('email', email, 'Invalid email format');
      }
    } else {
      setEmailValid(null);
    }
  }, [email]);

  // Real-time password validation
  useEffect(() => {
    if (password) {
      const strength = validatePasswordStrength(password);
      setPasswordStrength(strength);
      if (!strength.valid && password.length > 3) {
        logInputValidationError('password', '[REDACTED]', strength.errors.join(', '));
      }
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Enhanced rate limiting check
    if (!checkRateLimit('login', maxAttempts)) {
      const errorMsg = t('login.tooManyRequests');
      setError(errorMsg);
      logAuthAttempt(email, false, 'Rate limit exceeded');
      return;
    }

    if (isBlocked) {
      const errorMsg = 'Account temporarily locked due to too many failed attempts. Please try again later.';
      setError(errorMsg);
      logAuthAttempt(email, false, 'Account temporarily locked');
      return;
    }

    // Enhanced input validation
    if (!email || !password) {
      const errorMsg = 'Please fill in all required fields.';
      setError(errorMsg);
      logInputValidationError('form', email, 'Missing required fields');
      return;
    }

    if (!validateEmailFormat(email)) {
      const errorMsg = 'Please enter a valid email address.';
      setError(errorMsg);
      logInputValidationError('email', email, 'Invalid email format on submit');
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      const errorMsg = 'Password does not meet security requirements.';
      setError(errorMsg);
      logInputValidationError('password', '[REDACTED]', passwordValidation.errors.join(', '));
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.toLowerCase().trim(), password);
      
      if (result.error) {
        setAttempts(prev => prev + 1);
        setError(t('login.invalidCredentials'));
        logAuthAttempt(email, false, result.error);
        
        // Show different messages based on attempt count
        if (attempts >= 3) {
          toast({
            title: "Security Warning",
            description: `${maxAttempts - attempts - 1} attempts remaining before temporary lockout.`,
            variant: "destructive",
          });
        }
      } else {
        // Reset attempts on successful login
        setAttempts(0);
        logAuthAttempt(email, true);
        toast({
          title: t('login.success'),
          description: "Velkommen tilbage!",
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Login error:', error);
      setAttempts(prev => prev + 1);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      logAuthAttempt(email, false, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('login.description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isSecureContext && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Warning: Not using secure connection (HTTPS). Your data may be at risk.
            </AlertDescription>
          </Alert>
        )}

        {isBlocked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Account temporarily locked due to too many failed login attempts. 
              Please wait 15 minutes before trying again.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="csrf_token" value={csrfToken} />
          
          <div className="space-y-2">
            <SecureInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
              validateEmail={true}
              disabled={isLoading || isBlocked}
              autoComplete="email"
            />
            {emailValid === false && email.length > 5 && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Please enter a valid email address
              </div>
            )}
            {emailValid === true && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Valid email format
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <SecureInput
              id="password"
              label={t('common.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              required
              disabled={isLoading || isBlocked}
              autoComplete="current-password"
            />
            {passwordStrength && password.length > 3 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 4 ? 'bg-green-500' :
                        passwordStrength.score >= 3 ? 'bg-yellow-500' :
                        passwordStrength.score >= 2 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {passwordStrength.score}/5
                  </span>
                </div>
                {passwordStrength.errors.length > 0 && (
                  <div className="text-xs text-red-600">
                    {passwordStrength.errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {attempts > 0 && !isBlocked && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {attempts} failed attempt{attempts > 1 ? 's' : ''}. 
                {maxAttempts - attempts} attempt{maxAttempts - attempts > 1 ? 's' : ''} remaining.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || isBlocked || !emailValid || !passwordStrength?.valid}
          >
            {isLoading ? t('login.buttonLoading') : t('login.button')}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>Beskyttet af avancerede beskyttelsesmetoder</p>
          <p className="text-xs mt-1">Enhanced security validation active</p>
        </div>
      </CardContent>
    </Card>
  );
};
