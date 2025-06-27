import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { TranslationProvider } from './context/TranslationContext.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'
import { SecurityProvider } from './context/SecurityContext.tsx'
import { SessionSecurity } from './utils/sessionSecurity';
import { DataRetentionManager } from './utils/dataRetention';

// Initialize security measures
SessionSecurity.initialize();
DataRetentionManager.schedulePeriodicCleanup();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SecurityProvider>
      <AuthProvider>
        <TranslationProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </TranslationProvider>
      </AuthProvider>
    </SecurityProvider>
  </React.StrictMode>,
)

// Cleanup on app unmount
window.addEventListener('beforeunload', () => {
  SessionSecurity.cleanup();
});
