import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import Skeleton from './Skeleton'
import VerifiedTick from './VerifiedTick'
import { PRICING } from './pricing'
import { CONTACT_EMAIL } from './siteInfo'
import { shortDate, tickTitle, type Badges } from './businessUtils'
import { showToast } from './toast'

type MyBusiness = {
  kind: 'vendor' | 'company'
  name: string
  slug: string
  verified: boolean
  verification_type: string | null
  requested_at: string | null
  rejection_note: string | null
  paid_until: string | null
  founding_until: string | null
  public_phone: string | null
  stats: {
    created: number
    delivered: number
    completion_rate: number | null
    avg_minutes: number | null
    rating_count: number
    rating_avg: number | null
    age_days: number
  }
  badges: Badges
  targets: Record<string, number>
}

type RatingRow = {
  stars: number
  comment: string | null
  created_at: string
}

type MeterProps = {
  label: string
  value: number
  target: number
  text: string
  done: boolean
}

function Meter({ label, value, target, text, done }: MeterProps) {
  const pct = target <= 0 ? 100 : Math.max(0, Math.min(100, (value / target) * 100))
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <span className={done ? 'meter-done' : ''}>{done ? '✓ ' : ''}{text}</span>
      </div>
      <div className="meter-track">
        <div className={'meter-fill' + (done ? ' done' : '')} style={{ width: pct + '%' }} />
      </div>
    </div>
  )
}

type BusinessPanelProps = {
  isCompany: boolean
}

function BusinessPanel({ isCompany }: BusinessPanelProps) {
  const [biz, setBiz] = useState<MyBusiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<RatingRow[]>([])
  const [busy, setBusy] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [applyRc, setApplyRc] = useState('')
  const [applyMessage, setApplyMessage] = useState('')
  const [publicPhone, setPublicPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  async function load() {
    const { data, error } = await supabase.rpc('my_business')
    if (error) console.error('Business fetch error:', error)
    const b = (data as MyBusiness | null) ?? null
    setBiz(b)
    setPublicPhone(b?.public_phone ?? '')
    setLoading(false)

    if (b) {
      const { data: r } = await supabase
        .from('delivery_ratings')
        .select('stars, comment, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      setRatings((r as RatingRow[] | null) ?? [])
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function createPage(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.rpc('create_business_profile', {
      p_name: newName,
      p_city: newCity,
      p_state: newState,
      p_rc: null,
      p_phone: newPhone,
    })
    setBusy(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    showToast('Your public page is ready.')
    setLoading(true)
    load()
  }

  async function apply() {
    setBusy(true)
    const { error } = await supabase.rpc('apply_for_verification', {
      p_rc: applyRc,
      p_message: applyMessage,
    })
    setBusy(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    showToast('Application sent. We will check your details.')
    load()
  }

  async function savePhone() {
    setSavingPhone(true)
    const { error } = await supabase.rpc('set_public_phone', { p_phone: publicPhone })
    setSavingPhone(false)

    if (error) {
      showToast('Could not save: ' + error.message, 'error')
      return
    }

    showToast('Public contact number saved.')
  }

  async function copyLink() {
    if (!biz) return
    try {
      await navigator.clipboard.writeText(window.location.origin + '/b/' + biz.slug)
      showToast('Link copied.')
    } catch {
      showToast('Could not copy. Please copy the link by hand.', 'error')
    }
  }

  if (loading) {
    return (
      <>
        <h2 style={{ color: 'var(--text)' }}>Verification and reputation</h2>
        <div className="fleet-panel" aria-busy="true">
          <Skeleton width="70%" height={16} />
          <Skeleton height={8} radius={999} style={{ marginTop: 14 }} />
          <Skeleton height={8} radius={999} style={{ marginTop: 14 }} />
        </div>
      </>
    )
  }

  if (!biz) {
    return (
      <>
        <h2 style={{ color: 'var(--text)' }}>Public page</h2>
        <div className="fleet-panel">
          {isCompany ? (
            <p className="rider-hint">
              Your public page is missing. Please email{' '}
              <a href={'mailto:' + CONTACT_EMAIL} style={{ color: 'var(--accent)' }}>{CONTACT_EMAIL}</a>.
            </p>
          ) : (
            <form onSubmit={createPage} className="auth-form">
              <p className="rider-hint" style={{ margin: 0 }}>
                Create a public page to show your results, earn ratings, and apply for a blue tick.
              </p>
              <div className="field">
                <label className="field-label" htmlFor="biz-name">Business or shop name</label>
                <input
                  id="biz-name"
                  className="field-input"
                  placeholder="e.g. Mama Tee Boutique"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="biz-city">City</label>
                <input
                  id="biz-city"
                  className="field-input"
                  placeholder="e.g. Ikeja"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="biz-state">State</label>
                <input
                  id="biz-state"
                  className="field-input"
                  placeholder="e.g. Lagos"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="biz-phone">Public contact number (optional)</label>
                <input
                  id="biz-phone"
                  className="field-input"
                  type="tel"
                  placeholder="Leave empty to keep your number private"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? <><Spinner size="sm" /> Creating...</> : 'Create my public page'}
              </button>
            </form>
          )}
        </div>
      </>
    )
  }

  const t = biz.targets
  const s = biz.stats
  const b = biz.badges

  return (
    <>
      <div id="verification">
        <h2 style={{ color: 'var(--text)' }}>Verification and reputation</h2>
      </div>
      <div className="fleet-panel">
        {b.tick ? (
          <p className="rider-hint" style={{ marginBottom: 14 }}>
            <VerifiedTick size={16} title={tickTitle(b.verification_type)} /> You have the blue tick
            {b.tick_source === 'founding' && biz.founding_until ? ' as a founding member until ' + shortDate(biz.founding_until) : ''}
            {b.tick_source === 'paid' && biz.paid_until ? ' with your Verified plan until ' + shortDate(biz.paid_until) : ''}
            {b.tick_source === 'earned' ? ' for your track record' : ''}.
          </p>
        ) : biz.verified ? (
          <p className="rider-hint" style={{ marginBottom: 14 }}>
            You have been checked. The blue tick shows once you have a founding or paid plan, or reach all the targets below.
          </p>
        ) : (
          <p className="rider-hint" style={{ marginBottom: 14 }}>
            Earn the blue tick free by reaching the targets below, or get verified now with a Verified plan: {PRICING.vendor.price} a month for vendors, {PRICING.company.price} a month for companies.
            We check your details first either way.
          </p>
        )}

        <Meter
          label={biz.kind === 'company' ? 'Business registration checked' : 'Identity or registration checked'}
          value={biz.verified ? 1 : 0}
          target={1}
          text={biz.verified ? 'Checked' : biz.requested_at ? 'Under review' : 'Not checked yet'}
          done={biz.verified}
        />
        <Meter
          label="Account age"
          value={s.age_days}
          target={t.age_days}
          text={s.age_days + ' of ' + t.age_days + ' days'}
          done={s.age_days >= t.age_days}
        />
        <Meter
          label="Completed deliveries"
          value={s.delivered}
          target={t.delivered}
          text={s.delivered + ' of ' + t.delivered}
          done={s.delivered >= t.delivered}
        />
        <Meter
          label="Completion rate (deliveries older than 48 hours)"
          value={s.completion_rate ?? 0}
          target={t.completion}
          text={s.completion_rate === null ? 'No data yet' : s.completion_rate + '% (target ' + t.completion + '%)'}
          done={(s.completion_rate ?? 0) >= t.completion}
        />
        <Meter
          label="Customer ratings"
          value={s.rating_count}
          target={t.ratings}
          text={
            s.rating_count + ' of ' + t.ratings +
            (s.rating_avg !== null ? ', avg ' + s.rating_avg : '') +
            ' (target avg ' + t.rating_avg + ')'
          }
          done={s.rating_count >= t.ratings && (s.rating_avg ?? 0) >= t.rating_avg}
        />

        {!biz.verified && !biz.requested_at && (
          <div style={{ marginTop: 16 }}>
            {biz.rejection_note && (
              <p className="rider-hint" style={{ color: '#ef4444' }}>
                Your last application was not approved: {biz.rejection_note}
              </p>
            )}
            <div className="field">
              <label className="field-label" htmlFor="apply-rc">CAC / RC number (optional)</label>
              <input
                id="apply-rc"
                className="field-input"
                placeholder="e.g. RC1234567"
                value={applyRc}
                onChange={(e) => setApplyRc(e.target.value)}
              />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label className="field-label" htmlFor="apply-msg">
                How can we check you? Share your website, Instagram, or anything that proves who you are
              </label>
              <textarea
                id="apply-msg"
                className="field-input"
                rows={3}
                maxLength={500}
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
          {!biz.verified && !biz.requested_at && (
            <button type="button" className="btn-primary btn-sm" onClick={apply} disabled={busy}>
              {busy ? <><Spinner size="sm" /> Sending...</> : 'Apply for verification'}
            </button>
          )}
          {!biz.verified && biz.requested_at && (
            <span className="verified-badge pending">Application under review</span>
          )}
          {!b.tick && (
            <a className="rider-btn" href={'mailto:' + CONTACT_EMAIL + '?subject=Verified%20plan'}>
              Get a Verified plan
            </a>
          )}
        </div>

        <p className="rider-hint" style={{ marginTop: 14 }}>
          {b.top_rated
            ? 'You have the Top rated badge. It is earned from your results and cannot be bought.'
            : 'Top rated is earned only: ' + t.top_delivered + ' deliveries, ' + t.top_completion +
              '% completion, and ' + t.top_ratings + ' ratings averaging ' + t.top_rating_avg + ' or better.'}
        </p>
      </div>

      <h2 style={{ color: 'var(--text)' }}>Public page</h2>
      <div className="fleet-panel">
        <p className="rider-hint" style={{ marginBottom: 12 }}>
          Share this link with customers. It shows your results and tick.
        </p>
        <div className="invite-box">
          <span className="invite-code" style={{ fontSize: 14, letterSpacing: 0 }}>
            {window.location.origin}/b/{biz.slug}
          </span>
          <button type="button" className="btn-primary btn-sm" onClick={copyLink}>Copy link</button>
          <Link className="rider-btn" to={'/b/' + biz.slug}>View page</Link>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label className="field-label" htmlFor="public-phone">Public contact number</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              id="public-phone"
              className="field-input"
              type="tel"
              placeholder="e.g. 0801 234 5678"
              value={publicPhone}
              onChange={(e) => setPublicPhone(e.target.value)}
              style={{ flex: 1, minWidth: 180 }}
            />
            <button type="button" className="btn-primary btn-sm" onClick={savePhone} disabled={savingPhone}>
              {savingPhone ? <><Spinner size="sm" /> Saving...</> : 'Save'}
            </button>
          </div>
          <p className="rider-hint" style={{ margin: 0 }}>
            {isCompany ? 'Leave it empty to hide the Request a delivery button.' : 'Leave it empty to keep your number private.'}
          </p>
        </div>
      </div>

      <h2 style={{ color: 'var(--text)' }}>Recent ratings</h2>
      <div className="fleet-panel">
        {ratings.length === 0 ? (
          <p className="rider-hint">
            No ratings yet. Customers can rate a delivery on the tracking page after it is confirmed with their code.
          </p>
        ) : (
          <div className="client-list" style={{ marginTop: 0 }}>
            {ratings.map((r, i) => (
              <div key={i} className="client-row">
                <span>
                  {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                  {r.comment ? ' · ' + r.comment : ''}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{shortDate(r.created_at)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="rider-hint" style={{ marginTop: 10 }}>
          Only you can read the comments. The public sees your average once you have enough ratings.
        </p>
      </div>
    </>
  )
}

export default BusinessPanel