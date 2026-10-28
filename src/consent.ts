import { supabase } from './supabaseClient'
import { LAST_UPDATED } from './siteInfo'

// The version a person agrees to is the "Last updated" date shown on the Terms and Privacy pages.
// Change LAST_UPDATED in siteInfo.ts when the legal text changes and new signups record the new version.
export const TERMS_VERSION = LAST_UPDATED

export type ConsentMethod = 'email_signup' | 'social_signup'

// Data saved on the account itself at signup. The Google/LinkedIn flow reads terms_accepted_at.
export function consentMetadata() {
  return { terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION }
}

// Saves the agreement in the user_consents table (needs supabase/consent.sql to have been run).
// A failure here never blocks signup; it is only logged.
export async function recordConsent(method: ConsentMethod) {
  try {
    const { error } = await supabase.rpc('record_consent', { p_version: TERMS_VERSION, p_method: method })
    if (error) console.warn('Could not record consent:', error.message)
  } catch (err) {
    console.warn('Could not record consent:', err)
  }
}
