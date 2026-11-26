// ponytail: M3 Card with ripple and tonal elevation variants
import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { colors, radii, tonalElevation, spacing } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'filled' | 'outlined';
  accentColor?: string;
  onPress?: () => void;
  activeOpacity?: number;
}

export default function Card({
  children,
  style,
  variant = 'elevated',
  accentColor,
  onPress,
}: CardProps) {
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const content = accentColor ? (
    <View style={styles.row}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>{children}</View>
    </View>
  ) : (
    children
  );

  const variantStyle =
    variant === 'filled'
      ? styles.filled
      : variant === 'outlined'
        ? styles.outlined
        : styles.elevated;

  if (onPress) {
    return (
      <View style={[styles.card, variantStyle, style]}>
        <Pressable
          onPress={onPress}
          android_ripple={{ color: 'rgba(0, 82, 255, 0.08)', foreground: true }}
          style={({ pressed }) => [
            styles.pressable,
            Platform.OS !== 'android' && pressed && styles.pressed,
          ]}
        >
          {content}
        </Pressable>
      </View>
    );
  }

  return <View style={[styles.card, variantStyle, style]}>{content}</View>;
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  pressable: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
  },
  elevated: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(195, 199, 208, 0.4)',
    ...tonalElevation.level1,
  },
  filled: {
    backgroundColor: colors.surfaceContainer,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
