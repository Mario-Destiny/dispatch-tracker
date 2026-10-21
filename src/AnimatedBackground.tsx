import { useEffect, useRef } from 'react'
import { useTheme } from './useTheme'

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colorRef = useRef('rgba(140, 140, 150, 0.5)')
  const { theme } = useTheme()

  // Keep the color ref in sync with the current theme, without restarting the animation
  useEffect(() => {
    colorRef.current = theme === 'light'
      ? 'rgba(37, 99, 235, 0.5)'   // blue, light mode
      : 'rgba(150, 150, 160, 0.5)' // ash gray, dark mode
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const PARTICLE_COUNT = 60

    type Particle = { x: number; y: number; vx: number; vy: number; r: number }

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,   // faster drift
      vy: (Math.random() - 0.5) * 0.7,
      r: Math.random() * 1.8 + 1.8,      // slightly bigger dots
    }))

    let animationId: number

    function draw() {
      ctx!.clearRect(0, 0, width, height)
      ctx!.fillStyle = colorRef.current

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    function handleResize() {
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width
      canvas!.height = height
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

export default AnimatedBackground