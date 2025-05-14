
// Re-export from the hooks folder
import { useToast as useToastHook, toast as toastFunction, ToastProvider } from "@/hooks/use-toast";

export const useToast = useToastHook;
export const toast = toastFunction;
export { ToastProvider };
