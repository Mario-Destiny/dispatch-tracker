import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import LanguageSwitcher from './i18n/LanguageSwitcher'
import { showToast } from './toast'
import SocialButtons from './SocialButtons'
import PasswordFields, { passwordsOk } from './PasswordFields'
import TermsCheckbox from './TermsCheckbox'
import { consentMetadata, recordConsent } from './consent'
import PhoneField from './PhoneField'
import { isValidPhone } from './phone'
import { insertProfile } from './profileSave'
import { useTranslation } from 'react-i18next'
import { tx } from './i18n/text'

function VendorSignup() {
  useTranslation() // redraw when the language changes
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()

    if (!passwordsOk(password, confirm)) {
      showToast(tx("Passwords do not match."), 'error')
      return
    }
    if (!isValidPhone(phone)) {
      showToast(tx("Enter a valid phone number."), 'error')
      return
    }
    if (!agreed) {
      showToast(tx("Please agree to the Terms and Privacy Policy to continue."), 'error')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: consentMetadata() },
    })

    if (error) {
      showToast(tx('Signup failed:') + ' ' + error.message, 'error')
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      showToast(tx("Signup succeeded but no user ID returned."), 'error')
      setLoading(false)
      return
    }

    const { error: profileError } = await insertProfile({
      id: userId,
      name,
      phone,
      role: 'vendor',
    })

    if (profileError) {
      showToast(tx('Profile creation failed:') + ' ' + profileError.message, 'error')
      setLoading(false)
      return
    }

    await recordConsent('email_signup')
    navigate('/vendor')
  }

  return (
    <div className="page-bg">
      <div className="auth-wrap">
        <div className="lang-row"><LanguageSwitcher /></div>
        <h1 className="auth-title">{tx("Vendor Sign Up")}</h1>
        <p className="auth-sub">{tx("Create your account and start tracking deliveries.")}</p>

        <div className="form-card">
          <SocialButtons role="vendor" />

          <div className="auth-divider">{tx("or")}</div>

          <form onSubmit={handleSignup} className="auth-form">
            <div className="field">
              <label className="field-label" htmlFor="vendor-name">{tx("Full name")}</label>
              <input
                id="vendor-name"
                className="field-input"
                autoComplete="name"
                placeholder={tx("Your full name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="vendor-phone">{tx("Phone")}</label>
              <PhoneField id="vendor-phone" value={phone} onChange={setPhone} required />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="vendor-email">{tx("Email")}</label>
              <input
                id="vendor-email"
                className="field-input"
                type="email"
                autoComplete="email"
                placeholder={tx("you@example.com")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <PasswordFields
              idPrefix="vendor"
              password={password}
              confirm={confirm}
              onPasswordChange={setPassword}
              onConfirmChange={setConfirm}
            />

            <TermsCheckbox id="vendor-terms" checked={agreed} onChange={setAgreed} />

            <button type="submit" className="btn-primary btn-block" disabled={loading || !agreed || !passwordsOk(password, confirm)}>
              {loading ? <><Spinner size="sm" /> {tx("Signing up...")}</> : tx("Sign Up")}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {tx("Already have an account?")}{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>{tx("Log in")}</Link>
        </p>
      </div>
    </div>
  )
}

export default VendorSignup