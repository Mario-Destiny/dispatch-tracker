import { supabase } from './supabaseClient'
import { NIGERIA_AREA_DATA } from './data/nigeriaAreas'
import {
  isWorldKey,
  parseWorldKey,
  worldAreaName,
  worldAreas,
  worldCountryName,
  worldRegionName,
  worldRegions,
} from './worldAreas'

export type AreaLga = { key: string; name: string }
export type AreaState = { key: string; name: string; lgas: AreaLga[] }

// A saved work area looks like 'lagos:ikeja' (state key, then LGA key).
export const NIGERIA_STATES: AreaState[] = NIGERIA_AREA_DATA.map(([key, name, lgas]) => ({
  key,
  name,
  lgas: lgas.map(([lgaKey, lgaName]) => ({ key: key + ':' + lgaKey, name: lgaName })),
}))

// The starter limits. The database enforces the real limits; these only guide the picker.
export const DEFAULT_MAX_AREAS = 10
export const DEFAULT_MAX_STATES = 2

const stateByKey = new Map(NIGERIA_STATES.map((s) => [s.key, s]))
const lgaByKey = new Map(NIGERIA_STATES.flatMap((s) => s.lgas.map((l) => [l.key, { state: s, lga: l }] as const)))

export function stateKeyOf(areaKey: string) {
  return areaKey.split(':')[0]
}

export function stateName(stateKey: string) {
  if (isWorldKey(stateKey)) return worldRegionName(stateKey)
  return stateByKey.get(stateKey)?.name ?? stateKey
}

// Nigeria is 'NG'. Every other country's areas carry the country in their key.
export function countryOfArea(areaKey: string) {
  const parsed = parseWorldKey(stateKeyOf(areaKey))
  return parsed ? parsed.iso : 'NG'
}

// The regions (states, provinces ...) of a country, ready for a dropdown.
export function regionsOfCountry(iso: string): { key: string; name: string }[] {
  return iso === 'NG' ? NIGERIA_STATES.map((s) => ({ key: s.key, name: s.name })) : worldRegions(iso)
}

// The areas inside one region.
export function areasOfRegion(regionKey: string): AreaLga[] {
  if (isWorldKey(regionKey)) return worldAreas(regionKey)
  return stateByKey.get(regionKey)?.lgas ?? []
}

// 'Ikeja, Lagos'  or  'Accra, Greater Accra, Ghana'
export function areaLabel(areaKey: string) {
  if (isWorldKey(areaKey)) {
    const parsed = parseWorldKey(stateKeyOf(areaKey))
    const region = worldRegionName(stateKeyOf(areaKey))
    const country = parsed ? worldCountryName(parsed.iso) : ''
    const name = worldAreaName(areaKey)
    // A country with no regions in the data is its own region, so the name is not repeated.
    return [name, name.startsWith('All of ') ? '' : region, country]
      .filter((part, i, all) => part && all.indexOf(part) === i && !(i > 0 && name.endsWith(part)))
      .join(', ')
  }
  const hit = lgaByKey.get(areaKey)
  return hit ? hit.lga.name + ', ' + hit.state.name : areaKey
}

// 'Ikeja, Yaba and 2 more'
export function summarizeAreas(keys: string[], shown = 3) {
  const names = keys.map((k) => (isWorldKey(k) ? worldAreaName(k) : lgaByKey.get(k)?.lga.name ?? k))
  if (names.length <= shown) return names.join(', ')
  return names.slice(0, shown).join(', ') + ' and ' + (names.length - shown) + ' more'
}

// Turns whatever the database sent back into a clean list of area keys.
export function readWorkAreas(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

// Saves the signed-in rider's areas. The database checks the limits.
// Returns an error message, or null when saved.
export async function saveWorkAreas(keys: string[]): Promise<string | null> {
  try {
    const { error } = await supabase.rpc('set_my_work_areas', { p_areas: keys })
    return error ? error.message : null
  } catch (err) {
    return err instanceof Error ? err.message : 'Could not save your work areas.'
  }
}

// Reads the signed-in rider's own areas. Returns null when they cannot be read
// (for example the database update has not been run yet), so screens do not nag by mistake.
export async function loadMyWorkAreas(userId: string): Promise<string[] | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('work_areas').eq('id', userId).maybeSingle()
    if (error || !data) return null
    return readWorkAreas((data as { work_areas?: unknown }).work_areas)
  } catch {
    return null
  }
}
