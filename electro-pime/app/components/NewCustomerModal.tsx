import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../theme';
import { api } from '../services/api';
import { Customer, CreateCustomerDto } from '../types/api';

interface NewCustomerModalProps {
  visible: boolean;
  initialName?: string;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

const DOC_TYPES = [
  { value: 'dni', label: 'DNI' },
  { value: 'ruc', label: 'RUC' },
  { value: 'ce', label: 'CE' },
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
      // El backend devuelve 409 con mensaje de duplicado
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nuevo cliente</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
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

          <Text style={styles.label}>Nombre completo *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Juan Pérez"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Tipo de documento *</Text>
          <View style={styles.docTypeRow}>
            {DOC_TYPES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.docTypeBtn, documentType === d.value && styles.docTypeBtnActive]}
                onPress={() => setDocumentType(d.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.docTypeText,
                    documentType === d.value && styles.docTypeTextActive,
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Número de documento *</Text>
          <TextInput
            style={styles.input}
            value={documentNumber}
            onChangeText={setDocumentNumber}
            placeholder="DNI / RUC / CE"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Teléfono *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="9 dígitos"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Correo (opcional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Dirección (opcional)</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Dirección"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={20} color={colors.white} />
                <Text style={styles.saveBtnText}>Registrar cliente</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 32,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.button,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 44,
  },
  docTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  docTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  docTypeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  docTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  docTypeTextActive: {
    color: colors.white,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.button,
    borderCurve: 'continuous',
    marginTop: 20,
    minHeight: 48,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});