import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { useTheme } from './useTheme'
import { showToast } from './toast'
import ReportsTab from './AdminReports'
import SecurityTab from './AdminSecurity'
import AdminPayments from './AdminPayments'
import MfaChallenge from './MfaChallenge'

type Tab =
  | 'overview'
  | 'users'
  | 'companies'
  | 'verification'
  | 'businesses'
  | 'deliveries'
  | 'ratings'
  | 'reports'
  | 'settings'
  | 'security'
  | 'audit'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'Users' },
  { key: 'companies', label: 'Companies' },
  { key: 'verification', label: 'Verification' },
  { key: 'businesses', label: 'Businesses' },
  { key: 'deliveries', label: 'Deliveries' },
  { key: 'ratings', label: 'Ratings' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
  { key: 'security', label: 'Security' },
  { key: 'audit', label: 'Audit log' },
]

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) {
    showToast(error.message, 'error')
    return null
  }
  return data as T
}

async function run(fn: string, args?: Record<string, unknown>): Promise<boolean> {
  const { error } = await supabase.rpc(fn, args)
  if (error) {
    showToast(error.message, 'error')
    return false
  }
  return true
}

function fmt(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleString() : '—'
}

function dateInput(iso: string | null | undefined) {
  return iso ? iso.slice(0, 10) : ''
}

function dateToIso(value: string) {
  return value ? new Date(value + 'T23:59:59').toISOString() : null
}

function StatusPill({ status }: { status: string }) {
  return <span className={'status-pill pill-' + status}>{status}</span>
}

/* ---------- Overview ---------- */

type Overview = {
  vendors: number
  riders: number
  companies: number
  businesses: number
  verified: number
  pending: number
  deliveries: number
  deliveries_month: number
  delivered_month: number
  ratings: number
  pending_companies: number
  locked_deliveries: number
  restricted: number
    suspended: number
  open_reports: number
}

function OverviewTab({ go }: { go: (t: Tab) => void }) {
  const [data, setData] = useState<Overview | null>(null)

  useEffect(() => {
    async function load() {
      setData(await call<Overview>('admin_overview'))
    }
    load()
  }, [])

  if (!data) return <Spinner />

  const attention: { label: string; value: number; tab: Tab }[] = [
    { label: 'Companies awaiting approval', value: data.pending_companies, tab: 'companies' },
    { label: 'Verification applications', value: data.pending, tab: 'verification' },
    { label: 'Locked deliveries', value: data.locked_deliveries, tab: 'deliveries' },
    { label: 'Restricted accounts', value: data.restricted, tab: 'users' },
    { label: 'Suspended accounts', value: data.suspended, tab: 'users' },
        { label: 'Open reports', value: data.open_reports, tab: 'reports' },
  ]

  const numbers: [string, number][] = [
    ['Vendors', data.vendors],
    ['Riders', data.riders],
    ['Companies', data.companies],
    ['Public pages', data.businesses],
    ['Verified', data.verified],
    ['Deliveries (all time)', data.deliveries],
    ['Deliveries this month', data.deliveries_month],
    ['Delivered this month', data.delivered_month],
    ['Ratings', data.ratings],
  ]

  return (
    <>
      <div className="admin-section-title" style={{ marginTop: 0 }}>Needs attention</div>
      <div className="report-grid">
        {attention.map((a) => (
          <button
            key={a.label}
            type="button"
            className={'report-stat attention' + (a.value > 0 ? ' hot' : '')}
            onClick={() => go(a.tab)}
          >
            <div className="report-value">{a.value}</div>
            <div className="report-label">{a.label}</div>
          </button>
        ))}
      </div>

      <div className="admin-section-title">Numbers</div>
      <div className="report-grid">
        {numbers.map(([label, value]) => (
          <div key={label} className="report-stat">
            <div className="report-value">{value}</div>
            <div className="report-label">{label}</div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- Users ---------- */

type UserRow = {
  id: string
  name: string | null
  phone: string | null
  role: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  status: string
  reason: string | null
  is_admin: boolean
  company_name: string | null
  business_name: string | null
}

type UsersResponse = { total: number; rows: UserRow[] }

type Detail = {
  id: string
  name: string | null
  phone: string | null
  role: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  is_admin: boolean
  status: string
  reason: string | null
  status_changed_at: string | null
  is_available: boolean
  last_seen_at: string | null
  company_name: string | null
  company_approval: string | null
  business: { name: string; slug: string; verified: boolean; tick: boolean } | null
  created_deliveries: number
  active_as_sender: number
  active_as_rider: number
  delivered_as_rider: number
  notes: { admin_email: string | null; note: string; created_at: string }[]
  history: {
    action: string
    admin_email: string | null
    details: Record<string, unknown> | null
    created_at: string
  }[]
}

type StatusResult = { ok: boolean; status: string; signin_ban_applied: boolean | null }

const PAGE_SIZE = 25

function UserDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null)
  const [newStatus, setNewStatus] = useState('restricted')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [noteBusy, setNoteBusy] = useState(false)

  async function load() {
    const res = await call<Detail>('admin_user_detail', { p_user: id })
    setD(res)
    if (res) setNewStatus(res.status === 'active' ? 'restricted' : 'active')
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function applyStatus() {
    if (!d) return

    if (newStatus !== 'active' && reason.trim().length < 3) {
      showToast('Please give a reason. The user will see it.', 'error')
      return
    }

    const activeCount = d.active_as_rider + d.active_as_sender
    const warn =
      newStatus === 'suspended' && activeCount > 0
        ? '\n\nThis account has ' + activeCount + ' active deliveries.'
        : ''

    if (!window.confirm('Set ' + (d.name ?? 'this user') + ' to ' + newStatus + '?' + warn)) return

    setBusy(true)
    const res = await call<StatusResult>('admin_set_user_status', {
      p_user: d.id,
      p_status: newStatus,
      p_reason: reason,
    })
    setBusy(false)

    if (!res) return

    if (newStatus === 'suspended' && res.signin_ban_applied === false) {
      showToast('Suspended, but the sign-in ban could not be applied. Their access ends within about an hour.', 'error')
    } else {
      showToast('Status updated.')
    }

    setReason('')
    await load()
    onChanged()
  }

  async function addNote() {
    if (!d || !note.trim()) return
    setNoteBusy(true)
    const ok = await run('admin_add_note', { p_user: d.id, p_note: note })
    setNoteBusy(false)
    if (ok) {
      setNote('')
      load()
    }
  }

  if (!d) {
    return (
      <div className="admin-detail">
        <Spinner />
      </div>
    )
  }

  const activeCount = d.active_as_rider + d.active_as_sender

  return (
    <div className="admin-detail">
      <div className="admin-meta">
        {d.email ?? 'no email'} · {d.phone ?? 'no phone'} · Joined {fmt(d.created_at)} · Last sign-in {fmt(d.last_sign_in_at)}
      </div>
      <div className="admin-meta">
        {d.company_name ? 'Fleet: ' + d.company_name + ' · ' : ''}
        {d.company_approval ? 'Company approval: ' + d.company_approval + ' · ' : ''}
        {d.business ? 'Public page: /b/' + d.business.slug + (d.business.tick ? ' (blue tick)' : '') : 'No public page'}
      </div>
      <div className="admin-meta">
        Sent: {d.created_deliveries} ({d.active_as_sender} active) · Delivered as rider: {d.delivered_as_rider} ({d.active_as_rider} active)
        {d.role === 'rider' ? ' · Last seen ' + fmt(d.last_seen_at) : ''}
      </div>

      {d.status !== 'active' && (
        <div className="admin-warning">
          Currently {d.status} since {fmt(d.status_changed_at)}. Reason shown to the user: “{d.reason}”
        </div>
      )}

      {d.is_admin ? (
        <p className="rider-hint">Admin accounts cannot be restricted here.</p>
      ) : (
        <>
          <div className="admin-section-title">Change status</div>
          <div className="admin-grid">
            <div className="field">
              <label className="field-label">New status</label>
              <select className="field-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="active">Active (reactivate)</option>
                <option value="restricted">Restricted</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          {newStatus !== 'active' && (
            <div className="field" style={{ marginTop: 10 }}>
              <label className="field-label">Reason (the user will see this)</label>
              <input
                className="field-input"
                maxLength={300}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Multiple complaints about missing items"
              />
            </div>
          )}
          {newStatus === 'suspended' && activeCount > 0 && (
            <div className="admin-warning">
              This account has {activeCount} active deliveries. Deal with them before or right after suspending.
            </div>
          )}
          <div className="admin-actions">
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={applyStatus}
              disabled={busy || newStatus === d.status}
            >
              {busy ? <><Spinner size="sm" /> Saving...</> : 'Apply'}
            </button>
          </div>
        </>
      )}

      <div className="admin-section-title">Internal notes (only admins see these)</div>
      {d.notes.length === 0 ? (
        <p className="rider-hint">No notes yet.</p>
      ) : (
        <div className="client-list" style={{ marginTop: 0 }}>
          {d.notes.map((n, i) => (
            <div key={i} className="client-row">
              <span>{n.note}</span>
              <span className="admin-meta">{n.admin_email ?? '—'} · {fmt(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
        <input
          className="field-input"
          placeholder="Add a note"
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button type="button" className="rider-btn" onClick={addNote} disabled={noteBusy || !note.trim()}>
          {noteBusy ? <Spinner size="sm" /> : 'Add note'}
        </button>
      </div>

      <div className="admin-section-title">Recent admin actions on this user</div>
      {d.history.length === 0 ? (
        <p className="rider-hint">Nothing yet.</p>
      ) : (
        <div className="client-list" style={{ marginTop: 0 }}>
          {d.history.map((h, i) => (
            <div key={i} className="client-row">
              <span>
                {h.action}
                {h.details && Object.keys(h.details).length > 0 ? ' · ' + JSON.stringify(h.details) : ''}
              </span>
              <span className="admin-meta">{h.admin_email ?? '—'} · {fmt(h.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UsersTab({ initialSearch }: { initialSearch: string }) {
  const [search, setSearch] = useState(initialSearch)
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  async function load(nextOffset: number, term = search, r = role, s = status) {
    setLoading(true)
    const res = await call<UsersResponse>('admin_users', {
      p_search: term,
      p_role: r,
      p_status: s,
      p_limit: PAGE_SIZE,
      p_offset: nextOffset,
    })
    setData(res ?? { total: 0, rows: [] })
    setOffset(nextOffset)
    setLoading(false)
  }

  useEffect(() => {
    load(0, initialSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = data?.total ?? 0
  const rows = data?.rows ?? []

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          load(0)
        }}
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}
      >
        <input
          className="field-input"
          placeholder="Search by name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <select
          className="field-input"
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            load(0, search, e.target.value, status)
          }}
          style={{ width: 150 }}
        >
          <option value="all">All roles</option>
          <option value="vendor">Vendors</option>
          <option value="rider">Riders</option>
          <option value="company">Companies</option>
        </select>
        <select
          className="field-input"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            load(0, search, role, e.target.value)
          }}
          style={{ width: 160 }}
        >
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="restricted">Restricted</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="submit" className="btn-primary btn-sm">Search</button>
      </form>

      {loading && !data ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="rider-hint">No users found.</p>
      ) : (
        <>
          {rows.map((u) => (
            <div key={u.id} className="admin-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--text)' }}>{u.name ?? 'No name'}</strong>
                <span className="admin-meta">({u.role})</span>
                <StatusPill status={u.status} />
                {u.is_admin && <span className="status-pill pill-approved">admin</span>}
              </div>
              <div className="admin-meta">
                {u.email ?? 'no email'} · {u.phone ?? 'no phone'}
                {u.business_name ? ' · ' + u.business_name : ''}
                {u.company_name ? ' · fleet ' + u.company_name : ''}
              </div>
              <div className="admin-meta">Last sign-in {fmt(u.last_sign_in_at)}</div>
              {u.status !== 'active' && u.reason && (
                <div className="admin-meta">Reason: {u.reason}</div>
              )}
              <div className="admin-actions">
                <button
                  type="button"
                  className="rider-btn"
                  onClick={() => setOpenId(openId === u.id ? null : u.id)}
                >
                  {openId === u.id ? 'Close' : 'Manage'}
                </button>
              </div>
              {openId === u.id && <UserDetail id={u.id} onChanged={() => load(offset)} />}
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              type="button"
              className="rider-btn"
              onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0 || loading}
            >
              Previous
            </button>
            <span className="admin-meta">
              {offset + 1} to {offset + rows.length} of {total}
            </span>
            <button
              type="button"
              className="rider-btn"
              onClick={() => load(offset + PAGE_SIZE)}
              disabled={offset + rows.length >= total || loading}
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  )
}

/* ---------- Companies ---------- */

type CompanyRow = {
  id: string
  owner_id: string
  name: string
  city: string | null
  state: string | null
  rc_number: string | null
  rider_count_declared: string | null
  tracking_method: string | null
  approval_status: string
  approval_note: string | null
  created_at: string
  email: string | null
  phone: string | null
  fleet_size: number
  deliveries: number
  account_status: string
}

type FleetRider = {
  id: string
  name: string
  phone: string | null
  is_available: boolean
  last_seen_at: string | null
  active_deliveries: number
}

function CompaniesTab({ onOpenUser }: { onOpenUser: (email: string) => void }) {
  const [filter, setFilter] = useState('pending')
  const [list, setList] = useState<CompanyRow[] | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [fleetOpen, setFleetOpen] = useState<string | null>(null)
  const [fleet, setFleet] = useState<FleetRider[] | null>(null)

  async function load(f: string) {
    setList(null)
    setList((await call<CompanyRow[]>('admin_companies', { p_status: f })) ?? [])
  }

  useEffect(() => {
    load('pending')
  }, [])

  async function decide(c: CompanyRow, decision: 'approve' | 'reject') {
    const note = notes[c.id] ?? ''

    if (decision === 'reject' && !note.trim()) {
      showToast('Add a note so the company knows why.', 'error')
      return
    }
    if (!window.confirm((decision === 'approve' ? 'Approve ' : 'Reject ') + c.name + '?')) return

    setBusyId(c.id)
    const ok = await run('admin_review_company', {
      p_company: c.id,
      p_decision: decision,
      p_note: note,
    })
    setBusyId(null)

    if (ok) {
      showToast(decision === 'approve' ? 'Company approved.' : 'Company rejected.')
      load(filter)
    }
  }

  async function toggleFleet(c: CompanyRow) {
    if (fleetOpen === c.id) {
      setFleetOpen(null)
      setFleet(null)
      return
    }
    setFleetOpen(c.id)
    setFleet(null)
    setFleet((await call<FleetRider[]>('admin_company_fleet', { p_company: c.id })) ?? [])
  }

  async function removeRider(c: CompanyRow, r: FleetRider) {
    if (!window.confirm('Remove ' + r.name + ' from ' + c.name + '?')) return
    const ok = await run('admin_remove_fleet_rider', { p_rider: r.id })
    if (ok) {
      showToast(r.name + ' was removed from the fleet.')
      setFleet((await call<FleetRider[]>('admin_company_fleet', { p_company: c.id })) ?? [])
      load(filter)
    }
  }

  const options = ['pending', 'approved', 'rejected', 'all']

  return (
    <>
      <div className="rider-pills">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={'rider-pill' + (filter === o ? ' on' : '')}
            onClick={() => {
              setFilter(o)
              load(o)
            }}
            style={{ textTransform: 'capitalize' }}
          >
            {o}
          </button>
        ))}
      </div>

      {list === null ? (
        <Spinner />
      ) : list.length === 0 ? (
        <p className="rider-hint">No companies in this group.</p>
      ) : (
        list.map((c) => (
          <div key={c.id} className="admin-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--text)' }}>{c.name}</strong>
              <StatusPill status={c.approval_status} />
              {c.account_status !== 'active' && <StatusPill status={c.account_status} />}
            </div>
            <div className="admin-meta">
              {[c.city, c.state].filter(Boolean).join(', ') || 'No location'} · {c.email ?? 'no email'} · {c.phone ?? 'no phone'}
            </div>
            <div className="admin-meta">
              RC number: {c.rc_number ?? 'none given'} (check it on CAC's public search) · Declared riders: {c.rider_count_declared ?? '—'} · Tracks today with: {c.tracking_method ?? '—'}
            </div>
            <div className="admin-meta">
              Fleet size: {c.fleet_size} · Deliveries: {c.deliveries} · Signed up {fmt(c.created_at)}
            </div>
            {c.approval_note && <div className="admin-meta">Note: {c.approval_note}</div>}

            {c.approval_status !== 'approved' && (
              <div className="field" style={{ marginTop: 10 }}>
                <label className="field-label">Note (required if rejecting; the company sees it)</label>
                <input
                  className="field-input"
                  value={notes[c.id] ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                />
              </div>
            )}

            <div className="admin-actions">
              {c.approval_status !== 'approved' && (
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => decide(c, 'approve')}
                  disabled={busyId === c.id}
                >
                  {busyId === c.id ? <><Spinner size="sm" /> Working...</> : 'Approve'}
                </button>
              )}
              {c.approval_status !== 'rejected' && (
                <button
                  type="button"
                  className="rider-btn rider-btn-danger"
                  onClick={() => decide(c, 'reject')}
                  disabled={busyId === c.id}
                >
                  Reject
                </button>
              )}
              <button type="button" className="rider-btn" onClick={() => toggleFleet(c)}>
                {fleetOpen === c.id ? 'Hide fleet' : 'View fleet'}
              </button>
              {c.email && (
                <button type="button" className="rider-btn" onClick={() => onOpenUser(c.email as string)}>
                  Manage account
                </button>
              )}
            </div>

            {fleetOpen === c.id && (
              <div className="admin-detail">
                {fleet === null ? (
                  <Spinner />
                ) : fleet.length === 0 ? (
                  <p className="rider-hint">No riders in this fleet.</p>
                ) : (
                  <div className="client-list" style={{ marginTop: 0 }}>
                    {fleet.map((r) => (
                      <div key={r.id} className="client-row" style={{ alignItems: 'center' }}>
                        <span>
                          {r.name} · {r.phone ?? 'no phone'} · {r.is_available ? 'available' : 'unavailable'} ·{' '}
                          {r.active_deliveries} active
                        </span>
                        <button type="button" className="rider-btn rider-btn-danger" onClick={() => removeRider(c, r)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </>
  )
}

/* ---------- Verification queue ---------- */

type Application = {
  owner_id: string
  kind: string
  name: string
  slug: string
  city: string | null
  state: string | null
  rc_number: string | null
  message: string | null
  requested_at: string
  email: string | null
  phone: string | null
  delivered: number
}

type ReviewForm = { type: string; note: string; founding: string; paid: string }

function VerificationTab() {
  const [apps, setApps] = useState<Application[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, ReviewForm>>({})

  async function load() {
    setApps((await call<Application[]>('admin_applications')) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  function formFor(id: string): ReviewForm {
    return forms[id] ?? { type: 'cac', note: '', founding: '3', paid: '0' }
  }

  function setForm(id: string, patch: Partial<ReviewForm>) {
    setForms((prev) => ({ ...prev, [id]: { ...formFor(id), ...patch } }))
  }

  async function decide(a: Application, decision: 'approve' | 'reject') {
    const f = formFor(a.owner_id)

    if (decision === 'reject' && !f.note.trim()) {
      showToast('Add a note so the applicant knows why.', 'error')
      return
    }
    if (decision === 'approve' && !window.confirm('Approve ' + a.name + '?')) return

    setBusy(a.owner_id)
    const ok = await run('admin_review_application', {
      p_owner: a.owner_id,
      p_decision: decision,
      p_type: f.type,
      p_note: f.note,
      p_founding_months: Number(f.founding) || 0,
      p_paid_months: Number(f.paid) || 0,
    })
    setBusy(null)

    if (ok) {
      showToast(decision === 'approve' ? 'Approved.' : 'Rejected.')
      load()
    }
  }

  if (apps === null) return <Spinner />
  if (apps.length === 0) return <p className="rider-hint">No applications waiting.</p>

  return (
    <>
      {apps.map((a) => {
        const f = formFor(a.owner_id)
        return (
          <div key={a.owner_id} className="admin-item">
            <strong style={{ color: 'var(--text)' }}>{a.name}</strong>{' '}
            <span className="admin-meta">({a.kind}) · /b/{a.slug}</span>
            <div className="admin-meta">
              {[a.city, a.state].filter(Boolean).join(', ') || 'No location'} · {a.email ?? 'no email'} · {a.phone ?? 'no phone'}
            </div>
            <div className="admin-meta">
              RC number: {a.rc_number ?? 'none given'} · Deliveries completed: {a.delivered} · Applied {fmt(a.requested_at)}
            </div>
            {a.message && <p style={{ color: 'var(--text)', margin: '8px 0 0' }}>“{a.message}”</p>}

            <div className="admin-grid">
              <div className="field">
                <label className="field-label">Verified by</label>
                <select className="field-input" value={f.type} onChange={(e) => setForm(a.owner_id, { type: e.target.value })}>
                  <option value="cac">CAC registration</option>
                  <option value="identity">Identity check</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Founding months</label>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  max="24"
                  value={f.founding}
                  onChange={(e) => setForm(a.owner_id, { founding: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Paid months</label>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  max="24"
                  value={f.paid}
                  onChange={(e) => setForm(a.owner_id, { paid: e.target.value })}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 10 }}>
              <label className="field-label">Note (what you checked, or why you are rejecting)</label>
              <input
                className="field-input"
                value={f.note}
                onChange={(e) => setForm(a.owner_id, { note: e.target.value })}
              />
            </div>

            <div className="admin-actions">
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => decide(a, 'approve')}
                disabled={busy === a.owner_id}
              >
                {busy === a.owner_id ? <><Spinner size="sm" /> Working...</> : 'Approve'}
              </button>
              <button
                type="button"
                className="rider-btn rider-btn-danger"
                onClick={() => decide(a, 'reject')}
                disabled={busy === a.owner_id}
              >
                Reject
              </button>
              <a className="rider-btn" href={'/b/' + a.slug} target="_blank" rel="noopener noreferrer">View page</a>
            </div>
          </div>
        )
      })}
    </>
  )
}

/* ---------- Businesses ---------- */

type Biz = {
  owner_id: string
  kind: string
  name: string
  slug: string
  city: string | null
  verified: boolean
  verification_type: string | null
  verification_note: string | null
  founding_until: string | null
  paid_until: string | null
  tick: boolean
  top_rated: boolean
  delivered: number
  rating_avg: number | null
  rating_count: number
  plan: string | null
}

type BizDraft = {
  verified: boolean
  type: string
  note: string
  founding: string
  paid: string
  plan: string
}

function BusinessesTab() {
  const [search, setSearch] = useState('')
  const [list, setList] = useState<Biz[] | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<BizDraft | null>(null)
  const [saving, setSaving] = useState(false)

  async function load(term: string) {
    setList((await call<Biz[]>('admin_businesses', { p_search: term })) ?? [])
  }

  useEffect(() => {
    load('')
  }, [])

  function startEdit(b: Biz) {
    setEditId(b.owner_id)
    setDraft({
      verified: b.verified,
      type: b.verification_type ?? 'cac',
      note: b.verification_note ?? '',
      founding: dateInput(b.founding_until),
      paid: dateInput(b.paid_until),
      plan: b.plan ?? 'free',
    })
  }

  async function save(b: Biz) {
    if (!draft) return
    setSaving(true)

    let ok = await run('admin_set_business', {
      p_owner: b.owner_id,
      p_verified: draft.verified,
      p_type: draft.type,
      p_note: draft.note,
      p_founding: dateToIso(draft.founding),
      p_paid: dateToIso(draft.paid),
    })

    if (ok && b.kind === 'vendor' && draft.plan !== (b.plan ?? 'free')) {
      ok = await run('admin_set_plan', { p_owner: b.owner_id, p_plan: draft.plan })
    }

    setSaving(false)

    if (ok) {
      showToast('Saved.')
      setEditId(null)
      setDraft(null)
      load(search)
    }
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          load(search)
        }}
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}
      >
        <input
          className="field-input"
          placeholder="Search by name or page address"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button type="submit" className="btn-primary btn-sm">Search</button>
      </form>

      {list === null ? (
        <Spinner />
      ) : list.length === 0 ? (
        <p className="rider-hint">No businesses found.</p>
      ) : (
        list.map((b) => (
          <div key={b.owner_id} className="admin-item">
            <strong style={{ color: 'var(--text)' }}>{b.name}</strong>{' '}
            <span className="admin-meta">({b.kind}) · /b/{b.slug}</span>
            <div className="admin-meta">
              {b.verified ? 'Checked (' + (b.verification_type ?? '?') + ')' : 'Not verified'} ·{' '}
              {b.tick ? 'Blue tick ON' : 'No tick'} · {b.top_rated ? 'Top rated' : 'Not top rated'} ·{' '}
              {b.delivered} delivered · rating {b.rating_avg ?? '—'} ({b.rating_count})
              {b.kind === 'vendor' ? ' · plan ' + (b.plan ?? 'free') : ''}
            </div>
            <div className="admin-meta">
              Founding until {dateInput(b.founding_until) || '—'} · Paid until {dateInput(b.paid_until) || '—'}
            </div>

            {editId === b.owner_id && draft ? (
              <>
                <div className="admin-grid">
                  <div className="field">
                    <label className="field-label">Checked</label>
                    <select
                      className="field-input"
                      value={draft.verified ? 'yes' : 'no'}
                      onChange={(e) => setDraft({ ...draft, verified: e.target.value === 'yes' })}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Verified by</label>
                    <select
                      className="field-input"
                      value={draft.type}
                      onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                    >
                      <option value="cac">CAC registration</option>
                      <option value="identity">Identity check</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Founding until</label>
                    <input
                      className="field-input"
                      type="date"
                      value={draft.founding}
                      onChange={(e) => setDraft({ ...draft, founding: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Paid until</label>
                    <input
                      className="field-input"
                      type="date"
                      value={draft.paid}
                      onChange={(e) => setDraft({ ...draft, paid: e.target.value })}
                    />
                  </div>
                  {b.kind === 'vendor' && (
                    <div className="field">
                      <label className="field-label">Delivery plan</label>
                      <select
                        className="field-input"
                        value={draft.plan}
                        onChange={(e) => setDraft({ ...draft, plan: e.target.value })}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <label className="field-label">Note</label>
                  <input
                    className="field-input"
                    value={draft.note}
                    onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  />
                </div>
                <div className="admin-actions">
                  <button type="button" className="btn-primary btn-sm" onClick={() => save(b)} disabled={saving}>
                    {saving ? <><Spinner size="sm" /> Saving...</> : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="rider-btn"
                    onClick={() => {
                      setEditId(null)
                      setDraft(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="admin-actions">
                <button type="button" className="rider-btn" onClick={() => startEdit(b)}>Edit</button>
                <a className="rider-btn" href={'/b/' + b.slug} target="_blank" rel="noopener noreferrer">View page</a>
              </div>
            )}
          </div>
        ))
      )}
    </>
  )
}

/* ---------- Deliveries ---------- */

type DeliveryInfo = {
  tracking_code: string
  item_name: string
  status: string
  pickup_point: string
  dropoff_point: string
  created_at: string
  updated_at: string
  code_attempts: number
  delivery_fee: number | null
  customer_phone: string | null
  vendor: string | null
  business: string | null
  rider: string | null
}

function DeliveriesTab() {
  const [code, setCode] = useState('')
  const [info, setInfo] = useState<DeliveryInfo | null>(null)
  const [searched, setSearched] = useState(false)
  const [busy, setBusy] = useState(false)

  async function find(e?: React.FormEvent) {
    e?.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    const data = await call<DeliveryInfo | null>('admin_find_delivery', { p_code: code })
    setBusy(false)
    setInfo(data ?? null)
    setSearched(true)
  }

  async function unlock() {
    if (!info) return
    const ok = await run('admin_unlock_delivery', { p_code: info.tracking_code })
    if (ok) {
      showToast('Delivery unlocked.')
      find()
    }
  }

  return (
    <>
      <form onSubmit={find} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <input
          className="field-input"
          placeholder="Tracking code, e.g. DT-A83F2"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button type="submit" className="btn-primary btn-sm" disabled={busy}>
          {busy ? <><Spinner size="sm" /> Searching...</> : 'Find'}
        </button>
      </form>

      {searched && !info && <p className="rider-hint">No delivery found with that code.</p>}

      {info && (
        <div className="admin-item">
          <strong style={{ color: 'var(--text)' }}>{info.item_name}</strong>{' '}
          <span className="admin-meta">· {info.tracking_code} · {info.status}</span>
          <div className="admin-meta">{info.pickup_point} → {info.dropoff_point}</div>
          <div className="admin-meta">
            Vendor: {info.vendor ?? '—'} ({info.business ?? 'no public page'}) · Rider: {info.rider ?? '—'}
          </div>
          <div className="admin-meta">
            Customer phone: {info.customer_phone || '—'} · Fee: {info.delivery_fee ?? '—'}
          </div>
          <div className="admin-meta">
            Created {fmt(info.created_at)} · Updated {fmt(info.updated_at)} · Wrong code tries: {info.code_attempts}
          </div>
          {info.code_attempts > 0 && (
            <div className="admin-actions">
              <button type="button" className="btn-primary btn-sm" onClick={unlock}>Unlock code entry</button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* ---------- Ratings ---------- */

type RatingItem = {
  id: string
  stars: number
  comment: string | null
  created_at: string
  business: string | null
  tracking_code: string | null
}

function RatingsTab() {
  const [items, setItems] = useState<RatingItem[] | null>(null)

  async function load() {
    setItems((await call<RatingItem[]>('admin_recent_ratings', { p_limit: 50 })) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(r: RatingItem) {
    if (!window.confirm('Delete this rating? This cannot be undone.')) return
    const ok = await run('admin_delete_rating', { p_id: r.id })
    if (ok) {
      showToast('Rating deleted.')
      load()
    }
  }

  if (items === null) return <Spinner />
  if (items.length === 0) return <p className="rider-hint">No ratings yet.</p>

  return (
    <>
      {items.map((r) => (
        <div key={r.id} className="admin-item">
          <strong style={{ color: 'var(--text)' }}>
            {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
          </strong>{' '}
          <span className="admin-meta">
            for {r.business ?? 'unknown'} · {r.tracking_code ?? '—'} · {fmt(r.created_at)}
          </span>
          {r.comment && <p style={{ color: 'var(--text)', margin: '8px 0 0' }}>“{r.comment}”</p>}
          <div className="admin-actions">
            <button type="button" className="rider-btn rider-btn-danger" onClick={() => remove(r)}>Delete</button>
          </div>
        </div>
      ))}
    </>
  )
}

/* ---------- Settings ---------- */

type SettingRow = { key: string; value: number }

function SettingsTab() {
  const [rows, setRows] = useState<SettingRow[] | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)

  async function load() {
    const data = (await call<SettingRow[]>('admin_get_settings')) ?? []
    setRows(data)
    const next: Record<string, string> = {}
    data.forEach((r) => {
      next[r.key] = String(r.value)
    })
    setValues(next)
  }

  useEffect(() => {
    load()
  }, [])

  async function save(key: string) {
    setSavingKey(key)
    const ok = await run('admin_set_setting', { p_key: key, p_value: Number(values[key]) })
    setSavingKey(null)
    if (ok) showToast('Saved.')
  }

  if (rows === null) return <Spinner />

  return (
    <>
      <p className="rider-hint">
        These numbers decide who earns the blue tick and the Top rated badge. Changes apply right away.
      </p>
      {rows.map((r) => (
        <div key={r.key} className="client-row" style={{ alignItems: 'center' }}>
          <span>{r.key.replace(/_/g, ' ')}</span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="field-input"
              type="number"
              step="any"
              value={values[r.key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [r.key]: e.target.value }))}
              style={{ width: 110, minHeight: 40 }}
            />
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => save(r.key)}
              disabled={savingKey === r.key}
            >
              {savingKey === r.key ? <Spinner size="sm" /> : 'Save'}
            </button>
          </span>
        </div>
      ))}
    </>
  )
}

/* ---------- Audit log ---------- */

type AuditRow = {
  id: number
  admin_email: string | null
  action: string
  target: string | null
  details: Record<string, unknown> | null
  created_at: string
}

function AuditTab() {
  const [rows, setRows] = useState<AuditRow[] | null>(null)

  useEffect(() => {
    async function load() {
      setRows((await call<AuditRow[]>('admin_audit', { p_limit: 100 })) ?? [])
    }
    load()
  }, [])

  if (rows === null) return <Spinner />
  if (rows.length === 0) return <p className="rider-hint">No admin actions yet.</p>

  return (
    <>
      {rows.map((r) => (
        <div key={r.id} className="admin-item">
          <strong style={{ color: 'var(--text)' }}>{r.action}</strong>{' '}
          <span className="admin-meta">· {r.target ?? '—'}</span>
          <div className="admin-meta">{r.admin_email ?? 'unknown'} · {fmt(r.created_at)}</div>
          {r.details && Object.keys(r.details).length > 0 && (
            <div className="admin-meta" style={{ wordBreak: 'break-word' }}>{JSON.stringify(r.details)}</div>
          )}
        </div>
      ))}
    </>
  )
}

/* ---------- Page shell ---------- */

function AdminPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [ready, setReady] = useState(false)
    const [needsMfa, setNeedsMfa] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [seed, setSeed] = useState<{ search: string; n: number }>({ search: '', n: 0 })

  useEffect(() => {
    async function check() {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) {
        navigate('/login', { replace: true })
        return
      }

      const { data } = await supabase.rpc('is_admin')
      if (data !== true) {
        navigate('/', { replace: true })
        return
      }

           const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') setNeedsMfa(true)
      setReady(true)
    }
    check()
  }, [navigate])

  function openUser(email: string) {
    setSeed((prev) => ({ search: email, n: prev.n + 1 }))
    setTab('users')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }
    if (ready && needsMfa) {
    return <MfaChallenge onDone={() => setNeedsMfa(false)} />
  }

  if (!ready) {
    return (
      <div className="page-bg">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="page-bg">
      <div className="admin-wrap">
        <div className="admin-top">
          <h1 style={{ margin: 0, color: 'var(--text)' }}>Admin</h1>
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

        <div className="rider-pills">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={'rider-pill' + (tab === t.key ? ' on' : '')}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="fleet-panel">
          {tab === 'overview' && <OverviewTab go={setTab} />}
          {tab === 'users' && <UsersTab key={seed.n} initialSearch={seed.search} />}
          {tab === 'companies' && <CompaniesTab onOpenUser={openUser} />}
          {tab === 'verification' && (
            <>
              <VerificationTab />
              <AdminPayments />
            </>
          )}
          {tab === 'businesses' && <BusinessesTab />}
          {tab === 'deliveries' && <DeliveriesTab />}
          {tab === 'ratings' && <RatingsTab />}
                    {tab === 'reports' && <ReportsTab onOpenUser={openUser} />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'settings' && <SettingsTab />}
          {tab === 'audit' && <AuditTab />}
        </div>
      </div>
    </div>
  )
}

export default AdminPage