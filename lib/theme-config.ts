export const themeConfig = {
  brand: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    border: 'hsl(var(--border))',
  },
  fonts: {
    heading: 'var(--font-inter)',
    body: 'var(--font-inter)',
  },
  layout: {
    maxWidth: '1280px',
    headerHeight: '64px',
    footerHeight: '200px',
    containerPadding: '2rem',
  },
  radii: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.625rem',
  }
} as const

export type ThemeConfig = typeof themeConfig 