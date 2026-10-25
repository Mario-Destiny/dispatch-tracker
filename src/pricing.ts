// One place for plan prices so the landing page and dashboards always agree.
export const PRICING = {
  vendor: { name: 'Verified Vendor', price: '₦3,000', per: 'per month' },
  company: { name: 'Verified Company', price: '₦10,000', per: 'per month' },
  foundingMonths: 3,
}

// Paystack public key. It is safe to be visible in the app. To go live, set VITE_PAYSTACK_PUBLIC_KEY
// in Vercel to your pk_live_ key (and put the matching sk_live_ key in Supabase secrets).
export const PAYSTACK_PUBLIC_KEY: string =
  (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined) || 'pk_test_a56d6154524925eacb36a70264dc5b477e432293'

export const PLAN_MONTHS = [1, 3, 6] as const

export function planPriceNaira(kind: 'vendor' | 'company', months: number) {
  const monthly = kind === 'company' ? 10000 : 3000
  return monthly * months
}
