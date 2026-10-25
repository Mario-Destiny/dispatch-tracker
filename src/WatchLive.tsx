import { lazy, Suspense, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Skeleton from './Skeleton'
import type { LatLng } from './LiveMap'

const LiveMap = lazy(() => import('./LiveMap'))

type Props = { deliveryId: string; dropLat: number | null; dropLng: number | null }

// Vendor / company: a button that opens a live map for one in-transit delivery.
function WatchLive({ deliveryId, dropLat, dropLng }: Props) {
  const [open, setOpen] = useState(false)
  const [rider, setRider] = useState<LatLng | null>(null)
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let stopped = false
    async function poll() {
      const { data } = await supabase
        .from('rider_locations')
        .select('lat, lng, updated_at')
        .eq('delivery_id', deliveryId)
        .maybeSingle()
      if (stopped) return
      if (data) {
        setRider({ lat: data.lat, lng: data.lng })
        setSeconds(Math.max(0, Math.round((Date.now() - new Date(data.updated_at).getTime()) / 1000)))
      } else {
        setRider(null)
        setSeconds(null)
      }
    }
    poll()
    const timer = window.setInterval(poll, 6000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [open, deliveryId])

  const dropoff = dropLat !== null && dropLng !== null ? { lat: dropLat, lng: dropLng } : null

  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" className="rider-btn" onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide live map' : '📍 Watch live'}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          <Suspense fallback={<Skeleton width="100%" height={260} radius={14} />}>
            <LiveMap dropoff={dropoff} rider={rider} height={260} />
          </Suspense>
          <p className="live-note">
            {rider
              ? 'Blue dot: rider' + (seconds !== null ? ', last seen ' + (seconds < 60 ? seconds + 's' : Math.round(seconds / 60) + ' min') + ' ago' : '') + '.'
              : 'Waiting for the rider to share their location. They need to open Veritrack and allow location.'}
            {!dropoff && ' No drop-off pin was set for this delivery.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default WatchLive
