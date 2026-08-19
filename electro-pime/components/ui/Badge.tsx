import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, radii } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; bgDark: string; textDark: string }> = {
  default: { bg: colors.gray[100], text: colors.gray[600], bgDark: colors.gray[700], textDark: colors.gray[300] },
  primary: { bg: colors.primaryLight, text: colors.primary, bgDark: '#1E3A5F', textDark: '#60A5FA' },
  success: { bg: colors.successLight, text: colors.successDark, bgDark: '#064E3B', textDark: '#34D399' },
  warning: { bg: colors.warningLight, text: colors.warningDark, bgDark: '#78350F', textDark: '#FCD34D' },
  error: { bg: colors.errorLight, text: colors.errorDark, bgDark: '#7F1D1D', textDark: '#FCA5A5' },
  info: { bg: colors.infoLight, text: colors.infoDark, bgDark: '#1E1B4B', textDark: '#A5B4FC' },
};

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  style,
}: BadgeProps) {
  const { colorScheme } = useTheme();
  const v = variantStyles[variant];
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        size === 'md' ? styles.md : styles.sm,
        { backgroundColor: isDark ? v.bgDark : v.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'md' ? styles.textMd : styles.textSm,
          { color: isDark ? v.textDark : v.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  textSm: {
    fontSize: typography.sizes.xs,
  },
  textMd: {
    fontSize: typography.sizes.sm,
  },
});
