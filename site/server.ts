// writeDocPages() must run before the html import; writes a data.js script tag used by index.html
import { writeDocPages } from './buildMarkdown'
writeDocPages()

// This magic import will transpile the FE assets, bundle it, and serve it
// See https://bun.sh/docs/bundler/fullstack
import app from './index.html'

const PORT = 3333
Bun.serve({
  port: PORT,
  development: {
    hmr: true,
    console: true,
  },
  routes: {
    '/*': app,
  },
})

console.log(`Server running at http://localhost:${PORT}`)
