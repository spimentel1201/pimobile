// ponytail: M3 Dialog with 28dp radius, tonal icon header and text actions
import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { colors, radii, spacing, typography } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  details?: { label: string; value: string }[];
  icon?: IconName;
  tone?: 'success' | 'danger' | 'primary';
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  busy?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  details,
  icon = 'check-circle-outline',
  tone = 'success',
  destructive,
  confirmLabel = 'Aceptar',
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const effectiveTone = destructive ? 'danger' : tone;
  const palette =
    effectiveTone === 'danger'
      ? { color: colors.danger, soft: colors.dangerSoft, onColor: colors.onDanger }
      : effectiveTone === 'primary'
        ? { color: colors.primary, soft: colors.primarySoft, onColor: colors.onPrimary }
        : { color: colors.success, soft: colors.successSoft, onColor: colors.onSuccess };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel || (() => onConfirm())}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={[styles.iconBubble, { backgroundColor: palette.soft }]}>
            <MaterialCommunityIcons name={icon} size={28} color={palette.color} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          {!!details?.length && (
            <View style={styles.details}>
              {details.map((detail, index) => (
                <View
                  key={detail.label}
                  style={[styles.detailRow, index < details.length - 1 && styles.detailRowBorder]}
                >
                  <Text style={styles.detailLabel}>{detail.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {detail.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            {!!cancelLabel && onCancel && (
              <View style={styles.btnWrapper}>
                <Pressable
                  style={styles.textBtn}
                  onPress={onCancel}
                  disabled={busy}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                >
                  <Text style={styles.cancelText}>{cancelLabel}</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.btnWrapper}>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: palette.color }]}
                onPress={onConfirm}
                disabled={busy}
                android_ripple={{ color: colors.rippleOnPrimary }}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={palette.onColor} />
                ) : (
                  <Text style={[styles.confirmText, { color: palette.onColor }]}>{confirmLabel}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 24,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  details: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  btnWrapper: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  textBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    ...typography.labelLarge,
    color: colors.textSecondary,
  },
  primaryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.full,
  },
  confirmText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
});
