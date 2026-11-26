// ponytail: M3 Metric Card with tonal container and circular icon badge
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, tonalElevation, spacing, typography, withAlpha } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface MetricCardProps {
  label?: string;
  title?: string;
  value: string | number;
  variant?: 'hero' | 'default' | 'tonal';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  colorRole?: 'primary' | 'secondary' | 'tertiary' | string;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
}

export default function MetricCard({
  label,
  title,
  value,
  variant = 'default',
  icon,
  iconColor,
  iconBg,
  colorRole,
  style,
  subtitle,
}: MetricCardProps) {
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const displayLabel = title || label || '';
  const isHero = variant === 'hero';
  const isTonal = variant === 'tonal';

  return (
    <View
      style={[
        styles.card,
        isHero ? styles.hero : isTonal ? styles.tonal : styles.default,
        style,
      ]}
      accessibilityRole="summary"
    >
      <View style={styles.topRow}>
        {icon && (
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isHero
                  ? withAlpha(colors.onPrimary, 0.16)
                  : iconBg || colors.primarySoft,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={18}
              color={isHero ? colors.onPrimary : iconColor || colors.primary}
            />
          </View>
        )}
        <Text
          style={[styles.label, isHero && styles.labelHero]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
      </View>
      <Text style={[styles.value, isHero && styles.valueHero]} numberOfLines={1}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, isHero && styles.subtitleHero]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.md,
  },
  hero: {
    backgroundColor: colors.primary,
    ...tonalElevation.level2,
    minHeight: 96,
  },
  tonal: {
    backgroundColor: colors.surfaceContainer,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...tonalElevation.level1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  label: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    flex: 1,
  },
  labelHero: {
    color: withAlpha(colors.onPrimary, 0.82),
  },
  value: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  valueHero: {
    color: colors.onPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  subtitleHero: {
    color: withAlpha(colors.onPrimary, 0.72),
    marginTop: 2,
  },
});
