import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import LanguageSwitcher from './i18n/LanguageSwitcher'
import { showToast } from './toast'
import { dashboardFor, needsCompletion } from './authFlow'
import PhoneField from './PhoneField'
import { isValidPhone, phoneCountry, toE164 } from './phone'
import { insertProfile, updateProfile } from './profileSave'
import { consentMetadata, recordConsent } from './consent'
import WorkAreaPicker from './WorkAreaPicker'
import { loadMyWorkAreas, saveWorkAreas } from './areas'
import { useTranslation } from 'react-i18next'
import { tx } from './i18n/text'

type Role = 'vendor' | 'rider'

// Shown after Google or LinkedIn sign-in: collects a phone number and the person's agreement
// to the Terms before the account can be used.
function CompleteProfile() {
  useTranslation() // redraw when the language changes
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role | ''>('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [areas, setAreas] = useState<string[]>([])
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
      if (profile?.role === 'rider') setAreas((await loadMyWorkAreas(u.id)) ?? [])
      setLoading(false)
    }
    load()
  }, [navigate, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    if (!role) return setError(tx("Choose whether you are a vendor or a rider."))
    if (!name.trim()) return setError(tx("Enter your full name."))
    if (!isValidPhone(phone)) return setError(tx("Enter a valid phone number."))
    if (role === 'rider' && areas.length === 0) return setError(tx("Choose at least one area where you work."))
    if (!agreed) return setError(tx("Please agree to the Terms of Service and Privacy Policy to continue."))
    setError('')
    setSubmitting(true)

    const cleanName = name.trim()
    const cleanPhone = toE164(phone) ?? phone.trim()

    const { error: profileError } = hasProfile
      ? await updateProfile(user.id, { name: cleanName, phone: cleanPhone })
      : await insertProfile({ id: user.id, name: cleanName, phone: cleanPhone, role })

    if (profileError) {
      showToast(tx('Could not save your details:') + ' ' + profileError.message, 'error')
      setSubmitting(false)
      return
    }

    if (role === 'rider') {
      const areaError = await saveWorkAreas(areas)
      if (areaError) {
        showToast(tx('Your account is ready, but your work areas were not saved: {error} Add them in Settings.', { error: areaError }), 'error')
      }
    }

    await recordConsent('social_signup')

    const { error: consentError } = await supabase.auth.updateUser({
      data: consentMetadata(),
    })

    if (consentError) {
      showToast(tx('Could not record your agreement:') + ' ' + consentError.message, 'error')
      setSubmitting(false)
      return
    }

    showToast(tx("Welcome! Your account is ready."))
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
        <div className="lang-row"><LanguageSwitcher /></div>
        <h1 className="auth-title">{tx("Complete your profile")}</h1>
        <p className="auth-sub">{tx('One last step before you continue.')}{user?.email ? ' ' + user.email : ''}</p>

        <form onSubmit={handleSubmit} className="form-card" noValidate>
          {!hasProfile && (
            <div className="field">
              <span className="field-label" id="role-label">{tx("I am signing up as")}</span>
              <div className="role-choice-row" role="group" aria-labelledby="role-label">
                <button
                  type="button"
                  className={'role-choice' + (role === 'vendor' ? ' on' : '')}
                  aria-pressed={role === 'vendor'}
                  onClick={() => setRole('vendor')}
                >
                  <strong>{tx("Vendor")}</strong>
                  <span>{tx("I send deliveries")}</span>
                </button>
                <button
                  type="button"
                  className={'role-choice' + (role === 'rider' ? ' on' : '')}
                  aria-pressed={role === 'rider'}
                  onClick={() => setRole('rider')}
                >
                  <strong>{tx("Rider")}</strong>
                  <span>{tx("I make deliveries")}</span>
                </button>
              </div>
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="cp-name">{tx("Full name")}</label>
            <input
              id="cp-name"
              className="field-input"
              autoComplete="name"
              placeholder={tx("Your full name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="cp-phone">{tx("Phone number")}</label>
            <PhoneField id="cp-phone" value={phone} onChange={setPhone} />
          </div>

          {role === 'rider' && <WorkAreaPicker idPrefix="cp-areas" value={areas} onChange={setAreas} required defaultCountry={phoneCountry(phone)} />}

          <label className="check-row">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              {tx('I agree to the')}{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{tx("Terms of Service")}</Link>{' '}
              {tx('and')}{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{tx("Privacy Policy")}</Link>.
            </span>
          </label>

          {error && <p className="field-error" role="alert">{error}</p>}

          <button type="submit" className="btn-primary btn-block" disabled={submitting}>
            {submitting ? <><Spinner size="sm" /> {tx("Saving...")}</> : tx("Continue")}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {tx("Wrong account?")}{' '}
          <button type="button" onClick={useAnotherAccount} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', font: 'inherit' }}>
            {tx("Sign out")}
          </button>
        </p>
      </div>
    </div>
  )
}

export default CompleteProfile
