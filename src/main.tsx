
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App.tsx';
import './index.css';

// The correct order is important: AuthProvider first, then TranslationProvider
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <TranslationProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </TranslationProvider>
  </AuthProvider>
);
