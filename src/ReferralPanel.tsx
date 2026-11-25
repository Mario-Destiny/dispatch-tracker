import { useState } from 'react'
import { supabase } from './supabaseClient'
import { showToast } from './toast'
import { savedReferral, clearReferral } from './referral'

export type ReferralInfo = { code: string; can_enter_code: boolean; discount: boolean; rewards_this_year: number }

// A business's own referral link, plus the box for entering someone else's code.
function ReferralPanel({ info, onChange }: { info: ReferralInfo; onChange: () => void }) {
  const [code, setCode] = useState(savedReferral)
  const [busy, setBusy] = useState(false)
  const link = window.location.origin + '/signup?ref=' + info.code

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      showToast('Referral link copied.')
    } catch {
      showToast('Could not copy. Select the link and copy it.', 'error')
    }
  }

  async function claim(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { data, error } = await supabase.rpc('claim_referral', { p_code: code })
    setBusy(false)
    const result = data as { ok: boolean; reason?: string } | null
    if (error || !result?.ok) {
      showToast(error?.message || result?.reason || 'Could not use that code.', 'error')
      return
    }
    clearReferral()
    showToast('Code saved. Your first monthly payment is 20% off.')
    onChange()
  }

  return (
    <div style={{ marginTop: 16 }}>
      <span className="field-label">Refer a business, get 30 free days</span>
      <p className="rider-hint" style={{ margin: '6px 0 10px' }}>
        They get 20% off their first monthly payment. You get 30 free days after their first payment,
        up to 6 times a year. Earned in the last year: {info.rewards_this_year} of 6.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input className="field-input" readOnly value={link} aria-label="Your referral link" onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 220 }} />
        <button type="button" className="btn-primary btn-sm" onClick={copy}>Copy link</button>
      </div>

      {info.can_enter_code && (
        <form onSubmit={claim} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <input
            className="field-input"
            aria-label="Referral code"
            placeholder="Have a referral code?"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ flex: 1, minWidth: 220 }}
          />
          <button type="submit" className="btn-primary btn-sm" disabled={busy || code.trim().length !== 8}>Apply code</button>
        </form>
      )}
      {info.discount && <p className="rider-hint" style={{ marginTop: 10 }}>✓ 20% off applies to your first monthly payment.</p>}
    </div>
  )
}

export default ReferralPanel
