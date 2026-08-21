import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Colors ────────────────────────────────────────────
export const colors = {
  // Primary
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1D4ED8',

  // Secondary
  secondary: '#475569',
  secondaryLight: '#94A3B8',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#059669',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#D97706',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#DC2626',
  info: '#6366F1',
  infoLight: '#E0E7FF',
  infoDark: '#4F46E5',

  // Status (repair orders)
  status: {
    RECEIVED: '#94A3B8',
    DIAGNOSED: '#2563EB',
    IN_PROGRESS: '#F59E0B',
    WAITING_FOR_PARTS: '#8B5CF6',
    COMPLETED: '#10B981',
    DELIVERED: '#059669',
    CANCELLED: '#EF4444',
  } as Record<string, string>,

  // Grays (slate scale)
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Dynamic
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  scrim: 'rgba(0, 0, 0, 0.5)',
} as const;

// ─── Light Theme ───────────────────────────────────────
export const lightTheme = {
  background: colors.gray[50],
  surface: colors.white,
  surfaceVariant: colors.gray[100],
  border: colors.gray[200],
  borderLight: colors.gray[100],
  text: colors.gray[900],
  textSecondary: colors.gray[500],
  textMuted: colors.gray[400],
  textInverse: colors.white,
  primary: colors.primary,
  primaryLight: colors.primaryLight,
  accent: colors.info,
  accentLight: colors.infoLight,
  divider: colors.gray[200],
  card: colors.white,
  cardBorder: colors.gray[200],
  inputBg: colors.gray[50],
  inputBorder: colors.gray[300],
  inputBorderFocus: colors.primary,
  tabBar: 'rgba(255, 255, 255, 0.9)',
  tabBarBorder: colors.gray[200],
  headerBg: colors.white,
  headerBorder: colors.gray[200],
  skeleton: colors.gray[200],
  skeletonHighlight: colors.gray[100],
  overlay: colors.scrim,
  shadow: '#000',
};

// ─── Dark Theme ────────────────────────────────────────
export const darkTheme = {
  background: colors.gray[900],
  surface: colors.gray[800],
  surfaceVariant: colors.gray[700],
  border: colors.gray[700],
  borderLight: colors.gray[600],
  text: colors.gray[50],
  textSecondary: colors.gray[400],
  textMuted: colors.gray[500],
  textInverse: colors.gray[900],
  primary: colors.primary,
  primaryLight: '#1E3A5F',
  accent: colors.info,
  accentLight: '#1E1B4B',
  divider: colors.gray[700],
  card: colors.gray[800],
  cardBorder: colors.gray[700],
  inputBg: colors.gray[700],
  inputBorder: colors.gray[600],
  inputBorderFocus: colors.primary,
  tabBar: 'rgba(15, 23, 42, 0.9)',
  tabBarBorder: colors.gray[700],
  headerBg: colors.gray[800],
  headerBorder: colors.gray[700],
  skeleton: colors.gray[700],
  skeletonHighlight: colors.gray[600],
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000',
};

export type Theme = typeof lightTheme;

// ─── Typography ────────────────────────────────────────
export const typography = {
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ─── Spacing (4pt system) ──────────────────────────────
export const spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// ─── Border Radius ─────────────────────────────────────
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Shadows ───────────────────────────────────────────
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Animation ─────────────────────────────────────────
export const animation = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 400,
  },
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;

// ─── Layout ────────────────────────────────────────────
export const layout = {
  screen: {
    width: SCREEN_WIDTH,
    padding: spacing.base,
    paddingH: spacing.lg,
  },
  tabBar: {
    height: Platform.OS === 'ios' ? 85 : 64,
  },
  header: {
    height: Platform.OS === 'ios' ? 96 : 64,
  },
  touchTarget: Platform.OS === 'ios' ? 44 : 48,
  maxContentWidth: 600,
} as const;

// ─── Brand Colors (decorative, per-service/per-action) ──
export const brandColors = {
  blue: { color: colors.primary, bg: colors.primaryLight },
  indigo: { color: colors.info, bg: colors.infoLight },
  violet: { color: '#8B5CF6', bg: '#EDE9FE' },
  amber: { color: colors.warning, bg: colors.warningLight },
  emerald: { color: colors.success, bg: colors.successLight },
  red: { color: colors.error, bg: colors.errorLight },
  sky: { color: '#0EA5E9', bg: '#E0F2FE' },
  pink: { color: '#EC4899', bg: '#FCE7F3' },
  slate: { color: colors.gray[500], bg: colors.gray[100] },
} as const;

// ─── Full Theme Object ─────────────────────────────────
export const theme = {
  colors: lightTheme,
  darkColors: darkTheme,
  typography,
  spacing,
  radii,
  shadows,
  animation,
  layout,
} as const;

export default theme;
