import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from './useTheme'
import { LAST_UPDATED } from './siteInfo'

type LegalPageProps = {
  title: string
  children: ReactNode
}

function LegalPage({ title, children }: LegalPageProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="page-bg">
      <div className="legal-wrap">
        <div className="legal-top">
          <Link to="/" className="legal-back">← Back to home</Link>
          <button
            onClick={toggleTheme}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text)' }}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        <h1 className="legal-title">{title}</h1>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        <div className="form-card legal-card">{children}</div>

        <div className="legal-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}

export default LegalPage