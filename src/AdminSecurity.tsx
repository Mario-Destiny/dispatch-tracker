import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'

type Factor = {
  id: string
  status: string
  factor_type?: string
  friendly_name?: string
}

type Enrolling = { id: string; qr: string; secret: string }

function SecurityTab() {
  const [factors, setFactors] = useState<Factor[] | null>(null)
  const [level, setLevel] = useState('')
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data } = await supabase.auth.mfa.listFactors()
    const all = ((data?.all ?? []) as Factor[]).filter((f) => f.factor_type === 'totp')
    setFactors(all)
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    setLevel(aal?.currentLevel ?? '')
  }

  useEffect(() => {
    load()
  }, [])

  async function startEnroll() {
    setBusy(true)

    for (const f of factors ?? []) {
      if (f.status !== 'verified') {
        await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Admin ' + new Date().toISOString(),
    })
    setBusy(false)

    if (error || !data) {
      showToast(
        (error?.message ?? 'Could not start setup') +
          '. Check that TOTP is enabled in Supabase under Authentication.',
        'error'
      )
      return
    }

    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
    setCode('')
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (!enrolling) return
    setBusy(true)

    const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId: enrolling.id })
    if (e1 || !ch) {
      setBusy(false)
      showToast(e1?.message ?? 'Could not start the check', 'error')
      return
    }

    const { error: e2 } = await supabase.auth.mfa.verify({
      factorId: enrolling.id,
      challengeId: ch.id,
      code: code.trim(),
    })
    setBusy(false)

    if (e2) {
      showToast('That code did not work. Check the time on your phone and try again.', 'error')
      return
    }

    setEnrolling(null)
    setCode('')
    showToast('Two-step verification is on. Sign out and back in to test it.')
    load()
  }

  async function removeFactor(f: Factor) {
    if (!window.confirm('Remove this authenticator? Your admin login will no longer need a code.')) return
    const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id })
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Authenticator removed.')
    load()
  }

  if (factors === null) return <Spinner />

  const verified = factors.filter((f) => f.status === 'verified')

  return (
    <>
      <p className="rider-hint">
        Two-step verification asks for a 6-digit code from an authenticator app (Google Authenticator, Authy, or similar)
        every time you sign in. This session: <strong>{level === 'aal2' ? 'verified with a code' : 'password only'}</strong>.
      </p>

      {verified.length > 0 ? (
        <>
          <div className="admin-warning" style={{ color: 'var(--green-fg)', background: 'var(--green-bg)' }}>
            Two-step verification is ON. Every admin action now needs a verified session.
          </div>
          <div className="client-list">
            {verified.map((f) => (
              <div key={f.id} className="client-row" style={{ alignItems: 'center' }}>
                <span>{f.friendly_name ?? 'Authenticator app'}</span>
                <button type="button" className="rider-btn rider-btn-danger" onClick={() => removeFactor(f)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <p className="rider-hint" style={{ marginTop: 12 }}>
            Next step: after you have signed out and back in once with your code, open the Settings tab and set
            <strong> require admin mfa</strong> to 1. Then no admin action works without two-step verification.
          </p>
        </>
      ) : enrolling ? (
        <form onSubmit={confirm} className="auth-form">
          <p className="rider-hint" style={{ margin: 0 }}>
            1. Open your authenticator app and scan this code, or type the secret by hand.
          </p>
          <img src={enrolling.qr} alt="Authenticator QR code" style={{ width: 200, height: 200, background: '#fff', borderRadius: 12, padding: 8 }} />
          <code style={{ wordBreak: 'break-all', color: 'var(--text)' }}>{enrolling.secret}</code>
          <div className="field">
            <label className="field-label" htmlFor="mfa-code">2. Enter the 6-digit code it shows</label>
            <input
              id="mfa-code"
              className="field-input"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ maxWidth: 200, letterSpacing: 4, fontWeight: 700 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary btn-sm" disabled={busy || code.length !== 6}>
              {busy ? <><Spinner size="sm" /> Checking...</> : 'Turn on'}
            </button>
            <button type="button" className="rider-btn" onClick={() => setEnrolling(null)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div className="admin-warning">
            Two-step verification is OFF. Anyone with your password could use these admin powers.
          </div>
          <div className="admin-actions">
            <button type="button" className="btn-primary btn-sm" onClick={startEnroll} disabled={busy}>
              {busy ? <><Spinner size="sm" /> Starting...</> : 'Set up authenticator app'}
            </button>
          </div>
        </>
      )}
    </>
  )
}

export default SecurityTab