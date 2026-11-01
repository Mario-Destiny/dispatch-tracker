import { useState } from 'react'
import {
  NIGERIA_STATES,
  DEFAULT_MAX_AREAS,
  DEFAULT_MAX_STATES,
  areaLabel,
  stateKeyOf,
  stateName,
} from './areas'

type Props = {
  idPrefix: string
  value: string[]
  onChange: (areas: string[]) => void
  maxAreas?: number
  maxStates?: number
  required?: boolean
}

// Lets a rider choose the areas (LGAs) they work in. Up to maxAreas areas across up to maxStates states.
function WorkAreaPicker({ idPrefix, value, onChange, maxAreas = DEFAULT_MAX_AREAS, maxStates = DEFAULT_MAX_STATES, required = false }: Props) {
  const [stateKey, setStateKey] = useState('')
  const [query, setQuery] = useState('')

  const chosenStates = Array.from(new Set(value.map(stateKeyOf)))
  const atMaxAreas = value.length >= maxAreas
  const browsing = NIGERIA_STATES.find((s) => s.key === stateKey) ?? null
  const stateBlocked = (key: string) => !chosenStates.includes(key) && chosenStates.length >= maxStates

  const q = query.trim().toLowerCase()
  const lgas = browsing ? browsing.lgas.filter((l) => !q || l.name.toLowerCase().includes(q)) : []

  function toggle(key: string) {
    if (value.includes(key)) onChange(value.filter((k) => k !== key))
    else if (!atMaxAreas) onChange([...value, key])
  }

  return (
    <div className="field area-picker">
      <span className="field-label" id={idPrefix + '-label'}>Where do you work?{required && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> (required)</span>}</span>
      <p className="area-note">
        Pick the areas you can deliver in. Vendors in these areas will find you first. You can cover up to {maxAreas} areas
        in up to {maxStates} states.
      </p>

      <div className="area-count" aria-live="polite">
        {value.length} of {maxAreas} areas chosen
      </div>

      {value.length > 0 && (
        <ul className="area-chips" aria-label="Your work areas">
          {value.map((key) => (
            <li key={key} className="area-chip">
              <span>{areaLabel(key)}</span>
              <button type="button" onClick={() => toggle(key)} aria-label={'Remove ' + areaLabel(key)}>×</button>
            </li>
          ))}
        </ul>
      )}

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
        <option value="">Choose a state to add areas</option>
        {NIGERIA_STATES.map((s) => (
          <option key={s.key} value={s.key} disabled={stateBlocked(s.key)}>
            {s.name}
            {stateBlocked(s.key) ? ' (limit reached)' : ''}
          </option>
        ))}
      </select>

      {chosenStates.length >= maxStates && (
        <p className="area-note">
          You have chosen areas in {chosenStates.map(stateName).join(' and ')}. Remove all areas in a state to switch to another.
        </p>
      )}

      {browsing && (
        <>
          <input
            className="field-input"
            type="search"
            placeholder={'Search areas in ' + browsing.name}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={'Search areas in ' + browsing.name}
          />
          <div className="area-list" role="group" aria-label={'Areas in ' + browsing.name}>
            {lgas.length === 0 && <p className="area-note" style={{ padding: 12, margin: 0 }}>No area matches that search.</p>}
            {lgas.map((l) => {
              const checked = value.includes(l.key)
              const disabled = !checked && atMaxAreas
              return (
                <label key={l.key} className={'area-row' + (checked ? ' on' : '') + (disabled ? ' off' : '')}>
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(l.key)} />
                  <span>{l.name}</span>
                </label>
              )
            })}
          </div>
          {atMaxAreas && <p className="area-note">You have reached {maxAreas} areas. Remove one to add another.</p>}
        </>
      )}
    </div>
  )
}

export default WorkAreaPicker
