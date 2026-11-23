// ponytail: M3 NewCustomerModal with M3TextFields, document type chips, and Electric Blue styling
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../theme';
import { api } from '../services/api';
import { Customer, CreateCustomerDto } from '../types/api';
import M3TextField from './ui/M3TextField';

interface NewCustomerModalProps {
  visible: boolean;
  initialName?: string;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

const DOC_TYPES = [
  { value: 'dni', label: 'DNI (8 dígitos)' },
  { value: 'ruc', label: 'RUC (11 dígitos)' },
  { value: 'ce', label: 'C.E.' },
];

export default function NewCustomerModal({
  visible,
  initialName = '',
  onClose,
  onCreated,
}: NewCustomerModalProps) {
  const [name, setName] = useState(initialName);
  const [documentType, setDocumentType] = useState('dni');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(initialName || '');
      setDocumentType('dni');
      setDocumentNumber('');
      setPhone('');
      setEmail('');
      setAddress('');
      setError(null);
      setSaving(false);
    }
  }, [visible, initialName]);

  const handleSave = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!phone.trim()) {
      setError('El teléfono es obligatorio');
      return;
    }
    if (!documentNumber.trim()) {
      setError('El número de documento es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateCustomerDto = {
        name: trimmedName,
        phone: phone.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
      };
      if (email.trim()) payload.email = email.trim();
      if (address.trim()) payload.address = address.trim();

      const created = await api.createCustomer(payload);
      onCreated(created);
      onClose();
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        'No se pudo registrar el cliente';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconCircle}>
              <MaterialCommunityIcons name="account-plus" size={22} color={colors.primary} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.title}>Registrar Nuevo Cliente</Text>
              <Text style={styles.subtitle}>Se asignará automáticamente a la orden</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              android_ripple={{ color: 'rgba(0, 82, 255, 0.12)', borderless: true, radius: 20 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {error ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <M3TextField
              label="Nombre completo *"
              placeholder="Ej. Juan Pérez Soto"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              leadingIcon="account-outline"
            />

            {/* Document Type Selector Chips */}
            <Text style={styles.fieldLabel}>Tipo de documento *</Text>
            <View style={styles.docTypesRow}>
              {DOC_TYPES.map((dt) => {
                const isSelected = documentType === dt.value;
                return (
                  <Pressable
                    key={dt.value}
                    style={[styles.docTypeChip, isSelected && styles.docTypeChipSelected]}
                    onPress={() => setDocumentType(dt.value)}
                    android_ripple={{ color: 'rgba(0, 82, 255, 0.15)' }}
                  >
                    <Text style={[styles.docTypeChipText, isSelected && styles.docTypeChipTextSelected]}>
                      {dt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <M3TextField
              label="Número de documento *"
              placeholder="Ej. 72345678"
              value={documentNumber}
              onChangeText={setDocumentNumber}
              keyboardType="numeric"
              leadingIcon="card-account-details-outline"
            />

            <M3TextField
              label="Teléfono / WhatsApp *"
              placeholder="Ej. 987654321"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leadingIcon="phone-outline"
            />

            <M3TextField
              label="Correo electrónico (opcional)"
              placeholder="cliente@ejemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leadingIcon="email-outline"
            />

            <M3TextField
              label="Dirección (opcional)"
              placeholder="Av. Principal 123, Urb..."
              value={address}
              onChangeText={setAddress}
              leadingIcon="map-marker-outline"
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color={colors.white} />
                  <Text style={styles.saveBtnText}>Guardar y Asignar</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radii.full,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
  },
  fieldLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  docTypesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  docTypeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  docTypeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  docTypeChipText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  docTypeChipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...typography.labelLarge,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    ...typography.labelLarge,
    color: colors.white,
    fontWeight: '700',
  },
});
