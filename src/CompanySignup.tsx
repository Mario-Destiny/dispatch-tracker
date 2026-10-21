import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'

const SIZE_OPTIONS = ['1–5 riders', '6–20 riders', '21–50 riders', '51+ riders']
const TRACKING_OPTIONS = [
  'WhatsApp and phone calls',
  'Spreadsheet or paper',
  'Another app',
  'We do not track yet',
]

function CompanySignup() {
  const navigate = useNavigate()
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [size, setSize] = useState('')
  const [rcNumber, setRcNumber] = useState('')
  const [tracking, setTracking] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
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
      name: contactName.trim(),
      phone,
      role: 'company',
    })

    if (profileError) {
      showToast('Profile creation failed: ' + profileError.message, 'error')
      setLoading(false)
      return
    }

    const { error: companyError } = await supabase.rpc('create_company', {
      p_name: companyName,
      p_city: city,
      p_state: stateName,
      p_rider_count: size,
      p_rc_number: rcNumber || null,
      p_tracking: tracking || null,
    })

    if (companyError) {
      showToast('Company setup failed: ' + companyError.message, 'error')
      setLoading(false)
      return
    }

    showToast('Company created! Share your invite code with your riders.')
    navigate('/company')
  }

  return (
    <div className="page-bg">
      <div className="auth-wrap">
        <h1 className="auth-title">Company Sign Up</h1>
        <p className="auth-sub">
          For dispatch and courier companies. Manage your own riders and track every delivery.
        </p>

        <form onSubmit={handleSignup} className="form-card">
          <div className="field">
            <label className="field-label" htmlFor="co-name">Company name</label>
            <input
              id="co-name"
              className="field-input"
              placeholder="e.g. Swift Riders Logistics"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="co-contact">Your full name</label>
            <input
              id="co-contact"
              className="field-input"
              autoComplete="name"
              placeholder="Contact person"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="co-phone">Phone</label>
            <input
              id="co-phone"
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
            <label className="field-label" htmlFor="co-email">Email</label>
            <input
              id="co-email"
              className="field-input"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="co-password">Password</label>
            <input
              id="co-password"
              className="field-input"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="co-city">City</label>
            <input
              id="co-city"
              className="field-input"
              placeholder="e.g. Ikeja"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="co-state">State</label>
            <input
              id="co-state"
              className="field-input"
              placeholder="e.g. Lagos"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="co-size">How many riders do you have?</label>
            <select
              id="co-size"
              className="field-input"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
            >
              <option value="">Select</option>
              {SIZE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="co-rc">CAC / RC number (optional)</label>
            <input
              id="co-rc"
              className="field-input"
              placeholder="e.g. RC1234567"
              value={rcNumber}
              onChange={(e) => setRcNumber(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="co-tracking">How do you track deliveries today? (optional)</label>
            <select
              id="co-tracking"
              className="field-input"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            >
              <option value="">Select</option>
              {TRACKING_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Creating...</> : 'Create company account'}
          </button>

          <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
            By signing up you agree to our{' '}
            <Link to="/terms" style={{ color: 'var(--accent)' }}>Terms</Link> and{' '}
            <Link to="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
          </p>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default CompanySignup