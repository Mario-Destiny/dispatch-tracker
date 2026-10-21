import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Skeleton from './Skeleton'
import VerifiedTick from './VerifiedTick'
import BusinessBadges from './BusinessBadges'
import ReportBox from './ReportBox'
import { tickTitle } from './businessUtils'
import { SITE_NAME } from './siteInfo'

type PublicBusiness = {
  kind: 'vendor' | 'company'
  name: string
  slug: string
  city: string | null
  state: string | null
  member_since: string
  tick: boolean
  top_rated: boolean
  verification_type: string | null
  registered_checked: boolean
  phone: string | null
  delivered: number
  completion_rate: number | null
  avg_minutes: number | null
  rating_count: number
  rating_avg: number | null
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('234')) return digits
  if (digits.startsWith('0')) return '234' + digits.slice(1)
  return digits
}

function formatMinutes(minutes: number | null) {
  if (minutes === null || minutes === undefined) return '—'
  if (minutes < 60) return Math.round(minutes) + ' min'
  return Math.floor(minutes / 60) + 'h ' + Math.round(minutes % 60) + 'm'
}

function initialsOf(name: string) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?'
}

function BusinessPage() {
  const { slug } = useParams<{ slug: string }>()
  const [biz, setBiz] = useState<PublicBusiness | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.rpc('business_public', { p_slug: slug ?? '' })
      setBiz((data as PublicBusiness | null) ?? null)
      setLoading(false)
    }
    load()
  }, [slug])

  useEffect(() => {
    if (biz) document.title = biz.name + ' | ' + SITE_NAME
  }, [biz])

  const digits = (biz?.phone || '').replace(/\D/g, '')
  const canContact = digits.length >= 7
  const isCompany = biz?.kind === 'company'

  return (
    <div className="page-bg">
      <div className="auth-wrap" style={{ maxWidth: 640 }}>
        {loading ? (
          <div className="form-card" aria-busy="true">
            <Skeleton width="60%" height={28} />
            <Skeleton width="40%" height={16} />
            <Skeleton height={80} radius={12} />
          </div>
        ) : !biz ? (
          <div className="form-card" style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: 'var(--text)' }}>Page not found</h2>
            <p className="rider-hint">This link may be wrong, or the page is not available right now.</p>
            <Link to="/" style={{ color: 'var(--accent)' }}>Back to home</Link>
          </div>
        ) : (
          <div className="form-card fade-in-card">
            <div className="co-head">
              <div className="co-avatar">{initialsOf(biz.name)}</div>
              <div>
                <div className="co-name">
                  {biz.name}
                  {biz.tick && <VerifiedTick size={24} title={tickTitle(biz.verification_type)} />}
                </div>
                <div className="co-sub">
                  {isCompany ? 'Dispatch company' : 'Seller'}
                  {biz.city || biz.state ? ' · ' + [biz.city, biz.state].filter(Boolean).join(', ') : ''}
                  {' · Member since '}
                  {new Date(biz.member_since).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div>
              <BusinessBadges tick={biz.tick} topRated={biz.top_rated} verificationType={biz.verification_type} />
              {!biz.tick && (
                <span className="verified-badge pending">
                  {biz.registered_checked ? 'Checked, no active tick' : 'Not verified yet'}
                </span>
              )}
            </div>

            <div className="report-grid">
              <div className="report-stat">
                <div className="report-value">{biz.delivered}</div>
                <div className="report-label">Deliveries completed</div>
              </div>
              <div className="report-stat">
                <div className="report-value">
                  {biz.completion_rate === null ? '—' : biz.completion_rate + '%'}
                </div>
                <div className="report-label">Completion rate</div>
              </div>
              <div className="report-stat">
                <div className="report-value">{formatMinutes(biz.avg_minutes)}</div>
                <div className="report-label">Avg. delivery time</div>
              </div>
              <div className="report-stat">
                <div className="report-value">
                  {biz.rating_avg === null ? 'New' : biz.rating_avg.toFixed(1) + ' / 5'}
                </div>
                <div className="report-label">
                  Rating ({biz.rating_count} {biz.rating_count === 1 ? 'rating' : 'ratings'})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {canContact && (
                <a
                  className="rider-btn rider-btn-wa"
                  href={
                    'https://wa.me/' + formatPhone(biz.phone || '') + '?text=' +
                    encodeURIComponent(
                      isCompany
                        ? 'Hi ' + biz.name + ', I found you on ' + SITE_NAME + ' and would like to request a delivery.'
                        : 'Hi ' + biz.name + ', I found you on ' + SITE_NAME + '.'
                    )
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {isCompany ? 'Request a delivery' : 'Message this seller'}
                </a>
              )}
              <ReportBox slug={biz.slug} />
            </div>

            {!biz.tick && (
              <p className="rider-hint" style={{ margin: 0 }}>
                This business does not hold a blue tick, so check its details before you send or pay for anything valuable.
              </p>
            )}
          </div>
        )}

        <div className="legal-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}

export default BusinessPage