import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'

export type ShareState = 'idle' | 'asking' | 'sharing' | 'denied' | 'unsupported' | 'error'

const MIN_GAP_MS = 6000

// While the rider has deliveries in transit, sends their position every few seconds
// and asks the phone to keep the screen awake. Stops when nothing is in transit.
export function useShareLocation(inTransitIds: string[]) {
  const [state, setState] = useState<ShareState>('idle')
  const idsRef = useRef<string[]>(inTransitIds)
  const key = inTransitIds.slice().sort().join(',')

  useEffect(() => {
    idsRef.current = key ? key.split(',') : []
  }, [key])

  const active = key.length > 0

  useEffect(() => {
    if (!active) {
      setState('idle')
      return
    }
    if (!('geolocation' in navigator)) {
      setState('unsupported')
      return
    }
    setState('asking')
    let lastSent = 0
    let wake: WakeLockSentinel | null = null
    let stopped = false

    async function keepAwake() {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          wake = await navigator.wakeLock.request('screen')
        }
      } catch {
        // not allowed: carry on without it
      }
    }
    keepAwake()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !wake?.released) return
      keepAwake()
    }
    document.addEventListener('visibilitychange', onVisible)

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (stopped) return
        setState('sharing')
        const now = Date.now()
        if (now - lastSent < MIN_GAP_MS) return
        lastSent = now
        for (const id of idsRef.current) {
          supabase
            .rpc('update_my_location', {
              p_delivery_id: id,
              p_lat: pos.coords.latitude,
              p_lng: pos.coords.longitude,
              p_accuracy: pos.coords.accuracy ?? null,
              p_heading: pos.coords.heading ?? null,
            })
            .then(({ error }) => {
              if (error && !stopped) setState('error')
            })
        }
      },
      (err) => {
        if (stopped) return
        setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 20000 }
    )

    return () => {
      stopped = true
      navigator.geolocation.clearWatch(watchId)
      document.removeEventListener('visibilitychange', onVisible)
      wake?.release().catch(() => undefined)
    }
  }, [active])

  return state
}
