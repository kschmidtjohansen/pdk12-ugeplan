
// Security Headers Configuration
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cyuyrpwtkljfiqwgasmn.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://cyuyrpwtkljfiqwgasmn.supabase.co wss://cyuyrpwtkljfiqwgasmn.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block'
};

// Function to apply security headers (useful for SSR or edge functions)
export const applySecurityHeaders = (response: Response): Response => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

// Meta tags for client-side security
export const securityMetaTags = [
  { name: 'referrer', content: 'strict-origin-when-cross-origin' },
  { name: 'format-detection', content: 'telephone=no' },
  { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
  { httpEquiv: 'X-Frame-Options', content: 'DENY' },
  { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' }
];
