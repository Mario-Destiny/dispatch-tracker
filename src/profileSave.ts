import { supabase } from './supabaseClient'
import { phoneCountry } from './phone'

// Saves a profile together with the person's country (taken from their phone number unless one is
// given). If the database update in supabase/country.sql has not been run yet, the save is tried
// again without the country, so signing up and editing a profile never break because of it.
function countryNotReady(message: string) {
  return /country/i.test(message) || /permission denied/i.test(message)
}

type NewProfile = { id: string; name: string; phone: string; role: string; country?: string | null }

export async function insertProfile(row: NewProfile) {
  const { country: given, ...base } = row
  const country = given ?? phoneCountry(row.phone)
  if (!country) return supabase.from('profiles').insert(base)
  const first = await supabase.from('profiles').insert({ ...base, country })
  if (first.error && countryNotReady(first.error.message)) return supabase.from('profiles').insert(base)
  return first
}

export async function updateProfile(id: string, fields: { name: string; phone: string; country?: string | null }) {
  const { country: given, ...base } = fields
  const country = given ?? phoneCountry(fields.phone)
  if (!country) return supabase.from('profiles').update(base).eq('id', id)
  const first = await supabase.from('profiles').update({ ...base, country }).eq('id', id)
  if (first.error && countryNotReady(first.error.message)) return supabase.from('profiles').update(base).eq('id', id)
  return first
}
