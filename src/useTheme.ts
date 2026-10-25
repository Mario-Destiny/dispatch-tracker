import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'

function readMode(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
  } catch {
    // storage blocked: fall through to default
  }
  return 'light'
}

function systemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// mode is what the person picked (light, dark or auto). theme is what is actually showing.
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readMode)
  const [system, setSystem] = useState<'light' | 'dark'>(systemTheme)

  useEffect(() => {
    if (!window.matchMedia) return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystem(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const theme: 'light' | 'dark' = mode === 'auto' ? system : mode

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('theme', mode)
    } catch {
      // ignore
    }
  }, [theme, mode])

  function toggleTheme() {
    setMode(theme === 'light' ? 'dark' : 'light')
  }

  return { theme, mode, setMode, toggleTheme }
}
