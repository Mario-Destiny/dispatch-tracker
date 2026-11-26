import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_MAX_AREAS,
  DEFAULT_MAX_STATES,
  areaLabel,
  areasOfRegion,
  countryOfArea,
  regionsOfCountry,
  stateKeyOf,
  stateName,
} from './areas'
import { WHOLE_REGION, worldCountries } from './worldAreas'
import { useTranslation } from 'react-i18next'
import { tx, localCountries } from './i18n/text'

type Props = {
  idPrefix: string
  value: string[]
  onChange: (areas: string[]) => void
  maxAreas?: number
  maxStates?: number
  required?: boolean
  // Country shown first when nothing is chosen yet (a two-letter code like 'GH'). Nigeria if not given.
  defaultCountry?: string | null
}

// Big regions (a whole English county list, say) would make a very long page, so only this many
// rows are drawn at once. Typing in the search box narrows the list.
const MAX_ROWS = 200

const COUNTRIES = (() => {
  const all = worldCountries()
  const nigeria = all.find((c) => c.iso === 'NG')
  return nigeria ? [nigeria, ...all.filter((c) => c.iso !== 'NG')] : all
})()

// "All of <region>" comes from the area data; show it in the chosen language.
function areaText(name: string) {
  return name.replace(/^All of /, tx('All of') + ' ')
}

function knownCountry(iso: string | null | undefined): iso is string {
  return !!iso && COUNTRIES.some((c) => c.iso === iso)
}

// Lets a rider choose the areas they work in: first a country, then a state or region, then the
// areas inside it. Up to maxAreas areas across up to maxStates states or regions.
function WorkAreaPicker({
  idPrefix,
  value,
  onChange,
  maxAreas = DEFAULT_MAX_AREAS,
  maxStates = DEFAULT_MAX_STATES,
  required = false,
  defaultCountry,
}: Props) {
  useTranslation() // redraw when the language changes
  const [country, setCountry] = useState<string>(() =>
    value.length > 0 ? countryOfArea(value[0]) : knownCountry(defaultCountry) ? defaultCountry : 'NG'
  )
  const [stateKey, setStateKey] = useState('')
  const [query, setQuery] = useState('')
  const picked = useRef(false)

  // The starting country can arrive late (a phone number typed above, or a profile that loads after
  // this appears). Follow it until the rider has chosen a country or an area themselves.
  useEffect(() => {
    if (picked.current || value.length > 0 || !knownCountry(defaultCountry)) return
    setCountry(defaultCountry)
    setStateKey('')
  }, [defaultCountry, value.length])

  const chosenStates = Array.from(new Set(value.map(stateKeyOf)))
  const atMaxAreas = value.length >= maxAreas
  const regions = regionsOfCountry(country)
  const browsing = regions.find((s) => s.key === stateKey) ?? null
  const stateBlocked = (key: string) => !chosenStates.includes(key) && chosenStates.length >= maxStates
  const chooseText = country === 'NG' ? tx('Choose a state to add areas') : tx('Choose a region to add areas')

  const q = query.trim().toLowerCase()
  const all = browsing ? areasOfRegion(browsing.key) : []
  const whole = all.find((a) => a.key.endsWith(':' + WHOLE_REGION)) ?? null
  const matches = all.filter((a) => a !== whole && (!q || a.name.toLowerCase().includes(q)))
  const rows = [...(whole ? [whole] : []), ...matches.slice(0, MAX_ROWS)]
  const hiddenCount = Math.max(0, matches.length - MAX_ROWS)

  function toggle(key: string) {
    if (value.includes(key)) onChange(value.filter((k) => k !== key))
    else if (!atMaxAreas) onChange([...value, key])
  }

  return (
    <div className="field area-picker">
      <span className="field-label" id={idPrefix + '-label'}>{tx('Where do you work?')}{required && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> {tx('(required)')}</span>}</span>
      <p className="area-note">
        {tx('Pick the areas you can deliver in. Vendors in these areas will find you first. You can cover up to {areas} areas in up to {regions} states or regions.', { areas: maxAreas, regions: maxStates })}
      </p>

      <div className="area-count" aria-live="polite">
        {tx('{count} of {max} areas chosen', { count: value.length, max: maxAreas })}
      </div>

      {value.length > 0 && (
        <ul className="area-chips" aria-label={tx("Your work areas")}>
          {value.map((key) => (
            <li key={key} className="area-chip">
              <span>{areaText(areaLabel(key))}</span>
              <button type="button" onClick={() => toggle(key)} aria-label={tx('Remove') + ' ' + areaText(areaLabel(key))}>×</button>
            </li>
          ))}
        </ul>
      )}

      <select
        id={idPrefix + '-country'}
        className="field-input"
        aria-label={tx("Country")}
        value={country}
        onChange={(e) => {
          picked.current = true
          setCountry(e.target.value)
          setStateKey('')
          setQuery('')
        }}
      >
        {localCountries(COUNTRIES).map((c) => (
          <option key={c.iso} value={c.iso}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>

      <select
        id={idPrefix + '-state'}
        className="field-input"
        aria-labelledby={idPrefix + '-label'}
        value={stateKey}
        onChange={(e) => {
          setStateKey(e.target.value)
          setQuery('')
        }}
      >
        <option value="">{chooseText}</option>
        {regions.map((s) => (
          <option key={s.key} value={s.key} disabled={stateBlocked(s.key)}>
            {s.name}
            {stateBlocked(s.key) ? ' ' + tx('(limit reached)') : ''}
          </option>
        ))}
      </select>

      {chosenStates.length >= maxStates && (
        <p className="area-note">
          {tx('You have chosen areas in {places}. Remove all areas in one to switch to another.', { places: chosenStates.map(stateName).join(' ' + tx('and (list)') + ' ') })}
        </p>
      )}

      {browsing && (
        <>
          <input
            className="field-input"
            type="search"
            placeholder={tx('Search areas in {place}', { place: browsing.name })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={tx('Search areas in {place}', { place: browsing.name })}
          />
          <div className="area-list" role="group" aria-label={tx('Areas in {place}', { place: browsing.name })}>
            {matches.length === 0 && !whole && <p className="area-note" style={{ padding: 12, margin: 0 }}>{tx("No area matches that search.")}</p>}
            {matches.length === 0 && whole && q && <p className="area-note" style={{ padding: 12, margin: 0 }}>{tx("No area matches that search.")}</p>}
            {rows.map((l) => {
              const checked = value.includes(l.key)
              const disabled = !checked && atMaxAreas
              return (
                <label key={l.key} className={'area-row' + (checked ? ' on' : '') + (disabled ? ' off' : '')}>
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(l.key)} />
                  <span>{areaText(l.name)}</span>
                </label>
              )
            })}
          </div>
          {hiddenCount > 0 && (
            <p className="area-note">{tx('Showing the first {max}. Type in the search box to find the rest.', { max: MAX_ROWS })}</p>
          )}
          {atMaxAreas && <p className="area-note">{tx('You have reached {max} areas. Remove one to add another.', { max: maxAreas })}</p>}
        </>
      )}
    </div>
  )
}

export default WorkAreaPicker
