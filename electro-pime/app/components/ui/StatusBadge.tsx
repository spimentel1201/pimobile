// ponytail: M3 Status Chip with semantic icon and container tone
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radii, typography } from '../../theme';

interface StatusBadgeProps {
  label: string;
  color: string;
  soft: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export default function StatusBadge({
  label,
  color,
  soft,
  icon,
  style,
  compact = false,
}: StatusBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: soft },
        compact && styles.compactBadge,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Estado: ${label}`}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon as any}
          size={compact ? 12 : 14}
          color={color}
          style={styles.icon}
        />
      ) : (
        <View style={[styles.dot, { backgroundColor: color }]} />
      )}
      <Text style={[styles.text, { color }, compact && styles.compactText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  compactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  icon: {
    marginRight: 5,
  },
  text: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  compactText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
});
