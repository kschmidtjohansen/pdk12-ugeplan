
import React, { forwardRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Check, X, Loader2, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import { usePwnedPasswordCheck } from '@/hooks/usePwnedPasswordCheck';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showStrengthIndicator?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ 
    label, 
    showStrengthIndicator = false, 
    onValidationChange,
    className,
    value,
    onChange,
    ...props 
  }, ref) => {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const password = typeof value === 'string' ? value : '';

    const validation = {
      length: password.length >= 8,
      recommendedLength: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    const pwnedStatus = usePwnedPasswordCheck(password, showStrengthIndicator);
    const requiredMet =
      validation.length && validation.uppercase && validation.lowercase && validation.number;
    const isValid = requiredMet && pwnedStatus !== 'pwned' && pwnedStatus !== 'checking';

    useEffect(() => {
      if (!showStrengthIndicator) return;
      onValidationChange?.(isValid);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isValid, showStrengthIndicator]);

    const ValidationItem = ({
      state,
      text,
      optional = false,
    }: { state: boolean; text: string; optional?: boolean }) => (
      <div className="flex items-center gap-2">
        {state ? (
          <Check className="h-3 w-3 text-success-soft-foreground" />
        ) : optional ? (
          <Info className="h-3 w-3 text-muted-foreground" />
        ) : (
          <X className="h-3 w-3 text-destructive" />
        )}
        <span
          className={cn(
            'text-xs',
            state
              ? 'text-success-soft-foreground'
              : optional
                ? 'text-muted-foreground'
                : 'text-destructive'
          )}
        >
          {text}
        </span>
      </div>
    );

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id}>{label}</Label>
        )}
        
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            className={className}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {showStrengthIndicator && (
          <div className="space-y-1 p-3 bg-muted/50 rounded-md">
            <p className="text-xs font-medium text-foreground mb-2">{t('employees.pwTitle')}</p>
            <ValidationItem state={validation.length} text={t('employees.pwLength')} />
            <ValidationItem state={validation.uppercase} text={t('employees.pwUppercase')} />
            <ValidationItem state={validation.lowercase} text={t('employees.pwLowercase')} />
            <ValidationItem state={validation.number} text={t('employees.pwNumber')} />
            <ValidationItem state={validation.special} text={t('employees.pwSpecial')} optional />
            <ValidationItem
              state={validation.recommendedLength}
              text={t('employees.pwRecommendedLength')}
              optional
            />

            <div className="pt-1 mt-1 border-t border-border">
              {pwnedStatus === 'checking' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('employees.pwBreachChecking')}
                </div>
              )}
              {pwnedStatus === 'safe' && (
                <div className="flex items-center gap-2 text-xs text-success-soft-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  {t('employees.pwBreachSafe')}
                </div>
              )}
              {pwnedStatus === 'pwned' && (
                <div className="flex items-center gap-2 text-xs text-destructive font-medium">
                  <ShieldAlert className="h-3 w-3" />
                  {t('employees.pwBreachFound')}
                </div>
              )}
              {pwnedStatus === 'unknown' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  {t('employees.pwBreachUnavailable')}
                </div>
              )}
              {pwnedStatus === 'idle' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  {t('employees.pwBreachHint')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
