
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

const Index = () => {
  const { isAuthenticated, loading, authReady } = useAuth();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  console.log('[Index] COMPREHENSIVE FIX - Render state:', {
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
          console.error('[Index] COMPREHENSIVE FIX - Redirect loop detected, showing debug info');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Issue Detected</h2>
          <p className="text-gray-600 mb-4">
            We detected a redirect loop. This usually happens when there's an authentication state issue.
          </p>
          <div className="bg-gray-50 p-3 rounded mb-4 text-sm text-left">
            <p><strong>Debug Info:</strong></p>
            <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Auth Ready: {authReady ? 'Yes' : 'No'}</p>
            <p>Redirect Attempts: {redirectAttempts}</p>
          </div>
          <div className="space-y-2">
            <button 
              onClick={() => {
                sessionStorage.clear();
                window.location.href = '/login';
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Force Login Page
            </button>
            <button 
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wait for auth to be ready before making any routing decisions
  if (!authReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing authentication...</p>
          <div className="text-xs text-gray-400 mt-2">
            Auth Ready: {authReady ? 'Yes' : 'No'} | Loading: {loading ? 'Yes' : 'No'}
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
    console.log('[Index] COMPREHENSIVE FIX - User authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[Index] COMPREHENSIVE FIX - User not authenticated, redirecting to login');
  return <Navigate to="/login" replace />;
};

export default Index;
