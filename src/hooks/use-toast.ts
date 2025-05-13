
import { useToast as useToastOriginal } from "@/components/ui/use-toast";
import { toast as toastOriginal } from "@/components/ui/use-toast";

// Re-export the hooks
export const useToast = useToastOriginal;
export const toast = toastOriginal;
