
export const sanitizeText = (text: string, maxLength: number = 1000): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Remove potential XSS patterns
  const sanitized = text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
  
  return sanitized.substring(0, maxLength);
};

export const validateAndSanitizeEmail = (email: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} => {
  if (!email || typeof email !== 'string') {
    return { valid: false, sanitized: '', error: 'Email is required' };
  }
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid email format' };
  }
  
  if (sanitized.length > 255) {
    return { valid: false, sanitized, error: 'Email is too long' };
  }
  
  return { valid: true, sanitized };
};

export const validatePassword = (password: string): {
  valid: boolean;
  score: number;
  error?: string;
} => {
  if (!password) {
    return { valid: false, score: 0, error: 'Password is required' };
  }
  
  let score = 0;
  const errors: string[] = [];
  
  if (password.length >= 8) score++;
  else errors.push('at least 8 characters');
  
  if (/[A-Z]/.test(password)) score++;
  else errors.push('one uppercase letter');
  
  if (/[a-z]/.test(password)) score++;
  else errors.push('one lowercase letter');
  
  if (/[0-9]/.test(password)) score++;
  else errors.push('one number');
  
  const valid = score >= 4;
  const error = valid ? undefined : `Password must contain ${errors.join(', ')}`;
  
  return { valid, score, error };
};

export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export class ClientRateLimit {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();
  
  check(key: string, maxAttempts: number = 5): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    
    if (!attempt) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }
    
    // Reset if more than 15 minutes have passed
    if (now - attempt.timestamp > 15 * 60 * 1000) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }
    
    if (attempt.count >= maxAttempts) {
      return false;
    }
    
    attempt.count++;
    attempt.timestamp = now;
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}
