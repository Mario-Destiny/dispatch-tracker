import { useState } from 'react'
import { startOAuth } from './authFlow'
import type { Provider } from './authFlow'
import Spinner from './Spinner'
import { showToast } from './toast'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#ffffff" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.491 0-1.956.931-1.956 1.887v2.263h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

// Google and Facebook buttons used on the login and signup pages.
function SocialButtons({ role }: { role?: 'vendor' | 'rider' }) {
  const [busy, setBusy] = useState<Provider | null>(null)

  async function go(provider: Provider) {
    setBusy(provider)
    const error = await startOAuth(provider, role)
    if (error) {
      showToast(error, 'error')
      setBusy(null)
    }
  }

  return (
    <div className="social-buttons">
      <button type="button" className="btn-google" onClick={() => go('google')} disabled={busy !== null}>
        {busy === 'google' ? <><Spinner size="sm" /> Redirecting...</> : <><GoogleMark /> Continue with Google</>}
      </button>
      <button type="button" className="btn-facebook" onClick={() => go('facebook')} disabled={busy !== null}>
        {busy === 'facebook' ? <><Spinner size="sm" /> Redirecting...</> : <><FacebookMark /> Continue with Facebook</>}
      </button>
    </div>
  )
}

export default SocialButtons
