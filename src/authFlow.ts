import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export type Provider = 'google' | 'apple'

export const providerLabel: Record<Provider, string> = { google: 'Google', apple: 'Apple' }

export function dashboardFor(role: string | null | undefined) {
  return role === 'rider' ? '/rider' : role === 'company' ? '/company' : '/vendor'
}

// Sends the person to Google or Apple. They come back to /auth/callback.
// Returns an error message, or null when the redirect started.
export async function startOAuth(provider: Provider, role?: 'vendor' | 'rider'): Promise<string | null> {
  const redirectTo = window.location.origin + '/auth/callback' + (role ? '?role=' + role : '')
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
    },
  })
  if (!error) return null
  const msg = error.message.toLowerCase()
  if (msg.includes('not enabled') || msg.includes('unsupported provider')) {
    return providerLabel[provider] + ' sign-in is not available yet. Please use email for now.'
  }
  return providerLabel[provider] + ' sign-in failed: ' + error.message
}

// Accounts created through Google or Apple (not email and password).
export function isSocialUser(user: User) {
  const provider = user.app_metadata?.provider
  return !!provider && provider !== 'email'
}

export function hasAcceptedTerms(user: User) {
  return Boolean(user.user_metadata?.terms_accepted_at)
}

export function isValidPhone(phone: string | null | undefined) {
  return (phone ?? '').replace(/\D/g, '').length >= 7
}

// A Google or Apple account must have a profile, a phone number, and accepted the terms
// before it can use the app. Email accounts already give these at signup.
export function needsCompletion(user: User, profile: { phone: string | null } | null) {
  if (!profile) return true
  if (!isSocialUser(user)) return false
  return !isValidPhone(profile.phone) || !hasAcceptedTerms(user)
}
