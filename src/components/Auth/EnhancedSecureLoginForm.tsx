import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Eye, EyeOff, CheckCircle2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedSecureLoginFormProps {
  onSuccess?: () => void;
}

const REMEMBER_KEY = 'auth_remember_me';

type ErrorKind = 'invalid' | 'network' | 'timeout' | 'locked' | 'required' | 'unknown';

const classifyError = (raw: unknown): ErrorKind => {
  const msg = (raw && typeof raw === 'object' && 'message' in raw)
    ? String((raw as { message: unknown }).message ?? '').toLowerCase()
    : String(raw ?? '').toLowerCase();

  if (!msg) return 'unknown';
  if (msg.includes('invalid') && (msg.includes('credential') || msg.includes('login'))) return 'invalid';
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) return 'invalid';
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('fetch')) return 'network';
  if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
  if (msg.includes('rate') || msg.includes('too many')) return 'locked';
  return 'unknown';
};

export const EnhancedSecureLoginForm: React.FC<EnhancedSecureLoginFormProps> = ({
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [errorText, setErrorText] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loginTimeout, setLoginTimeout] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = window.localStorage.getItem(REMEMBER_KEY);
    return v === null ? true : v === '1';
  });
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const emailRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const { login } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const isDanish = currentLanguage === 'da';

  const maxAttempts = 5;
  const isBlocked = attempts >= maxAttempts;

  // Track network status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Persist "remember me" choice immediately so the supabase storage adapter picks it up
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(REMEMBER_KEY, rememberMe ? '1' : '0');
  }, [rememberMe]);

  // Auto-focus email on mount for keyboard users
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Move focus to error region when a new error appears (screen-reader friendly)
  useEffect(() => {
    if (errorKind && errorRef.current) {
      errorRef.current.focus();
    }
  }, [errorKind]);

  const setError = (kind: ErrorKind, fallbackText?: string) => {
    setErrorKind(kind);
    const text = (() => {
      switch (kind) {
        case 'invalid':
          return isDanish
            ? 'Ugyldig email eller adgangskode. Tjek dine oplysninger og prøv igen.'
            : 'Invalid email or password. Check your details and try again.';
        case 'network':
          return isDanish
            ? 'Ingen internetforbindelse. Tjek dit netværk og prøv igen.'
            : 'No internet connection. Check your network and try again.';
        case 'timeout':
          return t('login.timeout');
        case 'locked':
          return t('login.tooManyAttemptsLock');
        case 'required':
          return t('login.requiredFields');
        default:
          return fallbackText || t('login.unexpectedError');
      }
    })();
    setErrorText(text);
  };

  const clearError = () => {
    setErrorKind(null);
    setErrorText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoginTimeout(false);
    setSuccess(false);

    if (isBlocked) {
      setError('locked');
      return;
    }
    if (!email || !password) {
      setError('required');
      return;
    }
    if (!isOnline) {
      setError('network');
      return;
    }

    if (import.meta.env.DEV) console.log('[LoginForm] Attempting login');
    setIsLoading(true);

    const loginTimeoutId = setTimeout(() => {
      setLoginTimeout(true);
      setIsLoading(false);
      setError('timeout');
    }, 15000);

    try {
      const result = await login(email, password);
      clearTimeout(loginTimeoutId);

      if (result.error) {
        if (import.meta.env.DEV) console.log('[LoginForm] Login failed:', result.error);
        const kind = classifyError(result.error);
        setAttempts((prev) => prev + 1);
        setError(kind === 'unknown' ? 'invalid' : kind);
        if (attempts >= 3) {
          toast.error(
            isDanish ? 'For mange mislykkede forsøg' : 'Too many failed attempts',
            {
              description: isDanish
                ? `Du har ${Math.max(0, maxAttempts - attempts - 1)} forsøg tilbage.`
                : `${Math.max(0, maxAttempts - attempts - 1)} attempts left.`,
            }
          );
        }
      } else {
        if (import.meta.env.DEV) console.log('[LoginForm] Auth successful, proceeding...');
        setAttempts(0);
        clearError();
        setSuccess(true);
        toast.success(isDanish ? 'Du er logget ind' : 'You are signed in', {
          description: isDanish ? 'Omdirigerer til ugeplan…' : 'Redirecting to your planner…',
        });
        onSuccess?.();

        setTimeout(() => {
          if (window.location.pathname !== '/dashboard') {
            window.location.replace('/dashboard');
          } else {
            window.location.reload();
          }
        }, 800);
      }
    } catch (err) {
      clearTimeout(loginTimeoutId);
      if (import.meta.env.DEV) console.error('[LoginForm] Login error:', err);
      setAttempts((prev) => prev + 1);
      const kind = classifyError(err);
      setError(kind === 'unknown' ? (isOnline ? 'unknown' : 'network') : kind);
    } finally {
      if (!loginTimeout) setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-sm border-border/70">
      <CardContent className="space-y-4 pt-6">
        {/* Network banner */}
        {!isOnline && (
          <Alert variant="destructive" className="animate-fade-in" role="status">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {isDanish
                ? 'Du er offline. Login kræver internetforbindelse.'
                : 'You are offline. Sign-in requires an internet connection.'}
            </AlertDescription>
          </Alert>
        )}

        {isBlocked && (
          <Alert variant="destructive" className="animate-fade-in" role="alert">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{t('login.tooManyAttemptsLock')}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="animate-fade-in border-green-500/40 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100" role="status">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {isDanish ? 'Login lykkedes — omdirigerer…' : 'Sign-in successful — redirecting…'}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-describedby={errorKind ? 'login-error' : undefined}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errorKind) clearError(); }}
              placeholder={t('login.emailPlaceholder')}
              required
              disabled={isLoading || isBlocked}
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              aria-invalid={errorKind === 'invalid' || errorKind === 'required'}
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('common.password')}</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errorKind) clearError(); }}
                placeholder={t('login.passwordPlaceholder')}
                required
                disabled={isLoading || isBlocked}
                autoComplete="current-password"
                aria-invalid={errorKind === 'invalid' || errorKind === 'required'}
                aria-required="true"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                disabled={isLoading || isBlocked}
                aria-label={
                  showPassword
                    ? isDanish ? 'Skjul adgangskode' : 'Hide password'
                    : isDanish ? 'Vis adgangskode' : 'Show password'
                }
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label htmlFor="remember-me" className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
                disabled={isLoading || isBlocked}
                aria-label={isDanish ? 'Husk mig på denne enhed' : 'Remember me on this device'}
              />
              <span>{isDanish ? 'Husk mig' : 'Remember me'}</span>
            </label>
          </div>

          {errorKind && (
            <div
              id="login-error"
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="assertive"
              className="outline-none"
            >
              <Alert variant="destructive" className="animate-fade-in">
                {errorKind === 'network' ? <WifiOff className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertDescription>
                  {errorText}
                  {loginTimeout && (
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="ml-2 underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      {t('login.refreshPage')}
                    </button>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {attempts > 0 && !isBlocked && !errorKind && (
            <Alert className="animate-fade-in" role="status">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('login.failedAttempts', {
                  count: String(attempts),
                  remaining: String(maxAttempts - attempts),
                })}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isBlocked || loginTimeout || !isOnline}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span aria-hidden className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white" />
                <span>{t('login.buttonLoading')}</span>
              </span>
            ) : (
              t('login.button')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
