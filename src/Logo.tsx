import { useId } from 'react'

// Veritrack logo: a check mark that curves into a heart, with the name beside it. Colors follow the light/dark theme
// through the --logo-a (start) and --logo-b (end) variables set in App.css.
function Logo({ size = 40 }: { size?: number }) {
  const id = useId()
  return (
    <span className="brand-lockup">
      <svg className="brand-logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="14" y1="14" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--logo-a)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--logo-a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--logo-b)' }} />
        </linearGradient>
      </defs>
      <path
        d="M32 27 C29 17 15 16 14 28 C13 40 25 48 33 57 C40 47 50 35 58 17"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="6.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      </svg>
      <span className="brand-name">
        <b>Veri</b>
        <span>track</span>
      </span>
    </span>
  )
}

export default Logo
