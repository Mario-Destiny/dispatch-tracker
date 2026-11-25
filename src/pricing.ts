// One place for plan prices so the landing page and dashboards always agree.

// USD pricing and referrals stay OFF until VITE_USD_PRICING=on is set in Vercel. Switch it on only
// after supabase/usd-referrals.sql has been run and Paystack can take dollars.
export const USD_PRICING = (import.meta.env.VITE_USD_PRICING as string | undefined) === 'on'

export const PRICING = {
  vendor: { name: 'Verified Vendor', price: USD_PRICING ? '$5' : '₦3,000', yearly: '$50', per: 'per month' },
  company: { name: 'Verified Company', price: USD_PRICING ? '$20' : '₦10,000', yearly: '$200', per: 'per month' },
  foundingMonths: 3,
}

export const FREE_PRICE = USD_PRICING ? '$0' : '₦0'

// Paystack public key. It is safe to be visible in the app. To go live, set VITE_PAYSTACK_PUBLIC_KEY
// in Vercel to your pk_live_ key (and put the matching sk_live_ key in Supabase secrets).
export const PAYSTACK_PUBLIC_KEY: string =
  (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined) || 'pk_test_a56d6154524925eacb36a70264dc5b477e432293'

export const PLAN_MONTHS = [1, 3, 6] as const

export function planPriceNaira(kind: 'vendor' | 'company', months: number) {
  const monthly = kind === 'company' ? 10000 : 3000
  return monthly * months
}

export type Period = 'monthly' | 'yearly'

// Shown on the pay button. The database decides the real charge (amounts here are in cents).
export function planPriceCents(kind: 'vendor' | 'company', period: Period, discount: boolean) {
  const monthly = kind === 'company' ? 2000 : 500
  if (period === 'yearly') return monthly * 10
  return discount ? (monthly * 80) / 100 : monthly
}

export function usd(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })
}
