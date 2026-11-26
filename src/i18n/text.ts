import i18n, { currentLocale } from './index'
import fr from './fr-text'

// Page text, keyed by the English wording. {name} placeholders are filled from `values`.
// Components that call this also call useTranslation(), so they redraw when the language changes.
export function tx(text: string, values?: Record<string, string | number>) {
  const out = (i18n.language || 'en').startsWith('fr') ? (fr[text] ?? text) : text
  return values ? out.replace(/\{(\w+)\}/g, (m, k) => String(values[k] ?? m)) : out
}

// A country list with names, and A to Z order, in the chosen language.
export function localCountries<T extends { iso: string; name: string }>(list: T[]): T[] {
  const locale = currentLocale()
  if (locale === 'en' || !('DisplayNames' in Intl)) return list
  const names = new Intl.DisplayNames([locale], { type: 'region' })
  return list
    .map((c) => ({ ...c, name: names.of(c.iso) ?? c.name }))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
}
