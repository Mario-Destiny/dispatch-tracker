export function firstName(fullName: string | null | undefined) {
  if (!fullName) return ''
  const first = fullName.trim().split(/\s+/)[0] || ''
  return first.charAt(0).toUpperCase() + first.slice(1)
}

export function greetingWord() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}