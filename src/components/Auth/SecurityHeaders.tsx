
import { useEffect } from 'react';

// Component to set security headers and CSP policies
export const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Enhanced Content Security Policy with stricter controls
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!existingCSP) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cyuyrpwtkljfiqwgasmn.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://cyuyrpwtkljfiqwgasmn.supabase.co wss://cyuyrpwtkljfiqwgasmn.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "media-src 'self'",
        "worker-src 'self'",
        "manifest-src 'self'",
        "upgrade-insecure-requests"
      ].join('; ');
      
      document.head.appendChild(cspMeta);
    }

    // Enhanced security headers with additional protections
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { name: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
      { name: 'X-DNS-Prefetch-Control', content: 'off' },
      { name: 'X-Download-Options', content: 'noopen' },
      { name: 'X-Permitted-Cross-Domain-Policies', content: 'none' }
    ];

    securityHeaders.forEach(header => {
      const existingHeader = document.querySelector(`meta[name="${header.name}"]`);
      if (!existingHeader) {
        const meta = document.createElement('meta');
        meta.name = header.name;
        meta.content = header.content;
        document.head.appendChild(meta);
      }
    });

    // Enhanced security monitoring
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMsg = args.join(' ');
      if (errorMsg.includes('script') || errorMsg.includes('eval') || errorMsg.includes('innerHTML')) {
        if (import.meta.env.DEV) console.warn('[Security] Potential security issue detected:', errorMsg);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null; // This component doesn't render anything
};
