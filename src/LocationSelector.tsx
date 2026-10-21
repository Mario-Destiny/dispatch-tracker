import { useState, useEffect } from 'react'
import { Country, State, City } from 'country-state-city'

type Props = {
  label: string
  onChange: (formattedLocation: string) => void
}

function LocationSelector({ label, onChange }: Props) {
  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [cityName, setCityName] = useState('')

  const countries = Country.getAllCountries()
  const states = countryCode ? State.getStatesOfCountry(countryCode) : []
  const cities = countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []

  useEffect(() => {
    if (!countryCode) {
      onChange('')
      return
    }

    const country = countries.find((c) => c.isoCode === countryCode)
    const state = states.find((s) => s.isoCode === stateCode)

    const parts = [cityName, state ? state.name : '', country ? country.name : ''].filter(Boolean)
    onChange(parts.join(', '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, stateCode, cityName])

  return (
    <div className="field">
      <label className="field-label">{label}</label>

      <select
        className="field-input"
        value={countryCode}
        onChange={(e) => {
          setCountryCode(e.target.value)
          setStateCode('')
          setCityName('')
        }}
        required
      >
        <option value="">Select country</option>
        {countries.map((c) => (
          <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
        ))}
      </select>

      {countryCode && (
        <select
          className="field-input"
          value={stateCode}
          onChange={(e) => {
            setStateCode(e.target.value)
            setCityName('')
          }}
          required
        >
          <option value="">Select state/province</option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
          ))}
        </select>
      )}

      {countryCode && stateCode && (
        <select
          className="field-input"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          required
        >
          <option value="">Select city</option>
          {cities.map((city) => (
            <option key={city.name} value={city.name}>{city.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}

export default LocationSelector