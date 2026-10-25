import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Avatar from './Avatar'
import { useMyAvatar } from './useMyAvatar'
import { useShareLocation } from './useShareLocation'
import { supabase } from './supabaseClient'
import StatusBadge from './StatusBadge'
import Spinner from './Spinner'
import Skeleton from './Skeleton'
import Greeting from './Greeting'
import VerifiedTick from './VerifiedTick'
import { tickTitle } from './businessUtils'
import { hasPin, navLink } from './maps'
import { showToast } from './toast'

type Delivery = {
  id: string
  item_name: string
  pickup_point: string
  dropoff_point: string
  status: string
  landmark: string | null
  customer_phone: string | null
  pickup_lat: number | null
  pickup_lng: number | null
  pickup_maps_url: string | null
  dropoff_lat: number | null
  dropoff_lng: number | null
  dropoff_maps_url: string | null
}

type Fleet = {
  name: string
  slug: string | null
  tick: boolean
  verification_type: string | null
}

const statusLabel: Record<string, string> = {
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
}

function customerTel(phone: string | null) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length < 7) return null
  if (digits.startsWith('234')) return 'tel:+' + digits
  if (digits.startsWith('0')) return 'tel:+234' + digits.slice(1)
  return 'tel:+' + digits
}

function RiderView() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const myAvatar = useMyAvatar(name)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const shareState = useShareLocation(deliveries.filter((d) => d.status === 'in_transit').map((d) => d.id))
  const [loadingDeliveries, setLoadingDeliveries] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({})
  const [codeErrors, setCodeErrors] = useState<Record<string, string>>({})
  const [isAvailable, setIsAvailable] = useState(true)
  const [updatingAvailability, setUpdatingAvailability] = useState(false)
  const [fleet, setFleet] = useState<Fleet | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [fleetBusy, setFleetBusy] = useState(false)

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        navigate('/signup/rider')
        return
      }
      setUserId(data.user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_available, name')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profile) setIsAvailable(profile.is_available)
      setName(profile?.name ?? '')

      setCheckingAuth(false)
    }
    checkUser()
  }, [navigate])

  async function fetchDeliveries(currentUserId: string) {
    const { data, error } = await supabase
      .from('deliveries')
      .select(
        'id, item_name, pickup_point, dropoff_point, status, landmark, customer_phone, pickup_lat, pickup_lng, pickup_maps_url, dropoff_lat, dropoff_lng, dropoff_maps_url'
      )
      .eq('rider_id', currentUserId)
      .neq('status', 'delivered')
      .order('created_at', { ascending: false })

    if (error) console.error('Fetch error:', error)
    else setDeliveries(data || [])
    setLoadingDeliveries(false)
  }

  useEffect(() => {
    if (userId) fetchDeliveries(userId)
  }, [userId])

  // Refresh every 30 seconds so a customer's shared pin shows up without a reload
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(() => fetchDeliveries(userId), 30000)
    return () => clearInterval(interval)
  }, [userId])

  // Heartbeat: while the rider is marked available and this page is open,
  // refresh "last seen" every minute so vendors can see who is really online.
  useEffect(() => {
    if (!userId || !isAvailable) return
    const currentUserId = userId

    const ping = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', currentUserId)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') ping()
    }

    ping()
    const interval = setInterval(ping, 60000)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, isAvailable])

  async function toggleAvailability() {
    if (!userId) return
    setUpdatingAvailability(true)

    const newValue = !isAvailable

    const { error } = await supabase
      .from('profiles')
      .update({ is_available: newValue, last_seen_at: new Date().toISOString() })
      .eq('id', userId)

    setUpdatingAvailability(false)

    if (error) {
      showToast('Failed to update availability: ' + error.message, 'error')
      return
    }

    setIsAvailable(newValue)
    showToast(newValue ? 'You are now available for deliveries.' : 'You are now marked unavailable.')
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id)

    const { error } = await supabase.rpc('advance_delivery', { p_id: id, p_status: newStatus })

    setUpdatingId(null)

    if (error) {
      showToast('Update failed: ' + error.message, 'error')
    } else {
      showToast('Delivery status updated.')
      if (userId) fetchDeliveries(userId)
    }
  }

  async function handleConfirmDelivery(delivery: Delivery) {
    const entered = (codeInputs[delivery.id] || '').trim()

    if (entered.length !== 4) {
      setCodeErrors((prev) => ({ ...prev, [delivery.id]: 'Enter the 4-digit code from the customer.' }))
      return
    }

    setUpdatingId(delivery.id)
    const { data, error } = await supabase.rpc('confirm_delivery', {
      p_id: delivery.id,
      p_code: entered,
    })
    setUpdatingId(null)

    if (error) {
      showToast('Could not confirm: ' + error.message, 'error')
      return
    }

    if (data === 'ok') {
      setCodeErrors((prev) => ({ ...prev, [delivery.id]: '' }))
      showToast('Delivery confirmed! Great work.')
      if (userId) fetchDeliveries(userId)
      return
    }

    if (data === 'locked') {
      setCodeErrors((prev) => ({
        ...prev,
        [delivery.id]: 'Too many wrong codes. Please contact the vendor for help.',
      }))
      showToast('Too many wrong codes.', 'error')
      return
    }

    setCodeErrors((prev) => ({ ...prev, [delivery.id]: 'Incorrect code. Ask the customer to confirm it.' }))
    showToast('Incorrect confirmation code.', 'error')
  }

  async function fetchFleet() {
    const { data } = await supabase.rpc('my_fleet_info')
    setFleet((data as Fleet | null) ?? null)
  }

  useEffect(() => {
    if (userId) fetchFleet()
  }, [userId])

  async function joinCompany(e: React.FormEvent) {
    e.preventDefault()
    const code = inviteCode.trim()
    if (!code) return

    setFleetBusy(true)
    const { data, error } = await supabase.rpc('join_company', { p_code: code })
    setFleetBusy(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    setInviteCode('')
    await fetchFleet()
    showToast('You joined ' + ((data as string | null) ?? 'the fleet') + '.')
  }

  async function leaveCompany() {
    if (!window.confirm('Leave ' + (fleet?.name ?? 'this fleet') + '?')) return

    setFleetBusy(true)
    const { error } = await supabase.rpc('leave_company')
    setFleetBusy(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    setFleet(null)
    showToast('You left the fleet.')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const nextStatus: Record<string, string> = {
    pending: 'picked_up',
    picked_up: 'in_transit',
  }

  if (checkingAuth) {
    return (
      <div className="page-bg">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="page-bg">
      <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'sans-serif', padding: '40px 20px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Greeting name={name} />
            <h1 style={{ color: 'var(--text)', marginTop: 4 }}>Rider Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to="/settings" className="header-avatar-link" aria-label="Settings" title="Settings">
              <Avatar url={myAvatar} name={name} size={36} />
            </Link>
            <button onClick={handleLogout}>Log Out</button>
          </div>
        </div>

        {shareState !== 'idle' && (
          <div className={'share-banner ' + (shareState === 'sharing' ? 'ok' : shareState === 'asking' ? '' : 'bad')} role="status">
            <span aria-hidden="true">📍</span>
            <span>
              {shareState === 'sharing' && 'Sharing your live location with the customer and vendor. Keep this page open and your screen on.'}
              {shareState === 'asking' && 'Please tap Allow so we can share your live location for this delivery.'}
              {shareState === 'denied' && 'Location is blocked. Allow location for this site in your browser settings so customers can see you on the map.'}
              {shareState === 'unsupported' && 'This phone or browser cannot share a live location.'}
              {shareState === 'error' && 'Could not send your location just now. Check your network and location settings.'}
            </span>
          </div>
        )}

        <div className={'status-card fade-in-card ' + (isAvailable ? 'stat-green' : '')}>
          <div>
            <strong style={{ color: 'var(--text)' }}>
              Status: {isAvailable ? '🟢 Available' : '⚪ Unavailable'}
            </strong>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {isAvailable
                ? 'Vendors can currently assign you new deliveries.'
                : 'You are hidden from vendors — no new deliveries will be assigned to you.'}
            </p>
          </div>
          <button className="btn-primary btn-sm" onClick={toggleAvailability} disabled={updatingAvailability}>
            {updatingAvailability
              ? <><Spinner size="sm" /> Updating...</>
              : isAvailable ? 'Go Unavailable' : 'Go Available'}
          </button>
        </div>

        <div className="fleet-panel" style={{ marginBottom: 24 }}>
          {fleet ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <strong style={{ color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Fleet: {fleet.name}{' '}
                  {fleet.tick && <VerifiedTick size={16} title={tickTitle(fleet.verification_type)} />}
                </strong>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  You receive deliveries from this company.{' '}
                  {fleet.slug && (
                    <Link to={'/b/' + fleet.slug} style={{ color: 'var(--accent)' }}>View company page</Link>
                  )}
                </p>
              </div>
              <button type="button" className="rider-btn" onClick={leaveCompany} disabled={fleetBusy}>
                Leave fleet
              </button>
            </div>
          ) : (
            <form onSubmit={joinCompany}>
              <label className="field-label" htmlFor="invite-code">Join a company fleet</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
                Got an invite code from a dispatch company? Enter it here.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  id="invite-code"
                  className="field-input"
                  placeholder="Invite code"
                  maxLength={12}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  style={{ flex: 1, minWidth: 160, letterSpacing: 2 }}
                />
                <button type="submit" className="btn-primary btn-sm" disabled={fleetBusy || !inviteCode.trim()}>
                  {fleetBusy ? <><Spinner size="sm" /> Joining...</> : 'Join'}
                </button>
              </div>
            </form>
          )}
        </div>

        <h2 style={{ color: 'var(--text)' }}>My Assigned Deliveries</h2>

        {loadingDeliveries && [0, 1].map((i) => (
          <div key={i} className="delivery-card" aria-busy="true">
            <Skeleton width="45%" height={18} />
            <Skeleton width="80%" height={14} style={{ marginTop: 12 }} />
            <Skeleton width={90} height={22} radius={999} style={{ marginTop: 12 }} />
            <Skeleton width={150} height={40} radius={10} style={{ marginTop: 14 }} />
          </div>
        ))}

        {!loadingDeliveries && deliveries.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No active deliveries assigned to you yet.</p>
        )}

        {!loadingDeliveries && deliveries.map((d) => {
          const tel = customerTel(d.customer_phone)
          const pickupPinned = hasPin(d.pickup_lat, d.pickup_maps_url)
          const dropoffPinned = hasPin(d.dropoff_lat, d.dropoff_maps_url)
          const dropoffSearch = [d.landmark, d.dropoff_point].filter(Boolean).join(', ')

          return (
            <div key={d.id} className={'delivery-card fade-in-card edge-' + d.status}>
              <strong style={{ color: 'var(--text)' }}>{d.item_name}</strong>
              <p style={{ color: 'var(--text-secondary)' }}>{d.pickup_point} → {d.dropoff_point}</p>
              {d.landmark && <p style={{ color: 'var(--text-secondary)' }}>Landmark: {d.landmark}</p>}
              <p style={{ color: 'var(--text)' }}>Status: <StatusBadge status={d.status} /></p>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {nextStatus[d.status] && (
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => updateStatus(d.id, nextStatus[d.status])}
                    disabled={updatingId === d.id}
                  >
                    {updatingId === d.id
                      ? <><Spinner size="sm" /> Updating...</>
                      : 'Mark as ' + statusLabel[nextStatus[d.status]]}
                  </button>
                )}

                {d.status === 'pending' ? (
                  <a
                    className="rider-btn"
                    href={navLink(d.pickup_lat, d.pickup_lng, d.pickup_maps_url, d.pickup_point)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pickupPinned ? 'Navigate to pickup' : 'Find pickup on Maps'}
                  </a>
                ) : (
                  <a
                    className="rider-btn"
                    href={navLink(d.dropoff_lat, d.dropoff_lng, d.dropoff_maps_url, dropoffSearch)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {dropoffPinned ? 'Navigate to drop-off' : 'Find drop-off on Maps'}
                  </a>
                )}

                {tel && <a className="rider-btn" href={tel}>Call customer</a>}
              </div>

              {d.status !== 'pending' && !dropoffPinned && (
                <p className="rider-hint" style={{ margin: '8px 0 0' }}>
                  No exact pin yet, so Maps will search by the address. Call the customer if you cannot find them.
                </p>
              )}

              {d.status === 'in_transit' && (
                <div style={{ marginTop: 14 }}>
                  <label className="field-label" htmlFor={'code-' + d.id}>Customer confirmation code</label>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
                    Ask the customer for their 4-digit code to complete delivery.
                  </p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      id={'code-' + d.id}
                      className="field-input"
                      placeholder="4-digit code"
                      maxLength={4}
                      inputMode="numeric"
                      value={codeInputs[d.id] || ''}
                      onChange={(e) => setCodeInputs((prev) => ({ ...prev, [d.id]: e.target.value }))}
                      style={{ width: 140, textAlign: 'center', letterSpacing: 4, fontWeight: 700 }}
                    />
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => handleConfirmDelivery(d)}
                      disabled={updatingId === d.id}
                    >
                      {updatingId === d.id
                        ? <><Spinner size="sm" /> Confirming...</>
                        : 'Confirm Delivery'}
                    </button>
                  </div>
                  {codeErrors[d.id] && (
                    <p style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>{codeErrors[d.id]}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RiderView