import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Eye, EyeOff, Building2 } from 'lucide-react';
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
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { departments, selectedDepartmentId, setSelectedDepartmentId, loading: departmentsLoading } = useDepartment();

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

    // Validate department selection
    if (!selectedDepartmentId) {
      setError(t('login.departmentRequired'));
      return;
    }

    if (!email || !password) {
      setError(t('login.requiredFields'));
      return;
    }

    console.log('[LoginForm] Attempting login for:', email, 'with department:', selectedDepartmentId);
    setIsLoading(true);

    const loginTimeoutId = setTimeout(() => {
      setLoginTimeout(true);
      setIsLoading(false);
      setError(t('login.timeout'));
    }, 15000);

    try {
      const result = await login(email, password);

      clearTimeout(loginTimeoutId);

      if (result.error) {
        console.log('[LoginForm] Login failed:', result.error);
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
        // Login succeeded - now check department access
        console.log('[LoginForm] Auth successful, checking department access...');
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setError(t('login.unexpectedError'));
          setIsLoading(false);
          return;
        }

        // Check if user is super_admin (bypasses department check)
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .maybeSingle();

        const isSuperAdmin = roleData?.role === 'super_admin';

        if (!isSuperAdmin) {
          // Check user_access for the selected department
          const { data: accessData, error: accessError } = await supabase
            .from('user_access')
            .select('id')
            .eq('user_id', authUser.id)
            .eq('department_id', selectedDepartmentId)
            .limit(1);

          if (accessError || !accessData || accessData.length === 0) {
            // Access denied - sign out and show error
            console.log('[LoginForm] Department access denied for user:', authUser.email);
            await supabase.auth.signOut();
            setError(t('login.departmentAccessDenied'));
            setIsLoading(false);
            return;
          }
        }

        console.log('[LoginForm] Department access verified, proceeding...');
        setAttempts(0);
        setError('');
        onSuccess?.();

        setTimeout(() => {
          if (window.location.pathname !== '/dashboard') {
            window.location.replace('/dashboard');
          } else {
            window.location.reload();
          }
        }, 800);
      }
    } catch (error) {
      clearTimeout(loginTimeoutId);
      console.error('[LoginForm] Login error:', error);
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardDescription>
          {t('login.description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isBlocked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('login.tooManyAttemptsLock')}
            </AlertDescription>
          </Alert>
        )}

        {loginTimeout && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('login.timeoutMessage')}
              <button onClick={() => window.location.reload()} className="ml-2 underline hover:no-underline">
                {t('login.refreshPage')}
              </button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Department selector */}
          <div className="space-y-2">
            <Label htmlFor="department" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('login.selectDepartment')}
            </Label>
            {departmentsLoading ? (
              <div className="text-sm text-muted-foreground py-2">
                {t('login.loadingDepartments')}
              </div>
            ) : (
              <Select
                value={selectedDepartmentId || ''}
                onValueChange={(value) => setSelectedDepartmentId(value)}
                disabled={isLoading || isBlocked}
              >
                <SelectTrigger id="department" className="w-full bg-background">
                  <SelectValue placeholder={t('login.selectDepartmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                required
                disabled={isLoading || isBlocked}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={togglePasswordVisibility}
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                disabled={isLoading || isBlocked}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
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

          <Button type="submit" className="w-full" disabled={isLoading || isBlocked || loginTimeout}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                {t('login.buttonLoading')}
              </div>
            ) : t('login.button')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
