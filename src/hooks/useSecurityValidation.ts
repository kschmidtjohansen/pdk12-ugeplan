
import { useCallback } from 'react';
import { validateEmailFormat, validatePasswordStrength, sanitizeInput } from '@/utils/securityValidation';
import { logInputValidationError } from '@/utils/securityLogger';

export const useSecurityValidation = () => {
  const validateEmail = useCallback((email: string): { valid: boolean; error?: string } => {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }
    
    const isValid = validateEmailFormat(email);
    if (!isValid) {
      logInputValidationError('email', email, 'Invalid email format');
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    return { valid: true };
  }, []);

  const validatePassword = useCallback((password: string) => {
    const result = validatePasswordStrength(password);
    if (!result.valid) {
      logInputValidationError('password', '[REDACTED]', result.errors.join(', '));
    }
    return result;
  }, []);

  const sanitizeUserInput = useCallback((input: string, maxLength?: number): string => {
    return sanitizeInput(input, maxLength);
  }, []);

  const validateRequired = useCallback((value: string, fieldName: string): { valid: boolean; error?: string } => {
    if (!value || value.trim().length === 0) {
      logInputValidationError(fieldName, value || '', 'Required field is empty');
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  }, []);

  const validateLength = useCallback((
    value: string, 
    fieldName: string, 
    min: number = 0, 
    max: number = 1000
  ): { valid: boolean; error?: string } => {
    if (value.length < min) {
      logInputValidationError(fieldName, value, `Length below minimum: ${min}`);
      return { valid: false, error: `${fieldName} must be at least ${min} characters` };
    }
    
    if (value.length > max) {
      logInputValidationError(fieldName, value.substring(0, 50) + '...', `Length above maximum: ${max}`);
      return { valid: false, error: `${fieldName} must not exceed ${max} characters` };
    }
    
    return { valid: true };
  }, []);

  return {
    validateEmail,
    validatePassword,
    sanitizeUserInput,
    validateRequired,
    validateLength
  };
};
