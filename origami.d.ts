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
      'labelledfield-i': CustomElementProps
      'switch-i': CustomElementProps
      'card-i': CustomElementProps<BlockAttrs>
      'card-cover-i': CustomElementProps
      'container-i': CustomElementProps<BlockAttrs & { direction?: 'column' | 'row' | 'row-reverse' | 'responsive'; variant?: 'narrow' }>
      'vstack-i': CustomElementProps<StackAttrs>
      'hstack-i': CustomElementProps<StackAttrs & { breakpoint?: 's' | 'm' }>
      'alert-i': CustomElementProps<BlockAttrs & { role: 'alert'; tone?: 'success' | 'warn' | 'danger' | 'neutral' | 'info' }>
      'badge-i': CustomElementProps<{ tone?: 'info' | 'neutral' | 'danger' | 'warn' | 'success'; radius?: 's' | 'm' | 'full' | 'none' }>
      'skeleton-i': CustomElementProps<{ width?: 's' | 'm' | 'l' | 'xl'; radius?: 's' | 'm' | 'full' | 'none' }>
      'dropdown-i': CustomElementProps<{ align?: 'left' | 'right' }>
      'toastgroup-i': CustomElementProps<{ role: 'region'; 'aria-label': string; 'aria-live': 'polite' }>
      'toggletip-i': CustomElementProps<{ role: 'status'; popover: 'auto' | 'manual' }>
      'tooltip-i': CustomElementProps<{ role?: 'tooltip'; popover?: 'hint' }>
    }
  }
}

declare module 'react' {
  interface ButtonHTMLAttributes<T> {
    'data-variant'?: 'outline' | 'text' | 'ghost' | string
    'data-tone'?: 'danger'
    'data-size'?: 's' | 'l'
  }
}
