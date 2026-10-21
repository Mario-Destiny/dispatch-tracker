import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hasRun = useRef(false)

  useEffect(() => {
    // Guard so this only runs once (React dev mode runs effects twice)
    if (hasRun.current) return
    hasRun.current = true

    async function finishSignIn() {
      // 1. Did Google or Supabase send back an error?
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
      const oauthError = searchParams.get('error_description') || hashParams.get('error_description')
      if (oauthError) {
        showToast('Google sign-in failed: ' + oauthError, 'error')
        navigate('/login', { replace: true })
        return
      }

      // 2. Get the session created by the Google sign-in
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        showToast('Sign-in could not be completed. Please try again.', 'error')
        navigate('/login', { replace: true })
        return
      }

      // 3. Existing account? Send them straight to the dashboard for their role
      const { data: existing, error: lookupError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (lookupError) {
        showToast('Could not load your profile: ' + lookupError.message, 'error')
        navigate('/login', { replace: true })
        return
      }

      if (existing) {
        navigate(existing.role === 'rider' ? '/rider' : existing.role === 'company' ? '/company' : '/vendor', { replace: true })
        return
      }

      // 4. New Google user: create a profile using the role picked on the signup page
      const role = searchParams.get('role')
      if (role !== 'vendor' && role !== 'rider') {
        showToast('Please choose whether you are signing up as a vendor or a rider.', 'error')
        await supabase.auth.signOut()
        navigate('/', { replace: true })
        return
      }

      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email ? user.email.split('@')[0] : 'New user')

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        name,
        phone: '',
        role,
      })

      if (insertError) {
        showToast('Profile creation failed: ' + insertError.message, 'error')
        await supabase.auth.signOut()
        navigate('/login', { replace: true })
        return
      }

      showToast('Welcome! Your account is ready.')
      navigate(role === 'rider' ? '/rider' : '/vendor', { replace: true })
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