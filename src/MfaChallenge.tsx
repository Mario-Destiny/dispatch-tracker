import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'

function MfaChallenge({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)

    const { data: list } = await supabase.auth.mfa.listFactors()
    const factor = list?.totp?.[0]
    if (!factor) {
      setBusy(false)
      showToast('No authenticator found on this account.', 'error')
      return
    }

    const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId: factor.id })
    if (e1 || !ch) {
      setBusy(false)
      showToast(e1?.message ?? 'Could not start the check', 'error')
      return
    }

    const { error: e2 } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: ch.id,
      code: code.trim(),
    })
    setBusy(false)

    if (e2) {
      showToast('That code did not work. Try the next one.', 'error')
      setCode('')
      return
    }

    onDone()
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="page-bg">
      <div className="auth-wrap">
        <h1 className="auth-title">Two-step verification</h1>
        <p className="auth-sub">Enter the 6-digit code from your authenticator app.</p>

        <form onSubmit={submit} className="form-card">
          <div className="field">
            <label className="field-label" htmlFor="mfa-login-code">Code</label>
            <input
              id="mfa-login-code"
              className="field-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ letterSpacing: 6, fontWeight: 700, textAlign: 'center' }}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={busy || code.length !== 6}>
            {busy ? <><Spinner size="sm" /> Checking...</> : 'Verify'}
          </button>
          <button type="button" className="rider-btn" onClick={logout}>Log out</button>
        </form>
      </div>
    </div>
  )
}

export default MfaChallenge