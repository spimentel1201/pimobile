// ponytail: M3 Empty State with tonal circular icon and ripple CTA
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, spacing, typography, withAlpha } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const activeLabel = ctaLabel || actionLabel;
  const activeAction = onCta || onAction;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={36} color={colors.onPrimaryContainer} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {activeLabel && activeAction && (
        <View style={styles.ctaWrapper}>
          <Pressable
            style={styles.cta}
            onPress={activeAction}
            android_ripple={{ color: withAlpha(colors.onPrimary, 0.2) }}
          >
            <Text style={styles.ctaText}>{activeLabel}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
    lineHeight: 20,
  },
  ctaWrapper: {
    marginTop: spacing.lg,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  cta: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '600',
  },
});
