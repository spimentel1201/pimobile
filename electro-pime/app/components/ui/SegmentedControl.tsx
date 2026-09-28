import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Control segmentado estilo iOS: pista surfaceMuted radio 999,
 * opción activa en blanco con sombra.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.track, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.85}
            >
              <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    minHeight: 36,
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: colors.surface,
    ...shadow,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
