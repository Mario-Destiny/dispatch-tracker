// Saves real HTML for the public pages, so search engines and AI crawlers can read them
// without running JavaScript. Runs after `vite build`. If anything fails, the normal
// build output is left untouched and the build still succeeds.
import { createServer } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')

const PAGES = [
  {
    route: '/',
    title: 'Veritrack: Every delivery, verified and tracked',
    description:
      'Veritrack gives every delivery a status, a rider, and a tracking code your customer can check themselves. No app to download, no phone calls, no guessing.',
  },
  {
    route: '/home',
    title: 'Veritrack for vendors, riders and customers',
    description:
      'See how vendors create deliveries, riders update their status, and customers track with a code. Veritrack is built for small vendors and dispatch riders in Nigeria.',
  },
  {
    route: '/privacy',
    title: 'Privacy Policy | Veritrack',
    description: 'What personal information Veritrack collects, how it is used, and the choices you have.',
  },
  {
    route: '/terms',
    title: 'Terms of Service | Veritrack',
    description: 'The terms for using Veritrack as a vendor, rider, company or customer.',
  },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

async function main() {
  const templatePath = path.join(dist, 'index.html')
  if (!fs.existsSync(templatePath)) throw new Error('dist/index.html not found. Run vite build first.')
  const template = fs.readFileSync(templatePath, 'utf8')
  if (!template.includes('<div id="root"></div>')) throw new Error('Could not find the empty root element.')

  // Placeholders so the app code can load. Nothing here talks to Supabase while rendering.
  process.env.VITE_SUPABASE_URL ||= 'https://placeholder.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY ||= 'placeholder-key'

  // The app reads the saved theme while rendering. There is no browser here, so use a tiny stand-in.
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
  }

  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
  const results = []
  try {
    const { render } = await vite.ssrLoadModule('/src/prerender-entry.tsx')
    const { SITE_URL } = await vite.ssrLoadModule('/src/siteInfo.ts')

    for (const page of PAGES) {
      const html = render(page.route)
      if (!html || html.length < 500) throw new Error('Rendered page looks empty: ' + page.route)

      const url = SITE_URL + (page.route === '/' ? '/' : page.route)
      let out = template.replace('<div id="root"></div>', '<div id="root">' + html + '</div>')
      out = out
        .replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(page.title) + '</title>')
        .replace(/(<meta name="description" content=")[^"]*(")/, '$1' + esc(page.description) + '$2')
        .replace(/(<link rel="canonical" href=")[^"]*(")/, '$1' + url + '$2')
        .replace(/(<meta property="og:title" content=")[^"]*(")/, '$1' + esc(page.title) + '$2')
        .replace(/(<meta property="og:description" content=")[^"]*(")/, '$1' + esc(page.description) + '$2')
        .replace(/(<meta property="og:url" content=")[^"]*(")/, '$1' + url + '$2')
        .replace(/(<meta name="twitter:title" content=")[^"]*(")/, '$1' + esc(page.title) + '$2')
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, '$1' + esc(page.description) + '$2')
      results.push({ route: page.route, out })
    }
  } finally {
    await vite.close()
  }

  // Write everything only after every page rendered successfully.
  for (const { route, out } of results) {
    const file = route === '/' ? templatePath : path.join(dist, route, 'index.html')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, out)
    console.log('prerendered', route, '(' + Math.round(out.length / 1024) + ' KB)')
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.warn('Prerender skipped, normal build output kept:', err && err.message ? err.message : err)
    process.exit(0)
  }
)
