
import { useEffect } from 'react';

// Component to set security headers and CSP policies
export const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Set Content Security Policy via meta tag if not already set by server
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!existingCSP) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cyuyrpwtkljfiqwgasmn.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://cyuyrpwtkljfiqwgasmn.supabase.co wss://cyuyrpwtkljfiqwgasmn.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
      
      document.head.appendChild(cspMeta);
    }

    // Set additional security headers via meta tags
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { name: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=()' }
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

    // Monitor for potential XSS attempts
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMsg = args.join(' ');
      if (errorMsg.includes('script') || errorMsg.includes('eval') || errorMsg.includes('innerHTML')) {
        // Log potential XSS attempt
        fetch('/api/security/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'xss_attempt',
            message: 'Potential XSS attempt detected in console',
            details: { error: errorMsg, timestamp: new Date().toISOString() }
          })
        }).catch(() => {}); // Fail silently
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null; // This component doesn't render anything
};
