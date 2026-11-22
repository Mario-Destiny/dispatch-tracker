import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
  type PhoneNumber,
} from 'libphonenumber-js/min'

// Phone numbers are saved as plain text. New numbers are saved in full international form,
// like +233244123456. Numbers saved before Veritrack went international look like
// 08012345678 (or 2348012345678), so anything without a country code is read as Nigerian.
export const DEFAULT_COUNTRY: CountryCode = 'NG'

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

export type CountryOption = { iso: CountryCode; name: string; dial: string; flag: string }

export function flagOf(iso: string) {
  return String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

export function countryName(iso: string) {
  return regionNames?.of(iso) ?? iso
}

// Every country the phone library knows, A to Z by name.
export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((iso) => ({ iso, name: countryName(iso), dial: getCountryCallingCode(iso), flag: flagOf(iso) }))
  .filter((c) => c.name !== c.iso)
  .sort((a, b) => a.name.localeCompare(b.name))

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && COUNTRY_OPTIONS.some((c) => c.iso === value)
}

// Some calling codes are shared by several countries (+1, +44, +7 ...). This picks the main one.
const MAIN_COUNTRY_FOR_CODE: Record<string, CountryCode> = {
  '1': 'US', '7': 'RU', '39': 'IT', '44': 'GB', '47': 'NO', '61': 'AU', '212': 'MA',
  '262': 'RE', '358': 'FI', '590': 'GP', '599': 'CW',
}

// A country for a calling code (like '44'), used when a number is not in a recognised range.
export function countryForCallingCode(code: string): CountryCode | undefined {
  return MAIN_COUNTRY_FOR_CODE[code] ?? COUNTRY_OPTIONS.find((c) => c.dial === code)?.iso
}

// Reads saved text into a parsed number, or null when it cannot be read.
export function parseStored(phone: string | null | undefined): PhoneNumber | null {
  const raw = (phone ?? '').trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (raw.startsWith('+')) return parsePhoneNumberFromString('+' + digits) ?? null
  if (raw.startsWith('00')) return parsePhoneNumberFromString('+' + digits.slice(2)) ?? null
  if (digits.startsWith('234') && digits.length >= 13) return parsePhoneNumberFromString('+' + digits) ?? null
  return parsePhoneNumberFromString(raw, DEFAULT_COUNTRY) ?? null
}

// Full international form, like +2348012345678, or null when it cannot be read.
export function toE164(phone: string | null | undefined) {
  return parseStored(phone)?.number ?? null
}

// Digits for a wa.me link. Falls back to the digits that were typed.
export function waDigits(phone: string | null | undefined) {
  const e164 = toE164(phone)
  return e164 ? e164.slice(1) : (phone ?? '').replace(/\D/g, '')
}

// A tel: link that works in any country.
export function telHref(phone: string | null | undefined) {
  const e164 = toE164(phone)
  return 'tel:' + (e164 ?? '+' + (phone ?? '').replace(/\D/g, ''))
}

// Easy to read, like +233 24 412 3456. Falls back to the saved text.
export function displayPhone(phone: string | null | undefined) {
  return parseStored(phone)?.formatInternational() ?? (phone ?? '')
}

// The country a saved number belongs to, or null when it cannot be told (some +1 numbers).
export function phoneCountry(phone: string | null | undefined): CountryCode | null {
  return parseStored(phone)?.country ?? null
}

// Numbers with a country code must look possible for that country. Older numbers saved without
// one stay valid when they have at least 7 digits, so nobody is locked out.
export function isValidPhone(phone: string | null | undefined) {
  const raw = (phone ?? '').trim()
  if (!raw) return false
  const parsed = parseStored(raw)
  if (parsed) return parsed.isPossible()
  return !raw.startsWith('+') && raw.replace(/\D/g, '').length >= 7
}
