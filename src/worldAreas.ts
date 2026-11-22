import { Country, State, City } from 'country-state-city'

// Work areas outside Nigeria. Nigeria keeps its own list of local governments (data/nigeriaAreas.ts).
// For every other country an area is a city, inside a region (a state, province, county ...).
//
// A saved area looks like 'world-gh-aa:accra': a region key, a colon, then the city.
// The region key is 'world-' + the country code + the region code, all lower case, so it fits the
// same 'state:area' shape the database already accepts. Nothing changes for Nigerian areas.
const WORLD_PREFIX = 'world-'
export const WHOLE_REGION = 'whole-region'

export type WorldCountry = { iso: string; name: string; flag: string }
export type WorldRegion = { key: string; name: string }
export type WorldArea = { key: string; name: string }

function slug(text: string, max: number) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '')
}

function titleCase(text: string) {
  return text
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Every country the data knows, A to Z.
let countryCache: WorldCountry[] | null = null
export function worldCountries(): WorldCountry[] {
  if (!countryCache) {
    countryCache = Country.getAllCountries()
      .map((c) => ({ iso: c.isoCode, name: c.name, flag: c.flag }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
  return countryCache
}

export function isWorldKey(stateKey: string) {
  return stateKey.startsWith(WORLD_PREFIX)
}

// 'world-gh-aa' -> { iso: 'GH', code: 'aa' }
export function parseWorldKey(stateKey: string): { iso: string; code: string } | null {
  const m = /^world-([a-z]{2})-([a-z0-9-]+)$/.exec(stateKey)
  return m ? { iso: m[1].toUpperCase(), code: m[2] } : null
}

function regionCode(code: string) {
  return slug(code, 20) || 'x'
}

const regionCache = new Map<string, WorldRegion[]>()

// The regions of a country. A country with no regions in the data becomes one region of its own.
export function worldRegions(iso: string): WorldRegion[] {
  const hit = regionCache.get(iso)
  if (hit) return hit
  const states = State.getStatesOfCountry(iso)
  const regions: WorldRegion[] = states.length
    ? states
        .map((s) => ({ key: WORLD_PREFIX + iso.toLowerCase() + '-' + regionCode(s.isoCode), name: s.name }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [{ key: WORLD_PREFIX + iso.toLowerCase() + '-all', name: Country.getCountryByCode(iso)?.name ?? iso }]
  regionCache.set(iso, regions)
  return regions
}

export function worldRegionName(stateKey: string) {
  const parsed = parseWorldKey(stateKey)
  if (!parsed) return stateKey
  return worldRegions(parsed.iso).find((r) => r.key === stateKey)?.name ?? titleCase(parsed.code)
}

export function worldCountryName(iso: string) {
  return Country.getCountryByCode(iso)?.name ?? iso
}

const areaCache = new Map<string, WorldArea[]>()

// The areas inside a region: "All of <region>" first, then its cities. A region with no cities in
// the data only has "All of <region>", so nobody is ever left without a choice.
export function worldAreas(stateKey: string): WorldArea[] {
  const hit = areaCache.get(stateKey)
  if (hit) return hit
  const parsed = parseWorldKey(stateKey)
  const areas: WorldArea[] = []
  if (parsed) {
    areas.push({ key: stateKey + ':' + WHOLE_REGION, name: 'All of ' + worldRegionName(stateKey) })
    const states = State.getStatesOfCountry(parsed.iso)
    const state = states.find((s) => WORLD_PREFIX + parsed.iso.toLowerCase() + '-' + regionCode(s.isoCode) === stateKey)
    const cities = state
      ? City.getCitiesOfState(parsed.iso, state.isoCode)
      : states.length === 0
        ? City.getCitiesOfCountry(parsed.iso) ?? []
        : []
    const seen = new Set<string>([WHOLE_REGION])
    const named: WorldArea[] = []
    for (const c of cities) {
      const s = slug(c.name, 60)
      if (s.length < 2 || seen.has(s)) continue
      seen.add(s)
      named.push({ key: stateKey + ':' + s, name: c.name })
    }
    named.sort((a, b) => a.name.localeCompare(b.name))
    areas.push(...named)
  }
  areaCache.set(stateKey, areas)
  return areas
}

export function worldAreaName(areaKey: string) {
  const [stateKey, area = ''] = areaKey.split(':')
  const found = worldAreas(stateKey).find((a) => a.key === areaKey)
  return found?.name ?? titleCase(area)
}
