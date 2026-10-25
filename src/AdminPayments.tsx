import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'

type Row = { id: string; reference: string; owner_id: string; plan: string; months: number; amount_kobo: number; status: string; note: string | null; created_at: string; paid_at: string | null }

// Admin: recent Paystack payments.
function AdminPayments() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(30)
      const list = (data as Row[] | null) ?? []
      setRows(list)
      const ids = Array.from(new Set(list.map((r) => r.owner_id)))
      if (ids.length) {
        const { data: biz } = await supabase.from('business_profiles').select('owner_id, name').in('owner_id', ids)
        const map: Record<string, string> = {}
        for (const b of (biz as { owner_id: string; name: string }[] | null) ?? []) map[b.owner_id] = b.name
        setNames(map)
      }
    }
    load()
  }, [])

  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{ color: 'var(--text)' }}>Payments</h3>
      {rows === null && <Spinner />}
      {rows && rows.length === 0 && <p className="rider-hint">No payments yet.</p>}
      {rows?.map((r) => (
        <div key={r.id} className="admin-item">
          <strong style={{ color: 'var(--text)' }}>₦{(r.amount_kobo / 100).toLocaleString('en-NG')}</strong>{' '}
          <span className="admin-meta">
            {names[r.owner_id] ?? r.owner_id.slice(0, 8)} · {r.plan} · {r.months} {r.months === 1 ? 'month' : 'months'} · {r.status.toUpperCase()}
          </span>
          <div className="admin-meta">
            {new Date(r.paid_at ?? r.created_at).toLocaleString('en-NG')} · {r.reference}
            {r.note ? ' · ' + r.note : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

export default AdminPayments
