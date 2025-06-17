
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { logInputValidationError } from './securityLogger';

// Helper function to safely get data from a potentially nullable nested property
export function safeGet<T>(data: any, path: string, defaultValue: T): T {
  if (!data) return defaultValue;
  
  const keys = path.split('.');
  let current = data;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return (current !== null && current !== undefined) ? current : defaultValue;
}

// Handle proper error typing for Supabase join queries
export function handleJoinQueryResult<T>(result: PostgrestSingleResponse<any>, defaultValue: T): T {
  if (result.error) {
    console.error("Database query error:", result.error);
    return defaultValue;
  }
  
  // The data might be an error object if join relations aren't found
  if (result.data && typeof result.data === 'object' && 'message' in result.data) {
    console.error("Join relation error:", result.data);
    return defaultValue;
  }
  
  return result.data as T;
}

// Safe property accessor that works with possible error objects
export function safeProperty<T>(obj: any, property: string, defaultValue: T): T {
  // Check if obj is an error object
  if (obj && typeof obj === 'object' && 'message' in obj) {
    return defaultValue;
  }
  
  // Normal property access
  return obj && obj[property] !== undefined ? obj[property] : defaultValue;
}

// Enhanced input validation with security logging
export const validateTextInput = (
  input: string | null | undefined,
  fieldName: string,
  maxLength: number = 1000,
  required: boolean = false
): { isValid: boolean; sanitized: string | null; error?: string } => {
  // Handle null/undefined
  if (!input || input.trim() === '') {
    if (required) {
      const error = `${fieldName} is required`;
      logInputValidationError(fieldName, input || '', error);
      return { isValid: false, sanitized: null, error };
    }
    return { isValid: true, sanitized: null };
  }

  const trimmed = input.trim();

  // Check length
  if (trimmed.length > maxLength) {
    const error = `${fieldName} exceeds maximum length of ${maxLength} characters`;
    logInputValidationError(fieldName, trimmed, error);
    return { isValid: false, sanitized: trimmed.substring(0, maxLength), error };
  }

  // Check for potential XSS patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      const error = `${fieldName} contains potentially dangerous content`;
      logInputValidationError(fieldName, trimmed, error);
      return { isValid: false, sanitized: trimmed.replace(pattern, ''), error };
    }
  }

  return { isValid: true, sanitized: trimmed };
};

// Validate email format with enhanced security
export const validateEmailInput = (email: string | null | undefined): { isValid: boolean; sanitized: string | null; error?: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, sanitized: null, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();
  
  // Basic email regex
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  
  if (!emailRegex.test(trimmed)) {
    logInputValidationError('email', trimmed, 'Invalid email format');
    return { isValid: false, sanitized: trimmed, error: 'Invalid email format' };
  }

  // Additional security checks
  if (trimmed.length > 255) {
    logInputValidationError('email', trimmed, 'Email too long');
    return { isValid: false, sanitized: trimmed.substring(0, 255), error: 'Email too long' };
  }

  return { isValid: true, sanitized: trimmed };
};
