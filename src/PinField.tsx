import { useState } from 'react'
import { parseMapsInput, type Pin } from './maps'
import { showToast } from './toast'

type PinFieldProps = {
  label: string
  hint?: string
  value: Pin | null
  onChange: (pin: Pin | null) => void
}

function PinField({ label, hint, value, onChange }: PinFieldProps) {
  const [text, setText] = useState('')
  const [locating, setLocating] = useState(false)

  function fillCurrentLocation() {
    if (!navigator.geolocation) {
      showToast('This browser cannot share location.', 'error')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setText('')
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude, url: null })
      },
      () => {
        setLocating(false)
        showToast('Could not get your location. Allow location access and try again.', 'error')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function applyText(v: string) {
    setText(v)
    onChange(v.trim() ? parseMapsInput(v) : null)
  }

  function clear() {
    setText('')
    onChange(null)
  }

  const invalid = text.trim() !== '' && value === null

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {hint && <span className="rider-hint" style={{ margin: 0 }}>{hint}</span>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="rider-btn" onClick={fillCurrentLocation} disabled={locating}>
          {locating ? 'Finding you...' : 'Use my current location'}
        </button>
        {value && (
          <button type="button" className="rider-btn" onClick={clear}>Clear pin</button>
        )}
      </div>

      <input
        className="field-input"
        placeholder="Or paste a Google Maps link, or coordinates like 6.5244, 3.3792"
        value={text}
        onChange={(e) => applyText(e.target.value)}
      />

      {value && (
        <span className="pin-ok">
          ✓ Pin saved
          {value.lat !== null && value.lng !== null
            ? ' (' + value.lat.toFixed(5) + ', ' + value.lng.toFixed(5) + ')'
            : ' (map link)'}
        </span>
      )}
      {invalid && <span className="pin-bad">That does not look like a Google Maps link or coordinates.</span>}
    </div>
  )
}

export default PinField