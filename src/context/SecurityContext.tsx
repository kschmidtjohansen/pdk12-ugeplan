
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateCSRFToken, ClientRateLimit } from '@/utils/inputSanitization';

interface SecurityContextType {
  csrfToken: string;
  refreshCSRFToken: () => void;
  checkRateLimit: (key: string, maxAttempts?: number) => boolean;
  resetRateLimit: (key: string) => void;
  isSecureContext: boolean;
}

const SecurityContext = createContext<SecurityContextType>({
  csrfToken: '',
  refreshCSRFToken: () => {},
  checkRateLimit: () => true,
  resetRateLimit: () => {},
  isSecureContext: false,
});

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [csrfToken, setCSRFToken] = useState<string>('');
  const [rateLimit] = useState(() => new ClientRateLimit());
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false);

  const refreshCSRFToken = () => {
    const newToken = generateCSRFToken();
    setCSRFToken(newToken);
    // Store in sessionStorage for validation
    try {
      sessionStorage.setItem('csrf_token', newToken);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Unable to store CSRF token:', error);
    }
  };

  const checkRateLimit = (key: string, maxAttempts: number = 5): boolean => {
    return rateLimit.check(key, maxAttempts);
  };

  const resetRateLimit = (key: string): void => {
    rateLimit.reset(key);
  };

  useEffect(() => {
    // Initialize CSRF token
    refreshCSRFToken();
    
    // Check if we're in a secure context
    setIsSecureContext(
      window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost'
    );

    // Refresh CSRF token periodically (every 30 minutes)
    const interval = setInterval(refreshCSRFToken, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Log security warnings for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isSecureContext) {
      if (import.meta.env.DEV) console.warn(
        '[Security Warning] Not in secure context. HTTPS should be used in production.'
      );
    }
  }, [isSecureContext]);

  return (
    <SecurityContext.Provider value={{
      csrfToken,
      refreshCSRFToken,
      checkRateLimit,
      resetRateLimit,
      isSecureContext,
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
