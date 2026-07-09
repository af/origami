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

  return [
    {
      filepath,
      name: filepath.replace(/\.(css|md)$/, ''),
      markdown: `${header}<article>${marked(body) + attrsSection}</article>`,
    },
  ]
}

export const writeDocPages = () => {
  const docPages = fs
    .readdirSync('./src', { encoding: 'utf8', recursive: true })
    .filter((fname) => fname.endsWith('.css') || fname.endsWith('.md'))
    .flatMap(getDocPageFromPath)

  // Write data as an ES module so site.js can import it and hot-accept updates
  fs.writeFileSync('./site/data.js', `export const DOCS = ${JSON.stringify(docPages, null, 2)}`)
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
