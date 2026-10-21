const testimonials = [
  { quote: 'I used to spend half my day on the phone asking riders where my customers\' orders were. Now I just check the app.', name: 'Ngozi A.', role: 'Vendor, Lagos' },
  { quote: 'My customers stopped calling to ask "where is my package" once I started sharing the tracking code. Big relief.', name: 'Chidi O.', role: 'Vendor, Ibadan' },
  { quote: 'As a rider, having deliveries assigned to me clearly means less confusion and less back-and-forth calls.', name: 'Tunde A.', role: 'Rider' },
]

function Testimonials() {
  return (
    <div style={{ padding: '60px 20px', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--text)' }}>What People Are Saying</h2>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 32 }}>
        (Illustrative feedback based on the problem this platform solves — early users coming soon)
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
      }}>
        {testimonials.map((t) => (
          <div key={t.name} style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            backgroundColor: 'var(--bg-secondary)',
          }}>
            <p style={{ color: 'var(--text)', fontStyle: 'italic', marginBottom: 12 }}>"{t.quote}"</p>
            <strong style={{ color: 'var(--text)', fontSize: 14 }}>{t.name}</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.role}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Testimonials