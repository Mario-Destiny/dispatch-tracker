const sampleGoods = [
  { emoji: '👟', name: 'Sneakers & Footwear', vendor: 'Chidi\'s Kicks', price: '₦8,000 – ₦25,000' },
  { emoji: '🍲', name: 'Homemade Meals', vendor: 'Mama Ngozi\'s Kitchen', price: '₦1,500 – ₦4,000' },
  { emoji: '📱', name: 'Phone Accessories', vendor: 'TechHub Lagos', price: '₦2,000 – ₦15,000' },
  { emoji: '👗', name: 'Ankara Fashion', vendor: 'Amara Styles', price: '₦5,000 – ₦20,000' },
]

function VendorShowcase() {
  return (
    <div style={{ padding: '60px 20px', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--text)' }}>Goods From Real Vendors</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 32 }}>
        A sample of what vendors on the platform can list and have delivered
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
      }}>
        {sampleGoods.map((item) => (
          <div key={item.name} style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{item.emoji}</div>
            <strong style={{ color: 'var(--text)' }}>{item.name}</strong>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0' }}>{item.vendor}</p>
            <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VendorShowcase