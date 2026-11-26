import { tx } from './i18n/text'
type StatusConfig = {
  label: string
  bg: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  pending: { label: 'Pending', bg: '#6b7280' },
  picked_up: { label: 'Picked Up', bg: '#2563eb' },
  in_transit: { label: 'In Transit', bg: '#ea580c' },
  delivered: { label: 'Delivered', bg: '#16a34a' },
}

// `translate` is set on translated pages; dashboards stay in English for now.
function StatusBadge({ status, translate = false }: { status: string; translate?: boolean }) {
  const config = STATUS_MAP[status] || { label: status, bg: '#6b7280' }

  return (
    <span style={{
      background: config.bg,
      color: '#fff',
      padding: '3px 12px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      display: 'inline-block',
      letterSpacing: 0.3,
    }}>
      {translate ? tx(config.label) : config.label}
    </span>
  )
}

export default StatusBadge