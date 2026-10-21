import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'

type ReportRow = {
  id: string
  slug: string
  owner_id: string | null
  target_name: string | null
  target_email: string | null
  reason: string
  details: string | null
  contact: string | null
  status: string
  created_at: string
  resolution_note: string | null
  open_for_target: number
}

const REASON_LABEL: Record<string, string> = {
  scam: 'Scam or fraud',
  impersonation: 'Impersonation',
  poor_service: 'Poor or unsafe service',
  wrong_info: 'Wrong information',
  other: 'Something else',
}

const FILTERS = ['open', 'reviewing', 'resolved', 'dismissed', 'all']

function pillClass(status: string) {
  if (status === 'open') return 'pill-suspended'
  if (status === 'reviewing') return 'pill-pending'
  if (status === 'resolved') return 'pill-active'
  return 'pill-restricted'
}

function ReportsTab({ onOpenUser }: { onOpenUser: (email: string) => void }) {
  const [filter, setFilter] = useState('open')
  const [list, setList] = useState<ReportRow[] | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load(f: string) {
    setList(null)
    const { data, error } = await supabase.rpc('admin_reports', { p_status: f })
    if (error) {
      showToast(error.message, 'error')
      setList([])
      return
    }
    setList((data as ReportRow[] | null) ?? [])
  }

  useEffect(() => {
    load('open')
  }, [])

  async function update(r: ReportRow, status: string) {
    setBusyId(r.id)
    const { error } = await supabase.rpc('admin_update_report', {
      p_id: r.id,
      p_status: status,
      p_note: notes[r.id] ?? '',
    })
    setBusyId(null)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    showToast('Report updated.')
    load(filter)
  }

  return (
    <>
      <div className="rider-pills">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={'rider-pill' + (filter === f ? ' on' : '')}
            onClick={() => {
              setFilter(f)
              load(f)
            }}
            style={{ textTransform: 'capitalize' }}
          >
            {f}
          </button>
        ))}
      </div>

      {list === null ? (
        <Spinner />
      ) : list.length === 0 ? (
        <p className="rider-hint">No reports in this group.</p>
      ) : (
        list.map((r) => (
          <div key={r.id} className="admin-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--text)' }}>{r.target_name ?? r.slug}</strong>
              <span className={'status-pill ' + pillClass(r.status)}>{r.status}</span>
              <span className="admin-meta">{REASON_LABEL[r.reason] ?? r.reason}</span>
            </div>
            <div className="admin-meta">
              /b/{r.slug} · reported {new Date(r.created_at).toLocaleString()} · open reports on this business: {r.open_for_target}
            </div>
            {r.details && <p style={{ color: 'var(--text)', margin: '8px 0 0' }}>“{r.details}”</p>}
            <div className="admin-meta">Reporter contact: {r.contact ?? 'none given'}</div>
            {r.resolution_note && <div className="admin-meta">Note: {r.resolution_note}</div>}

            <div className="field" style={{ marginTop: 10 }}>
              <label className="field-label">Note (what you decided)</label>
              <input
                className="field-input"
                value={notes[r.id] ?? ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
              />
            </div>

            <div className="admin-actions">
              {r.status !== 'reviewing' && (
                <button type="button" className="rider-btn" onClick={() => update(r, 'reviewing')} disabled={busyId === r.id}>
                  Mark reviewing
                </button>
              )}
              {r.status !== 'resolved' && (
                <button type="button" className="btn-primary btn-sm" onClick={() => update(r, 'resolved')} disabled={busyId === r.id}>
                  {busyId === r.id ? <><Spinner size="sm" /> Saving...</> : 'Resolve'}
                </button>
              )}
              {r.status !== 'dismissed' && (
                <button type="button" className="rider-btn rider-btn-danger" onClick={() => update(r, 'dismissed')} disabled={busyId === r.id}>
                  Dismiss
                </button>
              )}
              <a className="rider-btn" href={'/b/' + r.slug} target="_blank" rel="noopener noreferrer">View page</a>
              {r.target_email && (
                <button type="button" className="rider-btn" onClick={() => onOpenUser(r.target_email as string)}>
                  Manage account
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </>
  )
}

export default ReportsTab