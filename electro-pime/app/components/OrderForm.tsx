import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

// Import types
import { 
  ServiceOrder, 
  ServiceOrderInput, 
  Device, 
  User,
  ServiceOrderStatus
} from '../types/api';

interface OrderFormProps {
  initialData?: Partial<ServiceOrder>;
  onSubmit: (data: ServiceOrderInput) => Promise<void>;
  loading: boolean;
  devices: Device[];
  customers: User[];
  technicians: User[];
}

export default function OrderForm({
  initialData,
  onSubmit,
  loading,
  devices,
  customers,
  technicians,
}: OrderFormProps) {
  const [formData, setFormData] = useState<ServiceOrderInput>({
    deviceId: '',
    customerId: '',
    description: '',
    status: 'pending',
    diagnosis: '',
    repairDetails: '',
    cost: undefined,
    estimatedCompletion: undefined,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        deviceId: initialData.deviceId || '',
        customerId: initialData.customerId || '',
        description: initialData.description || '',
        status: initialData.status || 'pending',
        diagnosis: initialData.diagnosis || '',
        repairDetails: initialData.repairDetails || '',
        cost: initialData.cost,
        estimatedCompletion: initialData.estimatedCompletion,
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof ServiceOrderInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'No se pudo guardar la orden');
    }
  };

  const selectedDevice = devices.find(d => d.id === formData.deviceId);
  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const selectedTechnician = technicians.find(t => t.id === formData.technicianId);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Cliente</Text>
        <View style={styles.selectContainer}>
          <Text style={styles.label}>Cliente *</Text>
          <TouchableOpacity 
            style={styles.select}
            onPress={() => {}}
          >
            <Text style={selectedCustomer ? styles.selectText : styles.placeholderText}>
              {selectedCustomer ? selectedCustomer.name : 'Seleccionar cliente'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.selectContainer}>
          <Text style={styles.label}>Dispositivo *</Text>
          <TouchableOpacity 
            style={styles.select}
            onPress={() => {}}
          >
            <Text style={selectedDevice ? styles.selectText : styles.placeholderText}>
              {selectedDevice ? `${selectedDevice.name} - ${selectedDevice.brand}` : 'Seleccionar dispositivo'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {selectedDevice && (
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceInfoText}>
              <Text style={styles.bold}>Marca:</Text> {selectedDevice.brand}
            </Text>
            <Text style={styles.deviceInfoText}>
              <Text style={styles.bold}>Modelo:</Text> {selectedDevice.model}
            </Text>
            {selectedDevice.serialNumber && (
              <Text style={styles.deviceInfoText}>
                <Text style={styles.bold}>N° de serie:</Text> {selectedDevice.serialNumber}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles de la Orden</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descripción del problema *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describa el problema que presenta el dispositivo"
            value={formData.description}
            onChangeText={(text) => handleChange('description', text)}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Diagnóstico</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Diagnóstico del problema"
            value={formData.diagnosis}
            onChangeText={(text) => handleChange('diagnosis', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Detalles de la reparación</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detalles del trabajo realizado"
            value={formData.repairDetails}
            onChangeText={(text) => handleChange('repairDetails', text)}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Adicional</Text>
        
        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Costo estimado</Text>
            <View style={styles.currencyInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.currencyInputField]}
                placeholder="0.00"
                value={formData.cost?.toString() || ''}
                onChangeText={(text) => {
                  const value = parseFloat(text) || undefined;
                  handleChange('cost', value);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Fecha estimada</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={formData.estimatedCompletion ? styles.dateText : styles.placeholderText}>
                {formData.estimatedCompletion 
                  ? format(new Date(formData.estimatedCompletion), 'PPP', { locale: es })
                  : 'Seleccionar fecha'}
              </Text>
              <MaterialIcons name="event" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.selectContainer}>
          <Text style={styles.label}>Técnico asignado</Text>
          <TouchableOpacity 
            style={styles.select}
            onPress={() => {}}
          >
            <Text style={selectedTechnician ? styles.selectText : styles.placeholderText}>
              {selectedTechnician ? selectedTechnician.name : 'Asignar técnico'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.selectContainer}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.select}>
            <Text style={styles.selectText}>
              {{
                pending: 'Pendiente',
                in_progress: 'En Progreso',
                waiting_approval: 'Esperando Aprobación',
                completed: 'Completado',
                cancelled: 'Cancelado',
              }[formData.status || 'pending']}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {initialData ? 'Actualizar Orden' : 'Crear Orden'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.estimatedCompletion ? new Date(formData.estimatedCompletion) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              handleChange('estimatedCompletion', selectedDate.toISOString());
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectContainer: {
    marginBottom: 16,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  deviceInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  deviceInfoText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '600',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  currencySymbol: {
    padding: 12,
    fontSize: 16,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  currencyInputField: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
