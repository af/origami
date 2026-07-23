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

// Navigation/routing (TODO: replace hashes with real urls if committing to running a server)
const shouldNotIntercept = (navEvt) => {
  return (
    !navEvt.canIntercept ||
    // navEvt.hashChange ||
    navEvt.downloadRequest ||
    navEvt.formData
  )
}

const navTo = (fullHash) => {
  // Root route (no hash) renders the Home page
  const hash = fullHash.replace('#', '') || 'Index'
  const page = docs.find((p) => p.name === hash)
  if (page) main.innerHTML = page.markdown

  // Update nav links
  nav.querySelectorAll('a[aria-current]').forEach((a) => a.removeAttribute('aria-current'))
  document.querySelector(`a[href="#${hash}"]`)?.setAttribute('aria-current', 'page')
}

navigation.addEventListener('navigate', (navigateEvent) => {
  if (shouldNotIntercept(navigateEvent)) return

  const url = new URL(navigateEvent.destination.url)
  navTo(url.hash)
})

window.addEventListener('load', () => navTo(location.hash))

// Dev: when the file watcher regenerates data.js, swap in the new docs and
// re-render the current page without a full reload. See buildMarkdown.ts.
if (import.meta.hot) {
  import.meta.hot.accept('./data.js', (mod) => {
    docs = mod.DOCS
    location.assign(location)
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
