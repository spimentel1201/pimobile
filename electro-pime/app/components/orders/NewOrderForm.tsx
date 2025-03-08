import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { styles } from '../../styles/components/orders/newOrderForm';
import { RepairOrder } from '../../types/budget';
import { FormSection } from '../common/FormSection';
import { FormInput } from '../common/FormInput';

interface NewOrderFormProps {
  onClose: () => void;
  editingOrder: RepairOrder | null;
  handleSubmit: (formData: any) => void;
}

export const NewOrderForm: React.FC<NewOrderFormProps> = ({
  onClose,
  editingOrder,
  handleSubmit
}) => {
  const [formData, setFormData] = useState({
    customer: {
      name: editingOrder?.customer?.name || '',
      phone: editingOrder?.customer?.phone || '',
      email: editingOrder?.customer?.email || ''
    },
    device: {
      brand: editingOrder?.device?.brand || '',
      model: editingOrder?.device?.model || '',
      serialNumber: editingOrder?.device?.serialNumber || '',
      issue: editingOrder?.device?.issue || '',
      condition: editingOrder?.device?.condition || ''
    },
    priority: editingOrder?.priority || 'medium',
    notes: editingOrder?.notes || ''
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {editingOrder ? 'Editar Orden' : 'Nueva Orden'}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <FormSection title="Información del Cliente">
          <FormInput
            placeholder="Nombre del cliente"
            value={formData.customer.name}
            onChangeText={text => setFormData({
              ...formData,
              customer: { ...formData.customer, name: text }
            })}
          />
          <FormInput
            placeholder="Teléfono"
            value={formData.customer.phone}
            keyboardType="phone-pad"
            onChangeText={text => setFormData({
              ...formData,
              customer: { ...formData.customer, phone: text }
            })}
          />
          <FormInput
            placeholder="Email"
            value={formData.customer.email}
            keyboardType="email-address"
            onChangeText={text => setFormData({
              ...formData,
              customer: { ...formData.customer, email: text }
            })}
          />
        </FormSection>

        <FormSection title="Información del Dispositivo">
          <FormInput
            placeholder="Marca"
            value={formData.device.brand}
            onChangeText={text => setFormData({
              ...formData,
              device: { ...formData.device, brand: text }
            })}
          />
          <FormInput
            placeholder="Modelo"
            value={formData.device.model}
            onChangeText={text => setFormData({
              ...formData,
              device: { ...formData.device, model: text }
            })}
          />
          <FormInput
            placeholder="Número de Serie"
            value={formData.device.serialNumber}
            onChangeText={text => setFormData({
              ...formData,
              device: { ...formData.device, serialNumber: text }
            })}
          />
          <FormInput
            placeholder="Problema"
            value={formData.device.issue}
            multiline
            numberOfLines={3}
            style={styles.textArea}
            onChangeText={text => setFormData({
              ...formData,
              device: { ...formData.device, issue: text }
            })}
          />
        </FormSection>

        <FormSection title="Prioridad">
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.priority}
              onValueChange={value => setFormData({
                ...formData,
                priority: value
              })}
              style={styles.picker}
            >
              <Picker.Item label="Alta" value="high" />
              <Picker.Item label="Media" value="medium" />
              <Picker.Item label="Baja" value="low" />
            </Picker>
          </View>
        </FormSection>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => handleSubmit(formData)}
        >
          <Text style={styles.submitButtonText}>
            {editingOrder ? 'Actualizar' : 'Crear'} Orden
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};