
import React, { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    const [showPassword, setShowPassword] = useState(false);
    const [validation, setValidation] = useState({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false
    });

    const validatePassword = (password: string) => {
      const newValidation = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
      };
      
      setValidation(newValidation);
      
      const isValid = Object.values(newValidation).every(Boolean);
      onValidationChange?.(isValid);
      
      return newValidation;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const password = e.target.value;
      if (showStrengthIndicator) {
        validatePassword(password);
      }
      onChange?.(e);
    };

    const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
      <div className="flex items-center gap-2 text-sm">
        {isValid ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <X className="h-3 w-3 text-red-600" />
        )}
        <span className={cn(
          "text-xs",
          isValid ? "text-green-600" : "text-red-600"
        )}>
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
            onChange={handleChange}
            className={className}
          />
          
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
        </div>

        {showStrengthIndicator && value && (
          <div className="space-y-1 p-3 bg-gray-50 rounded-md">
            <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
            <ValidationItem isValid={validation.length} text="At least 8 characters" />
            <ValidationItem isValid={validation.uppercase} text="One uppercase letter" />
            <ValidationItem isValid={validation.lowercase} text="One lowercase letter" />
            <ValidationItem isValid={validation.number} text="One number" />
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
