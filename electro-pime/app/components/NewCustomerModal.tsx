import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Customer } from '../types/customer';

interface NewCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
}

const NewCustomerModal = ({ visible, onClose, onSave }: NewCustomerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    documentType: 'dni' as 'dni' | 'ruc',
    documentNumber: '',
  });

  const handleSave = () => {
    onSave({
      ...formData,
      status: 'active',
      totalOrders: 0,
      totalSpent: 0,
      lastOrder: new Date().toISOString().split('T')[0],
      photo: `https://api.dicebear.com/7.x/avataaars/png?seed=${formData.name}`,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo Cliente</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de Documento</Text>
              <View style={styles.documentTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.documentTypeButton,
                    formData.documentType === 'dni' && styles.documentTypeActive,
                  ]}
                  onPress={() => setFormData({ ...formData, documentType: 'dni' })}
                >
                  <Text style={[
                    styles.documentTypeText,
                    formData.documentType === 'dni' && styles.documentTypeTextActive,
                  ]}>DNI</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.documentTypeButton,
                    formData.documentType === 'ruc' && styles.documentTypeActive,
                  ]}
                  onPress={() => setFormData({ ...formData, documentType: 'ruc' })}
                >
                  <Text style={[
                    styles.documentTypeText,
                    formData.documentType === 'ruc' && styles.documentTypeTextActive,
                  ]}>RUC</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Número de Documento</Text>
              <TextInput
                style={styles.input}
                value={formData.documentNumber}
                onChangeText={(text) => setFormData({ ...formData, documentNumber: text })}
                keyboardType="numeric"
                maxLength={formData.documentType === 'dni' ? 8 : 11}
                placeholder={formData.documentType === 'dni' ? "12345678" : "20123456789"}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Juan Pérez"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="juan@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="612345678"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Calle Principal 123"
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar Cliente</Text>
          </TouchableOpacity>
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
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '90%',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  formContainer: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  documentTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  documentTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    alignItems: 'center',
  },
  documentTypeActive: {
    backgroundColor: '#0056b3',
    borderColor: '#0056b3',
  },
  documentTypeText: {
    fontSize: 16,
    color: '#212529',
  },
  documentTypeTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NewCustomerModal;