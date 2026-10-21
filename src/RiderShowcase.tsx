const sampleRiders = [
  { emoji: '🏍️', name: 'Emeka O.', deliveries: 142, rating: '4.9' },
  { emoji: '🚴', name: 'Fatima B.', deliveries: 98, rating: '4.8' },
  { emoji: '🏍️', name: 'Tunde A.', deliveries: 210, rating: '5.0' },
]

function RiderShowcase() {
  return (
    <div style={{ padding: '60px 20px', maxWidth: 1000, margin: '0 auto', backgroundColor: 'var(--bg-secondary)' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--text)' }}>Riders Who Get It There</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 32 }}>
        Real people, tracked deliveries, real accountability
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 20,
      }}>
        {sampleRiders.map((r) => (
          <div key={r.name} style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
            backgroundColor: 'var(--bg)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{r.emoji}</div>
            <strong style={{ color: 'var(--text)' }}>{r.name}</strong>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0' }}>
              {r.deliveries} deliveries completed
            </p>
            <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>⭐ {r.rating}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RiderShowcase