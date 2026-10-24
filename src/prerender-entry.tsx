import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppRoutes } from './App'

// Used only at build time (see scripts/prerender.mjs) to save plain HTML for public pages.
export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  )
}
