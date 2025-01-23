export const baseStyles = {
  input: {
    base: 'w-full rounded-md border border-border px-3 py-2 text-sm',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light',
    error: 'border-status-error focus:ring-status-error focus:border-status-error',
    disabled: 'bg-background-secondary cursor-not-allowed opacity-75'
  },
  
  button: {
    base: 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-background-secondary text-secondary hover:bg-background-tertiary',
    ghost: 'hover:bg-background-secondary',
    danger: 'bg-status-error text-white hover:bg-status-error/90'
  },

  card: {
    base: 'rounded-lg bg-background-primary',
    interactive: 'hover:bg-background-secondary transition-colors cursor-pointer',
    shadow: 'shadow-sm',
    bordered: 'border border-border'
  },

  layout: {
    page: 'min-h-screen bg-background-secondary',
    header: 'h-16 bg-background-primary border-b border-border',
    sidebar: 'w-[280px] bg-background-primary border-r border-border',
    content: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
  },

  text: {
    h1: 'text-2xl font-semibold tracking-tight',
    h2: 'text-xl font-semibold tracking-tight',
    h3: 'text-lg font-semibold tracking-tight',
    p: 'text-base leading-7',
    small: 'text-sm text-secondary-light'
  },

  list: {
    base: 'divide-y divide-border',
    item: 'py-4',
    interactive: 'hover:bg-background-secondary cursor-pointer'
  },

  table: {
    base: 'w-full divide-y divide-border',
    header: 'bg-background-secondary',
    headerCell: 'px-4 py-3 text-left text-sm font-medium text-secondary-light',
    row: 'hover:bg-background-secondary',
    cell: 'px-4 py-4 text-sm'
  },

  form: {
    base: 'space-y-6',
    group: 'space-y-2',
    label: 'block text-sm font-medium text-secondary',
    helper: 'mt-1 text-sm text-secondary-light',
    error: 'mt-1 text-sm text-status-error'
  },

  dialog: {
    overlay: 'fixed inset-0 bg-black/30 backdrop-blur-sm',
    content: 'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-background-primary rounded-lg shadow-lg',
    header: 'px-6 py-4 border-b border-border',
    body: 'px-6 py-4',
    footer: 'px-6 py-4 border-t border-border'
  }
} as const

export type BaseStyles = typeof baseStyles 