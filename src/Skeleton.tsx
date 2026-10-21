import type { CSSProperties } from 'react'

type SkeletonProps = {
  width?: number | string
  height?: number | string
  radius?: number | string
  style?: CSSProperties
}

function Skeleton({ width = '100%', height = 16, radius = 6, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

export default Skeleton