import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { useTranslation } from 'react-i18next'
import { tx } from './i18n/text'

type TabKey = 'vendor' | 'riders' | 'rider' | 'track'

const TABS: { key: TabKey; label: string; path: string; caption: string }[] = [
  {
    key: 'vendor',
    label: 'Vendor dashboard',
    path: '/vendor',
    caption: 'See every delivery, its status and your numbers at a glance.',
  },
  {
    key: 'riders',
    label: 'Pick a rider',
    path: '/vendor',
    caption: 'Know who is online, how long others have been away, and message a rider before you assign.',
  },
  {
    key: 'rider',
    label: 'Rider app',
    path: '/rider',
    caption: "Riders update each step, and finish only with the customer's 4-digit code.",
  },
  {
    key: 'track',
    label: 'Customer tracking',
    path: '/track',
    caption: 'Customers follow their order with a tracking code. No account needed.',
  },
]

function VendorMock() {
  const stats = [
    { label: 'Total', value: '24', tone: 'stat-blue' },
    { label: 'Delivered', value: '18', tone: 'stat-green' },
    { label: 'In progress', value: '6', tone: 'stat-amber' },
    { label: 'Avg. time', value: '42m', tone: 'stat-violet' },
  ]

  const rows = [
    { item: 'Red sneakers, size 42', route: 'Market Square → Riverside', status: 'in_transit', code: 'DT-A83F2' },
    { item: 'Phone case (2 pieces)', route: 'Old Town → Hillside', status: 'picked_up', code: 'DT-K29PW' },
    { item: 'Birthday cake', route: 'Central Station → Lakeside', status: 'delivered', code: 'DT-M74XZ' },
  ]

  return (
    <>
      <div className="mk-grid">
        {stats.map((s) => (
          <div key={s.label} className={'stat-card ' + s.tone}>
            <div className="stat-values">
              <div className="stat-value">{s.value}</div>
            </div>
            <div className="stat-label">{tx(s.label)}</div>
          </div>
        ))}
      </div>

      {rows.map((r) => (
        <div key={r.code} className={'delivery-card edge-' + r.status}>
          <strong style={{ color: 'var(--text)' }}>{tx(r.item)}</strong>
          <p style={{ color: 'var(--text-secondary)' }}>{r.route}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <StatusBadge status={r.status} translate />
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text)' }}>{r.code}</span>
          </div>
        </div>
      ))}
    </>
  )
}

function RidersMock() {
  const riders = [
    { name: 'Tunde Bello', initials: 'TB', state: 'online', text: 'Active now', label: 'Online' },
    { name: 'Ngozi Obi', initials: 'NO', state: 'away', text: 'Last seen 12 min ago', label: 'Away' },
    { name: 'Ibrahim Musa', initials: 'IM', state: 'offline', text: 'Offline for 3 hr', label: 'Offline' },
  ]

  return (
    <>
      <div className="rider-pills">
        <span className="rider-pill on">{tx("All 3")}</span>
        <span className="rider-pill">{tx("Online 1")}</span>
        <span className="rider-pill">{tx("Away 1")}</span>
        <span className="rider-pill">{tx("Offline 1")}</span>
      </div>

      <div className="rider-list">
        {riders.map((r) => (
          <div key={r.name} className="rider-row">
            <div className="rider-av">
              {r.initials}
              <span className={'rider-dot dot-' + r.state} />
            </div>
            <div className="rider-info">
              <div className="rider-name">{r.name}</div>
              <div className="rider-sub">{tx(r.text)}</div>
            </div>
            <span className={'rider-badge badge-' + r.state}>{tx(r.label)}</span>
            <div className="rider-actions">
              <span className="rider-btn rider-btn-wa">WhatsApp</span>
              <span className="rider-btn">{tx("Call")}</span>
              {r.state === 'offline' ? (
                <span className="rider-muted">{tx("Can't assign")}</span>
              ) : (
                <span className="btn-primary btn-sm">{tx("Select")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function RiderMock() {
  return (
    <>
      <div className="status-card stat-green">
        <div>
          <strong style={{ color: 'var(--text)' }}>{tx("Status: 🟢 Available")}</strong>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {tx("Vendors can currently assign you new deliveries.")}
          </p>
        </div>
        <span className="btn-primary btn-sm">{tx("Go Unavailable")}</span>
      </div>

      <div className="delivery-card edge-in_transit">
        <strong style={{ color: 'var(--text)' }}>{tx('Red sneakers, size 42')}</strong>
        <p style={{ color: 'var(--text-secondary)' }}>Market Square → Riverside</p>
        <StatusBadge status="in_transit" translate />

        <div style={{ marginTop: 14 }}>
          <div className="field-label">{tx("Customer confirmation code")}</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
            {tx("Ask the customer for their 4-digit code to complete delivery.")}
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              className="field-input"
              style={{ width: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 4, fontWeight: 700 }}
            >
              4821
            </div>
            <span className="btn-primary btn-sm">{tx("Confirm Delivery")}</span>
          </div>
        </div>
      </div>
    </>
  )
}

function TrackMock() {
  const steps = ['Order Received', 'Picked Up', 'On The Way', 'Delivered']
  const current = 2

  return (
    <>
      <div className="form-card" style={{ marginBottom: 14 }}>
        <div className="field">
          <div className="field-label">{tx("Tracking code")}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="field-input" style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center' }}>
              DT-A83F2
            </div>
            <span className="btn-primary">{tx("Track")}</span>
          </div>
        </div>
      </div>

      <div className="delivery-card edge-in_transit" style={{ padding: 18 }}>
        <h4 style={{ margin: '0 0 6px', color: 'var(--text)' }}>{tx('Red sneakers, size 42')}</h4>
        <p style={{ color: 'var(--text-secondary)' }}>Market Square → Riverside</p>
        <p style={{ color: 'var(--text)' }}>
          <strong>{tx("Estimated arrival:")}</strong> {tx("Today, 4pm")}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          {steps.map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div
                className={i === current ? 'pulse-active' : ''}
                style={{
                  width: 18, height: 18, borderRadius: '50%', margin: '0 auto 8px',
                  background: i <= current ? 'var(--accent)' : 'var(--border)',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: i <= current ? 'var(--text)' : 'var(--text-secondary)',
                  fontWeight: i === current ? 700 : 400,
                }}
              >
                {tx(label)}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 20, padding: 14, borderRadius: 12, textAlign: 'center',
            background: 'var(--blue-bg)', border: '1px solid var(--blue-bar)',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            {tx("Your rider is on the way. Give them this code when your delivery arrives:")}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: 6, color: 'var(--blue-fg)' }}>
            4821
          </p>
        </div>
      </div>
    </>
  )
}

function AppShowcase() {
  useTranslation() // redraw when the language changes
  const [active, setActive] = useState<TabKey>('vendor')
  const current = TABS.find((t) => t.key === active) ?? TABS[0]

  return (
    <section className="mk-section" id="see-it-in-action">
      <div className="mk-eyebrow">{tx("See it in action")}</div>
      <h2 className="mk-title">{tx("Every delivery, one clear view")}</h2>
      <p className="mk-sub">
        {tx("A quick look at how vendors, riders and customers use Veritrack. Each screen below is built from the real app.")}
      </p>

      <div className="mk-tabs" role="tablist" aria-label={tx("App screens")}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            className={'mk-tab' + (active === t.key ? ' on' : '')}
            onClick={() => setActive(t.key)}
          >
            {tx(t.label)}
          </button>
        ))}
      </div>

      <p className="mk-caption">{tx(current.caption)}</p>

      <div className="mk-frame">
        <div className="mk-bar">
          <span />
          <span />
          <span />
          <em>{current.path}</em>
        </div>
        <div className="mk-body fade-in-card" key={active}>
          {active === 'vendor' && <VendorMock />}
          {active === 'riders' && <RidersMock />}
          {active === 'rider' && <RiderMock />}
          {active === 'track' && <TrackMock />}
        </div>
      </div>

      <p className="mk-note">{tx("Sample data shown for illustration.")}</p>

      <div className="mk-cta">
        <Link to="/signup/vendor" className="btn-primary">{tx("Sign up as a vendor")}</Link>
        <Link to="/signup/rider" className="mk-ghost">{tx("Join as a rider")}</Link>
        <Link to="/track" className="mk-ghost">{tx("Track an order")}</Link>
                <Link to="/signup/company" className="mk-ghost">{tx("Sign up as a company")}</Link>
      </div>
    </section>
  )
}

export default AppShowcase