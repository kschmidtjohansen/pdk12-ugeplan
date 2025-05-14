
import { useToast as useShadcnToast } from '@/components/ui/use-toast';

// Re-export the useToast hook from shadcn UI components
export const useToast = useShadcnToast;

// Re-export the ToastProvider for use in main.tsx
export { ToastProvider } from '@/components/ui/toaster';
