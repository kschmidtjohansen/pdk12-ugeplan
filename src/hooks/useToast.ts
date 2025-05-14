
// Re-export from the hooks folder
import { useToast as useToastHook, toast as toastFunction } from "./use-toast";

export const useToast = useToastHook;
export const toast = toastFunction;
export { ToastProvider } from "./use-toast";
