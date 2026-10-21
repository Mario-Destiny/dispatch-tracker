export type Pin = {
  lat: number | null
  lng: number | null
  url: string | null
}

const MAPS_URL = /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i

function validCoords(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

// Accepts a Google Maps link (even inside a WhatsApp message) or plain "6.5244, 3.3792"
export function parseMapsInput(raw: string): Pin | null {
  const text = raw.trim()
  if (!text) return null

  const plain = text.match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (plain) {
    const lat = Number(plain[1])
    const lng = Number(plain[2])
    return validCoords(lat, lng) ? { lat, lng, url: null } : null
  }

  const found = text.match(/https:\/\/[^\s]+/)
  if (!found) return null

  const url = found[0].slice(0, 500)
  if (!MAPS_URL.test(url)) return null

  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&](?:q|ll|query|destination|center)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/i,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  ]

  for (const p of patterns) {
    const m = url.match(p)
    if (m) {
      const lat = Number(m[1])
      const lng = Number(m[2])
      if (validCoords(lat, lng)) return { lat, lng, url }
    }
  }

  return { lat: null, lng: null, url }
}

export function hasPin(lat: number | null | undefined, url: string | null | undefined) {
  return (lat !== null && lat !== undefined) || Boolean(url)
}

// Opens the maps app: exact pin if we have one, the link if not, otherwise a search by address
export function navLink(
  lat: number | null | undefined,
  lng: number | null | undefined,
  url: string | null | undefined,
  fallbackText: string
) {
  if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '&travelmode=driving'
  }
  if (url) return url
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(fallbackText)
}