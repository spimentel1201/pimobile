// ponytail: M3 design tokens and helpers. Consolidated in one file, no external theme libs.
import { TextStyle, ViewStyle, StyleSheet } from 'react-native';
import type { QuoteStatus } from './types/api';

// ============================================================
// Material Design 3 (Material You) — Taller Eléctrico Theme
// ============================================================

export const lightColorScheme = {
  primary: '#0052FF',
  onPrimary: '#FFFFFF',
  primaryContainer: '#DCE1FF',
  onPrimaryContainer: '#001453',

  // Acento herramienta / taller (ámbar cálido)
  secondary: '#BA5500',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFDCC2',
  onSecondaryContainer: '#2E1500',

  tertiary: '#006874',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#9EEFFD',
  onTertiaryContainer: '#001F24',

  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  background: '#F8F9FA',
  onBackground: '#191C1E',

  // Capas de superficie M3
  surface: '#FFFFFF',
  onSurface: '#191C1E',
  surfaceVariant: '#DFE2EB',
  onSurfaceVariant: '#43474E',

  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F3F4F6',
  surfaceContainer: '#ECEEF1',
  surfaceContainerHigh: '#E5E8EB',
  surfaceContainerHighest: '#DFE2E6',

  outline: '#73777F',
  outlineVariant: '#C3C7D0',

  inverseSurface: '#2E3133',
  inverseOnSurface: '#F0F1F3',
  inversePrimary: '#B4C5FF',
  scrim: '#000000',
  shadow: '#000000',
};

export const darkColorScheme: typeof lightColorScheme = {
  primary: '#B4C5FF',
  onPrimary: '#002A78',
  primaryContainer: '#003EA8',
  onPrimaryContainer: '#DCE1FF',

  secondary: '#FFB68F',
  onSecondary: '#542200',
  secondaryContainer: '#773300',
  onSecondaryContainer: '#FFDCC2',

  tertiary: '#82D3E0',
  onTertiary: '#00363D',
  tertiaryContainer: '#004F58',
  onTertiaryContainer: '#9EEFFD',

  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  background: '#111416',
  onBackground: '#E1E2E5',

  // Capas de superficie M3 oscuras
  surface: '#111416',
  onSurface: '#E1E2E5',
  surfaceVariant: '#43474E',
  onSurfaceVariant: '#C3C7D0',

  surfaceContainerLowest: '#0C0E10',
  surfaceContainerLow: '#191C1E',
  surfaceContainer: '#1E2022',
  surfaceContainerHigh: '#282A2D',
  surfaceContainerHighest: '#333538',

  outline: '#8D9199',
  outlineVariant: '#43474E',

  inverseSurface: '#E1E2E5',
  inverseOnSurface: '#2E3133',
  inversePrimary: '#0052FF',
  scrim: '#000000',
  shadow: '#000000',
};

// ============================================================
// Retrocompatibilidad con código existente
// ============================================================
export const colors = {
  // Superficies
  surface: lightColorScheme.surface,
  surfaceMuted: lightColorScheme.surfaceContainerLow,
  canvas: lightColorScheme.background,

  // Bordes
  border: lightColorScheme.outlineVariant,
  borderStrong: lightColorScheme.outline,

  // Texto
  textPrimary: lightColorScheme.onSurface,
  textSecondary: lightColorScheme.onSurfaceVariant,
  textMuted: '#73777F',

  // Primario
  primary: lightColorScheme.primary,
  primarySoft: lightColorScheme.primaryContainer,
  secondary: lightColorScheme.secondary,
  secondarySoft: lightColorScheme.secondaryContainer,

  // Semánticos
  success: '#006D44',
  successSoft: '#94F8BE',
  warning: '#9C4100',
  warningSoft: '#FFDCC2',
  danger: lightColorScheme.error,
  dangerSoft: lightColorScheme.errorContainer,
  violet: '#754B9C',
  violetSoft: '#F0DCFF',

  // M3 containers
  surfaceContainerLowest: lightColorScheme.surfaceContainerLowest,
  surfaceContainerLow: lightColorScheme.surfaceContainerLow,
  surfaceContainer: lightColorScheme.surfaceContainer,
  surfaceContainerHigh: lightColorScheme.surfaceContainerHigh,
  surfaceContainerHighest: lightColorScheme.surfaceContainerHighest,

  white: '#FFFFFF',
} as const;

// Escala tipográfica M3
export const typography = {
  displayLarge: { fontSize: 57, fontWeight: '400', letterSpacing: -0.25 } as TextStyle,
  displayMedium: { fontSize: 45, fontWeight: '400', letterSpacing: 0 } as TextStyle,
  displaySmall: { fontSize: 36, fontWeight: '400', letterSpacing: 0 } as TextStyle,

  headlineLarge: { fontSize: 32, fontWeight: '400', letterSpacing: 0 } as TextStyle,
  headlineMedium: { fontSize: 28, fontWeight: '600', letterSpacing: 0 } as TextStyle,
  headlineSmall: { fontSize: 24, fontWeight: '600', letterSpacing: 0 } as TextStyle,

  titleLarge: { fontSize: 22, fontWeight: '600', letterSpacing: 0 } as TextStyle,
  titleMedium: { fontSize: 16, fontWeight: '600', letterSpacing: 0.15 } as TextStyle,
  titleSmall: { fontSize: 14, fontWeight: '600', letterSpacing: 0.1 } as TextStyle,

  bodyLarge: { fontSize: 16, fontWeight: '400', letterSpacing: 0.5 } as TextStyle,
  bodyMedium: { fontSize: 14, fontWeight: '400', letterSpacing: 0.25 } as TextStyle,
  bodySmall: { fontSize: 12, fontWeight: '400', letterSpacing: 0.4 } as TextStyle,

  labelLarge: { fontSize: 14, fontWeight: '600', letterSpacing: 0.1 } as TextStyle,
  labelMedium: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 } as TextStyle,
  labelSmall: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 } as TextStyle,

  // Alias para retrocompatibilidad
  display: { fontSize: 28, fontWeight: '700', color: colors.textPrimary } as TextStyle,
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary } as TextStyle,
  bodyStrong: { fontSize: 15, fontWeight: '600', color: colors.textPrimary } as TextStyle,
  body: { fontSize: 14, fontWeight: '400', color: colors.textSecondary } as TextStyle,
  caption: { fontSize: 12, fontWeight: '500', color: colors.textMuted } as TextStyle,
  micro: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 } as TextStyle,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  full: 999,

  // Alias para retrocompatibilidad
  card: 16,
  button: 12,
  input: 12,
  pill: 999,
  sheet: 28,
} as const;

export const radius = radii;

// Elevación tonal M3 nativa
export const tonalElevation = {
  level0: { elevation: 0, shadowColor: 'transparent' } as ViewStyle,
  level1: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } as ViewStyle,
  level2: { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 } as ViewStyle,
  level3: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 } as ViewStyle,
  level4: { elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10 } as ViewStyle,
} as const;

export const shadow: ViewStyle = tonalElevation.level1;

export const theme = {
  colorRoles: lightColorScheme,
  typography,
  spacing,
  radius: radii,
  radii,
  elevation: tonalElevation,
};

// ============================================================
// Estados de órdenes de reparación M3
// ============================================================
export type RepairOrderStatus =
  | 'RECEIVED'
  | 'DIAGNOSED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface StatusStyle {
  label: string;
  color: string;
  soft: string;
  icon?: string;
  onContainer?: string;
}

export const ORDER_STATUS: Record<RepairOrderStatus, StatusStyle> = {
  RECEIVED: {
    label: 'Recibido',
    color: '#4A6267',
    soft: '#CFE6EC',
    icon: 'tray-arrow-down',
    onContainer: '#051F23',
  },
  DIAGNOSED: {
    label: 'Diagnosticado',
    color: '#0052FF',
    soft: '#DCE1FF',
    icon: 'clipboard-text-search-outline',
    onContainer: '#001453',
  },
  IN_PROGRESS: {
    label: 'En Reparación',
    color: '#9C4100',
    soft: '#FFDCC2',
    icon: 'wrench',
    onContainer: '#341100',
  },
  WAITING_FOR_PARTS: {
    label: 'Esperando Repuestos',
    color: '#754B9C',
    soft: '#F0DCFF',
    icon: 'package-variant-closed',
    onContainer: '#2D004F',
  },
  COMPLETED: {
    label: 'Listo p/ Entrega',
    color: '#006D44',
    soft: '#94F8BE',
    icon: 'check-circle-outline',
    onContainer: '#002111',
  },
  DELIVERED: {
    label: 'Entregado',
    color: '#006874',
    soft: '#9EEFFD',
    icon: 'truck-delivery-outline',
    onContainer: '#001F24',
  },
  CANCELLED: {
    label: 'Cancelado',
    color: '#BA1A1A',
    soft: '#FFDAD6',
    icon: 'close-circle-outline',
    onContainer: '#410002',
  },
};

// ============================================================
// Estados de presupuestos (Quotes)
// ============================================================
export type { QuoteStatus };

export const QUOTE_STATUS: Record<QuoteStatus, StatusStyle> = {
  PENDING: { label: 'Pendiente', color: '#9C4100', soft: '#FFDCC2', icon: 'clock-outline' },
  APPROVED: { label: 'Aprobado', color: '#0052FF', soft: '#DCE1FF', icon: 'thumb-up-outline' },
  PAID: { label: 'Pagado', color: '#006D44', soft: '#94F8BE', icon: 'cash-check' },
  REJECTED: { label: 'Rechazado', color: '#BA1A1A', soft: '#FFDAD6', icon: 'thumb-down-outline' },
  EXPIRED: { label: 'Expirado', color: '#73777F', soft: '#ECEEF1', icon: 'clock-alert-outline' },
  INVOICED: { label: 'Facturado', color: '#754B9C', soft: '#F0DCFF', icon: 'file-document-outline' },
};

export const quoteStatusStyle = (status: string): StatusStyle =>
  (QUOTE_STATUS as Record<string, StatusStyle | undefined>)[status] ?? {
    label: status || 'Desconocido',
    color: colors.textMuted,
    soft: colors.surfaceMuted,
    icon: 'help-circle-outline',
  };

// ============================================================
// Métodos de Pago
// ============================================================
export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'TRANSFER'
  | 'YAPE'
  | 'PLIN';

export const PAYMENT_METHOD: Record<PaymentMethod, StatusStyle> = {
  CASH: { label: 'Efectivo', color: '#006D44', soft: '#94F8BE', icon: 'cash' },
  CREDIT_CARD: { label: 'Tarjeta de Crédito', color: '#0052FF', soft: '#DCE1FF', icon: 'credit-card' },
  DEBIT_CARD: { label: 'Tarjeta de Débito', color: '#0052FF', soft: '#DCE1FF', icon: 'credit-card-outline' },
  TRANSFER: { label: 'Transferencia', color: '#4A6267', soft: '#CFE6EC', icon: 'bank-transfer' },
  YAPE: { label: 'Yape', color: '#6B21A8', soft: '#F3E8FF', icon: 'cellphone' },
  PLIN: { label: 'Plin', color: '#00838F', soft: '#E0F7FA', icon: 'cellphone' },
};

// ============================================================
// Iconos de Electrodomésticos y Equipos del Taller
// ============================================================
export const getDeviceIcon = (deviceType: string = ''): string => {
  const t = deviceType.toLowerCase().trim();
  if (t.includes('lavadora') || t.includes('lava') || t.includes('secadora')) return 'washing-machine';
  if (t.includes('refri') || t.includes('nevera') || t.includes('congelador')) return 'fridge-outline';
  if (t.includes('micro') || t.includes('horno')) return 'microwave';
  if (t.includes('tv') || t.includes('tele') || t.includes('pantalla') || t.includes('monitor')) return 'television';
  if (t.includes('aire') || t.includes('ac') || t.includes('clima')) return 'air-conditioner';
  if (t.includes('licuadora') || t.includes('batidora') || t.includes('extractor')) return 'blender';
  if (t.includes('laptop') || t.includes('compu') || t.includes('pc') || t.includes('notebook')) return 'laptop';
  if (t.includes('audio') || t.includes('parlante') || t.includes('bocina') || t.includes('equipo')) return 'speaker';
  if (t.includes('aspiradora')) return 'vacuum';
  if (t.includes('ventilador')) return 'fan';
  if (t.includes('plancha')) return 'iron';
  return 'tools';
};

// Hoja de estilos común
export const themedStyles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
