import { Link } from 'react-router-dom'
import { useTheme } from './useTheme'
import Logo from './Logo'
import AnimatedBackground from './AnimatedBackground'
import AppShowcase from './AppShowcase'

function IconIllustration({ type }: { type: 'pin' | 'clock' | 'tag' }) {
  const common = { fill: 'none', stroke: 'var(--accent)', strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  if (type === 'pin') {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24">
        <path {...common} d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11z" />
        <circle {...common} cx="12" cy="10" r="2.5" />
      </svg>
    )
  }
  if (type === 'clock') {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24">
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 7v5l3.5 2" />
      </svg>
    )
  }
  return (
    <svg width="40" height="40" viewBox="0 0 24 24">
      <path {...common} d="M20 12l-8 8-9-9V4h7l10 8z" />
      <circle {...common} cx="7.5" cy="7.5" r="1" />
    </svg>
  )
}

function PitchPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', position: 'relative' }}>
      <AnimatedBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 40px', borderBottom: '1px solid var(--border)',
        }}>
          <Link to="/" aria-label="Veritrack home" style={{ display: 'flex', alignItems: 'center' }}><Logo size={48} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/login" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>
              Log In
            </Link>
            <button onClick={toggleTheme} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              padding: '6px 12px', color: 'var(--text)',
            }}>
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </nav>

        <div style={{ textAlign: 'center', padding: '90px 20px 40px', maxWidth: 700, margin: '0 auto' }}>
          <h1 className="brand-headline" style={{ fontSize: 38, color: 'var(--text)', lineHeight: 1.4, margin: '0 0 20px' }}>
            You sent a delivery. Now you're just... waiting.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            Veritrack gives every delivery a status, a rider, and a code your customer can
            check themselves — no app to download, no phone calls, no guessing.
          </p>
          <Link to="/home" style={{
            background: 'var(--accent)', color: '#fff', padding: '14px 28px',
            borderRadius: 8, textDecoration: 'none', fontWeight: 600, display: 'inline-block',
          }}>
            See the Platform →
          </Link>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)', padding: '18px 20px', textAlign: 'center',
          fontSize: 14, color: 'var(--text-secondary)',
        }}>
          Built for the Federal Ministry of Education's <strong style={{ color: 'var(--text)' }}>Student Venture Capital Grant (S-VCG)</strong> Programme &nbsp;•&nbsp; A live, working product — not a concept
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 20px 40px' }}>
          <h2 style={{ color: 'var(--text)' }}>The Problem</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 16 }}>
            Across Nigeria, small vendors and informal dispatch riders coordinate deliveries almost
            entirely through phone calls and trust. There's no record of who has a package, where
            it is, or when it's expected to arrive. When something goes wrong — a delay, a denied
            pickup, a lost item — there's no way to know who to hold accountable.
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 20px 60px' }}>
          <h2 style={{ color: 'var(--text)', textAlign: 'center' }}>The Fix</h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 32, marginTop: 24,
          }}>
            {[
              { icon: 'pin' as const, title: 'Every delivery is tracked', desc: 'From pickup to drop-off, every delivery has a clear, current status.' },
              { icon: 'clock' as const, title: 'Every update is timestamped', desc: 'Status changes are recorded the moment they happen, not remembered later.' },
              { icon: 'tag' as const, title: 'Customers get a code, not a call', desc: 'A simple tracking code replaces the "where is my order" phone call.' },
            ].map((f) => (
              <div key={f.title} style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 12 }}><IconIllustration type={f.icon} /></div>
                <strong style={{ color: 'var(--text)' }}>{f.title}</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '60px 20px' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{ color: 'var(--text)' }}>Why I Built This</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 16 }}>
              I'm a self-taught software developer from Nigeria. I built Veritrack end to
              end because I kept noticing the same problem everywhere, VENDORS and RIDERS
              coordinating deliveries with nothing but phone calls and hope. This is my submission
              to the Federal Ministry of Education's S-VCG programme, and it's a real, working
              product, not just a pitch deck.
            </p>
            <AppShowcase />
            <p style={{ color: 'var(--text)', fontWeight: 600, marginTop: 16 }}>— Bright Dimkpa</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '70px 20px' }}>
          <h2 style={{ color: 'var(--text)' }}>Ready to see it in action?</h2>
          <Link to="/home" style={{
            background: 'var(--accent)', color: '#fff', padding: '14px 28px',
            borderRadius: 8, textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginTop: 12,
          }}>
            Enter the Platform →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PitchPage