
/**
 * Input sanitization utilities for XSS protection and data validation
 */

// XSS protection - sanitize HTML content
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>'"&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char];
    })
    .trim();
}

// Sanitize text input (remove potential script injections)
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .substring(0, maxLength);
}

// Validate and sanitize email
export function validateAndSanitizeEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
  if (!email) {
    return { valid: false, sanitized: '', error: 'Email is required' };
  }

  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    return { valid: false, sanitized: '', error: 'Invalid email format' };
  }

  if (sanitized.length > 255) {
    return { valid: false, sanitized: '', error: 'Email too long' };
  }

  return { valid: true, sanitized };
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; error?: string; score: number } {
  if (!password) {
    return { valid: false, error: 'Password is required', score: 0 };
  }

  let score = 0;

  // Length check
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long', score: 0 };
  }
  score += password.length >= 12 ? 2 : 1;

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter', score };
  }
  score += 1;

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter', score };
  }
  score += 1;

  // Number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number', score };
  }
  score += 1;

  // Special character
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  }

  // No common patterns
  const commonPatterns = ['123', 'abc', 'password', 'admin', 'user'];
  const lowerPassword = password.toLowerCase();
  for (const pattern of commonPatterns) {
    if (lowerPassword.includes(pattern)) {
      score -= 1;
      break;
    }
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters', score: 0 };
  }

  return { valid: true, score: Math.max(0, score) };
}

// Sanitize form data
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

// Validate UUID format
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Rate limiting helper (for client-side usage)
export class ClientRateLimit {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  check(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key);

    if (!userAttempts || now > userAttempts.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (userAttempts.count >= maxAttempts) {
      return false;
    }

    userAttempts.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken || token.length !== storedToken.length) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}
