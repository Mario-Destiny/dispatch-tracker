import { Country } from 'country-state-city'
import { CURRENCY } from './siteInfo'

// The currency a person's delivery fees are in: the currency of their country. Falls back to the
// default currency when the country is not known. Fees are saved as plain numbers (no currency is
// stored with each delivery), so a vendor's fees are read in the currency of the vendor's country.
export function currencyOfCountry(iso: string | null | undefined): string {
  const code = iso ? Country.getCountryByCode(iso)?.currency : undefined
  return code && /^[A-Z]{3}$/.test(code) ? code : CURRENCY
}

// 1500 + 'GHS' -> 'GH₵1,500', 1500 + 'NGN' -> '₦1,500' (the symbol follows the reader's language).
export function formatMoney(amount: number, currency: string = CURRENCY) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return currency + ' ' + amount.toLocaleString()
  }
}
