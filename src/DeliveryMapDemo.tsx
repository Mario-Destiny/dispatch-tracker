import { useEffect, useRef } from 'react'

// Route follows the road grid below: start -> up -> right -> up -> right -> destination.
const ROUTE = 'M60 310 L60 230 L230 230 L230 120 L430 120 L430 70 L520 70'

// A stylised illustration (not real data): a rider moving to a pinned drop-off point.
function DeliveryMapDemo() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !window.matchMedia) return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (query.matches) {
      try {
        svg.pauseAnimations()
        svg.setCurrentTime(4)
      } catch {
        // older browsers: leave as is
      }
    }
  }, [])

  return (
    <figure className="demo-map" aria-label="Illustration of a delivery on the way to a pinned drop-off">
      <div className="demo-map-top">
        <span className="demo-live"><i /> On the way</span>
        <span className="demo-tag">Illustration</span>
      </div>

      <svg ref={svgRef} viewBox="0 0 600 360" role="img" aria-label="Animated map: a rider travels along the streets to a blinking drop-off pin">
        <rect className="dm-land" x="0" y="0" width="600" height="360" rx="14" />
        <path className="dm-water" d="M300 360 C 320 300, 270 270, 330 230 C 380 195, 360 160, 400 150 L 600 190 L 600 360 Z" />
        <g className="dm-block">
          <rect x="85" y="250" width="120" height="45" rx="6" />
          <rect x="85" y="140" width="120" height="70" rx="6" />
          <rect x="255" y="140" width="150" height="70" rx="6" />
          <rect x="255" y="20" width="150" height="75" rx="6" />
          <rect x="455" y="95" width="115" height="60" rx="6" />
          <rect x="455" y="20" width="40" height="30" rx="6" />
          <rect x="15" y="20" width="200" height="75" rx="6" />
          <rect x="15" y="140" width="30" height="70" rx="6" />
        </g>
        <g className="dm-road">
          <path d="M0 70 H600 M0 120 H600 M0 230 H600 M0 310 H600" />
          <path d="M60 0 V360 M230 0 V360 M430 0 V360 M520 0 V360" />
        </g>

        <path className="dm-route" d={ROUTE} />

        <g>
          <circle className="dm-ring" cx="520" cy="70" r="10" />
          <circle className="dm-ring dm-ring2" cx="520" cy="70" r="10" />
          <path className="dm-pin" d="M520 70 c-9-11-13-16-13-23 a13 13 0 1 1 26 0 c0 7-4 12-13 23z" />
          <circle cx="520" cy="47" r="5" fill="#fff" />
        </g>

        <g>
          <circle className="dm-rider-halo" r="16">
            <animateMotion dur="9s" repeatCount="indefinite" path={ROUTE} />
          </circle>
          <circle className="dm-rider" r="8">
            <animateMotion dur="9s" repeatCount="indefinite" path={ROUTE} />
          </circle>
        </g>

        <circle className="dm-start" cx="60" cy="310" r="5" />
      </svg>

      <figcaption>
        Every delivery has a pinned drop-off point and a status your customer can follow.
        This map is an illustration.
      </figcaption>
    </figure>
  )
}

export default DeliveryMapDemo
