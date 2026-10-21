import { useState } from 'react'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'

const REASONS = [
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'impersonation', label: 'Pretending to be someone else' },
  { value: 'poor_service', label: 'Poor or unsafe service' },
  { value: 'wrong_info', label: 'Wrong information on this page' },
  { value: 'other', label: 'Something else' },
]

function ReportBox({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('scam')
  const [details, setDetails] = useState('')
  const [contact, setContact] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.rpc('submit_report', {
      p_slug: slug,
      p_reason: reason,
      p_details: details,
      p_contact: contact,
    })
    setBusy(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    setSent(true)
  }

  if (sent) {
    return <span className="rider-hint">Thanks. We will review your report.</span>
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: 'none', border: 'none', padding: 0, fontSize: 13,
          color: 'var(--text-secondary)', textDecoration: 'underline',
        }}
      >
        Report this page
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="auth-form" style={{ width: '100%' }}>
      <div className="field">
        <label className="field-label" htmlFor="report-reason">What is wrong?</label>
        <select
          id="report-reason"
          className="field-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="report-details">Details (optional)</label>
        <textarea
          id="report-details"
          className="field-input"
          rows={3}
          maxLength={1000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="report-contact">Your email or phone (optional)</label>
        <input
          id="report-contact"
          className="field-input"
          maxLength={120}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="submit" className="btn-primary btn-sm" disabled={busy}>
          {busy ? <><Spinner size="sm" /> Sending...</> : 'Send report'}
        </button>
        <button type="button" className="rider-btn" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  )
}

export default ReportBox