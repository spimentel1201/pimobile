import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Customer } from '../types/customer';
import { useTheme } from '../hooks/useTheme';
import { typography, spacing, radii, shadows } from '../constants/theme';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface NewCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
}

const NewCustomerModal = ({ visible, onClose, onSave }: NewCustomerModalProps) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    documentType: 'dni' as 'dni' | 'ruc',
    documentNumber: '',
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'El teléfono es obligatorio');
      return;
    }
    if (!formData.documentNumber.trim()) {
      Alert.alert('Error', 'El número de documento es obligatorio');
      return;
    }

    onSave({
      ...formData,
      email: formData.email.trim() || `noemail-${Date.now()}-${Math.random().toString(36).slice(2)}@placeholder.com`,
      status: 'active',
      totalOrders: 0,
      totalSpent: 0,
      lastOrder: new Date().toISOString().split('T')[0],
      photo: `https://api.dicebear.com/7.x/avataaars/png?seed=${formData.name}`,
    });
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      documentType: 'dni',
      documentNumber: '',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Nuevo Cliente</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
            {/* Document Type */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Tipo de Documento</Text>
              <View style={styles.documentTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.documentTypeButton,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                    formData.documentType === 'dni' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, documentType: 'dni' })}
                >
                  <Text style={[
                    styles.documentTypeText,
                    { color: formData.documentType === 'dni' ? '#fff' : theme.text },
                  ]}>DNI</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.documentTypeButton,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                    formData.documentType === 'ruc' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, documentType: 'ruc' })}
                >
                  <Text style={[
                    styles.documentTypeText,
                    { color: formData.documentType === 'ruc' ? '#fff' : theme.text },
                  ]}>RUC</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Document Number */}
            <Input
              label="Número de Documento"
              value={formData.documentNumber}
              onChangeText={(text) => setFormData({ ...formData, documentNumber: text })}
              keyboardType="numeric"
              maxLength={formData.documentType === 'dni' ? 8 : 11}
              placeholder={formData.documentType === 'dni' ? "12345678" : "20123456789"}
            />

            {/* Name */}
            <Input
              label="Nombre Completo *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Juan Pérez"
            />

            {/* Email */}
            <Input
              label="Correo Electrónico"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="juan@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Phone */}
            <Input
              label="Teléfono *"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="612345678"
              keyboardType="phone-pad"
            />

            {/* Address */}
            <Input
              label="Dirección"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Calle Principal 123"
            />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Button
              title="Cancelar"
              variant="secondary"
              size="md"
              onPress={onClose}
              style={styles.cancelButton}
            />
            <Button
              title="Guardar Cliente"
              variant="primary"
              size="md"
              onPress={handleSave}
              icon={<MaterialCommunityIcons name="check" size={18} color="#fff" />}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    maxHeight: '80%',
    borderRadius: radii.lg,
    ...shadows.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  formContainer: {
    flex: 1,
    padding: spacing.base,
  },
  formGroup: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  documentTypeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  documentTypeButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  documentTypeText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    padding: spacing.base,
    borderTopWidth: 1,
  },
  cancelButton: {
    minWidth: 100,
  },
});

export default NewCustomerModal;
