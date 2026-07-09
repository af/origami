import { DOCS } from './data.js'

const nav = document.querySelector('nav')
const main = document.querySelector('main')

// Mutable so HMR can swap in freshly-generated docs without a full reload
let docs = DOCS

// localStorage-based theme switcher
const theme = localStorage.getItem('theme')
const themeSelect = document.querySelector('[name=theme]')
const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}
if (theme) {
  setTheme(theme)
  if (themeSelect) themeSelect.value = theme
}
themeSelect?.addEventListener('change', (evt) => setTheme(evt.target.value))

const navigateTo = (hash) => {
  const page = docs.find((p) => p.name === hash)
  if (page) {
    location.hash = hash
    main.innerHTML = page.markdown
  }

  // Update nav links
  nav.querySelectorAll('a[aria-current]').forEach((a) => a.removeAttribute('aria-current'))
  document.querySelector(`a[href="#${hash}"]`)?.setAttribute('aria-current', 'page')
}
nav.addEventListener('click', (e) => {
  const link = e.target
  if (link.tagName !== 'A') return
  e.preventDefault()

  const linkHash = new URL(link.href).hash?.replace('#', '')
  navigateTo(linkHash)
})

window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '')
  navigateTo(hash)
})
window.addEventListener('load', () => {
  const hash = location.hash.replace('#', '')
  navigateTo(hash)
})

// Dev: when the file watcher regenerates data.js, swap in the new docs and
// re-render the current page without a full reload. See buildMarkdown.ts.
if (import.meta.hot) {
  import.meta.hot.accept('./data.js', (mod) => {
    docs = mod.DOCS
    navigateTo(location.hash.replace('#', ''))
  })
}

// Example JS shim for tooltip-i popover hovering
// const popoverHover = (evt) => {
//   const source = evt.target
//   const parent = source?.parentElement
//   if (parent?.tagName !== 'TOOLTIP-I') return
//   const popover = parent.querySelector('[popover]')
//   if (evt.type === 'pointerover' || evt.type === 'focusin') popover?.showPopover({ source })
//   else popover?.hidePopover()
// }
// document.addEventListener('pointerover', popoverHover)
// document.addEventListener('pointerout', popoverHover)
// document.addEventListener('focusin', popoverHover)
// document.addEventListener('focusout', popoverHover)
