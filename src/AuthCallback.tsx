import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'
import { dashboardFor, needsCompletion } from './authFlow'

// The session can take a moment to appear after Google or LinkedIn sends the person back.
async function waitForSession(): Promise<Session | null> {
  for (let i = 0; i < 8; i++) {
    const { data } = await supabase.auth.getSession()
    if (data.session) return data.session
    await new Promise((r) => setTimeout(r, 400))
  }
  return null
}

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hasRun = useRef(false)

  useEffect(() => {
    // Guard so this only runs once (React dev mode runs effects twice)
    if (hasRun.current) return
    hasRun.current = true

    async function finishSignIn() {
      // 1. Did the sign-in provider or Supabase send back an error?
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
      const oauthError = searchParams.get('error_description') || hashParams.get('error_description')
      if (oauthError) {
        showToast('Sign-in failed: ' + oauthError, 'error')
        navigate('/login', { replace: true })
        return
      }

      // 2. Get the session created by the sign-in
      const session = await waitForSession()
      const user = session?.user
      if (!user) {
        showToast('Sign-in could not be completed. Please try again.', 'error')
        navigate('/login', { replace: true })
        return
      }

      // 3. Admins go to the admin area
      const { data: adminFlag } = await supabase.rpc('is_admin')
      if (adminFlag === true) {
        navigate('/admin', { replace: true })
        return
      }

      // 4. Look up their profile
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('role, phone')
        .eq('id', user.id)
        .maybeSingle()

      if (lookupError) {
        showToast('Could not load your profile: ' + lookupError.message, 'error')
        navigate('/login', { replace: true })
        return
      }

      // 5. Complete accounts go straight to their dashboard
      if (profile && !needsCompletion(user, profile)) {
        navigate(dashboardFor(profile.role), { replace: true })
        return
      }

      // 6. New accounts, or accounts missing a phone number or agreement, finish their profile first.
      //    The profile is only created there, after they agree to the terms.
      const role = searchParams.get('role')
      navigate('/complete-profile' + (role === 'vendor' || role === 'rider' ? '?role=' + role : ''), { replace: true })
    }

    finishSignIn()
  }, [navigate, searchParams])

  return (
    <div className="page-bg">
      <div style={{ textAlign: 'center', fontFamily: 'sans-serif', paddingTop: 40 }}>
        <Spinner />
        <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Signing you in...</p>
      </div>
    </div>
  )
}

export default AuthCallback
