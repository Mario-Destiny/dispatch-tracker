import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage } from './index'
import type { LangCode } from './index'

// A small language picker. It shows each language in its own name, so people can find theirs.
function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n, t } = useTranslation()
  const current = (i18n.language || 'en').split('-')[0]
  return (
    <select
      className={'lang-switch ' + className}
      value={LANGUAGES.some((l) => l.code === current) ? current : 'en'}
      onChange={(e) => setLanguage(e.target.value as LangCode)}
      aria-label={t('language.label')}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>{l.name}</option>
      ))}
    </select>
  )
}

export default LanguageSwitcher
