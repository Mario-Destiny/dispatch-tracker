import { useState } from 'react'

type Props = {
  idPrefix: string
  password: string
  confirm: string
  onPasswordChange: (value: string) => void
  onConfirmChange: (value: string) => void
}

export const MIN_PASSWORD_LENGTH = 6

// True when the password is long enough and both fields match.
export function passwordsOk(password: string, confirm: string) {
  return password.length >= MIN_PASSWORD_LENGTH && password === confirm
}

function strengthOf(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (password.length < MIN_PASSWORD_LENGTH) return { score: 1, label: 'Too short' }
  if (score <= 1) return { score: 1, label: 'Weak' }
  if (score <= 3) return { score: 2, label: 'Okay' }
  return { score: 3, label: 'Strong' }
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.77 19.77 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a19.86 19.86 0 0 1-3.17 4.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

// Password + confirm password with show/hide toggles, a strength hint and a live match message.
function PasswordFields({ idPrefix, password, confirm, onPasswordChange, onConfirmChange }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const strength = strengthOf(password)
  const showMatch = confirm.length > 0
  const matches = password === confirm

  return (
    <>
      <div className="field">
        <label className="field-label" htmlFor={`${idPrefix}-password`}>Password</label>
        <div className="password-wrap">
          <input
            id={`${idPrefix}-password`}
            className="field-input"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        {password && (
          <div className="strength" aria-live="polite">
            <div className="strength-bars">
              {[1, 2, 3].map((n) => (
                <span key={n} className={n <= strength.score ? `strength-bar on s${strength.score}` : 'strength-bar'} />
              ))}
            </div>
            <span className={`strength-label s${strength.score}`}>{strength.label}</span>
          </div>
        )}
      </div>

      <div className="field">
        <label className="field-label" htmlFor={`${idPrefix}-confirm`}>Confirm password</label>
        <div className="password-wrap">
          <input
            id={`${idPrefix}-confirm`}
            className="field-input"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Type your password again"
            value={confirm}
            onChange={(e) => onConfirmChange(e.target.value)}
            required
            aria-invalid={showMatch && !matches}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            aria-pressed={showConfirm}
          >
            <EyeIcon open={showConfirm} />
          </button>
        </div>
        {showMatch && (
          <span className={matches ? 'match-msg ok' : 'match-msg bad'} aria-live="polite">
            {matches ? '✓ Passwords match' : '✕ Passwords do not match'}
          </span>
        )}
      </div>
    </>
  )
}

export default PasswordFields
