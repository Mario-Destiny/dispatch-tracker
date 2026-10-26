import { Link } from 'react-router-dom'

type Props = {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
}

// Required "I agree to the Terms and Privacy Policy" checkbox for signup forms.
function TermsCheckbox({ id, checked, onChange }: Props) {
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
        I agree to the{' '}
        <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms</Link> and{' '}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
      </span>
    </label>
  )
}

export default TermsCheckbox
