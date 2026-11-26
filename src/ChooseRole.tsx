import { Link } from 'react-router-dom'
import Logo from './Logo'
import LanguageSwitcher from './i18n/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import { tx } from './i18n/text'

const ROLES = [
  { to: '/signup/vendor', icon: '📦', title: 'Vendor', desc: 'I send deliveries' },
  {
    to: '/signup/rider',
    icon: '🛵',
    title: 'Rider',
    desc: 'I make deliveries',
    note: 'Joining a company? Enter its invite code on your dashboard after signing up.',
  },
  { to: '/signup/company', icon: '🏢', title: 'Delivery company', desc: 'I manage a fleet of riders' },
]

// Where "Get started" leads: the person picks a role before seeing a signup form.
function ChooseRole() {
  useTranslation() // redraw when the language changes
  return (
    <div className="page-bg">
      <div className="auth-wrap">
        <div className="lang-row"><LanguageSwitcher /></div>
        <div className="role-pick-logo">
          <Link to="/" aria-label={tx("Veritrack home")}><Logo size={44} /></Link>
        </div>
        <h1 className="auth-title">{tx("How will you use Veritrack?")}</h1>
        <p className="auth-sub">{tx("Choose one to create your account.")}</p>

        <ul className="role-pick">
          {ROLES.map((r) => (
            <li key={r.to}>
              <Link to={r.to} className="role-pick-card">
                <span className="role-pick-icon" aria-hidden="true">{r.icon}</span>
                <span className="role-pick-text">
                  <strong>{tx(r.title)}</strong>
                  <span>{tx(r.desc)}</span>
                  {r.note && <small>{tx(r.note)}</small>}
                </span>
                <span className="role-pick-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {tx("Already have an account?")}{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>{tx("Log in")}</Link>
        </p>
      </div>
    </div>
  )
}

export default ChooseRole
