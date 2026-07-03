// Generates origami.d.ts from the `typescript` fenced blocks in each component's CSS
// docblock. Run `bun run build-types`; pass --check to fail (non-zero exit)
// when the committed file is out of date.

import fs from 'node:fs'
import path from 'node:path'
import { type Entry, extractFileEntries, serializeMixins, serializeType } from './types'

const SRC = './src'
const OUT = './origami.d.ts'

const collectEntries = (): Entry[] => {
  const files = fs
    .readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.css'))
    .sort()
  return files.flatMap((f) => extractFileEntries(path.join(SRC, f)))
}

const wrapEntry = (e: Entry): string => {
  const inner = serializeType(e.rawType)
  const wrapped = inner ? `CustomElementProps<${inner}>` : 'CustomElementProps'
  return `      '${e.element}': ${wrapped}`
}

const render = (): string => {
  const entries = collectEntries().map(wrapEntry).join('\n')
  return `// GENERATED FILE — do not edit by hand.
// Element attribute types live in the \`typescript\` fenced blocks of each component's
// CSS docblock; run \`bun run build-types\` to regenerate.

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

${serializeMixins()}

// biome-ignore lint/complexity/noBannedTypes: {} is intentional here
type CustomElementProps<T = {}> = DetailedHTMLProps<HTMLAttributes<HTMLElement> & T, HTMLElement>

// via https://til.jakelazaroff.com/typescript/add-custom-element-to-jsx-intrinsic-elements/
// TODO: find a framework-agnostic way to register these
// TODO: button data attribute support here?
declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
${entries}
    }
  }
}
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
