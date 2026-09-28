import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typography } from '../../theme';

interface MetricCardProps {
  label: string;
  value: string;
  /** Variante hero: fondo primary, texto blanco (para el KPI principal) */
  variant?: 'hero' | 'default';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/**
 * Card de métrica/KPI.
 * - hero: fondo primary con texto blanco — reservada para el dato más importante.
 * - default: card blanca secundaria.
 */
export default function MetricCard({ label, value, variant = 'default', icon, style }: MetricCardProps) {
  const isHero = variant === 'hero';

  return (
    <View
      style={[
        styles.card,
        isHero ? styles.hero : styles.default,
        style,
      ]}
    >
      <View style={styles.labelRow}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={14}
            color={isHero ? colors.white : colors.textMuted}
          />
        )}
        <Text style={[styles.label, isHero && styles.labelHero]}>{label}</Text>
      </View>
      <Text style={[styles.value, isHero && styles.valueHero]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.lg,
    flex: 1,
  },
  hero: {
    backgroundColor: colors.primary,
    ...shadow,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.micro,
  },
  labelHero: {
    color: 'rgba(255,255,255,0.75)',
  },
  value: {
    ...typography.display,
    fontSize: 24,
  },
  valueHero: {
    color: colors.white,
  },
});
