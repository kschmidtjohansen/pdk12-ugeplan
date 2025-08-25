import { useCallback } from 'react';
import { sanitizeText, validateAndSanitizeEmail, validatePassword } from '@/utils/inputSanitization';
import { validateAndSanitizePhone } from '@/utils/phoneValidation';
import { sanitizeInput } from '@/utils/securityValidation';
import { logInputValidationError } from '@/utils/securityLogger';

interface ValidationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

interface PasswordValidationResult {
  valid: boolean;
  score: number;
  error?: string;
}

/**
 * Enhanced input validation hook with comprehensive security measures
 * Combines multiple validation utilities for consistent security across the app
 */
export const useEnhancedInputValidation = () => {
  
  const validateEmail = useCallback((email: string): ValidationResult => {
    try {
      const result = validateAndSanitizeEmail(email);
      return {
        valid: result.valid,
        sanitized: result.sanitized,
        error: result.error
      };
    } catch (error) {
      logInputValidationError('email', email, 'Email validation failed');
      return {
        valid: false,
        sanitized: '',
        error: 'Invalid email format'
      };
    }
  }, []);

  const validatePhone = useCallback((phone: string | null | undefined): ValidationResult => {
    try {
      const result = validateAndSanitizePhone(phone);
      return {
        valid: result.valid,
        sanitized: result.sanitized || '',
        error: result.error
      };
    } catch (error) {
      logInputValidationError('phone', phone || '', 'Phone validation failed');
      return {
        valid: false,
        sanitized: '',
        error: 'Invalid phone format'
      };
    }
  }, []);

  const validatePasswordStrength = useCallback((password: string): PasswordValidationResult => {
    try {
      const result = validatePassword(password);
      return {
        valid: result.valid,
        score: result.score,
        error: result.error
      };
    } catch (error) {
      logInputValidationError('password', '[REDACTED]', 'Password validation failed');
      return {
        valid: false,
        score: 0,
        error: 'Password validation error'
      };
    }
  }, []);

  const sanitizeTextInput = useCallback((input: string, maxLength: number = 1000): string => {
    try {
      // Use multiple sanitization layers for enhanced security
      const sanitized1 = sanitizeText(input, maxLength);
      const sanitized2 = sanitizeInput(sanitized1, maxLength);
      return sanitized2;
    } catch (error) {
      logInputValidationError('text', input, 'Text sanitization failed');
      return '';
    }
  }, []);

  const validateRequired = useCallback((value: string, fieldName: string): ValidationResult => {
    const trimmed = value?.trim() || '';
    const sanitized = sanitizeTextInput(trimmed);
    
    if (!sanitized) {
      return {
        valid: false,
        sanitized: '',
        error: `${fieldName} is required`
      };
    }
    
    return {
      valid: true,
      sanitized
    };
  }, [sanitizeTextInput]);

  const validateLength = useCallback((
    value: string, 
    fieldName: string, 
    min: number = 0, 
    max: number = 1000
  ): ValidationResult => {
    const sanitized = sanitizeTextInput(value, max);
    
    if (sanitized.length < min) {
      return {
        valid: false,
        sanitized,
        error: `${fieldName} must be at least ${min} characters`
      };
    }
    
    if (sanitized.length > max) {
      return {
        valid: false,
        sanitized: sanitized.substring(0, max),
        error: `${fieldName} must be less than ${max} characters`
      };
    }
    
    return {
      valid: true,
      sanitized
    };
  }, [sanitizeTextInput]);

  return {
    validateEmail,
    validatePhone,
    validatePasswordStrength,
    sanitizeTextInput,
    validateRequired,
    validateLength
  };
};