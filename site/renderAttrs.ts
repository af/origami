import { type Attr, type Entry, elementAttrs } from '../scripts/types'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const renderAttrsTable = (element: string, attrs: Attr[]) => {
  const renderValues = (attr: Attr) =>
    attr.values
      ? attr.values.map((v) => `<badge-i tone="neutral">${escapeHtml(v)}</badge-i>`).join(' ')
      : `<code>${escapeHtml(attr.type)}</code>`

  const rows = attrs
    .map((a) => `<tr><td><code>${a.name}</code></td><td>${renderValues(a)}</td></tr>`)
    .join('')
  return `
    <attributes-table>
    <table>
      <caption><code>&lt;${element}&gt;</code></caption>
      <thead><tr><th>Attribute</th><th>Values</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </attributes-table>
  `
}

// Build a dedicated "Attributes" section for a component page from the `dts`
// type sources in its CSS docblock. Elements with no attributes are omitted;
// returns '' when none of the file's elements take attributes.
const renderAttrsSection = (entries: Entry[]) => {
  const tables = entries
    .map((e) => ({ element: e.element, attrs: elementAttrs(e.rawType) }))
    .filter((e) => e.attrs.length > 0)
    .map((e) => renderAttrsTable(e.element, e.attrs))
  if (tables.length === 0) return ''
  return `<section>${tables.join('\n')}</section>`
}

export default renderAttrsSection
