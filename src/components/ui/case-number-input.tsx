import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

interface CaseNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const CaseNumberInput: React.FC<CaseNumberInputProps> = ({
  value,
  onChange,
  label = "Sagsnummer",
  placeholder = "12-XXXXXX",
  required = false,
  className = ""
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');

  // Case number validation pattern (12-XXXXXX format)
  const validateCaseNumber = (caseNumber: string): { isValid: boolean; message: string } => {
    if (!caseNumber.trim()) {
      return { isValid: required ? false : true, message: required ? 'Sagsnummer er påkrævet' : '' };
    }

    // Check format: 12-XXXXXX (6 characters/numbers after dash)
    const pattern = /^12-[A-Za-z0-9]{6}$/;
    
    if (!pattern.test(caseNumber)) {
      return {
        isValid: false,
        message: 'Sagsnummer skal have formatet: 12-XXXXXX (fx. 12-ABC123)'
      };
    }

    return { isValid: true, message: 'Gyldig sagsnummer' };
  };

  // Format input as user types
  const formatCaseNumber = (input: string): string => {
    // Remove any non-alphanumeric characters except dash
    let cleaned = input.replace(/[^A-Za-z0-9-]/g, '');
    
    // Auto-add prefix if user starts typing without it
    if (cleaned.length > 0 && !cleaned.startsWith('12-')) {
      if (cleaned.startsWith('12')) {
        cleaned = cleaned.replace('12', '12-');
      } else {
        cleaned = '12-' + cleaned;
      }
    }
    
    // Limit to correct length (12-XXXXXX = 9 characters)
    if (cleaned.length > 9) {
      cleaned = cleaned.substring(0, 9);
    }
    
    // Convert to uppercase for consistency
    return cleaned.toUpperCase();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatCaseNumber(rawValue);
    onChange(formattedValue);
  };

  useEffect(() => {
    const validation = validateCaseNumber(value);
    setIsValid(validation.isValid);
    setValidationMessage(validation.message);
  }, [value, required]);

  const getInputClassName = () => {
    let baseClassName = className;
    
    if (value && isValid !== null) {
      if (isValid) {
        baseClassName += ' border-green-500 focus:border-green-500';
      } else {
        baseClassName += ' border-red-500 focus:border-red-500';
      }
    }
    
    return baseClassName;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="case-number" className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id="case-number"
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={getInputClassName()}
          maxLength={9}
        />
        
        {value && isValid !== null && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      {validationMessage && (
        <Alert variant={isValid ? "default" : "destructive"} className="py-2">
          <AlertDescription className="text-xs">
            {validationMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {!value && !required && (
        <p className="text-xs text-muted-foreground">
          Indtast sagsnummer for at aktivere OneDrive integration
        </p>
      )}
    </div>
  );
};