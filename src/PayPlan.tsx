import { useState } from 'react'
import { supabase } from './supabaseClient'
import Spinner from './Spinner'
import { showToast } from './toast'
import { PAYSTACK_PUBLIC_KEY, PLAN_MONTHS, planPriceNaira } from './pricing'

type PaystackHandler = { openIframe: () => void }
type PaystackPop = {
  setup: (o: {
    key: string
    email: string
    amount: number
    currency: string
    ref: string
    callback: () => void
    onClose: () => void
  }) => PaystackHandler
}

declare global {
  interface Window {
    PaystackPop?: PaystackPop
  }
}

function loadPaystack(): Promise<PaystackPop> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve(window.PaystackPop)
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    s.async = true
    s.onload = () => (window.PaystackPop ? resolve(window.PaystackPop) : reject(new Error('Paystack did not load')))
    s.onerror = () => reject(new Error('Could not reach Paystack. Check your internet and try again.'))
    document.head.appendChild(s)
  })
}

type Created = { reference: string; amount_kobo: number; email: string }

// Pay for 1, 3 or 6 months of a Verified plan. The price is decided by the database, and the plan
// is only switched on after Paystack's server tells our webhook the money arrived.
function PayPlan({ kind, onPaid }: { kind: 'vendor' | 'company'; onPaid: () => void }) {
  const [months, setMonths] = useState<number>(1)
  const [busy, setBusy] = useState(false)
  const [waiting, setWaiting] = useState(false)

  async function waitForCredit(reference: string) {
    setWaiting(true)
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 2500))
      const { data } = await supabase.from('payments').select('status').eq('reference', reference).maybeSingle()
      if (data?.status === 'paid') {
        setWaiting(false)
        showToast('Payment received. Thank you!', 'success')
        onPaid()
        return
      }
      if (data?.status === 'failed') break
    }
    setWaiting(false)
    showToast('We have not confirmed your payment yet. If money left your account it will show up shortly. Contact us if it does not.', 'error')
    onPaid()
  }

  async function pay() {
    setBusy(true)
    const { data, error } = await supabase.rpc('create_payment', { p_months: months })
    if (error || !data) {
      showToast(error?.message || 'Could not start the payment.', 'error')
      setBusy(false)
      return
    }
    const info = data as Created
    if (!info.email) {
      showToast('Your account has no email address, so we cannot start a payment.', 'error')
      setBusy(false)
      return
    }
    try {
      const Pop = await loadPaystack()
      const handler = Pop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: info.email,
        amount: info.amount_kobo,
        currency: 'NGN',
        ref: info.reference,
        callback: () => {
          setBusy(false)
          void waitForCredit(info.reference)
        },
        onClose: () => setBusy(false),
      })
      handler.openIframe()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not open Paystack.', 'error')
      setBusy(false)
    }
  }

  const naira = planPriceNaira(kind, months)
  return (
    <div className="pay-plan">
      <div className="theme-choice" role="radiogroup" aria-label="Plan length" style={{ marginBottom: 10 }}>
        {PLAN_MONTHS.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={months === m}
            className={'theme-option' + (months === m ? ' on' : '')}
            onClick={() => setMonths(m)}
            disabled={busy || waiting}
          >
            {m} {m === 1 ? 'month' : 'months'}
          </button>
        ))}
      </div>
      <button type="button" className="btn-primary btn-sm" onClick={pay} disabled={busy || waiting}>
        {waiting ? <><Spinner size="sm" /> Confirming payment...</> : busy ? <><Spinner size="sm" /> Opening...</> : 'Pay ₦' + naira.toLocaleString('en-NG') + ' with Paystack'}
      </button>
      <p className="rider-hint" style={{ marginTop: 8 }}>
        Secure payment by Paystack. Your blue tick shows once your details have been checked and the payment is confirmed.
      </p>
    </div>
  )
}

export default PayPlan
