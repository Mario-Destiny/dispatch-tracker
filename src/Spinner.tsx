type SpinnerProps = {
  size?: 'sm'
}

function Spinner({ size }: SpinnerProps) {
  if (size === 'sm') {
    return <span className="spinner spinner-sm" aria-hidden="true" />
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 60 }}>
      <div className="spinner" />
    </div>
  )
}

export default Spinner