/**
 * Comprehensive phone validation utility for consistent validation across all components
 */

export interface PhoneValidationResult {
  valid: boolean;
  sanitized: string | null;
  error?: string;
}

/**
 * Validates and sanitizes phone number according to database constraint
 * Database constraint: phone number must match pattern ^\+?[0-9\s\-\(\)]{8,}$
 */
export const validateAndSanitizePhone = (phone: string | null | undefined): PhoneValidationResult => {
  // Handle null, undefined, or empty values
  if (!phone || typeof phone !== 'string') {
    return { valid: true, sanitized: null };
  }

  const trimmed = phone.trim();
  
  // Empty string after trim is valid (will be stored as null)
  if (!trimmed) {
    return { valid: true, sanitized: null };
  }

  // Single character inputs like "-" are invalid
  if (trimmed.length < 3) {
    return { 
      valid: false, 
      sanitized: null, 
      error: 'Phone number must be at least 3 characters if provided' 
    };
  }

  // Check against database constraint pattern: ^\+?[0-9\s\-\(\)]{8,}$
  const phonePattern = /^\+?[0-9\s\-\(\)]{8,}$/;
  
  if (!phonePattern.test(trimmed)) {
    return { 
      valid: false, 
      sanitized: null, 
      error: 'Phone number format is invalid. Use only numbers, spaces, dashes, parentheses, and optional + prefix (minimum 8 characters)' 
    };
  }

  return { valid: true, sanitized: trimmed };
};

/**
 * Quick validation for form inputs (returns boolean only)
 */
export const isValidPhoneFormat = (phone: string | null | undefined): boolean => {
  const result = validateAndSanitizePhone(phone);
  return result.valid;
};

/**
 * Sanitizes phone for database storage (returns null for invalid/empty)
 */
export const sanitizePhoneForStorage = (phone: string | null | undefined): string | null => {
  const result = validateAndSanitizePhone(phone);
  return result.valid ? result.sanitized : null;
};

/**
 * Gets user-friendly error message for phone validation
 */
export const getPhoneValidationError = (phone: string | null | undefined): string | null => {
  const result = validateAndSanitizePhone(phone);
  return result.error || null;
};