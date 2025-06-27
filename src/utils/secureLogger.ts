// Secure logging utility that automatically redacts sensitive data
interface SensitivePatterns {
  password: RegExp[];
  email: RegExp[];
  token: RegExp[];
}

const SENSITIVE_PATTERNS: SensitivePatterns = {
  password: [
    /password/i,
    /pwd/i,
    /pass/i,
    /secret/i,
    /credentials/i
  ],
  email: [
    /email/i,
    /e-mail/i,
    /@/
  ],
  token: [
    /token/i,
    /jwt/i,
    /bearer/i,
    /authorization/i,
    /api[_-]?key/i
  ]
};

const REDACTED_TEXT = '[REDACTED]';

export class SecureLogger {
  private static isDevelopment = import.meta.env?.DEV || false;
  private static isProduction = import.meta.env?.PROD || false;

  // Sanitize object by redacting sensitive values
  private static sanitizeObject(obj: any, depth = 0): any {
    if (depth > 5) return '[MAX_DEPTH_REACHED]'; // Prevent infinite recursion
    
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, depth + 1));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = REDACTED_TEXT;
        } else {
          sanitized[key] = this.sanitizeObject(value, depth + 1);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  // Check if a key is sensitive
  private static isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    
    return Object.values(SENSITIVE_PATTERNS).some(patterns =>
      patterns.some(pattern => pattern.test(lowerKey))
    );
  }

  // Sanitize string values
  private static sanitizeString(str: string): string {
    // Don't redact very short strings (likely not sensitive data)
    if (str.length < 3) return str;
    
    // Check if string looks like sensitive data
    if (this.isSensitiveKey(str) || str.includes('@')) {
      return REDACTED_TEXT;
    }
    
    return str;
  }

  // Safe logging methods
  static log(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      const sanitizedArgs = args.map(arg => this.sanitizeObject(arg));
      console.log(`[SecureLog] ${message}`, ...sanitizedArgs);
    }
  }

  static warn(message: string, ...args: any[]): void {
    const sanitizedArgs = args.map(arg => this.sanitizeObject(arg));
    console.warn(`[SecureWarn] ${message}`, ...sanitizedArgs);
  }

  static error(message: string, error?: any, ...args: any[]): void {
    const sanitizedError = error ? {
      name: error.name,
      message: error.message,
      // Don't include stack trace in production
      ...(this.isDevelopment && { stack: error.stack })
    } : undefined;
    
    const sanitizedArgs = args.map(arg => this.sanitizeObject(arg));
    console.error(`[SecureError] ${message}`, sanitizedError, ...sanitizedArgs);
  }

  // Authentication-specific logging
  static authLog(event: string, context: Record<string, any> = {}): void {
    const safeContext = {
      ...context,
      // Always redact sensitive auth fields
      password: REDACTED_TEXT,
      token: REDACTED_TEXT,
      refreshToken: REDACTED_TEXT,
      // Keep safe fields
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent?.substring(0, 100) || 'unknown'
    };
    
    this.log(`Auth: ${event}`, safeContext);
  }

  // Performance logging
  static performance(operation: string, duration: number, metadata: Record<string, any> = {}): void {
    if (this.isDevelopment) {
      const sanitizedMetadata = this.sanitizeObject(metadata);
      console.log(`[Performance] ${operation}: ${duration}ms`, sanitizedMetadata);
    }
  }

  // Security event logging
  static security(event: string, details: Record<string, any> = {}): void {
    const sanitizedDetails = this.sanitizeObject(details);
    console.warn(`[Security] ${event}`, sanitizedDetails);
  }
}

// Convenience exports
export const secureLog = SecureLogger.log.bind(SecureLogger);
export const secureWarn = SecureLogger.warn.bind(SecureLogger);
export const secureError = SecureLogger.error.bind(SecureLogger);
export const authLog = SecureLogger.authLog.bind(SecureLogger);
export const performanceLog = SecureLogger.performance.bind(SecureLogger);
export const securityLog = SecureLogger.security.bind(SecureLogger);
