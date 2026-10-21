import { CURRENCY } from './siteInfo'

export type ReportDelivery = {
  created_at: string
  updated_at: string
  tracking_code: string
  item_name: string
  pickup_point: string
  dropoff_point: string
   customer_phone: string | null
  status: string
  delivery_fee: number | null
  rider_id: string | null
  client_name: string | null
  landmark: string | null
}

// "2026-10" for the given date, in the user's local time
export function monthKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return date.getFullYear() + '-' + m
}

export function inMonth(iso: string, key: string) {
  return monthKey(new Date(iso)) === key
}

export function countInMonth(items: { created_at: string }[], key: string) {
  return items.filter((i) => inMonth(i.created_at, key)).length
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Stops spreadsheet apps from treating text as a formula, while keeping phone numbers readable
function safeText(text: string) {
  if (/^[=@]/.test(text)) return "'" + text
  if (/^[+-]/.test(text) && !/^[+-]?[\d\s()-]+$/.test(text)) return "'" + text
  return text
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : safeText(String(value))
  return '"' + text.replace(/"/g, '""') + '"'
}

export function downloadMonthlyCsv(
  month: string,
  rows: ReportDelivery[],
  riderNames: Record<string, string>
) {
  const header = [
    'Date created',
    'Tracking code',
    'Client',
    'Item',
    'Pickup',
    'Drop-off',
    'Landmark',
    'Customer phone',
    'Rider',
    'Status',
    'Delivery fee (' + CURRENCY + ')',
    'Completed at',
  ]

  const lines = [header.map(csvCell).join(',')]

  rows.forEach((d) => {
    lines.push(
      [
        new Date(d.created_at).toLocaleString(),
        d.tracking_code,
        d.client_name,
        d.item_name,
        d.pickup_point,
        d.dropoff_point,
        d.landmark,
        d.customer_phone,
        d.rider_id ? riderNames[d.rider_id] || '' : '',
        d.status,
        d.delivery_fee ?? '',
        d.status === 'delivered' ? new Date(d.updated_at).toLocaleString() : '',
      ]
        .map(csvCell)
        .join(',')
    )
  })

  // The leading BOM makes Excel read the file as UTF-8 (₦, arrows, accents)
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'deliveries-' + month + '.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}