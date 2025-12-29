// Design tokens per PRD Section 4

export const colors = {
  // Primary accent - soft blue per PRD visual rules
  primary: '#4A90A4',
  primaryLight: '#E8F4F8',
  
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8F9FA',
  
  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  
  // UI elements
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  // States
  error: '#DC2626',
  success: '#16A34A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  // Per PRD: Titles 20-24px, Body 14-16px
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};
