import { describe, expect, test } from 'bun:test'
import {
  elementAttrs,
  extractFileEntries,
  mixins,
  parseEntries,
  parseType,
  serializeMixins,
  serializeType,
} from '../scripts/types'

describe('parseType', () => {
  test('parses an inline object with string-literal unions', () => {
    const { mixins: refs, attrs } = parseType("{ align?: 'left' | 'right' }")
    expect(refs).toEqual([])
    expect(attrs).toEqual([
      { name: 'align', optional: true, type: "'left' | 'right'", values: ['left', 'right'] },
    ])
  })

  test('marks non-optional members and non-string-union types', () => {
    const { attrs } = parseType('{ count: number }')
    expect(attrs).toEqual([{ name: 'count', optional: false, type: 'number', values: undefined }])
  })

  test('separates referenced mixins from inline attrs', () => {
    const { mixins: refs, attrs } = parseType("BlockAttrs & { variant?: 'narrow' }")
    expect(refs).toEqual(['BlockAttrs'])
    expect(attrs.map((a) => a.name)).toEqual(['variant'])
  })

  test('handles a bare mixin reference', () => {
    expect(parseType('StackAttrs')).toEqual({ mixins: ['StackAttrs'], attrs: [] })
  })

  test('handles the empty object', () => {
    expect(parseType('{}')).toEqual({ mixins: [], attrs: [] })
  })

  test('does not split unions nested inside members', () => {
    const { attrs } = parseType("{ a?: 'x' | 'y'\n b?: 'z' }")
    expect(attrs.map((a) => a.name)).toEqual(['a', 'b'])
    expect(attrs[0].values).toEqual(['x', 'y'])
  })
})

describe('elementAttrs', () => {
  test('expands a mixin recursively, inherited (BlockAttrs) attrs first', () => {
    const names = elementAttrs('StackAttrs').map((a) => a.name)
    expect(names).toEqual(['gap', 'pad', 'vpad', 'align', 'justify', 'wrap'])
  })

  test('lists own attrs before inherited mixin attrs', () => {
    const names = elementAttrs("BlockAttrs & { variant?: 'narrow' }").map((a) => a.name)
    expect(names).toEqual(['variant', 'gap', 'pad', 'vpad'])
  })

  test('dedupes by name, keeping the element-specific attr', () => {
    const attrs = elementAttrs("BlockAttrs & { gap?: 'only' }")
    expect(attrs.filter((a) => a.name === 'gap')).toHaveLength(1)
    expect(attrs.find((a) => a.name === 'gap')?.values).toEqual(['only'])
  })

  test('returns nothing for an attribute-less element', () => {
    expect(elementAttrs('{}')).toEqual([])
    expect(elementAttrs('')).toEqual([])
  })
})

describe('parseEntries', () => {
  test('extracts each member of a type Attributes map', () => {
    const entries = parseEntries(`type Attributes = {
      'vstack-i': StackAttrs
      'hstack-i': StackAttrs & { breakpoint?: 's' | 'm' }
    }`)
    expect(entries).toEqual([
      { element: 'vstack-i', rawType: 'StackAttrs' },
      { element: 'hstack-i', rawType: "StackAttrs & { breakpoint?: 's' | 'm' }" },
    ])
  })

  test('keeps an empty object as the raw type', () => {
    expect(parseEntries(`type Attributes = { 'switch-i': {} }`)).toEqual([
      { element: 'switch-i', rawType: '{}' },
    ])
  })

  test('preserves multi-line nested object types', () => {
    const [entry] = parseEntries(`type Attributes = {
      'badge-i': {
        tone?: 'info' | 'neutral'
        radius?: 's' | 'full'
      }
    }`)
    expect(entry.element).toBe('badge-i')
    expect(elementAttrs(entry.rawType).map((a) => a.name)).toEqual(['tone', 'radius'])
  })

  test('handles multiple type Attributes blocks', () => {
    const entries = parseEntries(`type Attributes = { 'a-i': {} }
      type Attributes = { 'b-i': {} }`)
    expect(entries.map((e) => e.element)).toEqual(['a-i', 'b-i'])
  })

  test('returns nothing when no type Attributes block is present', () => {
    expect(parseEntries('const x = 1')).toEqual([])
  })
})

describe('serializeType', () => {
  test('serializes a mixin reference unchanged', () => {
    expect(serializeType('StackAttrs')).toBe('StackAttrs')
  })

  test('joins members with semicolons and keeps the mixin', () => {
    expect(serializeType("BlockAttrs & { direction?: 'row'\n variant?: 'narrow' }")).toBe(
      "BlockAttrs & { direction?: 'row'; variant?: 'narrow' }",
    )
  })

  test('collapses the empty object to an empty string', () => {
    expect(serializeType('{}')).toBe('')
    expect(serializeType('')).toBe('')
  })
})

describe('serializeMixins', () => {
  test('emits a declaration for each shared mixin', () => {
    const out = serializeMixins()
    expect(out).toContain("type BlockAttrs = {\n  gap?: 'xs' | 's' | 'm' | 'l'")
    expect(out).toContain('type StackAttrs = BlockAttrs & {')
  })
})

describe('mixins data', () => {
  test('every mixin attr carries a type and is optional', () => {
    for (const mx of Object.values(mixins)) {
      for (const a of mx.attrs) {
        expect(a.optional).toBe(true)
        expect(a.type.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('extractFileEntries', () => {
  test('reads the type Attributes fence from a component CSS file', () => {
    const entries = extractFileEntries('./src/layout/Stack.css')
    expect(entries.map((e) => e.element)).toEqual(['vstack-i', 'hstack-i'])
  })

  test('returns nothing for a file without a fence', () => {
    expect(extractFileEntries('./src/reset.css')).toEqual([])
  })
})
