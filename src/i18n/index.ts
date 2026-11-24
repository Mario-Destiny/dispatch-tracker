import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from './locales/en/common.json'
import enTrack from './locales/en/track.json'
import frCommon from './locales/fr/common.json'
import frTrack from './locales/fr/track.json'

// Languages the app is available in. Add a language here, then add its folder under ./locales.
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
] as const
export type LangCode = (typeof LANGUAGES)[number]['code']

const STORAGE_KEY = 'veritrack-lang'
const supported = LANGUAGES.map((l) => l.code as string)

function pick(code: string | null | undefined): LangCode | null {
  const base = (code || '').toLowerCase().split('-')[0]
  return supported.includes(base) ? (base as LangCode) : null
}

// A saved choice wins, then the browser's language list, then English.
// On the server (prerendering) there is no browser, so pages are built in English.
function startingLanguage(): LangCode {
  if (typeof window === 'undefined') return 'en'
  try {
    const saved = pick(window.localStorage.getItem(STORAGE_KEY))
    if (saved) return saved
  } catch {
    /* storage can be blocked; fall through */
  }
  for (const l of window.navigator.languages ?? [window.navigator.language]) {
    const hit = pick(l)
    if (hit) return hit
  }
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, track: enTrack },
    fr: { common: frCommon, track: frTrack },
  },
  lng: startingLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'track'],
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
})

function syncHtmlLang(code: string) {
  if (typeof document !== 'undefined') document.documentElement.lang = code
}
syncHtmlLang(i18n.language)

export function setLanguage(code: LangCode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* ignore */
  }
  void i18n.changeLanguage(code)
  syncHtmlLang(code)
}

// The language code to use for dates and numbers ('en' or 'fr').
export function currentLocale() {
  return pick(i18n.language) ?? 'en'
}

export default i18n
