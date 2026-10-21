export type Badges = {
  tick: boolean
  tick_source: string | null
  top_rated: boolean
  earned: boolean
  verification_type: string | null
}

export function shortDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function tickTitle(type: string | null | undefined) {
  return type === 'identity' ? 'Identity verified' : 'Business registration verified'
}