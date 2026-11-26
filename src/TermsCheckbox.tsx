import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { tx } from './i18n/text'

type Props = {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
}

// Required "I agree to the Terms and Privacy Policy" checkbox for signup forms.
function TermsCheckbox({ id, checked, onChange }: Props) {
  useTranslation() // redraw when the language changes
  return (
    <label className="terms-check" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
      />
      <span>
        {tx('I agree to the')}{' '}
        <Link to="/terms" target="_blank" rel="noopener noreferrer">{tx("Terms")}</Link> {tx('and')}{' '}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer">{tx("Privacy Policy")}</Link>
      </span>
    </label>
  )
}

export default TermsCheckbox
