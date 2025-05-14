
import * as React from "react"
import { 
  Toast as ToastPrimitive, 
  ToastActionElement, 
  ToastProps 
} from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

export type ToastType = Pick<
  ToastPrimitive, 
  "id" | "title" | "description" | "action" | "variant"
>

interface State {
  toasts: ToastType[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToastType
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToastType>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToastType["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToastType["id"]
    }

interface ToastContext extends State {
  toast: (props: ToastProps) => void
  dismiss: (toastId?: string) => void
}

const ToastContext = React.createContext<ToastContext | null>(null)

function toastReducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // If no toast id, dismiss all
      if (toastId === undefined) {
        return {
          ...state,
          toasts: state.toasts.map((t) => ({
            ...t,
            open: false,
          })),
        }
      }

      // Dismiss specific toast
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t, open: false } : t
        ),
      }
    }

    case "REMOVE_TOAST": {
      const { toastId } = action

      if (toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      }
    }
  }
}

export const ToastProvider = (props: { children: React.ReactNode }) => {
  const [state, dispatch] = React.useReducer(toastReducer, {
    toasts: [],
  })

  React.useEffect(() => {
    state.toasts.forEach((toast) => {
      if (toast.id && !toast.open && !toastTimeouts.has(toast.id)) {
        const timeout = setTimeout(() => {
          dispatch({
            type: "REMOVE_TOAST",
            toastId: toast.id,
          })
          toastTimeouts.delete(toast.id)
        }, TOAST_REMOVE_DELAY)

        toastTimeouts.set(toast.id, timeout)
      }
    })
  }, [state.toasts])

  const toast = React.useCallback(
    ({ ...props }: ToastProps) => {
      const id = genId()

      dispatch({
        type: "ADD_TOAST",
        toast: {
          ...props,
          id,
          open: true,
        },
      })

      return id
    },
    [dispatch]
  )

  const dismiss = React.useCallback(
    (toastId?: string) => {
      dispatch({
        type: "DISMISS_TOAST",
        toastId,
      })
    },
    [dispatch]
  )

  return (
    <ToastContext.Provider
      value={{
        ...state,
        toast,
        dismiss,
      }}
    >
      {props.children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)

  if (context === null) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return context
}

export const toast = (props: ToastProps) => {
  const { toast } = useToast()
  return toast(props)
}
