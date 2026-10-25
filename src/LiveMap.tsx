import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type LatLng = { lat: number; lng: number }

function dot(cls: string) {
  return L.divIcon({ className: '', html: '<span class="lm-dot ' + cls + '"></span>', iconSize: [22, 22], iconAnchor: [11, 11] })
}

// Real map (OpenStreetMap tiles): the drop-off pin and, when known, the rider's moving dot.
function LiveMap({ dropoff, rider, height = 280 }: { dropoff: LatLng | null; rider: LatLng | null; height?: number }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const riderMarker = useRef<L.Marker | null>(null)
  const dropMarker = useRef<L.Marker | null>(null)
  const fitted = useRef(false)

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    m.setView([9.082, 8.675], 6)
    map.current = m
    return () => {
      m.remove()
      map.current = null
      riderMarker.current = null
      dropMarker.current = null
      fitted.current = false
    }
  }, [])

  useEffect(() => {
    const m = map.current
    if (!m) return
    if (dropoff) {
      if (!dropMarker.current) dropMarker.current = L.marker([dropoff.lat, dropoff.lng], { icon: dot('lm-drop') }).addTo(m)
      else dropMarker.current.setLatLng([dropoff.lat, dropoff.lng])
    } else if (dropMarker.current) {
      dropMarker.current.remove()
      dropMarker.current = null
    }
    if (rider) {
      if (!riderMarker.current) riderMarker.current = L.marker([rider.lat, rider.lng], { icon: dot('lm-rider') }).addTo(m)
      else riderMarker.current.setLatLng([rider.lat, rider.lng])
    } else if (riderMarker.current) {
      riderMarker.current.remove()
      riderMarker.current = null
    }
    const pts: L.LatLngExpression[] = []
    if (dropoff) pts.push([dropoff.lat, dropoff.lng])
    if (rider) pts.push([rider.lat, rider.lng])
    if (pts.length === 0) return
    if (!fitted.current) {
      if (pts.length === 1) m.setView(pts[0], 15)
      else m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 16 })
      fitted.current = true
    } else if (rider && !m.getBounds().contains([rider.lat, rider.lng])) {
      m.panTo([rider.lat, rider.lng])
    }
  }, [dropoff, rider])

  return <div ref={el} className="live-map" style={{ height }} role="img" aria-label="Map showing the rider and the drop-off point" />
}

export default LiveMap
