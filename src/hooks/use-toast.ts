
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToasterActionElement
}

type ToasterActionElement = React.ReactNode

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

// Session storage key for tracking shown toasts
const SHOWN_TOASTS_KEY = "polygon-shown-toast-ids";

// Get already shown toast IDs from session storage
const getShownToastIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(SHOWN_TOASTS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (err) {
    console.error("Error reading toast history from localStorage:", err);
    return new Set();
  }
};

// Save a toast ID to session storage
const saveShownToastId = (id: string): void => {
  try {
    const shownIds = getShownToastIds();
    shownIds.add(id);
    localStorage.setItem(SHOWN_TOASTS_KEY, JSON.stringify(Array.from(shownIds)));
  } catch (err) {
    console.error("Error saving toast history to localStorage:", err);
  }
};

// Check if a toast has already been shown this session
const hasToastBeenShown = (title: string, description?: string): boolean => {
  try {
    const shownIds = getShownToastIds();
    const toastKey = `${title}:${description || ''}`;
    return shownIds.has(toastKey);
  } catch (err) {
    console.error("Error checking toast history:", err);
    return false;
  }
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
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

      if (toastId) {
        toastTimeouts.set(
          toastId,
          setTimeout(() => {
            toastTimeouts.delete(toastId)
          }, TOAST_REMOVE_DELAY)
        )
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  // Check for duplicates based on content
  if (props.title && hasToastBeenShown(String(props.title), props.description ? String(props.description) : undefined)) {
    console.log('Toast already shown, skipping:', props.title);
    return {
      id: '',
      dismiss: () => {}
    }
  }

  const id = genId()

  // Save this toast to session storage
  if (props.title) {
    const toastKey = `${props.title}:${props.description || ''}`;
    saveShownToastId(toastKey);
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
    },
  })

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    clear: () => dispatch({ type: "REMOVE_TOAST" }),
  }
}

export { useToast, toast }
