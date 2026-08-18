import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { spacing, radii, shadows } from '../../../constants/theme';

type CardVariant = 'elevated' | 'outlined' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: number;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'elevated',
  padding = spacing.base,
  style,
}: CardProps) {
  const { theme } = useTheme();

  const variantStyle = {
    elevated: {
      backgroundColor: theme.card,
      borderWidth: 0,
      ...shadows.md,
    },
    outlined: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      ...shadows.none,
    },
    flat: {
      backgroundColor: theme.surfaceVariant,
      borderWidth: 0,
      ...shadows.none,
    },
  };

  return (
    <View
      style={[
        styles.container,
        variantStyle[variant],
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
  },
});
