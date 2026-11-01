import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import Avatar from './Avatar'
import { showToast } from './toast'
import { useTheme } from './useTheme'
import type { ThemeMode } from './useTheme'
import { dashboardFor, isSocialUser, isValidPhone, providerLabel } from './authFlow'
import type { Provider } from './authFlow'
import WorkAreaPicker from './WorkAreaPicker'
import { readWorkAreas, saveWorkAreas } from './areas'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

// Crops to a centred square and shrinks to 256px so uploads stay tiny.
async function squareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Your browser cannot process images.')
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process that image.'))), 'image/jpeg', 0.85)
  })
}

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '☀️ Light' },
  { value: 'dark', label: '🌙 Dark' },
  { value: 'auto', label: '🖥️ Auto' },
]

function Settings() {
  const navigate = useNavigate()
  const { mode, setMode } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [savingDetails, setSavingDetails] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [areas, setAreas] = useState<string[]>([])
  const [savingAreas, setSavingAreas] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingSecurity, setSavingSecurity] = useState(false)

  const [soundOn, setSoundOn] = useState(true)
  const [emailOn, setEmailOn] = useState(true)

  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) {
        navigate('/login', { replace: true })
        return
      }
      setUser(u.user)
      const meta = u.user.user_metadata || {}
      setSoundOn(meta.notify_sound !== false)
      setEmailOn(meta.notify_email !== false)

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.user.id).maybeSingle()
      if (profile) {
        setName(profile.name || '')
        setPhone(profile.phone || '')
        setRole(profile.role || null)
        setAvatarUrl(typeof profile.avatar_url === 'string' ? profile.avatar_url : null)
        setAreas(readWorkAreas(profile.work_areas))
      }
      setLoading(false)
    }
    load()
  }, [navigate])

  // Opening /settings#work-areas (from the rider dashboard nudge) jumps to the work areas section
  useEffect(() => {
    if (!loading && window.location.hash === '#work-areas') {
      document.getElementById('work-areas')?.scrollIntoView({ block: 'start' })
    }
  }, [loading])

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast('That photo is too big. Please pick one under 8 MB.', 'error')
      return
    }
    setUploading(true)
    try {
      const blob = await squareJpeg(file)
      const path = user.id + '/avatar.jpg'
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' })
      if (upErr) throw new Error(upErr.message)
      const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl + '?v=' + Date.now()
      const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (dbErr) throw new Error(dbErr.message)
      setAvatarUrl(publicUrl)
      showToast('Profile photo updated.', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.'
      showToast(
        msg.toLowerCase().includes('bucket') || msg.toLowerCase().includes('avatar_url')
          ? 'Photo upload is not set up yet. Please try again later.'
          : 'Could not upload photo: ' + msg,
        'error'
      )
    }
    setUploading(false)
  }

  async function removePhoto() {
    if (!user) return
    setUploading(true)
    await supabase.storage.from('avatars').remove([user.id + '/avatar.jpg'])
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    setUploading(false)
    if (error) {
      showToast('Could not remove photo: ' + error.message, 'error')
      return
    }
    setAvatarUrl(null)
    showToast('Photo removed.', 'success')
  }

  async function saveAreas() {
    setSavingAreas(true)
    const error = await saveWorkAreas(areas)
    setSavingAreas(false)
    if (error) {
      showToast('Could not save your work areas: ' + error, 'error')
      return
    }
    showToast('Work areas saved.', 'success')
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!name.trim()) {
      setDetailsError('Please enter your name.')
      return
    }
    if (!isValidPhone(phone)) {
      setDetailsError('Please enter a valid phone number.')
      return
    }
    setDetailsError('')
    setSavingDetails(true)
    const { error } = await supabase.from('profiles').update({ name: name.trim(), phone: phone.trim() }).eq('id', user.id)
    setSavingDetails(false)
    if (error) {
      showToast('Could not save: ' + error.message, 'error')
      return
    }
    showToast('Details saved.', 'success')
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setSavingSecurity(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setSavingSecurity(false)
    if (error) {
      showToast('Could not change email: ' + error.message, 'error')
      return
    }
    setNewEmail('')
    showToast('Check your inbox. Confirm the link to finish changing your email.', 'success')
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The two passwords do not match.')
      return
    }
    setPasswordError('')
    setSavingSecurity(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingSecurity(false)
    if (error) {
      setPasswordError(error.message)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    showToast('Password changed.', 'success')
  }

  async function signOutEverywhere() {
    await supabase.auth.signOut({ scope: 'global' })
    navigate('/login')
  }

  async function saveNotify(next: { sound: boolean; email: boolean }) {
    setSoundOn(next.sound)
    setEmailOn(next.email)
    const { error } = await supabase.auth.updateUser({ data: { notify_sound: next.sound, notify_email: next.email } })
    if (error) showToast('Could not save preference: ' + error.message, 'error')
  }

  async function deleteAccount() {
    if (!user) return
    setDeleting(true)
    await supabase.storage.from('avatars').remove([user.id + '/avatar.jpg'])
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      showToast('Could not delete account: ' + error.message + ' Please contact support.', 'error')
      setDeleting(false)
      return
    }
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

  const social = user ? isSocialUser(user) : false
  const provider = (user?.app_metadata?.provider as Provider | undefined) ?? 'google'

  return (
    <div className="page-bg">
      <div className="auth-wrap settings-wrap">
        <Link to={dashboardFor(role)} className="settings-back">← Back to dashboard</Link>
        <h1 className="auth-title" style={{ textAlign: 'left' }}>Settings</h1>

        <section className="form-card settings-card">
          <h2 className="settings-h">Profile photo</h2>
          <div className="settings-photo-row">
            <Avatar url={avatarUrl} name={name} size={84} />
            <div className="settings-photo-actions">
              <p className="settings-hint">Use your face or your company logo. Square photos look best. This photo is public: it shows on your business page.</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} aria-label="Choose profile photo" />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn-primary" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? <><Spinner size="sm" /> Uploading...</> : avatarUrl ? 'Change photo' : 'Upload photo'}
                </button>
                {avatarUrl && (
                  <button type="button" disabled={uploading} onClick={removePhoto}>Remove</button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="form-card settings-card">
          <h2 className="settings-h">Appearance</h2>
          <div className="theme-choice" role="radiogroup" aria-label="Theme">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={mode === m.value}
                className={'theme-option' + (mode === m.value ? ' on' : '')}
                onClick={() => setMode(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="settings-hint">Auto follows your phone or computer. Saved on this device.</p>
        </section>

        <form className="form-card settings-card" onSubmit={saveDetails}>
          <h2 className="settings-h">Your details</h2>
          <div className="field">
            <label className="field-label" htmlFor="set-name">Name</label>
            <input id="set-name" className="field-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="set-phone">Phone number</label>
            <input id="set-phone" className="field-input" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {detailsError && <p className="field-error">{detailsError}</p>}
          <button type="submit" className="btn-primary btn-block" disabled={savingDetails}>
            {savingDetails ? <><Spinner size="sm" /> Saving...</> : 'Save details'}
          </button>
        </form>

        {role === 'rider' && (
          <section id="work-areas" className="form-card settings-card">
            <h2 className="settings-h">Where you work</h2>
            <WorkAreaPicker idPrefix="set-areas" value={areas} onChange={setAreas} />
            <button type="button" className="btn-primary btn-block" style={{ marginTop: 14 }} disabled={savingAreas || areas.length === 0} onClick={saveAreas}>
              {savingAreas ? <><Spinner size="sm" /> Saving...</> : 'Save work areas'}
            </button>
          </section>
        )}

        <section className="form-card settings-card">
          <h2 className="settings-h">Notifications</h2>
          <label className="check-row">
            <input type="checkbox" checked={soundOn} onChange={(e) => saveNotify({ sound: e.target.checked, email: emailOn })} />
            <span>Sound alerts for new deliveries</span>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={emailOn} onChange={(e) => saveNotify({ sound: soundOn, email: e.target.checked })} />
            <span>Email me about delivery updates</span>
          </label>
        </section>

        <section className="form-card settings-card">
          <h2 className="settings-h">Security</h2>
          <p className="settings-hint">Signed in as {user?.email || 'your account'}</p>
          {social ? (
            <p className="settings-hint">
              You sign in with {providerLabel[provider] ?? 'a social account'}, so your email and password are managed there.
            </p>
          ) : (
            <>
              <form onSubmit={saveEmail} className="settings-sub">
                <div className="field">
                  <label className="field-label" htmlFor="set-email">New email</label>
                  <input id="set-email" className="field-input" type="email" autoComplete="email" placeholder="new@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
                <button type="submit" disabled={savingSecurity || !newEmail.trim()}>Change email</button>
              </form>
              <form onSubmit={savePassword} className="settings-sub">
                <div className="field">
                  <label className="field-label" htmlFor="set-pass">New password</label>
                  <input id="set-pass" className="field-input" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="set-pass2">Confirm password</label>
                  <input id="set-pass2" className="field-input" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                {passwordError && <p className="field-error">{passwordError}</p>}
                <button type="submit" disabled={savingSecurity || !newPassword}>Change password</button>
              </form>
            </>
          )}
          <button type="button" onClick={signOutEverywhere}>Sign out on all devices</button>
        </section>

        <section className="form-card settings-card settings-danger">
          <h2 className="settings-h">Delete account</h2>
          <p className="settings-hint">This permanently removes your account and profile. It cannot be undone.</p>
          <div className="field">
            <label className="field-label" htmlFor="set-del">Type DELETE to confirm</label>
            <input id="set-del" className="field-input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          </div>
          <button type="button" className="btn-danger" disabled={confirmText !== 'DELETE' || deleting} onClick={deleteAccount}>
            {deleting ? <><Spinner size="sm" /> Deleting...</> : 'Delete my account'}
          </button>
        </section>
      </div>
    </div>
  )
}

export default Settings
