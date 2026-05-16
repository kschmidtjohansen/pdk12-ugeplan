import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard: never run the PWA service worker inside the Lovable editor preview
// (iframes or *.lovableproject.com / id-preview--*.lovable.app hosts).
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;
const isPreviewHost =
  host.includes('id-preview--') ||
  host.includes('lovableproject.com') ||
  host.includes('lovableproject-dev.com');

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}

createRoot(document.getElementById("root")!).render(<App />);
