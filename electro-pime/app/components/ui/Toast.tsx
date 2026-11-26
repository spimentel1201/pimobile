import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const background = type === 'success' ? colors.success : colors.danger;
  const textColor = type === 'success' ? colors.onSuccess : colors.onDanger;
  const icon = type === 'success' ? 'check-circle' : 'alert-circle';

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View style={[styles.toast, { backgroundColor: background }]}>
        <MaterialCommunityIcons name={icon} size={18} color={textColor} />
        <Text style={[styles.text, { color: textColor }]}>{message}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    flexShrink: 1,
  },
});
