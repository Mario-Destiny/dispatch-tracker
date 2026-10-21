import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import VerifiedTick from './VerifiedTick'
import { tickTitle, type Badges } from './businessUtils'

type Mine = {
  name: string
  verified: boolean
  requested_at: string | null
  badges: Badges
}

function MyBadges() {
  const [mine, setMine] = useState<Mine | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.rpc('my_business')
      setMine((data as Mine | null) ?? null)
    }
    load()
  }, [])

  if (!mine) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <strong style={{ color: 'var(--text)' }}>{mine.name}</strong>
      {mine.badges.tick && <VerifiedTick size={20} title={tickTitle(mine.badges.verification_type)} />}
      {mine.badges.top_rated && <span className="toprated-badge">★ Top rated</span>}
      {!mine.badges.tick && (
        <a href="#verification" className="verified-badge pending" style={{ textDecoration: 'none' }}>
          {mine.verified ? 'Checked' : mine.requested_at ? 'Under review' : 'Not verified'}
        </a>
      )}
    </div>
  )
}

export default MyBadges