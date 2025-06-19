
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean main.tsx - all providers are handled in App.tsx
createRoot(document.getElementById("root")!).render(<App />);
