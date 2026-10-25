const sampleGoods = [
  { emoji: '👟', name: 'Sneakers & Footwear', vendor: 'Footwear seller' },
  { emoji: '🍲', name: 'Homemade Meals', vendor: 'Food vendor' },
  { emoji: '📱', name: 'Phone Accessories', vendor: 'Gadget shop' },
  { emoji: '👗', name: 'Ankara Fashion', vendor: 'Fashion boutique' },
]

function VendorShowcase() {
  return (
    <div style={{ padding: '60px 20px', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--text)' }}>Deliveries for every kind of vendor</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 32 }}>
        Examples of what vendors can send out and track. These are illustrations, not real shops.
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
          </div>
        ))}
      </div>
    </div>
  )
}

export default VendorShowcase