// ponytail: M3 Extended FAB with tonal container and ripple
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, tonalElevation, spacing, typography } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface M3FabProps {
  label?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'surface';
  extended?: boolean;
}

export default function M3Fab({
  label,
  icon,
  onPress,
  style,
  variant = 'primary',
  extended = true,
}: M3FabProps) {
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const bgColor = isPrimary
    ? colors.primary
    : isSecondary
      ? colors.secondary
      : colors.surfaceContainerHigh;

  const textColor = isPrimary || isSecondary ? colors.white : colors.primary;

  return (
    <View style={[styles.fabContainer, { backgroundColor: bgColor }, style]}>
      <Pressable
        onPress={onPress}
        style={[styles.pressable, !extended && styles.pressableIconOnly]}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.25)' }}
        accessibilityRole="button"
        accessibilityLabel={label || 'Acción flotante'}
      >
        <MaterialCommunityIcons name={icon} size={24} color={textColor} />
        {extended && label && (
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  fabContainer: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...tonalElevation.level3,
    minHeight: 56,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  pressableIconOnly: {
    paddingHorizontal: spacing.lg,
    width: 56,
    height: 56,
    justifyContent: 'center',
  },
  label: {
    ...typography.labelLarge,
    fontWeight: '700',
    marginLeft: spacing.sm,
    letterSpacing: 0.2,
  },
});
