type Toast = { id: number; message: string; type: 'success' | 'error' }
type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
let listeners: Listener[] = []
let nextId = 1

function notify() {
  listeners.forEach((listener) => listener(toasts))
}

export function subscribe(listener: Listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  const id = nextId++
  toasts = [...toasts, { id, message, type }]
  notify()

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, 3500)
}