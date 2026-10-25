// Supabase Edge Function: paystack-webhook
// Paystack calls this after a payment. We (1) check the signature, (2) ask Paystack directly
// whether the money really arrived, then (3) extend the plan in the database.
//
// Needs the secret PAYSTACK_SECRET_KEY. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
// In the dashboard, turn OFF "Verify JWT" for this function (Paystack does not send a login token).

type Deps = {
  secret: string
  verifyWithPaystack: (reference: string) => Promise<{ status: string; amount: number; currency: string; reference: string } | null>
  confirm: (reference: string, amount: number, currency: string) => Promise<{ ok: boolean; reason?: string }>
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sign(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
}

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const raw = await req.text()
  const given = req.headers.get('x-paystack-signature') || ''
  const expected = await sign(deps.secret, raw)
  if (!given || !sameText(given.toLowerCase(), expected)) return new Response('Bad signature', { status: 401 })

  let event: { event?: string; data?: { reference?: string } }
  try {
    event = JSON.parse(raw)
  } catch {
    return new Response('Bad body', { status: 400 })
  }
  // Other events are fine: acknowledge so Paystack stops retrying.
  if (event.event !== 'charge.success') return new Response('Ignored', { status: 200 })

  const reference = event.data?.reference
  if (!reference) return new Response('No reference', { status: 400 })

  // Never trust the webhook body for the amount: ask Paystack.
  const tx = await deps.verifyWithPaystack(reference)
  if (!tx || tx.status !== 'success' || tx.reference !== reference) return new Response('Not a successful payment', { status: 200 })

  const result = await deps.confirm(reference, tx.amount, tx.currency)
  // Ask Paystack to retry later only if our own database call failed.
  if (!result.ok && result.reason !== 'amount mismatch' && result.reason !== 'unknown reference') return new Response('Try again', { status: 500 })
  return new Response('OK', { status: 200 })
}

// ---- Real wiring (only runs inside Supabase) ----
declare const Deno: { env: { get(name: string): string | undefined }; serve(fn: (req: Request) => Promise<Response>): void } | undefined

if (typeof Deno !== 'undefined') {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY') || ''
  const url = Deno.env.get('SUPABASE_URL') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  Deno.serve(async (req) => {
    if (!secret || !url || !serviceKey) return new Response('Not configured', { status: 500 })
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const db = createClient(url, serviceKey)
    return handle(req, {
      secret,
      verifyWithPaystack: async (reference) => {
        const res = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
          headers: { Authorization: 'Bearer ' + secret },
        })
        if (!res.ok) return null
        const json = await res.json()
        return json?.data ?? null
      },
      confirm: async (reference, amount, currency) => {
        const { data, error } = await db.rpc('confirm_payment', { p_reference: reference, p_amount_kobo: amount, p_currency: currency })
        if (error) return { ok: false, reason: error.message }
        return data as { ok: boolean; reason?: string }
      },
    })
  })
}
