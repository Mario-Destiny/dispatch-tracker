import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import Skeleton from './Skeleton'
import VerifiedTick from './VerifiedTick'
import { tickTitle } from './businessUtils'
import { showToast } from './toast'

type Delivery = {
  item_name: string
  pickup_point: string
  dropoff_point: string
  status: string
  estimated_delivery: string
  tracking_code: string
  confirmation_code: string | null
  business_name: string | null
  business_slug: string | null
  business_tick: boolean
  business_verification_type: string | null
  can_rate: boolean
  rated: boolean
}

const statusLabels: Record<string, string> = {
  pending: 'Order Received',
  picked_up: 'Picked Up',
  in_transit: 'On The Way',
  delivered: 'Delivered',
}

function TrackPage() {
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(Boolean(searchParams.get('code')))
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(false)

  async function runTrack(trackingCode: string) {
    setLoading(true)
    setNotFound(false)
    setDelivery(null)
    setStars(0)
    setComment('')

    const { data, error } = await supabase.rpc('track_delivery', {
      p_code: trackingCode.trim().toUpperCase(),
    })

    setLoading(false)

    if (error || !data) {
      setNotFound(true)
      return
    }

    setDelivery(data as Delivery)
  }

  // Auto-search if a code was passed in the URL (e.g. from a WhatsApp share link)
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) {
      runTrack(urlCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    runTrack(code)
  }

  async function submitRating() {
    if (!delivery) return
    if (stars < 1) {
      showToast('Choose a star rating first.', 'error')
      return
    }

    setRating(true)
    const { error } = await supabase.rpc('rate_delivery', {
      p_code: delivery.tracking_code,
      p_stars: stars,
      p_comment: comment.trim() || null,
    })
    setRating(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    showToast('Thanks for your rating!')
    setDelivery({ ...delivery, rated: true, can_rate: false })
  }

  const steps = ['pending', 'picked_up', 'in_transit', 'delivered']
  const currentStepIndex = delivery ? steps.indexOf(delivery.status) : -1

  return (
    <div className="page-bg">
      <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif', padding: '60px 20px' }}>
        <h1 style={{ textAlign: 'center', lineHeight: 1.3, marginBottom: 8, color: 'var(--text)' }}>
          Track Your Delivery
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Enter the tracking code your vendor gave you
        </p>

        <form onSubmit={handleTrack} className="form-card" style={{ marginTop: 24 }}>
          <div className="field">
            <label className="field-label" htmlFor="tracking-code">Tracking code</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                id="tracking-code"
                className="field-input"
                placeholder="e.g. DT-A83F2"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ flex: 1, minWidth: 180 }}
                required
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <><Spinner size="sm" /> Searching...</> : 'Track'}
              </button>
            </div>
          </div>
        </form>

        {loading && (
          <div className="delivery-card" aria-busy="true" style={{ marginTop: 28, padding: 22 }}>
            <Skeleton width="55%" height={22} />
            <Skeleton width="80%" height={14} style={{ marginTop: 14 }} />
            <Skeleton width="50%" height={14} style={{ marginTop: 10 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <Skeleton width={18} height={18} radius={999} style={{ margin: '0 auto 8px' }} />
                  <Skeleton width="60%" height={10} style={{ margin: '0 auto' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {notFound && (
          <div className="delivery-card edge-error" style={{ marginTop: 28 }}>
            <strong style={{ color: '#ef4444' }}>No delivery found</strong>
            <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0' }}>
              We couldn't find a delivery with that tracking code. Double-check it and try again.
            </p>
          </div>
        )}

        {delivery && (
          <div
            className={'delivery-card fade-in-card edge-' + delivery.status}
            style={{ marginTop: 28, padding: 22 }}
          >
            <h2 style={{ marginTop: 0, color: 'var(--text)' }}>{delivery.item_name}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {delivery.pickup_point} → {delivery.dropoff_point}
            </p>

            {delivery.business_name && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', color: 'var(--text)' }}>
                Sent by{' '}
                {delivery.business_slug ? (
                  <Link to={'/b/' + delivery.business_slug} style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    {delivery.business_name}
                  </Link>
                ) : (
                  <strong>{delivery.business_name}</strong>
                )}
                {delivery.business_tick && (
                  <VerifiedTick size={18} title={tickTitle(delivery.business_verification_type)} />
                )}
              </p>
            )}

            {delivery.estimated_delivery && (
              <p style={{ color: 'var(--text)' }}>
                <strong>Estimated arrival:</strong> {delivery.estimated_delivery}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
              {steps.map((step, i) => (
                <div key={step} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    className={i === currentStepIndex ? 'pulse-active' : ''}
                    style={{
                      width: 18, height: 18, borderRadius: '50%', margin: '0 auto 8px',
                      background: i <= currentStepIndex ? 'var(--accent)' : 'var(--border)',
                    }}
                  />
                  <span style={{
                    fontSize: 13,
                    color: i <= currentStepIndex ? 'var(--text)' : 'var(--text-secondary)',
                    fontWeight: i === currentStepIndex ? 700 : 400,
                  }}>
                    {statusLabels[step]}
                  </span>
                </div>
              ))}
            </div>

            {delivery.status === 'in_transit' && delivery.confirmation_code && (
              <div style={{
                marginTop: 26, padding: 18, borderRadius: 12,
                background: 'var(--blue-bg)', border: '1px solid var(--blue-bar)', textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
                  Your rider is on the way. Give them this code when your delivery arrives:
                </p>
                <p style={{
                  fontSize: 32, fontWeight: 800, letterSpacing: 6, margin: '10px 0 0', color: 'var(--blue-fg)',
                }}>
                  {delivery.confirmation_code}
                </p>
              </div>
            )}

            {delivery.can_rate && (
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                <div className="field-label">How was your delivery?</div>
                <p className="rider-hint" style={{ margin: '4px 0 0' }}>
                  This rates the delivery experience.
                </p>
                <div style={{ display: 'flex', gap: 4, margin: '8px 0 12px' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={n + (n === 1 ? ' star' : ' stars')}
                      onClick={() => setStars(n)}
                      style={{
                        background: 'none', border: 'none', fontSize: 32, padding: '0 2px',
                        color: n <= stars ? '#f59e0b' : 'var(--border)',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <input
                  className="field-input"
                  placeholder="Comment (only the business can see this)"
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={submitRating}
                  disabled={rating}
                >
                  {rating ? <><Spinner size="sm" /> Sending...</> : 'Submit rating'}
                </button>
              </div>
            )}

            {delivery.rated && (
              <p className="rider-hint" style={{ marginTop: 18 }}>Thanks for rating this delivery.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackPage