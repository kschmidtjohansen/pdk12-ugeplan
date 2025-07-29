// Security configuration and environment setup
export const SecurityConfig = {
  // Content Security Policy configuration
  CSP: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cyuyrpwtkljfiqwgasmn.supabase.co"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "https://cyuyrpwtkljfiqwgasmn.supabase.co", "wss://cyuyrpwtkljfiqwgasmn.supabase.co"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    workerSrc: ["'self'"],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: true
  },

  // Rate limiting configuration
  RATE_LIMITS: {
    login: { attempts: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    passwordReset: { attempts: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
    dataOperations: { attempts: 100, window: 60 * 1000 }, // 100 operations per minute
    apiCalls: { attempts: 200, window: 60 * 1000 } // 200 API calls per minute
  },

  // Session configuration
  SESSION: {
    maxDuration: 8 * 60 * 60 * 1000, // 8 hours
    maxInactivity: 30 * 60 * 1000, // 30 minutes
    tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
    extendedSessionRoutes: ['/screen-display'] // Routes that allow extended sessions
  },

  // Input validation configuration
  INPUT_VALIDATION: {
    maxInputLength: 10000,
    maxFieldLength: 255,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024 // 5MB
  },

  // Security monitoring
  MONITORING: {
    enableThreatDetection: process.env.NODE_ENV === 'production',
    enableSecurityLogging: true,
    logRetentionDays: 30,
    alertThresholds: {
      failedLogins: 10,
      suspiciousActivities: 5,
      rateLimitViolations: 3
    }
  }
};

// Environment-specific security settings
export const getSecurityEnvironment = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDevelopment,
    isProduction,
    isSecureContext: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    
    // Demo credentials - securely managed via environment variables
    getDemoCredentials: () => {
      // Always prefer environment variables for security
      const demoEmail = process.env.VITE_DEMO_EMAIL || 'test@polygongroup.com';
      const demoPassword = process.env.VITE_DEMO_PASSWORD;
      
      // Fallback for development only (remove in production)
      if (isDevelopment && !demoPassword) {
        return {
          email: demoEmail,
          password: 'TesterbrugerPlan123' // Development fallback only
        };
      }
      
      return {
        email: demoEmail,
        password: demoPassword
      };
    }
  };
};

// Security headers for enhanced protection
export const SECURITY_HEADERS = [
  { name: 'X-Content-Type-Options', content: 'nosniff' },
  { name: 'X-Frame-Options', content: 'DENY' },
  { name: 'X-XSS-Protection', content: '1; mode=block' },
  { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
  { name: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { name: 'X-DNS-Prefetch-Control', content: 'off' },
  { name: 'X-Download-Options', content: 'noopen' },
  { name: 'X-Permitted-Cross-Domain-Policies', content: 'none' }
];