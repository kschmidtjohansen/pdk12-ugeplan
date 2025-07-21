
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-2">
              {title && (
                <ToastTitle className="font-semibold text-sm">
                  {typeof title === 'string' ? title : String(title)}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-sm leading-relaxed">
                  {typeof description === 'string' ? description : String(description)}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
