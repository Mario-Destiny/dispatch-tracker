import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import LocationSelector from './LocationSelector'
import { useTheme } from './useTheme'
import StatusBadge from './StatusBadge'
import Spinner from './Spinner'
import Skeleton from './Skeleton'
import BusinessPanel from './BusinessPanel'
import MyBadges from './MyBadges'
import PinField from './PinField'
import { navLink, type Pin } from './maps'
import Greeting from './Greeting'
import { firstName } from './userName'
import { CONTACT_EMAIL, CURRENCY, FREE_PLAN_MONTHLY_LIMIT } from './siteInfo'
import { monthKey, inMonth, countInMonth, formatMoney, downloadMonthlyCsv } from './report'
import { showToast } from './toast'


type Delivery = {
  id: string
  item_name: string
  pickup_point: string
  dropoff_point: string
  customer_phone: string | null
  status: string
  tracking_code: string
  estimated_delivery: string | null
  created_at: string
  updated_at: string
  rider_id: string | null
  delivery_fee: number | null
  client_name: string | null
  landmark: string | null
  pickup_lat: number | null
  pickup_lng: number | null
  pickup_maps_url: string | null
  dropoff_lat: number | null
  dropoff_lng: number | null
  dropoff_maps_url: string | null
  dropoff_pin_at: string | null
}

type Rider = {
  id: string
  name: string
  phone: string | null
  is_available: boolean
  last_seen_at: string | null
}

type Company = {
  name: string
  join_code: string
  verified: boolean
}

type RiderState = 'online' | 'away' | 'offline'
type RiderFilter = 'all' | RiderState

const ONLINE_WINDOW_MS = 2 * 60 * 1000
const stateRank: Record<RiderState, number> = { online: 0, away: 1, offline: 2 }
const stateLabel: Record<RiderState, string> = { online: 'Online', away: 'Away', offline: 'Offline' }
const filterLabel: Record<RiderFilter, string> = { all: 'All', online: 'Online', away: 'Away', offline: 'Offline' }
const filters: RiderFilter[] = ['all', 'online', 'away', 'offline']

function generateCode(length: number, charset: string) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += charset[Math.floor(Math.random() * charset.length)]
  }
  return code
}

function formatPhoneForWhatsApp(phone: string) {
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.startsWith('234')) return digitsOnly
  if (digitsOnly.startsWith('0')) return '234' + digitsOnly.slice(1)
  return digitsOnly
}

function buildWhatsAppLink(delivery: Delivery, pinToken?: string) {
  const trackingUrl = window.location.origin + '/track?code=' + delivery.tracking_code
   const pinPart = pinToken
    ? '\n\nPlease share your exact location so the rider can find you: ' + window.location.origin + '/l/' + pinToken
    : ''
  const message = 'Hi! You can track your delivery here: ' + trackingUrl + '\n\nYour tracking code is: ' + delivery.tracking_code + pinPart
  const encodedMessage = encodeURIComponent(message)

  if (delivery.customer_phone) {
    const formattedPhone = formatPhoneForWhatsApp(delivery.customer_phone)
    return 'https://wa.me/' + formattedPhone + '?text=' + encodedMessage
  }

  return 'https://wa.me/?text=' + encodedMessage
}

function formatDuration(minutes: number) {
  if (minutes < 60) return Math.round(minutes) + 'm'
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return hours + 'h ' + mins + 'm'
}

function getRiderState(r: Rider): RiderState {
  if (!r.is_available) return 'offline'
  if (r.last_seen_at && Date.now() - new Date(r.last_seen_at).getTime() < ONLINE_WINDOW_MS) return 'online'
  return 'away'
}

function durationSince(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return null
  if (mins < 60) return mins + ' min'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + ' hr'
  const days = Math.floor(hrs / 24)
  return days + (days === 1 ? ' day' : ' days')
}

function statusText(r: Rider, state: RiderState) {
  if (state === 'online') return 'Active now'
  if (!r.last_seen_at) return state === 'away' ? 'No recent activity' : 'Offline'
  const d = durationSince(r.last_seen_at)
  if (state === 'away') return d ? 'Last seen ' + d + ' ago' : 'Last seen just now'
  return d ? 'Offline for ' + d : 'Just went offline'
}

function initialsOf(name: string) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?'
}

type VendorViewProps = {
  mode?: 'vendor' | 'company'
}

function VendorView({ mode = 'vendor' }: VendorViewProps) {
  const isCompany = mode === 'company'
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [userId, setUserId] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(isCompany)
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [riderFilter, setRiderFilter] = useState<RiderFilter>('all')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [itemName, setItemName] = useState('')
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [landmark, setLandmark] = useState('')
    const [pickupPin, setPickupPin] = useState<Pin | null>(null)
  const [dropoffPin, setDropoffPin] = useState<Pin | null>(null)
  const [pinTokens, setPinTokens] = useState<Record<string, string>>({})
  const [phone, setPhone] = useState('')
  const [eta, setEta] = useState('')
  const [fee, setFee] = useState('')
  const [selectedRiderId, setSelectedRiderId] = useState('')
  const [locationResetKey, setLocationResetKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loadingDeliveries, setLoadingDeliveries] = useState(true)
  const [loadingRiders, setLoadingRiders] = useState(true)
  const [reportMonth, setReportMonth] = useState(() => monthKey(new Date()))
  const [, setTick] = useState(0)

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        navigate(isCompany ? '/signup/company' : '/signup/vendor')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      const role = prof?.role
      if (role === 'company' && !isCompany) {
        navigate('/company', { replace: true })
        return
      }
      if (role !== 'company' && isCompany) {
        navigate('/login', { replace: true })
        return
      }

      setUserId(data.user.id)
      setCheckingAuth(false)
    }
    checkUser()
  }, [navigate, isCompany])

  async function fetchDeliveries(_currentUserId: string) {
    const { data, error } = await supabase
      .from('deliveries')
             .select('id, item_name, pickup_point, dropoff_point, customer_phone, status, tracking_code, estimated_delivery, created_at, updated_at, rider_id, delivery_fee, client_name, landmark, pickup_lat, pickup_lng, pickup_maps_url, dropoff_lat, dropoff_lng, dropoff_maps_url, dropoff_pin_at')

    if (error) console.error('Fetch error:', error)
    else setDeliveries(data || [])
      setLoadingDeliveries(false)
    fetchPinTokens()
  }

    async function fetchPinTokens() {
    const { data } = await supabase.rpc('my_pin_tokens')
    setPinTokens((data as Record<string, string> | null) ?? {})
  }

  // Security rules decide which riders you may see:
  // vendors see independent riders, companies see only their own fleet.
  async function fetchRiders() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, phone, is_available, last_seen_at')
      .eq('role', 'rider')

    if (error) console.error('Rider fetch error:', error)
    else setRiders(data || [])
    setLoadingRiders(false)
  }

  async function fetchName(currentUserId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', currentUserId)
      .maybeSingle()
    setName(data?.name ?? '')
  }

  async function fetchPlan(currentUserId: string) {
    const { data } = await supabase
      .from('vendor_plans')
      .select('plan')
      .eq('vendor_id', currentUserId)
      .maybeSingle()
    setPlan(data?.plan === 'pro' ? 'pro' : 'free')
  }

  async function fetchCompany(currentUserId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('name, join_code, verified')
      .eq('owner_id', currentUserId)
      .maybeSingle()

    if (error) console.error('Company fetch error:', error)
    setCompany(data ?? null)
    setLoadingCompany(false)
  }

  useEffect(() => {
    if (!userId) return

    fetchDeliveries(userId)
    fetchRiders()
    fetchName(userId)
    fetchPlan(userId)
    if (isCompany) fetchCompany(userId)

    // Refresh rider statuses every 30 seconds, and re-render so "x min ago" stays current
    const interval = setInterval(() => {
      fetchRiders()
      setTick((t) => t + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [userId, isCompany])

  // If the rider you picked goes offline before you submit, clear the choice
  useEffect(() => {
    if (!selectedRiderId) return
    const r = riders.find((x) => x.id === selectedRiderId)
    if (!r || !r.is_available) {
      setSelectedRiderId('')
      showToast('The selected rider is no longer available. Please pick another.', 'error')
    }
  }, [riders, selectedRiderId])

  async function copyCode() {
    if (!company) return
    try {
      await navigator.clipboard.writeText(company.join_code)
      showToast('Invite code copied.')
    } catch {
      showToast('Could not copy. Please copy the code by hand.', 'error')
    }
  }

  async function regenerateCode() {
    if (!window.confirm('Create a new invite code? The old code will stop working. Riders already in your fleet stay.')) return
    const { data, error } = await supabase.rpc('regenerate_join_code')
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setCompany((prev) => (prev ? { ...prev, join_code: data as string } : prev))
    showToast('New invite code created.')
  }

  async function removeRider(r: Rider) {
    if (!window.confirm('Remove ' + r.name + ' from your fleet?')) return
    setRemovingId(r.id)
    const { error } = await supabase.rpc('remove_rider', { p_rider_id: r.id })
    setRemovingId(null)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    if (selectedRiderId === r.id) setSelectedRiderId('')
    showToast(r.name + ' was removed from your fleet.')
    fetchRiders()
  }

  async function createDelivery(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    if (
      FREE_PLAN_MONTHLY_LIMIT > 0 &&
      plan === 'free' &&
      countInMonth(deliveries, monthKey(new Date())) >= FREE_PLAN_MONTHLY_LIMIT
    ) {
      showToast('You have used all ' + FREE_PLAN_MONTHLY_LIMIT + ' free deliveries this month.', 'error')
      return
    }

    const chosenRider = riders.find((r) => r.id === selectedRiderId)
    if (!chosenRider || !chosenRider.is_available) {
      showToast('Please select an available rider first.', 'error')
      return
    }

    if (!pickup || !dropoff) {
      showToast('Please complete both pickup and drop-off locations.', 'error')
      return
    }

    const feeValue = fee.trim() === '' ? null : Number(fee)
    if (feeValue !== null && (Number.isNaN(feeValue) || feeValue < 0)) {
      showToast('Please enter a valid delivery fee.', 'error')
      return
    }

    setSubmitting(true)

    const trackingCode = 'DT-' + generateCode(5, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
    const confirmationCode = generateCode(4, '0123456789')

    const { error } = await supabase.from('deliveries').insert({
      vendor_id: userId,
      rider_id: selectedRiderId,
      item_name: itemName,
      pickup_point: pickup,
      dropoff_point: dropoff,
            landmark: landmark.trim() || null,
      pickup_lat: pickupPin?.lat ?? null,
      pickup_lng: pickupPin?.lng ?? null,
      pickup_maps_url: pickupPin?.url ?? null,
      dropoff_lat: dropoffPin?.lat ?? null,
      dropoff_lng: dropoffPin?.lng ?? null,
      dropoff_maps_url: dropoffPin?.url ?? null,
      dropoff_pin_source: dropoffPin ? (dropoffPin.url ? 'vendor_link' : 'vendor_gps') : null,
      dropoff_pin_at: dropoffPin ? new Date().toISOString() : null,
      client_name: isCompany ? clientName.trim() || null : null,
      customer_phone: phone,
      estimated_delivery: eta,
      delivery_fee: feeValue,
      tracking_code: trackingCode,
      confirmation_code: confirmationCode,
      status: 'pending',
    })

    setSubmitting(false)

    if (error) {
           showToast(
        error.code === '42501' || error.message.toLowerCase().includes('row-level security')
          ? 'Your account cannot create deliveries right now. See the notice at the top of the page.'
          : 'Failed to create delivery: ' + error.message,
        'error'
      )
      return
    }

    showToast('Delivery created successfully!')
    setClientName('')
    setItemName('')
    setPickup('')
    setDropoff('')
    setLandmark('')
    setPhone('')
    setEta('')
    setFee('')
    setSelectedRiderId('')
      setPickupPin(null)
    setDropoffPin(null)
    setLocationResetKey((prev) => prev + 1)
    fetchDeliveries(userId)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (checkingAuth) {
    return (
      <div className="page-bg">
        <Spinner />
      </div>
    )
  }

  if (isCompany && !loadingCompany && !company) {
    return (
      <div className="page-bg">
        <div className="auth-wrap">
          <h1 className="auth-title">Finish setting up</h1>
          <p className="auth-sub">
            Your account exists, but your company details were not saved. Please email{' '}
            <a href={'mailto:' + CONTACT_EMAIL} style={{ color: 'var(--accent)' }}>{CONTACT_EMAIL}</a>{' '}
            and we will fix it quickly.
          </p>
          <div style={{ textAlign: 'center' }}>
            <button onClick={handleLogout}>Log Out</button>
          </div>
        </div>
      </div>
    )
  }

  const totalDeliveries = deliveries.length
  const deliveredList = deliveries.filter((d) => d.status === 'delivered')
  const deliveredCount = deliveredList.length
  const inProgressCount = totalDeliveries - deliveredCount

  let avgTimeLabel = '—'
  if (deliveredList.length > 0) {
    const totalMinutes = deliveredList.reduce((sum, d) => {
      const start = new Date(d.created_at).getTime()
      const end = new Date(d.updated_at).getTime()
      return sum + (end - start) / 60000
    }, 0)
    avgTimeLabel = formatDuration(totalMinutes / deliveredList.length)
  }

  const stats = [
    { label: 'Total Deliveries', value: totalDeliveries, tone: 'stat-blue' },
    { label: 'Delivered', value: deliveredCount, tone: 'stat-green' },
    { label: 'In Progress', value: inProgressCount, tone: 'stat-amber' },
    { label: 'Avg. Delivery Time', value: avgTimeLabel, tone: 'stat-violet' },
  ]

  const riderRows = riders
    .map((r) => ({ rider: r, state: getRiderState(r) }))
    .sort(
      (a, b) =>
        stateRank[a.state] - stateRank[b.state] ||
        (b.rider.last_seen_at ?? '').localeCompare(a.rider.last_seen_at ?? '')
    )

  const counts: Record<RiderFilter, number> = {
    all: riderRows.length,
    online: riderRows.filter((x) => x.state === 'online').length,
    away: riderRows.filter((x) => x.state === 'away').length,
    offline: riderRows.filter((x) => x.state === 'offline').length,
  }

  const visibleRiders = riderRows.filter((x) => riderFilter === 'all' || x.state === riderFilter)
  const selectedRider = riders.find((r) => r.id === selectedRiderId)

  // Plan usage (only matters when a free-plan limit is switched on in siteInfo.ts)
  const thisMonthKey = monthKey(new Date())
  const usedThisMonth = countInMonth(deliveries, thisMonthKey)
  const limitActive = FREE_PLAN_MONTHLY_LIMIT > 0 && plan === 'free'
  const limitReached = limitActive && usedThisMonth >= FREE_PLAN_MONTHLY_LIMIT

  // Monthly report
  const activeMonth = reportMonth || thisMonthKey
  const reportRows = deliveries.filter((d) => inMonth(d.created_at, activeMonth))
  const reportDelivered = reportRows.filter((d) => d.status === 'delivered')
  const sumFees = (list: Delivery[]) =>
    list.reduce((sum, d) => sum + (d.delivery_fee ? Number(d.delivery_fee) : 0), 0)
  const riderNames = riders.reduce<Record<string, string>>((acc, r) => {
    acc[r.id] = r.name
    return acc
  }, {})

  const clientTotals = reportRows.reduce<Record<string, { count: number; fees: number }>>((acc, d) => {
    const key = d.client_name || 'No client name'
    if (!acc[key]) acc[key] = { count: 0, fees: 0 }
    acc[key].count += 1
    acc[key].fees += d.delivery_fee ? Number(d.delivery_fee) : 0
    return acc
  }, {})

  return (
    <div className="page-bg">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 20px 60px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <Greeting name={name} />
            <h1 style={{ color: 'var(--text)', marginTop: 4, marginBottom: 6 }}>
              {isCompany ? 'Company Dashboard' : 'Vendor Dashboard'}
            </h1>
                       <MyBadges />
                  
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggleTheme}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text)' }}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <button onClick={handleLogout} style={{ padding: '6px 12px' }}>Log Out</button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
          margin: '20px 0 28px',
        }}>
          {loadingDeliveries
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="stat-card" style={{ background: 'var(--card)' }}>
                  <div className="stat-values">
                    <Skeleton width={48} height={26} radius={8} />
                  </div>
                  <Skeleton width="70%" height={12} style={{ margin: '10px auto 0' }} />
                </div>
              ))
            : stats.map((s) => {
                const parts = String(s.value).split(' ')
                return (
                  <div key={s.label} className={'stat-card fade-in-card ' + s.tone}>
                    <div className="stat-values">
                      <div className="stat-value">{parts[0]}</div>
                      {parts[1] && <div className="stat-value-sub">{parts[1]}</div>}
                    </div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                )
              })}
        </div>

        {isCompany && company && (
          <>
            <h2 style={{ color: 'var(--text)' }}>Fleet invite code</h2>
            <div className="fleet-panel">
              <p className="rider-hint" style={{ marginBottom: 12 }}>
                Give this code to your riders. They enter it on their dashboard to join your fleet.
              </p>
              <div className="invite-box">
                <span className="invite-code">{company.join_code}</span>
                <button type="button" className="btn-primary btn-sm" onClick={copyCode}>Copy code</button>
                <button type="button" className="rider-btn" onClick={regenerateCode}>New code</button>
              </div>
            </div>
          </>
        )}

        <h2 style={{ color: 'var(--text)' }}>{isCompany ? 'Your riders' : 'Choose a rider'}</h2>

        <div className="rider-panel">
          <div className="rider-pills">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                className={'rider-pill' + (riderFilter === f ? ' on' : '')}
                onClick={() => setRiderFilter(f)}
              >
                {filterLabel[f]} {counts[f]}
              </button>
            ))}
          </div>

          {loadingRiders ? (
            <div className="rider-list" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rider-row">
                  <Skeleton width={42} height={42} radius={999} />
                  <div className="rider-info">
                    <Skeleton width="45%" height={14} />
                    <Skeleton width="30%" height={12} style={{ marginTop: 8 }} />
                  </div>
                  <Skeleton width={70} height={24} radius={999} />
                </div>
              ))}
            </div>
          ) : visibleRiders.length === 0 ? (
            <p className="rider-hint">
              {riders.length === 0
                ? isCompany
                  ? 'No riders have joined yet. Share your invite code above.'
                  : 'No riders have signed up yet.'
                : 'No riders in this group.'}
            </p>
          ) : (
            <div className="rider-list">
              {visibleRiders.map(({ rider: r, state }) => {
                const digits = (r.phone || '').replace(/\D/g, '')
                const canContact = digits.length >= 7
                const intl = formatPhoneForWhatsApp(r.phone || '')
                const isSelected = selectedRiderId === r.id

                return (
                  <div key={r.id} className={'rider-row' + (isSelected ? ' selected' : '')}>
                    <div className="rider-av">
                      {initialsOf(r.name)}
                      <span className={'rider-dot dot-' + state} />
                    </div>

                    <div className="rider-info">
                      <div className="rider-name">{r.name}</div>
                      <div className="rider-sub">{statusText(r, state)}</div>
                    </div>

                    <span className={'rider-badge badge-' + state}>{stateLabel[state]}</span>

                    <div className="rider-actions">
                      {canContact && (
                        <>
                          <a
                            className="rider-btn rider-btn-wa"
                            href={
                              'https://wa.me/' + intl + '?text=' +
                              encodeURIComponent('Hi ' + firstName(r.name) + ', are you available for a delivery?')
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            WhatsApp
                          </a>
                          <a className="rider-btn" href={'tel:+' + intl}>Call</a>
                        </>
                      )}

                      {state === 'offline' ? (
                        <span className="rider-muted">Can't assign</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={() => setSelectedRiderId(r.id)}
                        >
                          {isSelected ? 'Selected ✓' : 'Select'}
                        </button>
                      )}

                      {isCompany && (
                        <button
                          type="button"
                          className="rider-btn rider-btn-danger"
                          onClick={() => removeRider(r)}
                          disabled={removingId === r.id}
                        >
                          {removingId === r.id ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loadingRiders && riders.length > 0 && counts.online + counts.away === 0 && (
            <p className="rider-hint" style={{ marginTop: 12 }}>
              No riders are available right now. Offline riders can't be assigned.
            </p>
          )}
        </div>

        <h2 style={{ color: 'var(--text)' }}>New Delivery</h2>

        {limitActive && (
          <div className="usage-card">
            <div className="usage-text">
              <span>
                Free plan: {Math.min(usedThisMonth, FREE_PLAN_MONTHLY_LIMIT)} of {FREE_PLAN_MONTHLY_LIMIT} deliveries used this month
              </span>
              {limitReached && <strong style={{ color: '#ef4444' }}>Limit reached</strong>}
            </div>
            <div className="usage-track">
              <div
                className={'usage-fill' + (limitReached ? ' full' : '')}
                style={{ width: Math.min(100, (usedThisMonth / FREE_PLAN_MONTHLY_LIMIT) * 100) + '%' }}
              />
            </div>
          </div>
        )}

        <form onSubmit={createDelivery} className="form-card">
          {isCompany && (
            <div className="field">
              <label className="field-label" htmlFor="client-name">Client (who this delivery is for)</label>
              <input
                id="client-name"
                className="field-input"
                placeholder="e.g. Mama Tee Boutique"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="item-name">Item name</label>
            <input
              id="item-name"
              className="field-input"
              placeholder="e.g. Red sneakers, size 42"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>

          <LocationSelector key={'pickup-' + locationResetKey} label="Pickup Location" onChange={setPickup} />
          <LocationSelector key={'dropoff-' + locationResetKey} label="Drop-off Location" onChange={setDropoff} />

          <div className="field">
            <label className="field-label" htmlFor="landmark">Street or landmark (helps the rider find the customer)</label>
            <input
              id="landmark"
              className="field-input"
              placeholder="e.g. 12 Allen Avenue, opposite the filling station"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>
          <PinField
            key={'pickup-pin-' + locationResetKey}
            label="Pickup pin (optional)"
            hint="Helps the rider find the pickup point."
            value={pickupPin}
            onChange={setPickupPin}
          />

          <PinField
            key={'dropoff-pin-' + locationResetKey}
            label="Drop-off pin (optional)"
            hint="Or leave this empty. The WhatsApp message you send will ask the customer to share their location."
            value={dropoffPin}
            onChange={setDropoffPin}
          />
          <div className="field">
            <label className="field-label" htmlFor="customer-phone">Customer phone</label>
            <input
              id="customer-phone"
              className="field-input"
              placeholder="e.g. 0801 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="eta">Estimated delivery</label>
            <input
              id="eta"
              className="field-input"
              placeholder="e.g. Today, 4pm"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="delivery-fee">Delivery fee, {CURRENCY} (optional)</label>
            <input
              id="delivery-fee"
              className="field-input"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="e.g. 1500"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </div>

          <div className="field">
            <span className="field-label">Rider</span>
            {selectedRider ? (
              <div className="rider-chip">
                <span>{selectedRider.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedRiderId('')}
                  aria-label="Clear selected rider"
                >
                  ✕
                </button>
              </div>
            ) : (
              <p className="rider-hint">No rider selected. Choose one from the list above.</p>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting || limitReached}>
            {submitting ? <><Spinner size="sm" /> Creating...</> : 'Create Delivery'}
          </button>

          {limitReached && (
            <p className="rider-hint" style={{ marginTop: -8 }}>
              You have reached this month's free limit.{' '}
              <a href={'mailto:' + CONTACT_EMAIL} style={{ color: 'var(--accent)' }}>Contact us to upgrade</a>.
            </p>
          )}
        </form>

        <h2 style={{ marginTop: 32, color: 'var(--text)' }}>Monthly report</h2>

        <div className="report-panel">
          <div className="report-controls">
            <div className="field">
              <label className="field-label" htmlFor="report-month">Month</label>
              <input
                id="report-month"
                className="field-input"
                type="month"
                max={thisMonthKey}
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => downloadMonthlyCsv(activeMonth, reportRows, riderNames)}
              disabled={loadingDeliveries || reportRows.length === 0}
            >
              Download CSV
            </button>
          </div>

          {loadingDeliveries ? (
            <div className="report-grid" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="report-stat">
                  <Skeleton width={60} height={22} radius={6} style={{ margin: '0 auto' }} />
                  <Skeleton width="70%" height={12} style={{ margin: '8px auto 0' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="report-grid">
              <div className="report-stat">
                <div className="report-value">{reportRows.length}</div>
                <div className="report-label">Deliveries created</div>
              </div>
              <div className="report-stat">
                <div className="report-value">{reportDelivered.length}</div>
                <div className="report-label">Delivered</div>
              </div>
              <div className="report-stat">
                <div className="report-value">{formatMoney(sumFees(reportDelivered))}</div>
                <div className="report-label">Fees on delivered</div>
              </div>
              <div className="report-stat">
                <div className="report-value">{formatMoney(sumFees(reportRows))}</div>
                <div className="report-label">Fees on all deliveries</div>
              </div>
            </div>
          )}

          {isCompany && !loadingDeliveries && reportRows.length > 0 && (
            <div className="client-list">
              <strong style={{ color: 'var(--text)', fontSize: 14 }}>By client</strong>
              {Object.entries(clientTotals)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([client, t]) => (
                  <div key={client} className="client-row">
                    <span>{client}</span>
                    <strong>
                      {t.count} {t.count === 1 ? 'delivery' : 'deliveries'} · {formatMoney(t.fees)}
                    </strong>
                  </div>
                ))}
            </div>
          )}

          {!loadingDeliveries && reportRows.length === 0 && (
            <p className="rider-hint" style={{ marginTop: 12 }}>No deliveries in this month.</p>
          )}
        </div>
                <BusinessPanel isCompany={isCompany} />

        <h2 style={{ color: 'var(--text)' }}>My Deliveries</h2>

        {loadingDeliveries && [0, 1, 2].map((i) => (
          <div key={i} className="delivery-card" aria-busy="true">
            <Skeleton width="45%" height={18} />
            <Skeleton width="80%" height={14} style={{ marginTop: 12 }} />
            <Skeleton width={90} height={22} radius={999} style={{ marginTop: 12 }} />
            <Skeleton width={160} height={30} radius={6} style={{ marginTop: 14 }} />
          </div>
        ))}

        {!loadingDeliveries && deliveries.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No deliveries yet.</p>
        )}

        {!loadingDeliveries && deliveries.map((d) => {
                    const whatsappLink = buildWhatsAppLink(d, pinTokens[d.id])
          const pinned = d.dropoff_lat !== null || Boolean(d.dropoff_maps_url)
          return (
            <div key={d.id} className={'delivery-card fade-in-card edge-' + d.status}>
              <strong style={{ color: 'var(--text)' }}>{d.item_name}</strong>
              {d.client_name && <p style={{ color: 'var(--text-secondary)' }}>Client: {d.client_name}</p>}
              <p style={{ color: 'var(--text-secondary)' }}>{d.pickup_point} → {d.dropoff_point}</p>
                          {d.landmark && <p style={{ color: 'var(--text-secondary)' }}>Landmark: {d.landmark}</p>}
              <p style={{ color: 'var(--text-secondary)' }}>
                Drop-off pin:{' '}
                {pinned ? (
                  <>
                    saved{d.dropoff_pin_at ? ' (' + new Date(d.dropoff_pin_at).toLocaleString() + ')' : ''} ·{' '}
                    <a
                      href={navLink(d.dropoff_lat, d.dropoff_lng, d.dropoff_maps_url, d.dropoff_point)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)' }}
                    >
                      View on map
                    </a>
                  </>
                ) : d.status === 'delivered' ? (
                  'none'
                ) : (
                  'not shared yet. The WhatsApp button below asks the customer for it.'
                )}
              </p>

              <p style={{ color: 'var(--text)' }}>Status: <StatusBadge status={d.status} /></p>
              {d.estimated_delivery && <p style={{ color: 'var(--text-secondary)' }}>ETA: {d.estimated_delivery}</p>}
              {d.delivery_fee !== null && d.delivery_fee !== undefined && (
                <p style={{ color: 'var(--text-secondary)' }}>Delivery fee: {formatMoney(Number(d.delivery_fee))}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <p style={{
                  background: 'var(--bg-secondary)', display: 'inline-block', padding: '4px 10px',
                  borderRadius: 6, fontFamily: 'monospace', fontWeight: 600, margin: 0, color: 'var(--text)',
                }}>
                  Tracking Code: {d.tracking_code}
                </p>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25D366', color: '#fff', padding: '6px 14px', borderRadius: 6,
                    textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'inline-flex',
                    alignItems: 'center', gap: 6,
                  }}
                >
                  Share on WhatsApp
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VendorView