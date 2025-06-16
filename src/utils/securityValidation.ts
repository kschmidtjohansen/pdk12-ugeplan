
// Enhanced security validation utilities
export const validateEmailFormat = (email: string): boolean => {
  if (!email || email.length > 255) return false;
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  
  return emailRegex.test(email) &&
    !email.includes('..') &&
    !email.startsWith('.') &&
    !email.endsWith('.') &&
    email.indexOf('@') > 0 &&
    email.length - email.lastIndexOf('@') > 4;
};

export const validatePasswordStrength = (password: string): {
  valid: boolean;
  score: number;
  errors: string[];
} => {
  const errors: string[] = [];
  let score = 0;
  
  if (!password) {
    return { valid: false, score: 0, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
    score = 0;
  }
  
  return {
    valid: errors.length === 0,
    score: Math.max(0, score),
    errors
  };
};

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  // Remove potential XSS patterns and limit length
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, maxLength)
    .trim();
};

export const isValidUuid = (uuid: string): boolean => {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateInputLength = (input: string, min: number = 0, max: number = 1000): boolean => {
  if (!input) return min === 0;
  return input.length >= min && input.length <= max;
};
