
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSecurity } from '@/context/SecurityContext';
import { useTranslation } from '@/context/TranslationContext';
import { SecureInput } from '@/components/ui/secure-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SecureLoginFormProps {
  onSuccess?: () => void;
}

export const SecureLoginForm: React.FC<SecureLoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const { login } = useAuth();
  const { checkRateLimit, csrfToken, isSecureContext } = useSecurity();
  const { toast } = useToast();
  const { t } = useTranslation();

  const maxAttempts = 5;
  const isBlocked = attempts >= maxAttempts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Rate limiting check
    if (!checkRateLimit('login', maxAttempts)) {
      setError(t('login.tooManyRequests'));
      return;
    }

    if (isBlocked) {
      setError('Account temporarily locked due to too many failed attempts. Please try again later.');
      return;
    }

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.error) {
        setAttempts(prev => prev + 1);
        setError(t('login.invalidCredentials'));
        
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
        toast({
          title: t('login.success'),
          description: "Velkommen tilbage!",
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Login error:', error);
      setAttempts(prev => prev + 1);
      setError('An unexpected error occurred. Please try again.');
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
            disabled={isLoading || isBlocked}
          >
            {isLoading ? t('login.buttonLoading') : t('login.button')}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>Beskyttet af avancerede beskyttelsesmetoder</p>
        </div>
      </CardContent>
    </Card>
  );
};
