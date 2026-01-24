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
import { Ionicons } from '@expo/vector-icons';
import SearchableSelector from './SearchableSelector';
import { api } from '../services/api';
import {
  Customer,
  User,
  RepairOrder,
  CreateRepairOrderDto,
  RepairOrderItem,
  RepairOrderStatus,
} from '../types/api';

interface OrderFormProps {
  initialData?: RepairOrder;
  onSubmit: (data: CreateRepairOrderDto) => Promise<void>;
  loading: boolean;
}

const STATUS_OPTIONS: { value: RepairOrderStatus; label: string }[] = [
  { value: 'RECEIVED', label: 'Recibido' },
  { value: 'DIAGNOSED', label: 'Diagnosticado' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'WAITING_FOR_PARTS', label: 'Esperando Repuestos' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const DEVICE_TYPES = [
  'Laptop', 'TV LED', 'TV LCD', 'Control Remoto', 'Equipo de sonido',
  'Equipo Portátil', 'DVD', 'Licuadora', 'Olla arrocera', 'Horno Microondas',
  'Radio', 'Consola', 'Ventilador', 'PC de Escritorio', 'Celular', 'Tablet',
  'Monitor', 'Impresora', 'Otro'
];

const ACCESSORY_OPTIONS = [
  'Cable de Poder',
  'Pedestal (Patas)',
  'Control Remoto',
  'Cargador',
  'Base',
  'Funda/Estuche',
  'Cables HDMI',
  'Cable USB',
];

export default function OrderForm({
  initialData,
  onSubmit,
  loading,
}: OrderFormProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [initialReviewCost, setInitialReviewCost] = useState('');
  const [status, setStatus] = useState<RepairOrderStatus>('RECEIVED');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Device/Item fields
  const [deviceType, setDeviceType] = useState('');
  const [showDeviceTypePicker, setShowDeviceTypePicker] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleAccessory = (accessory: string) => {
    setSelectedAccessories(prev =>
      prev.includes(accessory)
        ? prev.filter(a => a !== accessory)
        : [...prev, accessory]
    );
  };

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      setInitialReviewCost(initialData.initialReviewCost?.toString() || '');
      setStatus(initialData.status);

      // Load first item data if exists
      if (initialData.items && initialData.items.length > 0) {
        const item = initialData.items[0];
        setDeviceType(item.deviceType);
        setBrand(item.brand);
        setModel(item.model);
        setSerialNumber(item.serialNumber || '');
        setProblemDescription(item.problemDescription);
        setSelectedAccessories(item.accessories || []);
      }
    }
  }, [initialData]);

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    if (query.length < 2) {
      return api.getCustomers();
    }
    return api.searchCustomers(query);
  };

  const searchTechnicians = async (query: string): Promise<User[]> => {
    const users = await api.getUsers();
    // Filter technicians and by query if provided
    return users.filter(user => {
      const isTechnician = user.role === 'TECHNICIAN' || user.role === 'ADMIN';
      if (!query) return isTechnician;
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return isTechnician && fullName.includes(query.toLowerCase());
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedCustomer) {
      newErrors.customer = 'El cliente es requerido';
    }
    if (!description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!deviceType) {
      newErrors.deviceType = 'El tipo de dispositivo es requerido';
    }
    if (!brand.trim()) {
      newErrors.brand = 'La marca es requerida';
    }
    if (!model.trim()) {
      newErrors.model = 'El modelo es requerido';
    }
    if (!problemDescription.trim()) {
      newErrors.problemDescription = 'La descripción del problema es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Error', 'Por favor complete los campos requeridos');
      return;
    }

    const item: Omit<RepairOrderItem, 'id' | 'repairOrderId' | 'createdAt' | 'updatedAt'> = {
      deviceType,
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim() || undefined,
      problemDescription: problemDescription.trim(),
      accessories: selectedAccessories,
      quantity: 1,
      price: undefined,
    };

    const orderData: CreateRepairOrderDto = {
      customerId: selectedCustomer!.id,
      technicianId: selectedTechnician?.id,
      status,
      description: description.trim(),
      notes: notes.trim() || undefined,
      initialReviewCost: initialReviewCost ? parseFloat(initialReviewCost) : undefined,
      items: [item],
    };

    try {
      await onSubmit(orderData);
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'No se pudo guardar la orden');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Customer Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Cliente</Text>

        <SearchableSelector<Customer>
          label="Cliente"
          placeholder="Buscar cliente por nombre, teléfono o documento..."
          value={selectedCustomer}
          onSelect={setSelectedCustomer}
          searchFn={searchCustomers}
          renderItem={(c) => c.name}
          renderSubtitle={(c) => `${c.documentType}: ${c.documentNumber} | Tel: ${c.phone}`}
          keyExtractor={(c) => c.id}
          required
        />
        {errors.customer && <Text style={styles.errorText}>{errors.customer}</Text>}
      </View>

      {/* Device Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Dispositivo</Text>

        {/* Device Type */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tipo de dispositivo <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowDeviceTypePicker(!showDeviceTypePicker)}
          >
            <Text style={deviceType ? styles.selectText : styles.placeholderText}>
              {deviceType || 'Seleccionar tipo...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showDeviceTypePicker && (
            <View style={styles.pickerDropdown}>
              {DEVICE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.pickerItem}
                  onPress={() => {
                    setDeviceType(type);
                    setShowDeviceTypePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{type}</Text>
                  {deviceType === type && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.deviceType && <Text style={styles.errorText}>{errors.deviceType}</Text>}
        </View>

        {/* Brand & Model */}
        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Marca <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Samsung, Apple..."
              value={brand}
              onChangeText={setBrand}
            />
            {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
          </View>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Modelo <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Galaxy S21, iPhone 13..."
              value={model}
              onChangeText={setModel}
            />
            {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
          </View>
        </View>

        {/* Serial Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Número de Serie (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingrese el número de serie si está disponible"
            value={serialNumber}
            onChangeText={setSerialNumber}
          />
        </View>

        {/* Problem Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descripción del problema <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describa detalladamente el problema del dispositivo"
            value={problemDescription}
            onChangeText={setProblemDescription}
            multiline
            numberOfLines={4}
          />
          {errors.problemDescription && <Text style={styles.errorText}>{errors.problemDescription}</Text>}
        </View>

        {/* Accessories */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Accesorios incluidos (opcional)</Text>
          <View style={styles.tagsContainer}>
            {ACCESSORY_OPTIONS.map((accessory) => (
              <TouchableOpacity
                key={accessory}
                style={[
                  styles.tag,
                  selectedAccessories.includes(accessory) && styles.tagSelected
                ]}
                onPress={() => toggleAccessory(accessory)}
              >
                <Text style={[
                  styles.tagText,
                  selectedAccessories.includes(accessory) && styles.tagTextSelected
                ]}>
                  {accessory}
                </Text>
                {selectedAccessories.includes(accessory) && (
                  <Ionicons name="checkmark" size={14} color="#fff" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Order Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles de la Orden</Text>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descripción general <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Resumen general de la orden de reparación"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Notes */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notas adicionales (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notas internas o instrucciones especiales"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Initial Review Cost */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Costo de revisión inicial (opcional)</Text>
          <View style={styles.currencyInput}>
            <Text style={styles.currencySymbol}>S/</Text>
            <TextInput
              style={[styles.input, styles.currencyInputField]}
              placeholder="0.00"
              value={initialReviewCost}
              onChangeText={setInitialReviewCost}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Assignment Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asignación</Text>

        {/* Technician */}
        <SearchableSelector<User>
          label="Técnico asignado (opcional)"
          placeholder="Buscar técnico..."
          value={selectedTechnician}
          onSelect={setSelectedTechnician}
          searchFn={searchTechnicians}
          renderItem={(u) => `${u.firstName} ${u.lastName}`}
          renderSubtitle={(u) => u.email}
          keyExtractor={(u) => u.id}
          required={false}
        />

        {/* Status */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Estado</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowStatusPicker(!showStatusPicker)}
          >
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
              <Text style={styles.selectText}>
                {STATUS_OPTIONS.find(s => s.value === status)?.label}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showStatusPicker && (
            <View style={styles.pickerDropdown}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.pickerItem}
                  onPress={() => {
                    setStatus(option.value);
                    setShowStatusPicker(false);
                  }}
                >
                  <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(option.value) }]} />
                    <Text style={styles.pickerItemText}>{option.label}</Text>
                  </View>
                  {status === option.value && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>
                {initialData ? 'Actualizar Orden' : 'Crear Orden'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: RepairOrderStatus): string {
  const colors: Record<RepairOrderStatus, string> = {
    RECEIVED: '#9CA3AF',
    DIAGNOSED: '#3B82F6',
    IN_PROGRESS: '#F59E0B',
    WAITING_FOR_PARTS: '#8B5CF6',
    COMPLETED: '#10B981',
    DELIVERED: '#059669',
    CANCELLED: '#EF4444',
  };
  return colors[status] || '#9CA3AF';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
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
  required: {
    color: '#EF4444',
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
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
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
  pickerDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  tagText: {
    fontSize: 13,
    color: '#4B5563',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
