import { USD_PRICING } from './pricing'

const KEY = 'veritrack-ref'
const MAX_AGE = 30 * 24 * 60 * 60 * 1000

// Remembers a code from a link such as /signup?ref=AB12CD34 until the business can use it.
export function captureReferral() {
  if (!USD_PRICING || typeof window === 'undefined') return
  const code = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase()
  if (!code || !/^[A-Z0-9]{8}$/.test(code)) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }))
  } catch {
    /* storage can be blocked; the code can still be typed in */
  }
}

export function savedReferral(): string {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || 'null') as { code?: string; at?: number } | null
    return v?.code && v.at && Date.now() - v.at < MAX_AGE ? v.code : ''
  } catch {
    return ''
  }
}

export function clearReferral() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
