type VerifiedTickProps = {
  size?: number
  title?: string
}

function VerifiedTick({ size = 18, title = 'Verified business' }: VerifiedTickProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      style={{ verticalAlign: 'middle', flex: 'none' }}
    >
      <title>{title}</title>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="#1d9bf0" />
      <rect x="3" y="3" width="18" height="18" rx="5" fill="#1d9bf0" transform="rotate(45 12 12)" />
      <path
        d="M8 12.2l2.8 2.8L16.2 9.6"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default VerifiedTick