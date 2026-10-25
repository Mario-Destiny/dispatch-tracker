import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Loads the signed-in person's photo for dashboard headers. Quietly returns null if
// the avatar_url column has not been added yet.
export function useMyAvatar(name?: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) return
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', u.user.id).maybeSingle()
      if (!cancelled && data && typeof data.avatar_url === 'string') setUrl(data.avatar_url)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [name])
  return url
}
