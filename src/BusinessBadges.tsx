import VerifiedTick from './VerifiedTick'
import { tickTitle } from './businessUtils'

type BusinessBadgesProps = {
  tick: boolean
  topRated: boolean
  verificationType?: string | null
}

function BusinessBadges({ tick, topRated, verificationType }: BusinessBadgesProps) {
  if (!tick && !topRated) return null

  return (
    <span className="badge-row">
      {tick && (
        <span className="verified-badge blue badge-with-icon">
          <VerifiedTick size={14} title={tickTitle(verificationType)} /> {tickTitle(verificationType)}
        </span>
      )}
      {topRated && <span className="toprated-badge">★ Top rated</span>}
    </span>
  )
}

export default BusinessBadges