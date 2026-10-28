import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'
import { dashboardFor, isValidPhone, needsCompletion } from './authFlow'
import { consentMetadata, recordConsent } from './consent'

type Role = 'vendor' | 'rider'

// Shown after Google or LinkedIn sign-in: collects a phone number and the person's agreement
// to the Terms before the account can be used.
function CompleteProfile() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role | ''>('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        navigate('/login', { replace: true })
        return
      }
      const u = data.user

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone, role')
        .eq('id', u.id)
        .maybeSingle()

      if (profile && !needsCompletion(u, profile)) {
        navigate(dashboardFor(profile.role), { replace: true })
        return
      }

      const fromUrl = searchParams.get('role')
      setUser(u)
      setHasProfile(Boolean(profile))
      setRole(
        profile?.role === 'vendor' || profile?.role === 'rider'
          ? profile.role
          : fromUrl === 'vendor' || fromUrl === 'rider'
            ? fromUrl
            : ''
      )
      setName(
        profile?.name ||
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          (u.email ? u.email.split('@')[0] : '')
      )
      setPhone(profile?.phone ?? '')
      setLoading(false)
    }
    load()
  }, [navigate, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    if (!role) return setError('Choose whether you are a vendor or a rider.')
    if (!name.trim()) return setError('Enter your full name.')
    if (!isValidPhone(phone)) return setError('Enter a valid phone number.')
    if (!agreed) return setError('Please agree to the Terms of Service and Privacy Policy to continue.')
    setError('')
    setSubmitting(true)

    const cleanName = name.trim()
    const cleanPhone = phone.trim()

    const { error: profileError } = hasProfile
      ? await supabase.from('profiles').update({ name: cleanName, phone: cleanPhone }).eq('id', user.id)
      : await supabase.from('profiles').insert({ id: user.id, name: cleanName, phone: cleanPhone, role })

    if (profileError) {
      showToast('Could not save your details: ' + profileError.message, 'error')
      setSubmitting(false)
      return
    }

    await recordConsent('social_signup')

    const { error: consentError } = await supabase.auth.updateUser({
      data: consentMetadata(),
    })

    if (consentError) {
      showToast('Could not record your agreement: ' + consentError.message, 'error')
      setSubmitting(false)
      return
    }

    showToast('Welcome! Your account is ready.')
    navigate(dashboardFor(role), { replace: true })
  }

  async function useAnotherAccount() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div className="page-bg">
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="page-bg">
      <div className="auth-wrap">
        <h1 className="auth-title">Complete your profile</h1>
        <p className="auth-sub">One last step before you continue{user?.email ? ' as ' + user.email : ''}.</p>

        <form onSubmit={handleSubmit} className="form-card" noValidate>
          {!hasProfile && (
            <div className="field">
              <span className="field-label" id="role-label">I am signing up as</span>
              <div className="role-choice-row" role="group" aria-labelledby="role-label">
                <button
                  type="button"
                  className={'role-choice' + (role === 'vendor' ? ' on' : '')}
                  aria-pressed={role === 'vendor'}
                  onClick={() => setRole('vendor')}
                >
                  <strong>Vendor</strong>
                  <span>I send deliveries</span>
                </button>
                <button
                  type="button"
                  className={'role-choice' + (role === 'rider' ? ' on' : '')}
                  aria-pressed={role === 'rider'}
                  onClick={() => setRole('rider')}
                >
                  <strong>Rider</strong>
                  <span>I make deliveries</span>
                </button>
              </div>
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="cp-name">Full name</label>
            <input
              id="cp-name"
              className="field-input"
              autoComplete="name"
              placeholder="e.g. Amaka Eze"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="cp-phone">Phone number</label>
            <input
              id="cp-phone"
              className="field-input"
              type="tel"
              autoComplete="tel"
              placeholder="e.g. 0801 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <label className="check-row">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to the{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
            </span>
          </label>

          {error && <p className="field-error" role="alert">{error}</p>}

          <button type="submit" className="btn-primary btn-block" disabled={submitting}>
            {submitting ? <><Spinner size="sm" /> Saving...</> : 'Continue'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Wrong account?{' '}
          <button type="button" onClick={useAnotherAccount} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', font: 'inherit' }}>
            Sign out
          </button>
        </p>
      </div>
    </div>
  )
}

export default CompleteProfile
