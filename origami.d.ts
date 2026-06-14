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
// TODO: button data attribute support here?
declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'container-i': CustomElementProps<
        BlockAttrs & {
          direction?: 'column' | 'row' | 'row-reverse' | 'responsive'
          variant?: 'narrow'
        }
      >
      'vstack-i': CustomElementProps<StackAttrs>
      'hstack-i': CustomElementProps<StackAttrs & { breakpoint?: 's' | 'm' }>

      'alert-i': CustomElementProps<
        BlockAttrs & {
          tone?: 'success' | 'warn' | 'danger' | 'neutral' | 'info'
        }
      >
      'skeleton-i': CustomElementProps<{
        width?: 's' | 'm' | 'l' | 'xl'
        radius?: 's' | 'm' | 'full' | 'none'
      }>
      'badge-i': CustomElementProps<{
        type?: 'info' | 'neutral' | 'danger' | 'warn' | 'success'
        radius?: 's' | 'm' | 'full' | 'none'
      }>
      'card-i': CustomElementProps<BlockAttrs>
      'card-cover-i': CustomElementProps

      'switch-i': CustomElementProps
      'labelledfield-i': CustomElementProps

      'dropdown-i': CustomElementProps<{
        align?: 'left' | 'right'
      }>
      'toggletip-i': CustomElementProps
      'tooltip-i': CustomElementProps
    }
  }
}
