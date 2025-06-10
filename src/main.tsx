
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App.tsx';
import './index.css';

// The correct order is important: ThemeProvider first for dark mode, then AuthProvider, TranslationProvider, and NotificationProvider
createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="polygon-ui-theme">
    <AuthProvider>
      <TranslationProvider>
        <NotificationProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </NotificationProvider>
      </TranslationProvider>
    </AuthProvider>
  </ThemeProvider>
);
