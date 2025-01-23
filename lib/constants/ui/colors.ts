export const colors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '#03363D',  // Deep Teal - Main brand color
    light: '#2F3941',    // Light Teal - Secondary actions
    hover: '#1F73B7',    // Blue - Hover states
  },
  
  // Secondary Colors
  secondary: {
    DEFAULT: '#49545C',  // Slate - Secondary text
    light: '#87929D',    // Light Slate - Tertiary text
    hover: '#C2C8CC',    // Hover state for secondary
  },
  
  // Status Colors
  status: {
    success: '#087443',  // Green - Success states
    warning: '#B35F00',  // Orange - Warning states
    error: '#B30000',    // Red - Error states
    info: '#0077C5',     // Blue - Info states
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',  // White - Primary background
    secondary: '#F8F9F9', // Light Gray - Secondary background
    tertiary: '#EBF0F4', // Lighter Gray - Tertiary background
  },
  
  // Border Colors
  border: {
    light: '#D8DCDE',    // Light border
    DEFAULT: '#C2C8CC',  // Default border
    dark: '#87929D',     // Dark border
  }
} as const

export type Colors = typeof colors 