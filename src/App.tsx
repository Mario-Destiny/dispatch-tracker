import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import VendorView from './VendorView'
import RiderView from './RiderView'
import VendorSignup from './VendorSignup'
import RiderSignup from './RiderSignup'
import AuthCallback from './AuthCallback'
import CompleteProfile from './CompleteProfile'
import TrackPage from './TrackPage'
import Login from './Login'
import CompanySignup from './CompanySignup'
import BusinessPage from './BusinessPage'
import AdminPage from './AdminPage'
import StatusGate from './StatusGate'
import Settings from './Settings'
import CustomerPin from './CustomerPin'
import VendorShowcase from './VendorShowcase'
import RiderShowcase from './RiderShowcase'
import Testimonials from './Testimonials'
import PitchPage from './PitchPage'
import AnimatedBackground from './AnimatedBackground'
import { useTheme } from './useTheme'
import Logo from './Logo'
import './App.css'
import ToastContainer from './ToastContainer'
import Privacy from './Privacy'
import Terms from './Terms'
import { CONTACT_EMAIL } from './siteInfo'

function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 300" width="100%" height="auto" style={{ maxWidth: 400 }}>
      <rect x="20" y="180" width="360" height="6" rx="3" fill="var(--border)" />
      <circle cx="120" cy="220" r="30" fill="none" stroke="var(--accent)" strokeWidth="6" />
      <circle cx="280" cy="220" r="30" fill="none" stroke="var(--accent)" strokeWidth="6" />
      <rect x="90" y="120" width="150" height="80" rx="10" fill="var(--bg-secondary)" stroke="var(--accent)" strokeWidth="4" />
      <rect x="240" y="140" width="60" height="60" rx="8" fill="var(--accent)" opacity="0.15" stroke="var(--accent)" strokeWidth="3" />
      <line x1="120" y1="120" x2="120" y2="90" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
      <line x1="120" y1="90" x2="160" y2="70" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
      <rect x="110" y="145" width="30" height="30" rx="4" fill="var(--accent)" />
      <rect x="150" y="145" width="30" height="30" rx="4" fill="var(--accent)" opacity="0.6" />
      <rect x="190" y="145" width="30" height="30" rx="4" fill="var(--accent)" opacity="0.3" />
    </svg>
  )
}

export function Home() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', position: 'relative' }}>
      <AnimatedBackground />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Link to="/" aria-label="Veritrack home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}><Logo size={44} /></Link>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text)', marginRight: 16, textDecoration: 'none', fontWeight: 600 }}>
              Log In
            </Link>
            <Link to="/track" style={{ color: 'var(--text)', marginRight: 16, textDecoration: 'none', fontWeight: 600 }}>
              Track Order
            </Link>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 12px',
                color: 'var(--text)',
              }}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 60,
          padding: '80px 40px 60px',
          flexWrap: 'wrap',
        }}>
          <div style={{ maxWidth: 480 }}>
            <h1 style={{ fontSize: 42, margin: '0 0 16px', color: 'var(--text)' }}>
              Track every delivery, end to end
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 32 }}>
              A simple dispatch tracking tool built for local vendors and riders — know exactly where every delivery is, in real time.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/signup/vendor" style={{
                background: 'var(--accent)', color: '#fff', padding: '12px 24px',
                borderRadius: 8, textDecoration: 'none', fontWeight: 600,
              }}>
                Sign Up as Vendor
              </Link>
              <Link to="/signup/rider" style={{
                background: 'var(--bg-secondary)', color: 'var(--text)', padding: '12px 24px',
                borderRadius: 8, textDecoration: 'none', fontWeight: 600, border: '1px solid var(--border)',
              }}>
                Sign Up as Rider
              </Link>
            </div>
          </div>
          <HeroIllustration />
        </div>

        {/* How it works */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)', padding: '60px 20px',
          display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap',
        }}>
          {[
            { title: '1. Create a delivery', desc: 'Vendors log item, pickup, and drop-off details.' },
            { title: '2. Rider updates status', desc: 'Riders mark progress as they pick up and deliver.' },
            { title: '3. Everyone sees live status', desc: 'No more guessing — status updates in real time.' },
          ].map((step) => (
            <div key={step.title} style={{ maxWidth: 240, textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text)' }}>{step.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{step.desc}</p>
            </div>
          ))}
        </div>

        <VendorShowcase />
        <RiderShowcase />
        <Testimonials />

        {/* About */}
        <div style={{ padding: '60px 40px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text)' }}>About This Project</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Veritrack was built to solve a real, everyday problem for small vendors and
            informal dispatch riders across Nigeria — the lack of visibility into where a delivery
            actually is. This project is submitted under the Federal Ministry of Education's
            Student Venture Capital Grant (S-VCG) programme, supporting student-led innovation
            in Technology and Logistics under the STEMM initiative.
          </p>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border)',
          padding: '32px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          color: 'var(--text-secondary)',
          fontSize: 14,
        }}>
          <div>
            <strong style={{ color: 'var(--text)' }}>Veritrack</strong>
                       <p>Contact: <a href={'mailto:' + CONTACT_EMAIL} style={{ color: 'var(--text-secondary)' }}>{CONTACT_EMAIL}</a></p>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/" style={{ color: 'var(--text-secondary)' }}>About This Project</Link>
                      <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'var(--text-secondary)' }}>Terms of Service</Link>
          </div>
          <div>© {new Date().getFullYear()} Veritrack. All rights reserved.</div>
        </footer>
      </div>
    </div>
  )
}

// Only these pages may appear in search results. Everything else gets a noindex tag.
const PUBLIC_PATHS = ['/', '/home', '/privacy', '/terms']

// Tells search engines not to index private, personal or unknown pages, even if they run JavaScript.
function RobotsMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
    const isPublic = PUBLIC_PATHS.includes(clean) || clean.startsWith('/b/')
    let tag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    if (!isPublic) {
      if (!tag) {
        tag = document.createElement('meta')
        tag.name = 'robots'
        document.head.appendChild(tag)
      }
      tag.content = 'noindex, nofollow'
    } else if (tag) {
      tag.remove()
    }
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <div className="page-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
      <div>
        <h1 style={{ color: 'var(--text)' }}>Page not found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link to="/" style={{
          background: 'var(--accent)', color: '#fff', padding: '12px 24px',
          borderRadius: 8, textDecoration: 'none', fontWeight: 600, display: 'inline-block',
        }}>
          Back to home
        </Link>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <>
      <RobotsMeta />
      <ToastContainer />
      <Routes>

  <Route path="/" element={<PitchPage />} />
  <Route path="/home" element={<Home />} />
                  <Route path="/vendor" element={<StatusGate><VendorView key="vendor" /></StatusGate>} />
                <Route path="/company" element={<StatusGate><VendorView key="company" mode="company" /></StatusGate>} />
          <Route path="/rider" element={<StatusGate><RiderView /></StatusGate>} />
  <Route path="/signup/vendor" element={<VendorSignup />} />
  <Route path="/signup/rider" element={<RiderSignup />} />
          <Route path="/signup/company" element={<CompanySignup />} />
                  <Route path="/b/:slug" element={<BusinessPage />} />
                          <Route path="/admin" element={<AdminPage />} />
                                  <Route path="/l/:token" element={<CustomerPin />} />
  <Route path="/auth/callback" element={<AuthCallback />} />
  <Route path="/complete-profile" element={<CompleteProfile />} />
  <Route path="/settings" element={<StatusGate><Settings /></StatusGate>} />
  <Route path="/track" element={<TrackPage />} />
  <Route path="/login" element={<Login />} />
  <Route path="/pitch" element={<Navigate to="/" replace />} />
          <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App