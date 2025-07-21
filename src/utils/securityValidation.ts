
export const validateEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && 
         email.length <= 255 && 
         !email.includes('..') && 
         !email.startsWith('.') && 
         !email.endsWith('.');
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
  
  if (password.length >= 8) score++;
  else errors.push('Password must be at least 8 characters long');
  
  if (/[A-Z]/.test(password)) score++;
  else errors.push('Password must contain at least one uppercase letter');
  
  if (/[a-z]/.test(password)) score++;
  else errors.push('Password must contain at least one lowercase letter');
  
  if (/[0-9]/.test(password)) score++;
  else errors.push('Password must contain at least one number');
  
  return {
    valid: score >= 4,
    score,
    errors
  };
};

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potential XSS patterns
  const sanitized = input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
  
  return sanitized.substring(0, maxLength);
};
