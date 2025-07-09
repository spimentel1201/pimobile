import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type DeviceItem = {
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  problemDescription: string;
  accessories: string[];
  quantity: number;
  price: number;
  productId: string;
};

type OrderFormData = {
  customerId: string;
  technicianId: string;
  status: string;
  description: string;
  notes: string;
  initialReviewCost: number;
  items: DeviceItem[];
};

export default function NewOrderScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    customerId: '',
    technicianId: '',
    status: 'RECEIVED',
    description: '',
    notes: '',
    initialReviewCost: 0,
    items: [{
      deviceType: '',
      brand: '',
      model: '',
      serialNumber: '',
      problemDescription: '',
      accessories: [],
      quantity: 1,
      price: 0,
      productId: ''
    }]
  });

  const handleInputChange = (field: keyof OrderFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeviceChange = (index: number, field: keyof DeviceItem, value: string | number | string[]) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addNewDevice = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          deviceType: '',
          brand: '',
          model: '',
          serialNumber: '',
          problemDescription: '',
          accessories: [],
          quantity: 1,
          price: 0,
          productId: ''
        }
      ]
    }));
  };

  const removeDevice = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.customerId.trim()) {
      Alert.alert('Error', 'Por favor ingrese el ID del cliente');
      return false;
    }
    if (!formData.items.some(item => item.deviceType && item.brand && item.model)) {
      Alert.alert('Error', 'Por favor complete al menos un equipo con tipo, marca y modelo');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      // Aquí iría la llamada a la API
      console.log('Enviando orden:', formData);
      // Simulamos un retraso de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      // await api.post('/orders', formData);
      Alert.alert('Éxito', 'Orden de reparación creada correctamente');
      router.back();
    } catch (error) {
      console.error('Error al crear la orden:', error);
      Alert.alert('Error', 'No se pudo crear la orden de reparación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDeviceForm = (item: DeviceItem, index: number) => (
    <View key={index} style={styles.deviceContainer}>
      <View style={styles.deviceHeader}>
        <Text style={styles.deviceTitle}>Equipo {index + 1}</Text>
        {formData.items.length > 1 && (
          <TouchableOpacity onPress={() => removeDevice(index)}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.label}>Tipo de dispositivo</Text>
      <TextInput
        style={styles.input}
        value={item.deviceType}
        onChangeText={(text) => handleDeviceChange(index, 'deviceType', text)}
        placeholder="Ej. Teléfono, Laptop, etc."
      />

      <View style={styles.row}>
        <View style={[styles.column, { marginRight: 8 }]}>
          <Text style={styles.label}>Marca</Text>
          <TextInput
            style={styles.input}
            value={item.brand}
            onChangeText={(text) => handleDeviceChange(index, 'brand', text)}
          />
        </View>
        <View style={[styles.column, { marginLeft: 8 }]}>
          <Text style={styles.label}>Modelo</Text>
          <TextInput
            style={styles.input}
            value={item.model}
            onChangeText={(text) => handleDeviceChange(index, 'model', text)}
          />
        </View>
      </View>

      <Text style={styles.label}>Número de serie</Text>
      <TextInput
        style={styles.input}
        value={item.serialNumber}
        onChangeText={(text) => handleDeviceChange(index, 'serialNumber', text)}
      />

      <Text style={styles.label}>Descripción del problema</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={item.problemDescription}
        onChangeText={(text) => handleDeviceChange(index, 'problemDescription', text)}
        multiline
        numberOfLines={3}
      />

      <View style={styles.row}>
        <View style={[styles.column, { marginRight: 8 }]}>
          <Text style={styles.label}>Cantidad</Text>
          <TextInput
            style={styles.input}
            value={item.quantity.toString()}
            onChangeText={(text) => handleDeviceChange(index, 'quantity', parseInt(text) || 0)}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.column, { marginLeft: 8 }]}>
          <Text style={styles.label}>Precio</Text>
          <TextInput
            style={styles.input}
            value={item.price.toString()}
            onChangeText={(text) => handleDeviceChange(index, 'price', parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Stack.Screen 
          options={{
            headerTitle: 'Nueva Orden',
            headerLeft: () => (
              <TouchableOpacity onPress={handleCancel} style={{ marginLeft: 16 }}>
                <Text style={{ color: '#2563eb', fontSize: 16 }}>Cancelar</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-search" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="Buscar cliente por ID o nombre"
              value={formData.customerId}
              onChangeText={(text) => handleInputChange('customerId', text)}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: 'white', borderWidth: 1, borderColor: '#2563eb' }]}>
            <MaterialCommunityIcons name="plus" size={18} color="#2563eb" />
            <Text style={[styles.buttonText, { color: '#2563eb' }]}>Nuevo Cliente</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Técnico</Text>
          <TextInput
            style={styles.input}
            placeholder="ID del Técnico"
            value={formData.technicianId}
            onChangeText={(text) => handleInputChange('technicianId', text)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de la Orden</Text>
          <Text style={styles.label}>Estado</Text>
          <View style={[styles.input, styles.picker]}> 
            <Text>{formData.status}</Text>
          </View>

          <Text style={styles.label}>Descripción General</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            multiline
            numberOfLines={2}
          />

          <Text style={styles.label}>Costo de Revisión Inicial</Text>
          <TextInput
            style={styles.input}
            value={formData.initialReviewCost.toString()}
            onChangeText={(text) => handleInputChange('initialReviewCost', parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Equipos a Reparar</Text>
            <TouchableOpacity style={styles.addButton} onPress={addNewDevice}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar Equipo</Text>
            </TouchableOpacity>
          </View>
          
          {formData.items.map((item, index) => renderDeviceForm(item, index))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Orden</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  form: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    height: 48,
  },
  buttonText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
    color: '#1e293b',
  },
  inputWithIcon: {
    paddingLeft: 40,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
  },
  label: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    fontWeight: '500',
  },
  deviceContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  picker: {
    justifyContent: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 16,
  },
});
