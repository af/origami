// Shared types tooling.
//
// Element attribute types are authored as `typescript` fenced blocks inside each
// component's CSS docblock, e.g.:
//
//   ```typescript
//   type Attributes = {
//     'badge-i': {
//       tone?: 'info' | 'neutral' | 'danger' | 'warn' | 'success'
//       radius?: 's' | 'm' | 'full' | 'none'
//     }
//   }
//   ```
//
// Two consumers read these via this module:
//   - scripts/build-types.ts  -> assembles origami.d.ts
//   - site/buildMarkdown.ts   -> renders attribute tables in the docs/pdf
//
// Fence bodies are raw TypeScript attribute fragments (no `CustomElementProps`
// wrapper). They may reference the shared mixins below; build-types wraps each
// entry and the docs renderer expands mixins inline.

import fs from 'node:fs'

export type Attr = {
  name: string
  optional: boolean
  type: string // raw TS type text, e.g. "'left' | 'right'"
  values?: string[] // populated when `type` is a pure string-literal union
}

export type Mixin = { extends?: string[]; attrs: Attr[] }

const lit = (...values: string[]): Pick<Attr, 'type' | 'values'> => ({
  values,
  type: values.map((v) => `'${v}'`).join(' | '),
})

// Shared attribute mixins, the single source for both the generated .d.ts
// preamble and the docs tables. Element fences reference these by name.
export const mixins: Record<string, Mixin> = {
  BlockAttrs: {
    attrs: [
      { name: 'gap', optional: true, ...lit('xs', 's', 'm', 'l') },
      { name: 'pad', optional: true, ...lit('none', 'xs', 's', 'm', 'l', 'xl') },
      { name: 'vpad', optional: true, ...lit('none', 'xs', 's', 'm', 'l', 'xl') },
    ],
  },
  StackAttrs: {
    extends: ['BlockAttrs'],
    attrs: [
      { name: 'align', optional: true, ...lit('start', 'end', 'center', 'baseline', 'stretch') },
      {
        name: 'justify',
        optional: true,
        ...lit('center', 'start', 'space-between', 'space-around', 'space-evenly', 'flex-end'),
      },
      { name: 'wrap', optional: true, ...lit('wrap', 'nowrap', 'wrap-reverse') },
    ],
  },
}

// Split `s` on any of `seps`, but only at the top nesting level (outside of
// brackets and string literals).
const splitTopLevel = (s: string, seps: string[]): string[] => {
  const out: string[] = []
  let depth = 0
  let buf = ''
  let inStr: string | null = null
  for (const c of s) {
    if (inStr) {
      buf += c
      if (c === inStr) inStr = null
      continue
    }
    if (c === "'" || c === '"') {
      inStr = c
      buf += c
      continue
    }
    if ('{<(['.includes(c)) depth++
    else if ('}>)]'.includes(c)) depth--
    if (depth === 0 && seps.includes(c)) {
      out.push(buf)
      buf = ''
      continue
    }
    buf += c
  }
  if (buf.trim()) out.push(buf)
  return out
}

const stringUnionValues = (type: string): string[] | undefined => {
  const tokens = splitTopLevel(type, ['|'])
    .map((t) => t.trim())
    .filter(Boolean)
  if (tokens.length > 0 && tokens.every((t) => /^'[^']*'$/.test(t))) {
    return tokens.map((t) => t.slice(1, -1))
  }
  return undefined
}

const parseObject = (text: string): Attr[] => {
  const inner = text.trim().replace(/^\{/, '').replace(/\}$/, '')
  return splitTopLevel(inner, ['\n', ';', ','])
    .map((m) => m.trim())
    .filter(Boolean)
    .map((member) => {
      const mm = /^([A-Za-z_][\w-]*)(\?)?\s*:\s*([\s\S]+)$/.exec(member)
      if (!mm) throw new Error(`Cannot parse attribute member: ${member}`)
      const [, name, opt, rawType] = mm
      const type = rawType.trim()
      return { name, optional: Boolean(opt), type, values: stringUnionValues(type) }
    })
}

// Parse a raw attribute fragment into referenced mixins plus inline attrs.
export const parseType = (raw: string): { mixins: string[]; attrs: Attr[] } => {
  const mixinNames: string[] = []
  const attrs: Attr[] = []
  for (const part of splitTopLevel(raw, ['&'])) {
    const p = part.trim()
    if (!p) continue
    if (p.startsWith('{')) attrs.push(...parseObject(p))
    else mixinNames.push(p)
  }
  return { mixins: mixinNames, attrs }
}

const resolveMixin = (name: string): Attr[] => {
  const mx = mixins[name]
  if (!mx) throw new Error(`Unknown mixin: ${name}`)
  return [...(mx.extends ?? []).flatMap(resolveMixin), ...mx.attrs]
}

// Fully-expanded attribute list for an element (own attrs first, then inherited
// mixin attrs), used to render the docs table.
export const elementAttrs = (raw: string): Attr[] => {
  const { mixins: refs, attrs } = parseType(raw)
  const seen = new Set<string>()
  const out: Attr[] = []
  for (const a of [...attrs, ...refs.flatMap(resolveMixin)]) {
    if (seen.has(a.name)) continue
    seen.add(a.name)
    out.push(a)
  }
  return out
}

// rawType is the element's attribute type as authored in the `type Attributes`
// map (e.g. `BlockAttrs & { … }`, `{}` for no attributes), i.e. what the docs
// table and serializers consume; build-types wraps it in `CustomElementProps`.
export type Entry = { element: string; rawType: string }

// Body of the balanced `{ ... }` starting at the brace index `open`.
const braceBody = (s: string, open: number): { body: string; end: number } => {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0) return { body: s.slice(open + 1, i), end: i }
    }
  }
  throw new Error('Unbalanced braces in typescript fence')
}

const parseMembers = (body: string): Entry[] => {
  const keyRe = /'([a-z][a-z0-9-]*-i)'\s*:/g
  const keys: { element: string; end: number; start: number }[] = []
  let m: RegExpExecArray | null = keyRe.exec(body)
  while (m) {
    keys.push({ element: m[1], start: m.index, end: keyRe.lastIndex })
    m = keyRe.exec(body)
  }
  return keys.map((k, i) => {
    const next = keys[i + 1]?.start ?? body.length
    const rawType = body.slice(k.end, next).trim().replace(/[,;]$/, '').trim()
    return { element: k.element, rawType }
  })
}

// Split a `typescript` fence (one or more `type Attributes = { … }` maps) into
// per-element entries.
export const parseEntries = (fenceBody: string): Entry[] => {
  const typeRe = /type\s+Attributes\s*=\s*\{/g
  const entries: Entry[] = []
  let m: RegExpExecArray | null = typeRe.exec(fenceBody)
  while (m) {
    const { body, end } = braceBody(fenceBody, fenceBody.indexOf('{', m.index))
    entries.push(...parseMembers(body))
    typeRe.lastIndex = end
    m = typeRe.exec(fenceBody)
  }
  return entries
}

const docblockRe = /\/\*\*([\s\S]*?)\*\*\//
const fenceRe = /```typescript\s*\n([\s\S]*?)```/g

// Extract all element entries from a CSS file's leading docblock.
export const extractFileEntries = (cssPath: string): Entry[] => {
  const doc = docblockRe.exec(fs.readFileSync(cssPath, 'utf-8'))?.[1] ?? ''
  const entries: Entry[] = []
  let m: RegExpExecArray | null = fenceRe.exec(doc)
  while (m) {
    entries.push(...parseEntries(m[1]))
    m = fenceRe.exec(doc)
  }
  return entries
}

// Serialize the shared mixins to their `.d.ts` declarations.
export const serializeMixins = (): string =>
  Object.entries(mixins)
    .map(([name, mx]) => {
      const ext = mx.extends?.length ? `${mx.extends.join(' & ')} & ` : ''
      const body = mx.attrs.map((a) => `  ${a.name}${a.optional ? '?' : ''}: ${a.type}`).join('\n')
      return `type ${name} = ${ext}{\n${body}\n}`
    })
    .join('\n\n')

// Re-serialize a raw fragment to a single-line type (biome reflows it later).
export const serializeType = (raw: string): string => {
  const { mixins: refs, attrs } = parseType(raw)
  const obj = attrs.length
    ? `{ ${attrs.map((a) => `${a.name}${a.optional ? '?' : ''}: ${a.type}`).join('; ')} }`
    : ''
  return [...refs, obj].filter(Boolean).join(' & ')
}
