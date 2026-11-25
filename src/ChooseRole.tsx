import { Link } from 'react-router-dom'
import Logo from './Logo'

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
  return (
    <div className="page-bg">
      <div className="auth-wrap">
        <div className="role-pick-logo">
          <Link to="/" aria-label="Veritrack home"><Logo size={44} /></Link>
        </div>
        <h1 className="auth-title">How will you use Veritrack?</h1>
        <p className="auth-sub">Choose one to create your account.</p>

        <ul className="role-pick">
          {ROLES.map((r) => (
            <li key={r.to}>
              <Link to={r.to} className="role-pick-card">
                <span className="role-pick-icon" aria-hidden="true">{r.icon}</span>
                <span className="role-pick-text">
                  <strong>{r.title}</strong>
                  <span>{r.desc}</span>
                  {r.note && <small>{r.note}</small>}
                </span>
                <span className="role-pick-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default ChooseRole
