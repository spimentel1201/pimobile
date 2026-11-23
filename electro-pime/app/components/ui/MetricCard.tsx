// ponytail: M3 Metric Card with tonal container and circular icon badge
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, tonalElevation, spacing, typography } from '../../theme';

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
                  ? 'rgba(255,255,255,0.2)'
                  : iconBg || colors.primarySoft,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={18}
              color={isHero ? colors.white : iconColor || colors.primary}
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

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.md,
    flex: 1,
  },
  hero: {
    backgroundColor: colors.primary,
    ...tonalElevation.level2,
  },
  tonal: {
    backgroundColor: colors.surfaceContainer,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(195, 199, 208, 0.4)',
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
    color: 'rgba(255, 255, 255, 0.85)',
  },
  value: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  valueHero: {
    color: colors.white,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  subtitleHero: {
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
});
