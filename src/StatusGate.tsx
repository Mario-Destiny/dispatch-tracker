import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { CONTACT_EMAIL } from './siteInfo'
import { needsCompletion } from './authFlow'

type AccountStatus = {
  status: 'active' | 'restricted' | 'suspended'
  reason: string | null
  company_approval: 'pending' | 'approved' | 'rejected' | null
  company_approval_note: string | null
}

function mail(subject: string) {
  return 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject)
}

function StatusGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [info, setInfo] = useState<AccountStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: u } = await supabase.auth.getUser()
      if (u.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', u.user.id)
          .maybeSingle()
        if (needsCompletion(u.user, profile)) {
          navigate('/complete-profile', { replace: true })
          return
        }
        const { data } = await supabase.rpc('my_account_status')
        setInfo((data as AccountStatus | null) ?? null)
      }
      setLoading(false)
    }
    load()
  }, [navigate])

  async function logout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="page-bg">
        <Spinner />
      </div>
    )
  }

  if (info?.status === 'suspended') {
    return (
      <div className="page-bg">
        <div className="auth-wrap">
          <div className="form-card" style={{ textAlign: 'center' }}>
            <div className="notice-icon">⛔</div>
            <h2 style={{ margin: 0, color: 'var(--text)' }}>Account suspended</h2>
            <p className="rider-hint">
              Your account has been suspended, so you cannot use the platform right now.
            </p>
            {info.reason && (
              <p style={{ color: 'var(--text)', margin: 0 }}>
                <strong>Reason:</strong> {info.reason}
              </p>
            )}
            <a className="btn-primary" href={mail('Appeal: suspended account')} style={{ textDecoration: 'none' }}>
              Contact support to appeal
            </a>
            <button type="button" className="rider-btn" onClick={logout}>Log out</button>
          </div>
        </div>
      </div>
    )
  }

  if (info?.company_approval === 'pending' || info?.company_approval === 'rejected') {
    const rejected = info.company_approval === 'rejected'
    return (
      <div className="page-bg">
        <div className="auth-wrap">
          <div className="form-card" style={{ textAlign: 'center' }}>
            <div className="notice-icon">{rejected ? '❌' : '⏳'}</div>
            <h2 style={{ margin: 0, color: 'var(--text)' }}>
              {rejected ? 'Your company was not approved' : 'Your company is awaiting approval'}
            </h2>
            <p className="rider-hint">
              {rejected
                ? 'We could not approve your company yet.'
                : 'We check every company before it can create deliveries or invite riders. We will review your details and approve your account.'}
            </p>
            {rejected && info.company_approval_note && (
              <p style={{ color: 'var(--text)', margin: 0 }}>
                <strong>Note from us:</strong> {info.company_approval_note}
              </p>
            )}
            <a className="btn-primary" href={mail('Company approval')} style={{ textDecoration: 'none' }}>
              {rejected ? 'Contact us to fix this' : 'Contact us'}
            </a>
            <button type="button" className="rider-btn" onClick={logout}>Log out</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {info?.status === 'restricted' && (
        <div className="status-banner">
          Your account is restricted
          {info.reason ? ': ' + info.reason + '. ' : '. '}
          You can finish current deliveries, but some actions are limited.{' '}
          <a href={mail('Restricted account')}>Contact support</a>
        </div>
      )}
      {children}
    </>
  )
}

export default StatusGate