import { Link } from 'react-router-dom'
import { useTheme } from './useTheme'
import Logo from './Logo'
import AnimatedBackground from './AnimatedBackground'
import AppShowcase from './AppShowcase'
import DeliveryMapDemo from './DeliveryMapDemo'
import { CONTACT_EMAIL, SITE_NAME } from './siteInfo'
import { PRICING } from './pricing'

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
          <Link to="/" aria-label="Veritrack home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}><Logo size={44} /></Link>
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
          <div className="lp-cta-row">
            <Link to="/signup/vendor" className="lp-btn lp-btn-primary">Get started free</Link>
            <Link to="/login" className="lp-btn lp-btn-ghost">Log in</Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 14 }}>
            <Link to="/home" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Or take a look around the platform →
            </Link>
          </p>
        </div>

        <div className="lp-proof">
          <span>Free to start</span>
          <span>Works on any phone</span>
          <span>Customers need no app</span>
        </div>

        <div className="lp-section">
          <h2>Know where every delivery stands</h2>
          <p className="lp-sub">Pinned drop-off, clear status, one tracking code.</p>
          <DeliveryMapDemo />
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 40px' }}>
          <h2 style={{ color: 'var(--text)' }}>The Problem</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 16 }}>
            Across Nigeria, small vendors and informal dispatch riders coordinate deliveries almost
            entirely through phone calls and trust. There's no record of who has a package, where
            it is, or when it's expected to arrive. When something goes wrong — a delay, a denied
            pickup, a lost item — there's no way to know who to hold accountable.
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 20px 40px' }}>
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

        <div className="lp-section">
          <h2>How it works</h2>
          <p className="lp-sub">Three steps, no training needed.</p>
          <div className="lp-steps">
            <div className="lp-step"><b>1</b><strong>Create the delivery</strong><p>The vendor adds the item, pickup and drop-off, and gets a tracking code.</p></div>
            <div className="lp-step"><b>2</b><strong>The rider takes it</strong><p>The rider sees the job, navigates to the pinned spots, and updates the status as they go.</p></div>
            <div className="lp-step"><b>3</b><strong>The customer follows along</strong><p>They enter the code on the tracking page. No account, no app, no phone call.</p></div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="lp-section">
            <h2>Who it's for</h2>
            <p className="lp-sub">Pick the one that sounds like you.</p>
            <div className="lp-steps">
              <div className="lp-who"><strong>Vendors</strong><p>Send orders out and stop answering "where is my package?" all day.</p><Link to="/signup/vendor">Sign up as a vendor →</Link></div>
              <div className="lp-who"><strong>Riders</strong><p>See your jobs clearly, navigate to each pin, and build a record of deliveries done.</p><Link to="/signup/rider">Sign up as a rider →</Link></div>
              <div className="lp-who"><strong>Delivery companies</strong><p>Manage your fleet and every rider's deliveries from one dashboard.</p><Link to="/signup/company">Register your company →</Link></div>
            </div>
          </div>
        </div>

        <div className="lp-section">
          <h2>Simple pricing</h2>
          <p className="lp-sub">Tracking is free. Pay only if you want the blue verification tick.</p>
          <div className="lp-steps">
            <div className="lp-who">
              <strong>Free</strong>
              <p className="lp-price">₦0</p>
              <p>Create deliveries, assign riders, share tracking codes and follow every delivery.</p>
              <Link to="/signup/vendor">Start free →</Link>
            </div>
            <div className="lp-who lp-featured">
              <strong>{PRICING.vendor.name}</strong>
              <p className="lp-price">{PRICING.vendor.price} <small>{PRICING.vendor.per}</small></p>
              <p>A blue tick on your public page so customers trust you. We check your details first.</p>
              <a href={'mailto:' + CONTACT_EMAIL + '?subject=Verified%20Vendor%20plan'}>Contact us to subscribe →</a>
            </div>
            <div className="lp-who">
              <strong>{PRICING.company.name}</strong>
              <p className="lp-price">{PRICING.company.price} <small>{PRICING.company.per}</small></p>
              <p>For dispatch companies with a fleet: the tick, plus your company page.</p>
              <a href={'mailto:' + CONTACT_EMAIL + '?subject=Verified%20Company%20plan'}>Contact us to subscribe →</a>
            </div>
          </div>
          <p className="lp-sub" style={{ marginTop: 20, marginBottom: 0, fontSize: 14 }}>
            Early businesses get the first {PRICING.foundingMonths} months of verification free. You can also earn the tick for free by building a good delivery record.
          </p>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 20px' }}>
          <h2 style={{ color: 'var(--text)' }}>Why I built Veritrack</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 16 }}>
            I'm Bright, a self-taught software developer from Nigeria. I kept seeing the same thing
            everywhere: vendors and riders coordinating deliveries with nothing but phone calls and
            hope. So I built Veritrack end to end, to give every delivery a clear status and every
            customer a way to check it themselves.
          </p>
          <AppShowcase />
          <p style={{ color: 'var(--text)', fontWeight: 600, marginTop: 16 }}>— Bright Dimkpa</p>
        </div>

        <div style={{ textAlign: 'center', padding: '30px 20px 70px' }}>
          <h2 style={{ color: 'var(--text)' }}>Ready to stop chasing deliveries?</h2>
          <div className="lp-cta-row" style={{ marginTop: 16 }}>
            <Link to="/signup/vendor" className="lp-btn lp-btn-primary">Get started free</Link>
            <Link to="/login" className="lp-btn lp-btn-ghost">Log in</Link>
          </div>
        </div>

        <footer className="lp-footer">
          <nav aria-label="Footer">
            <a href={'mailto:' + CONTACT_EMAIL}>Contact</a>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/track">Track a delivery</Link>
          </nav>
          <div>© {new Date().getFullYear()} {SITE_NAME}. Made in Nigeria.</div>
        </footer>
      </div>
    </div>
  )
}

export default PitchPage
