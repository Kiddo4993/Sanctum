// ============================================================
// Sanctum — Design System
// Dark-first aesthetic: white text glowing on near-black.
// ============================================================

export const COLORS = {
  background: '#0D0D0D',
  card: '#1A1A1A',
  surface: '#242424',
  textPrimary: '#F0F0F0',
  textSecondary: '#888888',
  textMuted: '#555555',
  accentGold: '#C9A84C',
  accentGoldDim: 'rgba(201, 168, 76, 0.15)',
  danger: '#E74C3C',
  success: '#2ECC71',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBar: '#111111',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',
} as const;

export const FONTS = {
  serif: 'Lora_400Regular',
  serifItalic: 'Lora_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansBold: 'Inter_600SemiBold',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;
