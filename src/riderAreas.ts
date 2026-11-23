import { NIGERIA_STATES, stateKeyOf } from './areas'
import { WHOLE_REGION, isWorldKey, worldCityKey, worldRegionKey } from './worldAreas'
import type { Place } from './LocationSelector'

// How well a rider's work areas fit a pickup place.
//   exact   the rider lists that city / local government (or "All of" its region)
//   region  the rider works somewhere in the same state or region
//   unset   the rider has not chosen any areas yet (older accounts)
//   other   the rider works elsewhere
export type Fit = 'exact' | 'region' | 'unset' | 'other'

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\b(state|city|lga)\b/g, '').replace(/[^a-z0-9]/g, '')

// Nigeria's own area list names its states a little differently from the location data
// ('FCT (Abuja)' against 'Federal Capital Territory'), so match on a cleaned-up name.
function nigerianStateKey(stateNameText: string): string | null {
  const n = norm(stateNameText)
  if (!n) return null
  if (n.includes('federalcapital') || n === 'fct' || n === 'abuja') return 'fct'
  return NIGERIA_STATES.find((s) => norm(s.name) === n)?.key ?? null
}

// The saved region key for a place, or null when it cannot be worked out.
export function regionKeyOfPlace(place: Place): string | null {
  return place.iso === 'NG' ? nigerianStateKey(place.stateName) : worldRegionKey(place.iso, place.stateCode)
}

export function fitOf(areas: string[] | null | undefined, place: Place | null): Fit {
  if (!areas || areas.length === 0) return 'unset'
  if (!place) return 'other'
  const region = regionKeyOfPlace(place)
  if (!region) return 'other'

  if (place.iso === 'NG') {
    const inRegion = areas.filter((a) => stateKeyOf(a) === region && !isWorldKey(a))
    if (inRegion.length === 0) return 'other'
    const city = norm(place.city)
    const lgas = NIGERIA_STATES.find((s) => s.key === region)?.lgas ?? []
    const exact = city && inRegion.some((a) => lgas.some((l) => l.key === a && norm(l.name) === city))
    return exact ? 'exact' : 'region'
  }

  const inRegion = areas.filter((a) => stateKeyOf(a) === region)
  if (inRegion.length === 0) return 'other'
  if (inRegion.includes(region + ':' + WHOLE_REGION)) return 'exact'
  return place.city && inRegion.includes(worldCityKey(region, place.city)) ? 'exact' : 'region'
}

// Short label for a rider's card, e.g. 'Covers Ikeja', 'Works in Lagos', 'Other area'.
export function fitLabel(fit: Fit, areas: string[] | null | undefined, place: Place | null): string {
  if (!place) return ''
  const where = place.city || place.stateName
  if (fit === 'unset') return 'Area not set'
  if (fit === 'other') return 'Other area'
  if (fit === 'region') return 'Works in ' + (place.stateName || where)
  const region = regionKeyOfPlace(place)
  const whole = !!region && !!areas && areas.includes(region + ':' + WHOLE_REGION)
  return whole ? 'Covers all of ' + (place.stateName || where) : 'Covers ' + where
}

// Smaller number = shown first.
export const fitRank: Record<Fit, number> = { exact: 0, region: 1, unset: 2, other: 3 }

// 'Ikeja, Lagos' - how the pickup is described in messages.
export function placeLabel(place: Place): string {
  return [place.city, place.stateName].filter(Boolean).join(', ') || place.iso
}
