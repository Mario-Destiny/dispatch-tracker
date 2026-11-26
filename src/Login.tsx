import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import LanguageSwitcher from './i18n/LanguageSwitcher'
import { showToast } from './toast'
import SocialButtons from './SocialButtons'
import { CONTACT_EMAIL } from './siteInfo'
import { useTranslation } from 'react-i18next'
import { tx } from './i18n/text'

function Login() {
  useTranslation() // redraw when the language changes
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
           showToast(
        error.message.toLowerCase().includes('banned')
          ? tx('This account is suspended. Please contact {email}.', { email: CONTACT_EMAIL })
          : tx('Login failed:') + ' ' + error.message,
        'error'
      )
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      showToast(tx("Login succeeded but no user found."), 'error')
      setLoading(false)
      return
    }


        const { data: adminFlag } = await supabase.rpc('is_admin')
    if (adminFlag === true) {
      setLoading(false)
      navigate('/admin')
      return
    }

    // Look up their role so we send them to the right dashboard
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    setLoading(false)

    if (profileError || !profile) {
      showToast(tx("Could not find your profile. Please contact support."), 'error')
      return
    }

    if (profile.role === 'rider') navigate('/rider')
    else if (profile.role === 'company') navigate('/company')
    else navigate('/vendor')
  }

  return (
    <div className="page-bg">
      <div className="auth-wrap">
        <div className="lang-row"><LanguageSwitcher /></div>
        <h1 className="auth-title">{tx("Log In")}</h1>
        <p className="auth-sub">{tx("Welcome back. Sign in to your dashboard.")}</p>

        <div className="form-card" style={{ marginBottom: 16 }}>
          <SocialButtons />
          <div className="auth-divider">{tx("or log in with email")}</div>
        </div>

        <form onSubmit={handleLogin} className="form-card">
          <div className="field">
            <label className="field-label" htmlFor="login-email">{tx("Email")}</label>
            <input
              id="login-email"
              className="field-input"
              type="email"
              autoComplete="email"
              placeholder={tx("you@example.com")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="login-password">{tx("Password")}</label>
            <input
              id="login-password"
              className="field-input"
              type="password"
              autoComplete="current-password"
              placeholder={tx("Your password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? <><Spinner size="sm" /> {tx("Logging in...")}</> : tx("Log In")}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {tx("Don't have an account? Sign up as a")}{' '}
          <Link to="/signup/vendor" style={{ color: 'var(--accent)' }}>{tx('vendor')}</Link>,{' '}
          <Link to="/signup/rider" style={{ color: 'var(--accent)' }}>{tx('rider')}</Link> {tx('or')}{' '}
          <Link to="/signup/company" style={{ color: 'var(--accent)' }}>{tx('company')}</Link>.
        </p>
      </div>
    </div>
  )
}

export default Login