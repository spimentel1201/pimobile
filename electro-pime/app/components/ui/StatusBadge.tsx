import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, typography } from '../../theme';

interface StatusBadgeProps {
  label: string;
  /** Color principal del estado (texto + dot) */
  color: string;
  /** Color de fondo suave (pareja del color) */
  soft: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pill de estado: fondo soft + texto del color + dot de 6px.
 * Nunca fondo sólido con texto blanco.
 */
export default function StatusBadge({ label, color, soft, style }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: soft }, style]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    ...typography.micro,
    textTransform: 'none',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
