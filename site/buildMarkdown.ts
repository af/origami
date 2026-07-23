import fs from 'node:fs'
import { marked } from 'marked'
import { extractFileEntries } from '../scripts/types'
import renderAttrsSection from './renderAttrs'

// Custom renderers for <code> elements, by language name
const renderer = {
  code({ text, lang }: { text: string; lang?: string }) {
    // `typescript` fences are the type source for build-types and the generated
    // Attributes section; they aren't rendered inline.
    if (lang === 'typescript') {
      return ''
    }
    if (lang === 'color') {
      return `
      <color-swatch style="--color: var(${text})">
      ${text}
      </color-swatch>
      `
    }
    if (lang === 'spacing') {
      return `
      <spacing-bar style="--width: var(${text})">
      ${text}
      </spacing-bar>
      `
    }
    if (lang === 'html' || lang === 'html-wide') {
      const props = lang === 'html-wide' ? 'direction="column"' : ''
      return `
      <side-by-side ${props}>
        ${marked.Renderer.prototype.code.call(this, { text })}
        <div>${text}</div>
      </side-by-side>
    `
    }

    return `<code>${text}</code>`
  },
}
marked.use({ renderer })

const commentDocRegex = /^\/\*\*(.+)?\*\*\//s

// Pull a leading `--- ... ---` YAML-ish block off the markdown. Only simple
// `key: value` lines are supported (all we need for page metadata).
const frontmatterRegex = /^---\n(.*?)\n---\n?/s
const parseFrontmatter = (md: string) => {
  const match = frontmatterRegex.exec(md)
  if (!match) return { attrs: {} as Record<string, string>, body: md }

  const attrs: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const entry = /^([\w-]+):\s*(.*)$/.exec(line.trim())
    if (entry) attrs[entry[1]] = entry[2].trim()
  }
  return { attrs, body: md.slice(match[0].length) }
}

const getDocPageFromPath = (filepath: string) => {
  const content = fs.readFileSync(`./src/${filepath}`, 'utf-8')

  let markdown: string | undefined
  let attrsSection = ''
  if (filepath.endsWith('.md')) {
    markdown = content.trim()
  } else {
    const commentMatch = commentDocRegex.exec(content)
    markdown = commentMatch?.[1].trim()
    attrsSection = renderAttrsSection(extractFileEntries(`./src/${filepath}`))
  }

  if (!markdown) return []

  // Frontmatter title/description render into the grid's header area; the rest
  // becomes the page body. `main` is `display: contents` (see site.css) so both
  // blocks land as direct grid children — no client-side JS needed.
  const { attrs, body } = parseFrontmatter(markdown)
  const header = attrs.title
    ? `<header><h1>${attrs.title}</h1>${attrs.description ? `<p>${attrs.description}</p>` : ''
    }</header>`
    : ''

  const fullMarkdown = `${header}<article>${marked(body) + attrsSection}</article>`
  const name = filepath.replace(/\.(css|md)$/, '')
  // Nav label: the page's own <h1> (css docs embed it in their comment; md docs
  // get it from frontmatter above). Falls back to the file's base name.
  const title = /<h1>(.*?)<\/h1>/s.exec(fullMarkdown)?.[1] ?? name.split('/').pop()!

  return [{ filepath, name, title, markdown: fullMarkdown }]
}

type DocPage = ReturnType<typeof getDocPageFromPath>[number]

// Sidebar groups, keyed by the top-level src/ directory. Order here is the
// display order; any dir not listed is appended with a title-cased fallback.
// Adding a component to an existing dir needs no changes here.
const NAV_GROUPS: Record<string, string> = {
  docs: 'Variables',
  layout: 'Layout',
  forms: 'Forms',
  popovers: 'Popovers',
  misc: 'Misc',
}

// Build the sidebar markup (grouped by src/ dir) and splice it into index.html
// between the nav:start / nav:end markers. Idempotent, so it's safe to run on
// every dev rebuild and in the production build.
const injectNav = (pages: DocPage[]) => {
  // Root-level pages (e.g. Index.md, the landing page) aren't sidebar entries
  const navPages = pages.filter((p) => p.name.includes('/'))
  const byDir = Map.groupBy(navPages, (p) => p.name.split('/')[0])
  const dirs = [...new Set([...Object.keys(NAV_GROUPS), ...byDir.keys()])].filter((d) => byDir.has(d))
  const titleCase = (s: string) => s[0].toUpperCase() + s.slice(1)

  const nav = dirs
    .map((dir) => {
      const links = byDir
        .get(dir)!
        .map((p) => `          <a href="#${p.name}">${p.title}</a>`)
        .join('\n')
      return `        <div>\n          <h2>${NAV_GROUPS[dir] ?? titleCase(dir)}</h2>\n${links}\n        </div>`
    })
    .join('\n\n')

  const path = './site/index.html'
  const html = fs.readFileSync(path, 'utf-8')
  const next = html.replace(
    /( *<!-- nav:start[^]*?-->\n)[^]*?( *<!-- nav:end -->)/,
    `$1${nav}\n$2`,
  )
  if (next !== html) fs.writeFileSync(path, next)
}

export const writeDocPages = () => {
  const docPages = fs
    .readdirSync('./src', { encoding: 'utf8', recursive: true })
    .filter((fname) => fname.endsWith('.css') || fname.endsWith('.md'))
    .flatMap(getDocPageFromPath)
    // Sort for deterministic output (and a stable, alphabetical sidebar order)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Write data as an ES module so site.js can import it and hot-accept updates
  fs.writeFileSync('./site/data.js', `export const DOCS = ${JSON.stringify(docPages, null, 2)}`)

  // Bake the sidebar nav straight into the served HTML (no client-side JS)
  injectNav(docPages)
}

// Run directly (e.g. `bun run build-docs`) to regenerate data.js once. The
// production HTML build relies on this so attribute tables land in the output.
if (import.meta.main) writeDocPages()

// also watch for changes and re-build docs on css changes in dev mode
// see https://bun.com/docs/guides/read-file/watch
//
// TODO: this is inefficient; should only build the changed file, not everything
if (process.env.NODE_ENV !== 'production') {
  fs.watch('./src', { recursive: true }, (_event, filename) => {
    if (filename?.endsWith('.css') || filename?.endsWith('.md')) writeDocPages()
  })
}
