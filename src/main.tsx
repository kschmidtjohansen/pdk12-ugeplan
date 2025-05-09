
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { NotificationProvider } from './context/NotificationContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <TranslationProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </TranslationProvider>
  </AuthProvider>
);
