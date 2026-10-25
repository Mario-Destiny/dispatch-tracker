import { useState } from 'react'

function initialsOf(name: string | null | undefined) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
}

// Round profile picture. Falls back to initials when there is no photo or it fails to load.
function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string | null; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showImage = url && failedUrl !== url

  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>
      {showImage ? (
        <img src={url} alt="" onError={() => setFailedUrl(url)} />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}

export default Avatar
