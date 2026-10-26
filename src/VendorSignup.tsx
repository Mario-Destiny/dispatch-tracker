import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'
import SocialButtons from './SocialButtons'
import PasswordFields, { passwordsOk } from './PasswordFields'
import TermsCheckbox from './TermsCheckbox'

function VendorSignup() {
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
      showToast('Passwords do not match.', 'error')
      return
    }
    if (!agreed) {
      showToast('Please agree to the Terms and Privacy Policy to continue.', 'error')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      showToast('Signup failed: ' + error.message, 'error')
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      showToast('Signup succeeded but no user ID returned.', 'error')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      name,
      phone,
      role: 'vendor',
    })

    if (profileError) {
      showToast('Profile creation failed: ' + profileError.message, 'error')
      setLoading(false)
      return
    }

    navigate('/vendor')
  }

  return (
    <div className="page-bg">
      <div className="auth-wrap">
        <h1 className="auth-title">Vendor Sign Up</h1>
        <p className="auth-sub">Create your account and start tracking deliveries.</p>

        <div className="form-card">
          <SocialButtons role="vendor" />

          <div className="auth-divider">or</div>

          <form onSubmit={handleSignup} className="auth-form">
            <div className="field">
              <label className="field-label" htmlFor="vendor-name">Full name</label>
              <input
                id="vendor-name"
                className="field-input"
                autoComplete="name"
                placeholder="e.g. Amaka Eze"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="vendor-phone">Phone</label>
              <input
                id="vendor-phone"
                className="field-input"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. 0801 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="vendor-email">Email</label>
              <input
                id="vendor-email"
                className="field-input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
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
              {loading ? <><Spinner size="sm" /> Signing up...</> : 'Sign Up'}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default VendorSignup