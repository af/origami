// GENERATED FILE — do not edit by hand.
// Element attribute types live in the `typescript` fenced blocks of each component's
// CSS docblock; run `bun run build-types` to regenerate.

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type BlockAttrs = {
  gap?: 'xs' | 's' | 'm' | 'l'
  pad?: 'none' | 'xs' | 's' | 'm' | 'l' | 'xl'
  vpad?: 'none' | 'xs' | 's' | 'm' | 'l' | 'xl'
}

type StackAttrs = BlockAttrs & {
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  justify?: 'center' | 'start' | 'space-between' | 'space-around' | 'space-evenly' | 'flex-end'
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
}

// biome-ignore lint/complexity/noBannedTypes: {} is intentional here
type CustomElementProps<T = {}> = DetailedHTMLProps<HTMLAttributes<HTMLElement> & T, HTMLElement>

// via https://til.jakelazaroff.com/typescript/add-custom-element-to-jsx-intrinsic-elements/
// TODO: find a framework-agnostic way to register these
declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      /** Integrated layout and label styles for inputs, selects, and textareas */
      'labelledfield-i': CustomElementProps
      /** Animated, themable toggle switch, using a checkbox for state */
      'switch-i': CustomElementProps
      /** It's a card. You know the drill. */
      'card-i': CustomElementProps<BlockAttrs>
      /** It's a card. You know the drill. */
      'card-cover-i': CustomElementProps
      /** Responsive, centered container with a default width of content */
      'container-i': CustomElementProps<BlockAttrs & { direction?: 'column' | 'row' | 'row-reverse' | 'responsive'; variant?: 'narrow' }>
      /** Simple responsive CSS grid container */
      'grid-i': CustomElementProps<BlockAttrs & { columns: string; rows: string }>
      /** Flexible layout primitives, for every place you need a flex container */
      'vstack-i': CustomElementProps<StackAttrs>
      /** Flexible layout primitives, for every place you need a flex container */
      'hstack-i': CustomElementProps<StackAttrs & { breakpoint?: 's' | 'm' }>
      /** Status banners, with various supported tone variants */
      'alert-i': CustomElementProps<BlockAttrs & { role: 'alert'; tone?: 'success' | 'warn' | 'danger' | 'neutral' | 'info' }>
      /** Small pill-like elements for counts and statuses */
      'badge-i': CustomElementProps<{ tone?: 'info' | 'neutral' | 'danger' | 'warn' | 'success'; radius?: 's' | 'm' | 'full' | 'none' }>
      /** Generic shimmering boxes for loading states */
      'skeleton-i': CustomElementProps<{ width?: 's' | 'm' | 'l' | 'xl'; radius?: 's' | 'm' | 'full' | 'none' }>
      /** Anchor-positioned popovers for buttons and menus */
      'dropdown-i': CustomElementProps<{ align?: 'left' | 'right' }>
      /** Dismissable popup notifications, using popovers */
      'toastgroup-i': CustomElementProps<{ role: 'region'; 'aria-label': string; 'aria-live': 'polite' }>
      /** Tooltips that show when clicking a button */
      'toggletip-i': CustomElementProps<{ role: 'status'; popover: 'auto' | 'manual' }>
      /** Hover-invoked popover content, using Interest Invokers. Experimental! */
      'tooltip-i': CustomElementProps<{ role: 'tooltip'; popover?: 'hint' }>
    }
  }
}

declare module 'react' {
  /** Themable button styles, with multiple variants and supported states */
  interface ButtonHTMLAttributes<T> {
    'data-variant'?: 'outline' | 'text' | 'ghost' | string
    'data-tone'?: 'danger'
    'data-size'?: 's' | 'l'
  }
}
