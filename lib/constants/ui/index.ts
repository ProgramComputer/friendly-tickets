export * from './colors'
export * from './typography'
export * from './breakpoints'
export * from './base-styles'

export const TRANSITIONS = {
  DEFAULT: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  FAST: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
  SLOW: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

export const LAYERS = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
} as const

export type Transitions = typeof TRANSITIONS
export type Layers = typeof LAYERS 