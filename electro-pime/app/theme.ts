import { TextStyle, ViewStyle, StyleSheet } from 'react-native';

// ============================================================
// Design Tokens — "Taller Eléctrico Premium"
// Única fuente de verdad para todo el rediseño de UI.
// Ver UI_REDESIGN_PLAN.md para el plan completo.
// ============================================================

export const colors = {
  // Superficies
  surface: '#FFFFFF',
  surfaceMuted: '#F6F7F9',
  canvas: '#F2F4F7',

  // Bordes
  border: '#E4E7EC',
  borderStrong: '#D0D5DD',

  // Texto
  textPrimary: '#101828',
  textSecondary: '#475467',
  textMuted: '#98A2B3',

  // Primario (reemplaza todo uso de #3B82F6 / #2563eb)
  primary: '#1D4ED8',
  primarySoft: '#EFF4FF',

  // Semánticos — siempre en pareja color + soft
  success: '#067647',
  successSoft: '#ECFDF3',
  warning: '#B54708',
  warningSoft: '#FFFAEB',
  danger: '#B42318',
  dangerSoft: '#FEF3F2',
  violet: '#5925DC',
  violetSoft: '#F4F3FF',

  // Blancos sobre superficies sólidas (primary/success)
  white: '#FFFFFF',
} as const;

export const typography = {
  display: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  bodyStrong: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  } as TextStyle,
  micro: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  } as TextStyle,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  card: 16,
  button: 12,
  input: 12,
  pill: 999,
  sheet: 20,
} as const;

// Sombra única — prohibida la mezcla de elevaciones
export const shadow: ViewStyle = {
  shadowColor: colors.textPrimary,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 1,
};

// ============================================================
// Mapa semántico de estados de órdenes de reparación
// Definido UNA sola vez — lo consumen dashboard, órdenes y detalle.
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
}

export const ORDER_STATUS: Record<RepairOrderStatus, StatusStyle> = {
  RECEIVED: { label: 'Recibido', color: colors.textSecondary, soft: colors.surfaceMuted },
  DIAGNOSED: { label: 'Diagnosticado', color: colors.violet, soft: colors.violetSoft },
  IN_PROGRESS: { label: 'En Progreso', color: colors.primary, soft: colors.primarySoft },
  WAITING_FOR_PARTS: { label: 'Esperando Repuestos', color: colors.warning, soft: colors.warningSoft },
  COMPLETED: { label: 'Completado', color: colors.success, soft: colors.successSoft },
  DELIVERED: { label: 'Entregado', color: '#054F31', soft: colors.successSoft },
  CANCELLED: { label: 'Cancelado', color: colors.danger, soft: colors.dangerSoft },
};

// ============================================================
// Estados de presupuestos (quotes)
// ============================================================

export type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export const QUOTE_STATUS: Record<QuoteStatus, StatusStyle> = {
  PENDING: { label: 'Pendiente', color: colors.warning, soft: colors.warningSoft },
  APPROVED: { label: 'Aprobado', color: colors.success, soft: colors.successSoft },
  REJECTED: { label: 'Rechazado', color: colors.danger, soft: colors.dangerSoft },
  EXPIRED: { label: 'Expirado', color: colors.textMuted, soft: colors.surfaceMuted },
};

// ============================================================
// Métodos de pago — dot de color por método (Ventas)
// ============================================================

export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'TRANSFER'
  | 'YAPE'
  | 'PLIN';

export const PAYMENT_METHOD: Record<PaymentMethod, StatusStyle> = {
  CASH: { label: 'Efectivo', color: colors.success, soft: colors.successSoft },
  CREDIT_CARD: { label: 'Tarjeta de Crédito', color: colors.primary, soft: colors.primarySoft },
  DEBIT_CARD: { label: 'Tarjeta de Débito', color: colors.primary, soft: colors.primarySoft },
  TRANSFER: { label: 'Transferencia', color: colors.textSecondary, soft: colors.surfaceMuted },
  YAPE: { label: 'Yape', color: colors.violet, soft: colors.violetSoft },
  PLIN: { label: 'Plin', color: colors.violet, soft: colors.violetSoft },
};

// Utilidad: hoja de estilos base para pantallas que consumen tokens
export const themedStyles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
