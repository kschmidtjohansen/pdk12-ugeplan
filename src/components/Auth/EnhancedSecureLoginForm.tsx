
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

export const EnhancedSecureLoginForm: React.FC<EnhancedSecureLoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loginTimeout, setLoginTimeout] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const maxAttempts = 5;
  const isBlocked = attempts >= maxAttempts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isBlocked) {
      setError('Account temporarily locked due to too many failed attempts. Please try again later.');
      return;
    }

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    console.log('[LoginForm] Attempting login for:', email);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.error) {
        console.log('[LoginForm] Login failed:', result.error);
        setAttempts(prev => prev + 1);
        setError(result.error);
        
        if (attempts >= 3) {
          toast({
            title: "Security Warning",
            description: `${maxAttempts - attempts - 1} attempts remaining before temporary lockout.`,
            variant: "destructive",
          });
        }
      } else {
        console.log('[LoginForm] Login successful');
        setAttempts(0);
        setError('');
        
        toast({
          title: t('login.success'),
          description: "Login successful!",
        });
        
        onSuccess?.();
      }
    } catch (error) {
      console.error('[LoginForm] Login error:', error);
      setAttempts(prev => prev + 1);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
        {isBlocked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Account temporarily locked due to too many failed login attempts. 
              Please wait 15 minutes before trying again.
            </AlertDescription>
          </Alert>
        )}

        {loginTimeout && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Login is taking longer than expected. This might be a connectivity issue.
              <button 
                onClick={() => window.location.reload()} 
                className="ml-2 underline hover:no-underline"
              >
                Refresh page
              </button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
              disabled={isLoading || isBlocked}
              autoComplete="email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                required
                disabled={isLoading || isBlocked}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading || isBlocked}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
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
            disabled={isLoading || isBlocked || loginTimeout}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                {t('login.buttonLoading')}
              </div>
            ) : (
              t('login.button')
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>Secure login system</p>
        </div>
      </CardContent>
    </Card>
  );
};
