
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '@/hooks/use-toast';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
