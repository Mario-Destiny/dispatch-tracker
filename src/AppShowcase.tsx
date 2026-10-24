import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

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
    { item: 'Red sneakers, size 42', route: 'Ikeja → Lekki', status: 'in_transit', code: 'DT-A83F2' },
    { item: 'Phone case (2 pieces)', route: 'Yaba → Surulere', status: 'picked_up', code: 'DT-K29PW' },
    { item: 'Birthday cake', route: 'Wuse → Garki', status: 'delivered', code: 'DT-M74XZ' },
  ]

  return (
    <>
      <div className="mk-grid">
        {stats.map((s) => (
          <div key={s.label} className={'stat-card ' + s.tone}>
            <div className="stat-values">
              <div className="stat-value">{s.value}</div>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {rows.map((r) => (
        <div key={r.code} className={'delivery-card edge-' + r.status}>
          <strong style={{ color: 'var(--text)' }}>{r.item}</strong>
          <p style={{ color: 'var(--text-secondary)' }}>{r.route}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <StatusBadge status={r.status} />
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
        <span className="rider-pill on">All 3</span>
        <span className="rider-pill">Online 1</span>
        <span className="rider-pill">Away 1</span>
        <span className="rider-pill">Offline 1</span>
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
              <div className="rider-sub">{r.text}</div>
            </div>
            <span className={'rider-badge badge-' + r.state}>{r.label}</span>
            <div className="rider-actions">
              <span className="rider-btn rider-btn-wa">WhatsApp</span>
              <span className="rider-btn">Call</span>
              {r.state === 'offline' ? (
                <span className="rider-muted">Can't assign</span>
              ) : (
                <span className="btn-primary btn-sm">Select</span>
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
          <strong style={{ color: 'var(--text)' }}>Status: 🟢 Available</strong>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Vendors can currently assign you new deliveries.
          </p>
        </div>
        <span className="btn-primary btn-sm">Go Unavailable</span>
      </div>

      <div className="delivery-card edge-in_transit">
        <strong style={{ color: 'var(--text)' }}>Red sneakers, size 42</strong>
        <p style={{ color: 'var(--text-secondary)' }}>Ikeja → Lekki</p>
        <StatusBadge status="in_transit" />

        <div style={{ marginTop: 14 }}>
          <div className="field-label">Customer confirmation code</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
            Ask the customer for their 4-digit code to complete delivery.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              className="field-input"
              style={{ width: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 4, fontWeight: 700 }}
            >
              4821
            </div>
            <span className="btn-primary btn-sm">Confirm Delivery</span>
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
          <div className="field-label">Tracking code</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="field-input" style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center' }}>
              DT-A83F2
            </div>
            <span className="btn-primary">Track</span>
          </div>
        </div>
      </div>

      <div className="delivery-card edge-in_transit" style={{ padding: 18 }}>
        <h4 style={{ margin: '0 0 6px', color: 'var(--text)' }}>Red sneakers, size 42</h4>
        <p style={{ color: 'var(--text-secondary)' }}>Ikeja → Lekki</p>
        <p style={{ color: 'var(--text)' }}>
          <strong>Estimated arrival:</strong> Today, 4pm
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
                {label}
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
            Your rider is on the way. Give them this code when your delivery arrives:
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
  const [active, setActive] = useState<TabKey>('vendor')
  const current = TABS.find((t) => t.key === active) ?? TABS[0]

  return (
    <section className="mk-section" id="see-it-in-action">
      <div className="mk-eyebrow">See it in action</div>
      <h2 className="mk-title">Every delivery, one clear view</h2>
      <p className="mk-sub">
        A quick look at how vendors, riders and customers use Veritrack. Each screen below is
        built from the real app.
      </p>

      <div className="mk-tabs" role="tablist" aria-label="App screens">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            className={'mk-tab' + (active === t.key ? ' on' : '')}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mk-caption">{current.caption}</p>

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

      <p className="mk-note">Sample data shown for illustration.</p>

      <div className="mk-cta">
        <Link to="/signup/vendor" className="btn-primary">Sign up as a vendor</Link>
        <Link to="/signup/rider" className="mk-ghost">Join as a rider</Link>
        <Link to="/track" className="mk-ghost">Track an order</Link>
                <Link to="/signup/company" className="mk-ghost">Sign up as a company</Link>
      </div>
    </section>
  )
}

export default AppShowcase