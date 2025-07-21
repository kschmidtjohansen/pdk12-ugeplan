import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PasswordResetDialog from '@/components/Auth/PasswordResetDialog';
import { DepartmentSelector } from '@/components/Auth/DepartmentSelector';
import { useDepartment } from '@/context/DepartmentContext';
import { AlertCircle } from 'lucide-react';
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('TEST'); // Default to Test department
  const [isLoading, setIsLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const {
    login,
    user,
    isAuthenticated
  } = useAuth();
  const { validateDepartmentAccess } = useDepartment();
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    console.log("Login page - checking authentication status:", {
      user,
      isAuthenticated
    });
    if (user || isAuthenticated) {
      console.log("User is authenticated, redirecting to dashboard");
      navigate('/dashboard', {
        replace: true
      });
    }
  }, [user, isAuthenticated, navigate]);

  // Add a safety timeout to prevent "logging in" state getting stuck forever
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (isLoading) {
      timeoutId = setTimeout(() => {
        console.log('Login timeout reached, resetting loading state');
        setIsLoading(false);
      }, 10000); // 10 seconds timeout
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Check if account is locked
  useEffect(() => {
    // Try to load failed attempts from session storage
    try {
      const storedAttempts = sessionStorage.getItem('login_failed_attempts');
      const storedLockTime = sessionStorage.getItem('login_locked_until');
      if (storedAttempts) {
        setFailedAttempts(parseInt(storedAttempts, 10));
      }
      if (storedLockTime) {
        const lockTime = new Date(storedLockTime);
        if (lockTime > new Date()) {
          setLockedUntil(lockTime);
        } else {
          // Lock time has passed, reset
          sessionStorage.removeItem('login_locked_until');
          setLockedUntil(null);
        }
      }
    } catch (err) {
      console.error('Error accessing session storage:', err);
    }
  }, []);

  // Check if account is locked and update remaining time
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const now = new Date();
      if (lockedUntil <= now) {
        setLockedUntil(null);
        sessionStorage.removeItem('login_locked_until');
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if account is locked
    if (lockedUntil && lockedUntil > new Date()) {
      toast({
        title: t('common.error'),
        description: t('login.tooManyRequests'),
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      console.log('Attempting login for:', email, 'Department:', selectedDepartment);
      
      // First attempt login
      const {
        error
      } = await login(email, password);
      if (error) {
        console.error('Login error:', error);
        let errorMessage = t('login.failed');

        // More specific error messages based on the error code
        if (error.includes('Invalid login credentials')) {
          errorMessage = t('login.invalidCredentials');

          // Increment failed attempts and possibly lock account
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          try {
            sessionStorage.setItem('login_failed_attempts', newFailedAttempts.toString());

            // Lock account after 5 failed attempts
            if (newFailedAttempts >= 5) {
              const lockTime = new Date();
              lockTime.setMinutes(lockTime.getMinutes() + 15); // Lock for 15 minutes
              setLockedUntil(lockTime);
              sessionStorage.setItem('login_locked_until', lockTime.toISOString());
              errorMessage = t('login.tooManyRequests');
            }
          } catch (err) {
            console.error('Error setting session storage:', err);
          }
        } else if (error.includes('rate limit') || error.includes('Too many login attempts')) {
          errorMessage = t('login.tooManyRequests');
        }
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: "destructive"
        });
        setIsLoading(false);
      } else {
        // Validate department access after successful login
        const departmentValidation = await validateDepartmentAccess(selectedDepartment);
        
        if (!departmentValidation.valid) {
          // User logged in but doesn't have access to the selected department
          toast({
            title: t('departments.accessDenied'),
            description: t('departments.wrongDepartment'),
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Success is handled by the useEffect above through the auth state change
        toast({
          title: t('common.success'),
          description: t('login.success')
        });

        // Reset failed attempts on successful login
        try {
          sessionStorage.removeItem('login_failed_attempts');
          sessionStorage.removeItem('login_locked_until');
          setFailedAttempts(0);
          setLockedUntil(null);
        } catch (err) {
          console.error('Error clearing session storage:', err);
        }

        // Force navigate to dashboard after successful login
        console.log("Login successful, forcing navigation to dashboard");
        setTimeout(() => {
          navigate('/dashboard', {
            replace: true
          });
        }, 500);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: t('common.error'),
        description: t('login.failed'),
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  const handleForgotPassword = () => {
    setResetDialogOpen(true);
  };

  // Calculate remaining lockout time
  const getRemainingLockoutTime = (): string => {
    if (!lockedUntil) return '';
    const now = new Date();
    const diffMs = lockedUntil.getTime() - now.getTime();
    if (diffMs <= 0) return '';
    const minutes = Math.floor(diffMs / (1000 * 60));
    const seconds = Math.floor(diffMs % (1000 * 60) / 1000);
    return `${minutes}m ${seconds}s`;
  };
  return <div className="min-h-screen flex items-center justify-center bg-polygon-lightgray p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg" alt="Polygon Logo" className="mx-auto mb-6 h-16" />
          <h1 className="text-2xl font-bold text-gray-800">{t('login.welcomeMessage')}</h1>
          <p className="text-gray-600">{t('login.internalSystem')}</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('login.title')}</CardTitle>
            <CardDescription>
              {t('login.description')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {lockedUntil && lockedUntil > new Date() && <div className="bg-red-50 p-3 rounded border border-red-200 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">Account temporarily locked</p>
                    <p className="text-red-700 text-sm">
                      Too many failed login attempts. Please try again in {getRemainingLockoutTime()}.
                    </p>
                  </div>
                </div>}
              
              <DepartmentSelector
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                disabled={isLoading || (lockedUntil && lockedUntil > new Date())}
              />
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <Input id="email" type="email" placeholder={t('login.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required className="border-2" disabled={isLoading || lockedUntil && lockedUntil > new Date()} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">{t('common.password')}</Label>
                  
                </div>
                <Input id="password" type="password" placeholder={t('login.passwordPlaceholder')} value={password} onChange={e => setPassword(e.target.value)} required className="border-2" disabled={isLoading || lockedUntil && lockedUntil > new Date()} />
              </div>
              
              {/* Show warning after 3 failed attempts */}
              {failedAttempts >= 3 && failedAttempts < 5 && <div className="text-amber-600 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Warning: {5 - failedAttempts} attempts remaining before temporary lockout
                </div>}
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-polygon-blue hover:bg-polygon-darkblue" type="submit" disabled={isLoading || lockedUntil && lockedUntil > new Date() || !email || !password}>
                {isLoading ? t('login.buttonLoading') : t('login.button')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <PasswordResetDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen} />
    </div>;
};
export default LoginPage;