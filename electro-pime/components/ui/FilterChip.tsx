import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radii } from '../../constants/theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function FilterChip({ label, selected, onPress, style }: FilterChipProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: selected ? theme.primary : theme.surfaceVariant,
          borderColor: selected ? theme.primary : theme.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: selected ? '#FFFFFF' : theme.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
