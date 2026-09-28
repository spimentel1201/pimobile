import React from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, shadow } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Barra de color opcional en el borde izquierdo (StatusPillBar integrado) */
  accentColor?: string;
  onPress?: () => void;
  activeOpacity?: number;
}

/**
 * Card base: superficie + radio 16 + borde 1px + sombra única del tema.
 * Con `onPress` se vuelve tocable (activeOpacity 0.85).
 * Con `accentColor` muestra la barra de estado de 4px en el borde izquierdo.
 */
export default function Card({ children, style, accentColor, onPress, activeOpacity = 0.85 }: CardProps) {
  const content = accentColor ? (
    <View style={styles.row}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>{children}</View>
    </View>
  ) : (
    children
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
  },
});
