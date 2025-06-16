
import { logInputValidationError } from './securityLogger';

export const validateEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && 
         email.length <= 255 &&
         !email.includes('..') &&
         !email.startsWith('.') &&
         !email.endsWith('.');
};

export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
};

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters and patterns
  let sanitized = input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    logInputValidationError('length_limit', input, `Input truncated to ${maxLength} characters`);
  }
  
  return sanitized;
};

export const validateRequired = (value: any, fieldName: string): boolean => {
  if (value === null || value === undefined || value === '') {
    logInputValidationError(fieldName, String(value), 'Required field is empty');
    return false;
  }
  return true;
};

export const validateLength = (value: string, fieldName: string, min: number = 0, max: number = 1000): boolean => {
  if (!value || typeof value !== 'string') {
    logInputValidationError(fieldName, String(value), 'Invalid string value');
    return false;
  }
  
  if (value.length < min) {
    logInputValidationError(fieldName, value, `Length below minimum: ${min}`);
    return false;
  }
  
  if (value.length > max) {
    logInputValidationError(fieldName, value.substring(0, 50) + '...', `Length above maximum: ${max}`);
    return false;
  }
  
  return true;
};

export const validateNumericRange = (value: number, fieldName: string, min?: number, max?: number): boolean => {
  if (typeof value !== 'number' || isNaN(value)) {
    logInputValidationError(fieldName, String(value), 'Invalid numeric value');
    return false;
  }
  
  if (min !== undefined && value < min) {
    logInputValidationError(fieldName, String(value), `Value below minimum: ${min}`);
    return false;
  }
  
  if (max !== undefined && value > max) {
    logInputValidationError(fieldName, String(value), `Value above maximum: ${max}`);
    return false;
  }
  
  return true;
};

export const validateDateRange = (date: Date, fieldName: string, minDate?: Date, maxDate?: Date): boolean => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    logInputValidationError(fieldName, String(date), 'Invalid date value');
    return false;
  }
  
  if (minDate && date < minDate) {
    logInputValidationError(fieldName, date.toISOString(), `Date before minimum: ${minDate.toISOString()}`);
    return false;
  }
  
  if (maxDate && date > maxDate) {
    logInputValidationError(fieldName, date.toISOString(), `Date after maximum: ${maxDate.toISOString()}`);
    return false;
  }
  
  return true;
};
