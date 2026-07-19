// Generates origami.d.ts from the `typescript` fenced blocks in each component's CSS
// docblock. Run `bun run build-types`; pass --check to fail (non-zero exit)
// when the committed file is out of date.

import fs from 'node:fs'
import path from 'node:path'
import { type Entry, elementAttrs, extractFileEntries, keyName, serializeMixins, serializeType } from './types'

const SRC = './src'
const OUT = './origami.d.ts'

// Native HTML elements (keys without the `-i` custom-element suffix) augment
// React's existing attribute interface via interface merging, rather than being
// added to JSX.IntrinsicElements (which would clobber React's built-in typing).
const NATIVE_INTERFACES: Record<string, string> = {
  button: 'ButtonHTMLAttributes<T>',
}

const collectEntries = (): Entry[] => {
  const files = fs
    .readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.css'))
    .sort()
  return files.flatMap((f) => extractFileEntries(path.join(SRC, f)))
}

// Single-line JSDoc so LSP hover shows the component summary. `indent` aligns
// the comment with the declaration it documents; returns '' when undocumented.
const jsdoc = (description: string | undefined, indent: string): string =>
  description ? `${indent}/** ${description.replace(/\*\//g, '*\\/')} */\n` : ''

const wrapEntry = (e: Entry): string => {
  const inner = serializeType(e.rawType)
  const wrapped = inner ? `CustomElementProps<${inner}>` : 'CustomElementProps'
  return `${jsdoc(e.description, '      ')}      '${e.element}': ${wrapped}`
}

const nativeAugmentation = (e: Entry): string => {
  const iface = NATIVE_INTERFACES[e.element]
  if (!iface) throw new Error(`No React interface mapping for native element '${e.element}'`)
  const body = elementAttrs(e.rawType)
    .map((a) => `    ${keyName(a.name)}${a.optional ? '?' : ''}: ${a.type}`)
    .join('\n')
  return `declare module 'react' {\n${jsdoc(e.description, '  ')}  interface ${iface} {\n${body}\n  }\n}`
}

const render = (): string => {
  const all = collectEntries()
  const entries = all.filter((e) => e.element.endsWith('-i')).map(wrapEntry).join('\n')
  const native = all
    .filter((e) => !e.element.endsWith('-i'))
    .map(nativeAugmentation)
    .join('\n\n')
  return `// GENERATED FILE — do not edit by hand.
// Element attribute types live in the \`typescript\` fenced blocks of each component's
// CSS docblock; run \`bun run build-types\` to regenerate.

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

${serializeMixins()}

// biome-ignore lint/complexity/noBannedTypes: {} is intentional here
type CustomElementProps<T = {}> = DetailedHTMLProps<HTMLAttributes<HTMLElement> & T, HTMLElement>

// via https://til.jakelazaroff.com/typescript/add-custom-element-to-jsx-intrinsic-elements/
// TODO: find a framework-agnostic way to register these
declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
${entries}
    }
  }
}

${native}
`
}

const output = render()
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf-8') : ''
  if (current !== output) {
    console.error('origami.d.ts is out of date. Run `bun run build-types`.')
    process.exit(1)
  }
  console.log('origami.d.ts is up to date.')
} else {
  fs.writeFileSync(OUT, output)
  console.log(`Wrote ${OUT}`)
}
