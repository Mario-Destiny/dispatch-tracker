import { Link } from 'react-router-dom'
import { useTheme } from './useTheme'
import Logo from './Logo'
import AnimatedBackground from './AnimatedBackground'
import LanguageSwitcher from './i18n/LanguageSwitcher'
import AppShowcase from './AppShowcase'
import DeliveryMapDemo from './DeliveryMapDemo'
import { CONTACT_EMAIL, COMPANY_NAME } from './siteInfo'
import { PRICING, FREE_PRICE, USD_PRICING } from './pricing'
import { useTranslation } from 'react-i18next'
import { tx } from './i18n/text'

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
  useTranslation() // redraw when the language changes
  const { theme, toggleTheme } = useTheme()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', position: 'relative' }}>
      <AnimatedBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px clamp(16px, 4vw, 40px)', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--border)',
        }}>
          <Link to="/" aria-label={tx("Veritrack home")} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}><Logo size={44} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/login" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>
              {tx("Log In")}
            </Link>
            <LanguageSwitcher />
            <button onClick={toggleTheme} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              padding: '6px 12px', color: 'var(--text)',
            }}>
              {theme === 'light' ? '🌙 ' + tx('Dark') : '☀️ ' + tx('Light')}
            </button>
          </div>
        </nav>

        <div style={{ textAlign: 'center', padding: '90px 20px 40px', maxWidth: 700, margin: '0 auto' }}>
          <h1 className="brand-headline" style={{ fontSize: 38, color: 'var(--text)', lineHeight: 1.4, margin: '0 0 20px' }}>
            {tx("You sent a delivery. Now you're just... waiting.")}
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            {tx("Veritrack gives every delivery a status, a rider, and a code your customer can check themselves — no app to download, no phone calls, no guessing.")}
          </p>
          <div className="lp-cta-row">
            <Link to="/signup" className="lp-btn lp-btn-primary">{tx("Get started free")}</Link>
            <Link to="/login" className="lp-btn lp-btn-ghost">{tx("Log in")}</Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 14 }}>
            <Link to="/home" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              {tx("Or take a look around the platform →")}
            </Link>
          </p>
        </div>

        <div className="lp-proof">
          <span>{tx("Free to start")}</span>
          <span>{tx("Works on any phone")}</span>
          <span>{tx("Customers need no app")}</span>
        </div>

        <div className="lp-section">
          <h2>{tx("Know where every delivery stands")}</h2>
          <p className="lp-sub">{tx("Pinned drop-off, clear status, one tracking code.")}</p>
          <DeliveryMapDemo />
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 40px' }}>
          <h2 style={{ color: 'var(--text)' }}>{tx("The Problem")}</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 16 }}>
            {tx("Around the world, small vendors and informal dispatch riders coordinate deliveries almost entirely through phone calls and trust. There's no record of who has a package, where it is, or when it's expected to arrive. When something goes wrong — a delay, a denied pickup, a lost item — there's no way to know who to hold accountable.")}
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 20px 40px' }}>
          <h2 style={{ color: 'var(--text)', textAlign: 'center' }}>{tx("The Fix")}</h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 32, marginTop: 24,
          }}>
            {[
              { icon: 'pin' as const, title: tx("Every delivery is tracked"), desc: tx("From pickup to drop-off, every delivery has a clear, current status.") },
              { icon: 'clock' as const, title: tx("Every update is timestamped"), desc: tx("Status changes are recorded the moment they happen, not remembered later.") },
              { icon: 'tag' as const, title: tx("Customers get a code, not a call"), desc: tx("A simple tracking code replaces the \"where is my order\" phone call.") },
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
          <h2>{tx("How it works")}</h2>
          <p className="lp-sub">{tx("Three steps, no training needed.")}</p>
          <div className="lp-steps">
            <div className="lp-step"><b>1</b><strong>{tx("Create the delivery")}</strong><p>{tx("The vendor adds the item, pickup and drop-off, and gets a tracking code.")}</p></div>
            <div className="lp-step"><b>2</b><strong>{tx("The rider takes it")}</strong><p>{tx("The rider sees the job, navigates to the pinned spots, and updates the status as they go.")}</p></div>
            <div className="lp-step"><b>3</b><strong>{tx("The customer follows along")}</strong><p>{tx("They enter the code on the tracking page. No account, no app, no phone call.")}</p></div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="lp-section">
            <h2>{tx("Who it's for")}</h2>
            <p className="lp-sub">{tx("Pick the one that sounds like you.")}</p>
            <div className="lp-steps">
              <div className="lp-who"><strong>{tx("Vendors")}</strong><p>{tx("Send orders out and stop answering \"where is my package?\" all day.")}</p><Link to="/signup/vendor">{tx("Sign up as a vendor →")}</Link></div>
              <div className="lp-who"><strong>{tx("Riders")}</strong><p>{tx("See your jobs clearly, navigate to each pin, and build a record of deliveries done.")}</p><Link to="/signup/rider">{tx("Sign up as a rider →")}</Link></div>
              <div className="lp-who"><strong>{tx("Delivery companies")}</strong><p>{tx("Manage your fleet and every rider's deliveries from one dashboard.")}</p><Link to="/signup/company">{tx("Register your company →")}</Link></div>
            </div>
          </div>
        </div>

        <div className="lp-section">
          <h2>{tx("Simple pricing")}</h2>
          <p className="lp-sub">{tx("Tracking is free. Pay only if you want the blue verification tick. Payments are secure, by Paystack.")}</p>
          <div className="lp-steps">
            <div className="lp-who">
              <strong>{tx("Free")}</strong>
              <p className="lp-price">{FREE_PRICE}</p>
              <p>{tx("Create deliveries, assign riders, share tracking codes and follow every delivery.")}</p>
              <Link to="/signup">{tx("Start free →")}</Link>
            </div>
            <div className="lp-who lp-featured">
              <strong>{tx(PRICING.vendor.name)}</strong>
              <p className="lp-price">{PRICING.vendor.price} <small>{tx(PRICING.vendor.per)}</small></p>
              {USD_PRICING && <p>{tx('or {price} a year (2 months free)', { price: PRICING.vendor.yearly })}</p>}
              <p>{tx("A blue tick on your public page so customers trust you. We check your details first.")}</p>
              <Link to="/signup/vendor">{tx("Sign up, then pay online →")}</Link>
            </div>
            <div className="lp-who">
              <strong>{tx(PRICING.company.name)}</strong>
              <p className="lp-price">{PRICING.company.price} <small>{tx(PRICING.company.per)}</small></p>
              {USD_PRICING && <p>{tx('or {price} a year (2 months free)', { price: PRICING.company.yearly })}</p>}
              <p>{tx("For dispatch companies with a fleet: the tick, plus your company page.")}</p>
              <Link to="/signup/company">{tx("Register, then pay online →")}</Link>
            </div>
          </div>
          <p className="lp-sub" style={{ marginTop: 20, marginBottom: 0, fontSize: 14 }}>
            {USD_PRICING
              ? tx('Your first 30 days after verification are free. Refer another business: they get 20% off their first monthly payment and you get 30 free days.')
              : tx('Early businesses get the first {months} months of verification free.', { months: PRICING.foundingMonths })}{' '}
            {tx('You can also earn the tick for free by building a good delivery record.')}
          </p>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 20px' }}>
          <h2 style={{ color: 'var(--text)' }}>{tx("Why I built Veritrack")}</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 16 }}>
            {tx("I'm Bright, founder of Veritrack, a product of {company}. I kept seeing the same thing everywhere: vendors and riders coordinating deliveries with nothing but phone calls and hope. So I built Veritrack end to end, to give every delivery a clear status and every customer a way to check it themselves.", { company: COMPANY_NAME })}
          </p>
          <AppShowcase />
          <p style={{ color: 'var(--text)', fontWeight: 600, marginTop: 16 }}>— Bright Dimkpa, {tx('Founder')}</p>
        </div>

        <div style={{ textAlign: 'center', padding: '30px 20px 70px' }}>
          <h2 style={{ color: 'var(--text)' }}>{tx("Ready to stop chasing deliveries?")}</h2>
          <div className="lp-cta-row" style={{ marginTop: 16 }}>
            <Link to="/signup" className="lp-btn lp-btn-primary">{tx("Get started free")}</Link>
            <Link to="/login" className="lp-btn lp-btn-ghost">{tx("Log in")}</Link>
          </div>
        </div>

        <footer className="lp-footer">
          <nav aria-label={tx("Footer")}>
            <a href={'mailto:' + CONTACT_EMAIL}>{tx("Contact")}</a>
            <Link to="/terms">{tx("Terms")}</Link>
            <Link to="/privacy">{tx("Privacy")}</Link>
            <Link to="/track">{tx("Track a delivery")}</Link>
          </nav>
          <div>© {new Date().getFullYear()} {COMPANY_NAME}. {tx('All rights reserved.')}</div>
        </footer>
      </div>
    </div>
  )
}

export default PitchPage
