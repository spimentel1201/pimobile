import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typography } from '../../theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
}

/**
 * Mensaje rápido flotante en la parte superior de la pantalla.
 * Sustituye a Alert.alert, que no está implementado en react-native-web
 * (en web Alert.alert no muestra nada).
 */
export default function Toast({ message, type = 'success' }: ToastProps) {
  const background = type === 'success' ? colors.success : colors.danger;
  const icon = type === 'success' ? 'check-circle' : 'alert-circle';

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View style={[styles.toast, { backgroundColor: background }]}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.white} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    maxWidth: '92%',
    ...shadow,
  },
  text: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.white,
    flexShrink: 1,
  },
});
