import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radii, shadows } from '../../constants/theme';

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const variantConfig: Record<ConfirmVariant, { icon: string; iconColor: string; bg: string }> = {
  danger: { icon: 'alert-circle-outline', iconColor: '#EF4444', bg: '#FEE2E2' },
  warning: { icon: 'alert-outline', iconColor: '#F59E0B', bg: '#FEF3C7' },
  info: { icon: 'information-outline', iconColor: '#2563EB', bg: '#DBEAFE' },
  success: { icon: 'check-circle-outline', iconColor: '#10B981', bg: '#D1FAE5' },
};

const confirmVariantMap: Record<ConfirmVariant, 'danger' | 'primary' | 'success'> = {
  danger: 'danger',
  warning: 'primary',
  info: 'primary',
  success: 'success',
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'info',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { theme } = useTheme();
  const config = variantConfig[variant];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <Animated.View
          entering={FadeInDown.delay(50).springify()}
          style={[styles.dialog, { backgroundColor: theme.surface }]}
        >
          <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={28}
              color={config.iconColor}
            />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

          <View style={styles.actions}>
            {variant !== 'success' && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: theme.surfaceVariant }]}
                onPress={onCancel}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: theme.textSecondary }]}>{cancelLabel}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor:
                    variant === 'danger'
                      ? theme.error
                      : variant === 'success'
                      ? theme.success
                      : theme.primary,
                },
                loading && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dialog: {
    width: '85%',
    maxWidth: 340,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {},
  confirmButton: {},
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
