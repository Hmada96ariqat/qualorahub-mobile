export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const palette = {
  background: '#F9FBFA',
  foreground: '#17261F',
  surface: '#FFFFFF',
  onSurface: '#17261F',
  primary: '#248F36',
  primaryLight: '#59C06A',
  primaryDark: '#136C22',
  onPrimary: '#FFFFFF',
  secondary: '#E2DACF',
  onSecondary: '#17261F',
  accent: '#F0C442',
  onAccent: '#17261F',
  success: '#2EB845',
  onSuccess: '#FFFFFF',
  warning: '#FFC61A',
  onWarning: '#17261F',
  destructive: '#EF4343',
  onDestructive: '#FFFFFF',
  muted: '#EDF2F0',
  mutedForeground: '#677E73',
  border: '#DCE5E0',
  outline: '#DCE5E0',
  ring: '#248F36',
  surfaceVariant: '#EDF2F0',
  error: '#EF4343',
} as const;

export const typography = {
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
} as const;
