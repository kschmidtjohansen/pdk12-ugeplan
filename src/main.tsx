
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { NotificationProvider } from './context/NotificationContext';
import { DepartmentProvider } from './context/DepartmentContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App.tsx';
import './index.css';

// The correct order is important: AuthProvider first, then TranslationProvider, then NotificationProvider
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <DepartmentProvider>
      <TranslationProvider>
        <NotificationProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </NotificationProvider>
      </TranslationProvider>
    </DepartmentProvider>
  </AuthProvider>
);
