
import React, { forwardRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sanitizeText, validateAndSanitizeEmail, validatePassword } from '@/utils/inputSanitization';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  sanitize?: boolean;
  validateEmail?: boolean;
  validatePasswordStrength?: boolean;
  showPasswordStrength?: boolean;
  maxLength?: number;
}

export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ 
    label, 
    sanitize = true, 
    validateEmail = false, 
    validatePasswordStrength = false,
    showPasswordStrength = false,
    maxLength = 1000,
    onChange,
    value,
    type,
    className,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [validationError, setValidationError] = useState<string>('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [sanitizedValue, setSanitizedValue] = useState(value || '');

    const isPasswordField = type === 'password' || validatePasswordStrength;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      let error = '';

      // Sanitize input if enabled
      if (sanitize) {
        inputValue = sanitizeText(inputValue, maxLength);
        setSanitizedValue(inputValue);
      }

      // Email validation
      if (validateEmail && inputValue) {
        const emailValidation = validateAndSanitizeEmail(inputValue);
        if (!emailValidation.valid) {
          error = emailValidation.error || 'Invalid email';
        } else {
          inputValue = emailValidation.sanitized;
        }
      }

      // Password validation
      if (validatePasswordStrength && inputValue) {
        const passwordValidation = validatePassword(inputValue);
        if (!passwordValidation.valid) {
          error = passwordValidation.error || 'Invalid password';
        }
        setPasswordStrength(passwordValidation.score);
      }

      setValidationError(error);

      // Create new event with sanitized value
      const sanitizedEvent = {
        ...e,
        target: {
          ...e.target,
          value: inputValue
        }
      };

      if (onChange) {
        onChange(sanitizedEvent);
      }
    };

    const getPasswordStrengthColor = (strength: number) => {
      if (strength <= 2) return 'bg-red-500';
      if (strength <= 4) return 'bg-yellow-500';
      return 'bg-green-500';
    };

    const getPasswordStrengthText = (strength: number) => {
      if (strength <= 2) return 'Weak';
      if (strength <= 4) return 'Medium';
      return 'Strong';
    };

    useEffect(() => {
      if (value !== sanitizedValue && sanitize) {
        setSanitizedValue(sanitizeText(String(value || ''), maxLength));
      }
    }, [value, sanitize, maxLength]);

    return (
      <div className="space-y-1">
        {label && (
          <Label htmlFor={props.id} className="flex items-center gap-1">
            {label}
            {sanitize && <Shield className="h-3 w-3 text-green-600" title="Input is sanitized for security" />}
          </Label>
        )}
        
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={isPasswordField && showPassword ? 'text' : type}
            value={sanitize ? sanitizedValue : value}
            onChange={handleInputChange}
            className={`${className} ${validationError ? 'border-red-500 focus:border-red-500' : ''}`}
            maxLength={maxLength}
          />
          
          {isPasswordField && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          )}
        </div>

        {showPasswordStrength && validatePasswordStrength && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                  style={{ width: `${Math.min(100, (passwordStrength / 6) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {getPasswordStrengthText(passwordStrength)}
              </span>
            </div>
          </div>
        )}

        {validationError && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {validationError}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';
