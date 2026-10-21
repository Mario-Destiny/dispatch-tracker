import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import Skeleton from './Skeleton'
import { parseMapsInput } from './maps'
import { showToast } from './toast'

type Info = {
  item_name: string
  business_name: string | null
  status: string
  has_pin: boolean
  pin_source: string | null
  pin_at: string | null
  can_set: boolean
}

function CustomerPin() {
  const { token } = useParams<{ token: string }>()
  const [info, setInfo] = useState<Info | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState('')
  const [thanks, setThanks] = useState(false)

  async function load() {
    const { data } = await supabase.rpc('pin_info', { p_token: token ?? '' })
    setInfo((data as Info | null) ?? null)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function save(lat: number | null, lng: number | null, url: string | null) {
    setBusy(true)
    const { error } = await supabase.rpc('customer_set_pin', {
      p_token: token ?? '',
      p_lat: lat,
      p_lng: lng,
      p_url: url,
    })
    setBusy(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    setThanks(true)
    setLink('')
    load()
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      showToast('Your browser cannot share location. Paste a map link below instead.', 'error')
      return
    }

    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false)
        save(pos.coords.latitude, pos.coords.longitude, null)
      },
      (err) => {
        setBusy(false)
        showToast(
          err.code === 1
            ? 'Location is blocked. Allow it in your browser settings, or paste a map link below.'
            : 'Could not get your location. Try again, or paste a map link below.',
          'error'
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function sendLink(e: React.FormEvent) {
    e.preventDefault()
    const pin = parseMapsInput(link)
    if (!pin) {
      showToast('That does not look like a Google Maps link or coordinates.', 'error')
      return
    }
    save(pin.lat, pin.lng, pin.url)
  }

  return (
    <div className="page-bg">
      <div className="auth-wrap">
        {loading ? (
          <div className="form-card" aria-busy="true">
            <Skeleton width="60%" height={26} />
            <Skeleton height={60} radius={12} />
          </div>
        ) : !info ? (
          <div className="form-card" style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: 'var(--text)' }}>This link is not valid</h2>
            <p className="rider-hint">Please ask the sender to send you the link again.</p>
          </div>
        ) : info.status === 'delivered' ? (
          <div className="form-card" style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: 'var(--text)' }}>Delivery complete</h2>
            <p className="rider-hint">Thank you. You no longer need to share your location for this delivery.</p>
          </div>
        ) : (
          <div className="form-card fade-in-card">
            <div>
              <h1 className="auth-title" style={{ marginBottom: 6 }}>Share your location</h1>
              <p className="auth-sub" style={{ marginBottom: 0 }}>
                {info.business_name ? info.business_name + ' is' : 'Your sender is'} delivering
                {' '}<strong>{info.item_name}</strong> to you. Share your exact spot so the rider can find you quickly.
              </p>
            </div>

            {thanks || info.has_pin ? (
              <div className="admin-warning" style={{ color: 'var(--green-fg)', background: 'var(--green-bg)' }}>
                ✓ Your location is saved. You can update it below if you moved.
              </div>
            ) : null}

            {info.can_set ? (
              <>
                <button type="button" className="btn-primary btn-block" onClick={shareLocation} disabled={busy}>
                  {busy ? <><Spinner size="sm" /> Working...</> : info.has_pin ? 'Update my location' : 'Share my location'}
                </button>

                <form onSubmit={sendLink} className="auth-form" style={{ gap: 10 }}>
                  <label className="field-label" htmlFor="map-link">Or paste a Google Maps link</label>
                  <input
                    id="map-link"
                    className="field-input"
                    placeholder="https://maps.app.goo.gl/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                  <button type="submit" className="rider-btn" disabled={busy || !link.trim()}>
                    Send link
                  </button>
                </form>
              </>
            ) : (
              <p className="rider-hint">This delivery cannot take more updates.</p>
            )}

            <p className="rider-hint" style={{ margin: 0 }}>
              Your location is shown only to the sender and the rider assigned to this delivery. We use it to help
              find you and we do not track you afterwards.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerPin