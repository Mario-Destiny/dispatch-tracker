import { useEffect, useState } from 'react'
import { subscribe } from './toast'

type Toast = { id: number; message: string; type: 'success' | 'error' }

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return subscribe(setToasts)
  }, [])

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="fade-in-card"
          style={{
            background: t.type === 'success' ? '#16a34a' : '#dc2626',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            maxWidth: 320,
          }}
        >
          {t.type === 'success' ? '✅ ' : '⚠️ '}{t.message}
        </div>
      ))}
    </div>
  )
}

export default ToastContainer