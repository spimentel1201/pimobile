import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../constants/theme';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  RECEIVED: { label: 'Recibido', color: colors.gray[500], bg: colors.gray[100] },
  DIAGNOSED: { label: 'Diagnosticado', color: colors.primary, bg: colors.primaryLight },
  IN_PROGRESS: { label: 'En Progreso', color: colors.warningDark, bg: colors.warningLight },
  WAITING_FOR_PARTS: { label: 'Esperando', color: '#7C3AED', bg: '#EDE9FE' },
  COMPLETED: { label: 'Completado', color: colors.successDark, bg: colors.successLight },
  DELIVERED: { label: 'Entregado', color: colors.success, bg: colors.successLight },
  CANCELLED: { label: 'Cancelado', color: colors.error, bg: colors.errorLight },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.RECEIVED;

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});

export const STATUS_COLORS = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, val]) => [key, val.color])
);

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, val]) => [key, val.label])
);
