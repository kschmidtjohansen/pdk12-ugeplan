
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

const Index = () => {
  const { isAuthenticated, loading, authReady } = useAuth();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  if (import.meta.env.DEV) console.log('[Index] SESSION EXPIRATION FIX - Render state:', {
    isAuthenticated,
    loading,
    authReady,
    redirectAttempts
  });

  // Circuit breaker: Prevent infinite redirect loops
  useEffect(() => {
    const maxAttempts = 3;
    const timeWindow = 10000; // 10 seconds
    
    // Check for redirect loop
    const lastRedirectTime = sessionStorage.getItem('last-redirect-time');
    const currentTime = Date.now();
    
    if (lastRedirectTime) {
      const timeDiff = currentTime - parseInt(lastRedirectTime);
      if (timeDiff < timeWindow) {
        const attempts = parseInt(sessionStorage.getItem('redirect-attempts') || '0') + 1;
        setRedirectAttempts(attempts);
        sessionStorage.setItem('redirect-attempts', attempts.toString());
        
        if (attempts >= maxAttempts) {
          if (import.meta.env.DEV) console.error('[Index] SESSION EXPIRATION FIX - Redirect loop detected, showing debug info');
          setShowDebugInfo(true);
          return;
        }
      } else {
        // Reset attempts if enough time has passed
        sessionStorage.removeItem('redirect-attempts');
        setRedirectAttempts(0);
      }
    }
    
    sessionStorage.setItem('last-redirect-time', currentTime.toString());
  }, []);

  // Show debug info if we're in a redirect loop
  if (showDebugInfo || redirectAttempts >= 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-card rounded-xl border border-border shadow-sm p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sessionsproblem opdaget</h2>
          <p className="text-muted-foreground mb-4">
            Vi har registreret et muligt sessionsproblem. Dette kan ske, når din session udløber uventet.
          </p>
          <div className="bg-muted p-3 rounded mb-4 text-sm text-left">
            <p><strong>Debug-info:</strong></p>
            <p>Autentificeret: {isAuthenticated ? 'Ja' : 'Nej'}</p>
            <p>Indlæser: {loading ? 'Ja' : 'Nej'}</p>
            <p>Auth klar: {authReady ? 'Ja' : 'Nej'}</p>
            <p>Omdirigeringsforsøg: {redirectAttempts}</p>
          </div>
          <div className="space-y-2">
            <button 
              onClick={() => {
                sessionStorage.clear();
                window.location.href = '/login';
              }}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90 transition-colors"
            >
              Gå til login
            </button>
            <button 
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full bg-muted-foreground text-background py-2 px-4 rounded hover:bg-muted-foreground/90 transition-colors"
            >
              Ryd data og genindlæs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wait for auth to be ready before making any routing decisions
  if (!authReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-muted/30 to-muted/50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initialiserer godkendelse...</p>
          <div className="text-xs text-muted-foreground/60 mt-2">
            Auth klar: {authReady ? 'Ja' : 'Nej'} | Indlæser: {loading ? 'Ja' : 'Nej'}
          </div>
        </div>
      </div>
    );
  }

  // Clear redirect attempts on successful auth check
  if (authReady && !loading) {
    sessionStorage.removeItem('redirect-attempts');
    sessionStorage.removeItem('last-redirect-time');
  }

  // Route based on authentication status
  if (isAuthenticated) {
    if (import.meta.env.DEV) console.log('[Index] Redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  if (import.meta.env.DEV) console.log('[Index] Redirecting to login');
  return <Navigate to="/login" replace />;
};

export default Index;
