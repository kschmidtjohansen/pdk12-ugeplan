
import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { secureLog, authLog } from '@/utils/secureLogger';

export interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showToggle?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ className, type = 'password', showToggle = true, onVisibilityChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const togglePasswordVisibility = () => {
      const newVisibility = !showPassword;
      setShowPassword(newVisibility);
      setHasInteracted(true);
      
      // Log visibility toggle without sensitive data
      authLog('password_visibility_toggle', {
        visible: newVisibility,
        userInteracted: hasInteracted
      });
      
      onVisibilityChange?.(newVisibility);
    };

    const handleFocus = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        authLog('secure_input_focus', {
          inputType: type,
          hasValue: props.value ? 'yes' : 'no'
        });
      }
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className="relative">
        <Input
          type={inputType}
          className={cn('pr-10', className)}
          ref={ref}
          onFocus={handleFocus}
          autoComplete={type === 'password' ? 'current-password' : props.autoComplete}
          {...props}
        />
        {type === 'password' && showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

export { SecureInput };
