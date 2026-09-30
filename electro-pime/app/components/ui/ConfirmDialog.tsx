import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { colors, radii, shadow, spacing, typography } from '../../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Detalle opcional (líneas clave→valor) del resumen */
  details?: { label: string; value: string }[];
  icon?: IconName;
  tone?: 'success' | 'danger' | 'primary';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  /** Cuando es true el botón de confirmar queda deshabilitado (ej. procesando) */
  busy?: boolean;
}

/**
 * Diálogo de confirmación estilo Android (Material): superficie elevada,
 * icono circular, título, mensaje y hasta dos acciones de texto.
 * Sustituye a Alert.alert, que no está implementado en react-native-web.
 */
export default function ConfirmDialog({
  visible,
  title,
  message,
  details,
  icon = 'check-circle-outline',
  tone = 'success',
  confirmLabel = 'Aceptar',
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  const palette =
    tone === 'danger'
      ? { color: colors.danger, soft: colors.dangerSoft }
      : tone === 'primary'
        ? { color: colors.primary, soft: colors.primarySoft }
        : { color: colors.success, soft: colors.successSoft };

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
              <TouchableOpacity
                style={[styles.action, styles.actionGhost]}
                onPress={onCancel}
                activeOpacity={0.85}
                disabled={busy}
              >
                <Text style={styles.actionGhostText}>{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.action, styles.actionPrimary, busy && styles.actionDisabled]}
              onPress={onConfirm}
              activeOpacity={0.85}
              disabled={busy}
            >
              <Text style={styles.actionPrimaryText}>
                {busy ? 'Procesando…' : confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    padding: spacing.xl,
    ...shadow,
    elevation: 12,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    alignSelf: 'center',
  },
  title: {
    ...typography.title,
    fontSize: 19,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  details: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.button,
    minHeight: 44,
  },
  actionGhost: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionGhostText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});