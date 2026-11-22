import { useEffect, useRef, useState } from 'react'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min'
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, countryForCallingCode, isCountryCode, parseStored } from './phone'

type Props = {
  id: string
  // The saved number, in international form (+233244123456). An empty string means nothing typed yet.
  value: string
  onChange: (value: string) => void
  // Country shown first when the field is empty.
  defaultCountry?: string | null
  required?: boolean
}

function startingCountry(value: string, fallback?: string | null): CountryCode {
  const parsed = parseStored(value)
  const found = parsed && (parsed.country ?? countryForCallingCode(parsed.countryCallingCode))
  if (found) return found
  return isCountryCode(fallback) ? fallback : DEFAULT_COUNTRY
}

function startingNational(value: string) {
  return parseStored(value)?.nationalNumber ?? ''
}

// A country picker plus the number. Whatever is typed is handed back in full international form,
// so a number always works for WhatsApp and calls, in any country.
function PhoneField({ id, value, onChange, defaultCountry, required = false }: Props) {
  const [country, setCountry] = useState<CountryCode>(() => startingCountry(value, defaultCountry))
  const [national, setNational] = useState(() => startingNational(value))
  const lastSent = useRef(value)

  // When the parent changes the value (loaded from the database, or cleared after saving), follow it.
  useEffect(() => {
    if (value === lastSent.current) return
    lastSent.current = value
    setCountry(startingCountry(value, defaultCountry))
    setNational(startingNational(value))
  }, [value, defaultCountry])

  // When the starting country arrives late (profile loaded) and nothing is typed yet, use it.
  useEffect(() => {
    if (!value && !national && isCountryCode(defaultCountry)) setCountry(defaultCountry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCountry])

  function send(nextCountry: CountryCode, nextNational: string) {
    const digits = nextNational.replace(/\D/g, '')
    let out = ''
    if (digits) {
      const parsed = parsePhoneNumberFromString(digits, nextCountry)
      const dial = COUNTRY_OPTIONS.find((c) => c.iso === nextCountry)?.dial ?? ''
      out = parsed ? parsed.number : '+' + dial + digits.replace(/^0+/, '')
    }
    lastSent.current = out
    onChange(out)
  }

  function onNumberChange(text: string) {
    // A full number pasted with its + sign picks the country by itself.
    if (text.trim().startsWith('+')) {
      const parsed = parsePhoneNumberFromString(text.trim())
      const found = parsed && (parsed.country ?? countryForCallingCode(parsed.countryCallingCode))
      if (parsed && found) {
        setCountry(found)
        setNational(parsed.nationalNumber)
        send(found, parsed.nationalNumber)
        return
      }
    }
    setNational(text)
    send(country, text)
  }

  function onCountryChange(next: string) {
    if (!isCountryCode(next)) return
    setCountry(next)
    send(next, national)
  }

  return (
    <div className="phone-field">
      <select
        className="field-input phone-country"
        aria-label="Country code"
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
      >
        {COUNTRY_OPTIONS.map((c) => (
          <option key={c.iso} value={c.iso}>
            {c.flag} {c.name} (+{c.dial})
          </option>
        ))}
      </select>
      <input
        id={id}
        className="field-input phone-number"
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        placeholder="Phone number"
        value={national}
        onChange={(e) => onNumberChange(e.target.value)}
        required={required}
      />
    </div>
  )
}

export default PhoneField
