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
// Verdadero cuando la paleta oscura está activa. Permite que los
// estilos semánticos (estados, pagos) se resuelvan al leerlos.
let currentSchemeIsDark = false;
export const isDarkScheme = () => currentSchemeIsDark;

/** Convierte #RRGGBB (o #RGB) en rgba() con la opacidad indicada. */
export function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const colors = {
  // Superficies
  surface: lightColorScheme.surface,
  surfaceMuted: lightColorScheme.surfaceContainerLow,
  canvas: lightColorScheme.background,

  // Bordes
  border: lightColorScheme.outlineVariant,
  borderStrong: lightColorScheme.outline,
  outline: lightColorScheme.outline,
  outlineVariant: lightColorScheme.outlineVariant,

  // Texto
  textPrimary: lightColorScheme.onSurface,
  textSecondary: lightColorScheme.onSurfaceVariant,
  textMuted: lightColorScheme.outline,
  textDisabled: '#A6ABB4',

  // Primario
  primary: lightColorScheme.primary,
  onPrimary: lightColorScheme.onPrimary,
  primarySoft: lightColorScheme.primaryContainer,
  primaryContainer: lightColorScheme.primaryContainer,
  onPrimaryContainer: lightColorScheme.onPrimaryContainer,

  secondary: lightColorScheme.secondary,
  onSecondary: lightColorScheme.onSecondary,
  secondarySoft: lightColorScheme.secondaryContainer,
  secondaryContainer: lightColorScheme.secondaryContainer,
  onSecondaryContainer: lightColorScheme.onSecondaryContainer,

  tertiary: lightColorScheme.tertiary,
  onTertiary: lightColorScheme.onTertiary,
  tertiarySoft: lightColorScheme.tertiaryContainer,
  onTertiaryContainer: lightColorScheme.onTertiaryContainer,

  // Semánticos
  success: '#006D44',
  onSuccess: '#FFFFFF',
  successSoft: '#94F8BE',
  onSuccessContainer: '#002111',
  warning: '#9C4100',
  onWarning: '#FFFFFF',
  warningSoft: '#FFDCC2',
  onWarningContainer: '#341100',
  danger: lightColorScheme.error,
  onDanger: '#FFFFFF',
  dangerSoft: lightColorScheme.errorContainer,
  onDangerContainer: lightColorScheme.onErrorContainer,
  violet: '#754B9C',
  onViolet: '#FFFFFF',
  violetSoft: '#F0DCFF',
  onVioletContainer: '#2D004F',

  // M3 containers
  surfaceContainerLowest: lightColorScheme.surfaceContainerLowest,
  surfaceContainerLow: lightColorScheme.surfaceContainerLow,
  surfaceContainer: lightColorScheme.surfaceContainer,
  surfaceContainerHigh: lightColorScheme.surfaceContainerHigh,
  surfaceContainerHighest: lightColorScheme.surfaceContainerHighest,

  inverseSurface: lightColorScheme.inverseSurface,
  inverseOnSurface: lightColorScheme.inverseOnSurface,
  scrim: lightColorScheme.scrim,

  // Colores de interacción (ripple / selección)
  ripple: withAlpha(lightColorScheme.primary, 0.12),
  rippleOnPrimary: withAlpha(lightColorScheme.onPrimary, 0.2),

  white: '#FFFFFF',
};

// ============================================================
// Tema dinámico (claro/oscuro)
// ============================================================
export type ThemePreference = 'system' | 'light' | 'dark';

/** Aplica la paleta clara u oscura sobre el objeto `colors` mutable. */
export function applyColorScheme(isDark: boolean) {
  currentSchemeIsDark = isDark;
  const scheme = isDark ? darkColorScheme : lightColorScheme;

  // Superficies: en oscuro las tarjetas usan containerLow para separarse
  // del canvas (que es casi negro).
  colors.surface = isDark ? scheme.surfaceContainerLow : scheme.surface;
  colors.surfaceMuted = scheme.surfaceContainerLow;
  colors.canvas = scheme.background;

  // Bordes
  colors.border = scheme.outlineVariant;
  colors.borderStrong = scheme.outline;
  colors.outline = scheme.outline;
  colors.outlineVariant = scheme.outlineVariant;

  // Texto
  colors.textPrimary = scheme.onSurface;
  colors.textSecondary = scheme.onSurfaceVariant;
  colors.textMuted = scheme.outline;
  colors.textDisabled = isDark ? '#5C6169' : '#A6ABB4';

  // Primario y contenedores
  colors.primary = scheme.primary;
  colors.onPrimary = scheme.onPrimary;
  colors.primarySoft = scheme.primaryContainer;
  colors.primaryContainer = scheme.primaryContainer;
  colors.onPrimaryContainer = scheme.onPrimaryContainer;

  colors.secondary = scheme.secondary;
  colors.onSecondary = scheme.onSecondary;
  colors.secondarySoft = scheme.secondaryContainer;
  colors.secondaryContainer = scheme.secondaryContainer;
  colors.onSecondaryContainer = scheme.onSecondaryContainer;

  colors.tertiary = scheme.tertiary;
  colors.onTertiary = scheme.onTertiary;
  colors.tertiarySoft = scheme.tertiaryContainer;
  colors.onTertiaryContainer = scheme.onTertiaryContainer;

  // Semánticos adaptados al modo oscuro
  colors.success = isDark ? '#8FE3AE' : '#006D44';
  colors.onSuccess = isDark ? '#00391F' : '#FFFFFF';
  colors.successSoft = isDark ? 'rgba(143, 227, 174, 0.16)' : '#94F8BE';
  colors.onSuccessContainer = isDark ? '#8FE3AE' : '#002111';

  colors.warning = isDark ? '#FFB68F' : '#9C4100';
  colors.onWarning = isDark ? '#4A1F00' : '#FFFFFF';
  colors.warningSoft = isDark ? 'rgba(255, 182, 143, 0.16)' : '#FFDCC2';
  colors.onWarningContainer = isDark ? '#FFB68F' : '#341100';

  colors.danger = scheme.error;
  colors.onDanger = scheme.onError;
  colors.dangerSoft = isDark ? 'rgba(255, 180, 171, 0.16)' : scheme.errorContainer;
  colors.onDangerContainer = scheme.onErrorContainer;

  colors.violet = isDark ? '#D3B8F5' : '#754B9C';
  colors.onViolet = isDark ? '#2E0F4F' : '#FFFFFF';
  colors.violetSoft = isDark ? 'rgba(211, 184, 245, 0.16)' : '#F0DCFF';
  colors.onVioletContainer = isDark ? '#D3B8F5' : '#2D004F';

  // M3 containers
  colors.surfaceContainerLowest = scheme.surfaceContainerLowest;
  colors.surfaceContainerLow = scheme.surfaceContainerLow;
  colors.surfaceContainer = scheme.surfaceContainer;
  colors.surfaceContainerHigh = scheme.surfaceContainerHigh;
  colors.surfaceContainerHighest = scheme.surfaceContainerHighest;

  colors.inverseSurface = scheme.inverseSurface;
  colors.inverseOnSurface = scheme.inverseOnSurface;
  colors.scrim = scheme.scrim;

  // Interacción
  colors.ripple = withAlpha(scheme.primary, isDark ? 0.2 : 0.12);
  colors.rippleOnPrimary = withAlpha(scheme.onPrimary, 0.22);

  // Tipografía: actualizar colores dependientes
  typography.display.color = colors.textPrimary;
  typography.title.color = colors.textPrimary;
  typography.bodyStrong.color = colors.textPrimary;
  typography.body.color = colors.textSecondary;
  typography.caption.color = colors.textMuted;
  typography.micro.color = colors.textMuted;
  theme.colorRoles = scheme;
}

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

// Colores de estado con variante clara y oscura. `color` es siempre el tono
// legible sobre `soft` (el contenedor), así que se resuelve al leerlo y
// cambia automáticamente con el tema.
interface StatusSpec {
  label: string;
  icon?: string;
  light: { color: string; soft: string };
  dark: { color: string; soft: string };
}

const statusStyle = (spec: StatusSpec): StatusStyle => ({
  label: spec.label,
  icon: spec.icon,
  get color() {
    return (currentSchemeIsDark ? spec.dark : spec.light).color;
  },
  get soft() {
    return (currentSchemeIsDark ? spec.dark : spec.light).soft;
  },
});

/** Versión fija en modo claro, para impresión sobre papel blanco. */
const lightStatus = (spec: StatusSpec): StatusStyle => ({
  label: spec.label,
  icon: spec.icon,
  color: spec.light.color,
  soft: spec.light.soft,
});

const ORDER_STATUS_SPECS: Record<RepairOrderStatus, StatusSpec> = {
  RECEIVED: {
    label: 'Recibido',
    icon: 'tray-arrow-down',
    light: { color: '#4A6267', soft: '#CFE6EC' },
    dark: { color: '#A8D5DF', soft: 'rgba(168, 213, 223, 0.16)' },
  },
  DIAGNOSED: {
    label: 'Diagnosticado',
    icon: 'clipboard-text-search-outline',
    light: { color: '#0052FF', soft: '#DCE1FF' },
    dark: { color: '#B4C5FF', soft: 'rgba(180, 197, 255, 0.16)' },
  },
  IN_PROGRESS: {
    label: 'En Reparación',
    icon: 'wrench',
    light: { color: '#9C4100', soft: '#FFDCC2' },
    dark: { color: '#FFB68F', soft: 'rgba(255, 182, 143, 0.16)' },
  },
  WAITING_FOR_PARTS: {
    label: 'Esperando Repuestos',
    icon: 'package-variant-closed',
    light: { color: '#754B9C', soft: '#F0DCFF' },
    dark: { color: '#D3B8F5', soft: 'rgba(211, 184, 245, 0.16)' },
  },
  COMPLETED: {
    label: 'Listo p/ Entrega',
    icon: 'check-circle-outline',
    light: { color: '#006D44', soft: '#94F8BE' },
    dark: { color: '#8FE3AE', soft: 'rgba(143, 227, 174, 0.16)' },
  },
  DELIVERED: {
    label: 'Entregado',
    icon: 'truck-delivery-outline',
    light: { color: '#006874', soft: '#9EEFFD' },
    dark: { color: '#86D9E6', soft: 'rgba(134, 217, 230, 0.16)' },
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: 'close-circle-outline',
    light: { color: '#BA1A1A', soft: '#FFDAD6' },
    dark: { color: '#FFB4AB', soft: 'rgba(255, 180, 171, 0.16)' },
  },
};

export const ORDER_STATUS: Record<RepairOrderStatus, StatusStyle> = {
  RECEIVED: statusStyle(ORDER_STATUS_SPECS.RECEIVED),
  DIAGNOSED: statusStyle(ORDER_STATUS_SPECS.DIAGNOSED),
  IN_PROGRESS: statusStyle(ORDER_STATUS_SPECS.IN_PROGRESS),
  WAITING_FOR_PARTS: statusStyle(ORDER_STATUS_SPECS.WAITING_FOR_PARTS),
  COMPLETED: statusStyle(ORDER_STATUS_SPECS.COMPLETED),
  DELIVERED: statusStyle(ORDER_STATUS_SPECS.DELIVERED),
  CANCELLED: statusStyle(ORDER_STATUS_SPECS.CANCELLED),
};

/** Variante para impresión (siempre modo claro). */
export const printOrderStatusStyle = (status: string): StatusStyle =>
  lightStatus(
    (ORDER_STATUS_SPECS as Record<string, StatusSpec | undefined>)[status] ??
      ORDER_STATUS_SPECS.RECEIVED
  );

// ============================================================
// Estados de presupuestos (Quotes)
// ============================================================
export type { QuoteStatus };

const QUOTE_STATUS_SPECS: Record<QuoteStatus, StatusSpec> = {
  PENDING: {
    label: 'Pendiente',
    icon: 'clock-outline',
    light: { color: '#9C4100', soft: '#FFDCC2' },
    dark: { color: '#FFB68F', soft: 'rgba(255, 182, 143, 0.16)' },
  },
  APPROVED: {
    label: 'Aprobado',
    icon: 'thumb-up-outline',
    light: { color: '#0052FF', soft: '#DCE1FF' },
    dark: { color: '#B4C5FF', soft: 'rgba(180, 197, 255, 0.16)' },
  },
  PAID: {
    label: 'Pagado',
    icon: 'cash-check',
    light: { color: '#006D44', soft: '#94F8BE' },
    dark: { color: '#8FE3AE', soft: 'rgba(143, 227, 174, 0.16)' },
  },
  REJECTED: {
    label: 'Rechazado',
    icon: 'thumb-down-outline',
    light: { color: '#BA1A1A', soft: '#FFDAD6' },
    dark: { color: '#FFB4AB', soft: 'rgba(255, 180, 171, 0.16)' },
  },
  EXPIRED: {
    label: 'Expirado',
    icon: 'clock-alert-outline',
    light: { color: '#73777F', soft: '#ECEEF1' },
    dark: { color: '#C3C7D0', soft: 'rgba(195, 199, 208, 0.14)' },
  },
  INVOICED: {
    label: 'Facturado',
    icon: 'file-document-outline',
    light: { color: '#754B9C', soft: '#F0DCFF' },
    dark: { color: '#D3B8F5', soft: 'rgba(211, 184, 245, 0.16)' },
  },
};

export const QUOTE_STATUS: Record<QuoteStatus, StatusStyle> = {
  PENDING: statusStyle(QUOTE_STATUS_SPECS.PENDING),
  APPROVED: statusStyle(QUOTE_STATUS_SPECS.APPROVED),
  PAID: statusStyle(QUOTE_STATUS_SPECS.PAID),
  REJECTED: statusStyle(QUOTE_STATUS_SPECS.REJECTED),
  EXPIRED: statusStyle(QUOTE_STATUS_SPECS.EXPIRED),
  INVOICED: statusStyle(QUOTE_STATUS_SPECS.INVOICED),
};

const quoteFallbackStyle = (status: string): StatusStyle => ({
  label: status || 'Desconocido',
  color: colors.textMuted,
  soft: colors.surfaceMuted,
  icon: 'help-circle-outline',
});

export const quoteStatusStyle = (status: string): StatusStyle => {
  const spec = (QUOTE_STATUS_SPECS as Record<string, StatusSpec | undefined>)[status];
  return spec ? statusStyle(spec) : quoteFallbackStyle(status);
};

/** Variante para impresión (siempre modo claro). */
export const printQuoteStatusStyle = (status: string): StatusStyle => {
  const spec = (QUOTE_STATUS_SPECS as Record<string, StatusSpec | undefined>)[status];
  return spec ? lightStatus(spec) : quoteFallbackStyle(status);
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

const PAYMENT_METHOD_SPECS: Record<PaymentMethod, StatusSpec> = {
  CASH: {
    label: 'Efectivo',
    icon: 'cash',
    light: { color: '#006D44', soft: '#94F8BE' },
    dark: { color: '#8FE3AE', soft: 'rgba(143, 227, 174, 0.16)' },
  },
  CREDIT_CARD: {
    label: 'Tarjeta de Crédito',
    icon: 'credit-card',
    light: { color: '#0052FF', soft: '#DCE1FF' },
    dark: { color: '#B4C5FF', soft: 'rgba(180, 197, 255, 0.16)' },
  },
  DEBIT_CARD: {
    label: 'Tarjeta de Débito',
    icon: 'credit-card-outline',
    light: { color: '#0052FF', soft: '#DCE1FF' },
    dark: { color: '#B4C5FF', soft: 'rgba(180, 197, 255, 0.16)' },
  },
  TRANSFER: {
    label: 'Transferencia',
    icon: 'bank-transfer',
    light: { color: '#4A6267', soft: '#CFE6EC' },
    dark: { color: '#A8D5DF', soft: 'rgba(168, 213, 223, 0.16)' },
  },
  YAPE: {
    label: 'Yape',
    icon: 'cellphone',
    light: { color: '#6B21A8', soft: '#F3E8FF' },
    dark: { color: '#D3B8F5', soft: 'rgba(211, 184, 245, 0.16)' },
  },
  PLIN: {
    label: 'Plin',
    icon: 'cellphone',
    light: { color: '#00838F', soft: '#E0F7FA' },
    dark: { color: '#86D9E6', soft: 'rgba(134, 217, 230, 0.16)' },
  },
};

export const PAYMENT_METHOD: Record<PaymentMethod, StatusStyle> = {
  CASH: statusStyle(PAYMENT_METHOD_SPECS.CASH),
  CREDIT_CARD: statusStyle(PAYMENT_METHOD_SPECS.CREDIT_CARD),
  DEBIT_CARD: statusStyle(PAYMENT_METHOD_SPECS.DEBIT_CARD),
  TRANSFER: statusStyle(PAYMENT_METHOD_SPECS.TRANSFER),
  YAPE: statusStyle(PAYMENT_METHOD_SPECS.YAPE),
  PLIN: statusStyle(PAYMENT_METHOD_SPECS.PLIN),
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
