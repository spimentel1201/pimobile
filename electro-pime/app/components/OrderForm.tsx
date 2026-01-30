import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SearchableSelector from './SearchableSelector';
import LabelScanner from './LabelScanner';
import { ExtractedDeviceInfo } from '../services/ocrService';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Customer,
  RepairOrder,
  CreateRepairOrderDto,
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

interface OrderItem {
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  problemDescription: string;
  accessories: string[];
  quantity: number;
  price: string;
  showDeviceTypePicker: boolean;
}

const createEmptyItem = (): OrderItem => ({
  deviceType: '',
  brand: '',
  model: '',
  serialNumber: '',
  problemDescription: '',
  accessories: [],
  quantity: 1,
  price: '',
  showDeviceTypePicker: false,
});

export default function OrderForm({
  initialData,
  onSubmit,
  loading,
}: OrderFormProps) {
  const { user } = useAuth();

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Order details
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [initialReviewCost, setInitialReviewCost] = useState('');
  const [status, setStatus] = useState<RepairOrderStatus>('RECEIVED');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Multiple items
  const [items, setItems] = useState<OrderItem[]>([createEmptyItem()]);

  // Label scanner
  const [showScanner, setShowScanner] = useState(false);
  const [currentScanIndex, setCurrentScanIndex] = useState(0);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Search customers
  const searchCustomers = async (query: string): Promise<Customer[]> => {
    if (query.length < 2) {
      return api.getCustomers();
    }
    return api.searchCustomers(query);
  };

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      setInitialReviewCost(initialData.initialReviewCost?.toString() || '');
      setStatus(initialData.status);

      if (initialData.customer) {
        setSelectedCustomer(initialData.customer);
      }

      if (initialData.items && initialData.items.length > 0) {
        setItems(initialData.items.map(item => ({
          deviceType: item.deviceType || '',
          brand: item.brand || '',
          model: item.model || '',
          serialNumber: item.serialNumber || '',
          problemDescription: item.problemDescription || '',
          accessories: item.accessories || [],
          quantity: item.quantity || 1,
          price: item.price?.toString() || '',
          showDeviceTypePicker: false,
        })));
      }
    }
  }, [initialData]);

  // Item handlers
  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleAccessory = (itemIndex: number, accessory: string) => {
    setItems(prev => {
      const updated = [...prev];
      const currentAccessories = updated[itemIndex].accessories;
      updated[itemIndex].accessories = currentAccessories.includes(accessory)
        ? currentAccessories.filter(a => a !== accessory)
        : [...currentAccessories, accessory];
      return updated;
    });
  };

  // Handle OCR scan result
  const handleScanResult = (data: ExtractedDeviceInfo) => {
    setItems(prev => {
      const updated = [...prev];
      if (data.brand) updated[currentScanIndex].brand = data.brand;
      if (data.model) updated[currentScanIndex].model = data.model;
      if (data.serialNumber) updated[currentScanIndex].serialNumber = data.serialNumber;
      return updated;
    });
  };

  const openScanner = (index: number) => {
    setCurrentScanIndex(index);
    setShowScanner(true);
  };


  const addItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      Alert.alert('Error', 'Debe haber al menos un equipo');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedCustomer) {
      newErrors.customer = 'Seleccione un cliente';
    }

    if (!description.trim()) {
      newErrors.description = 'Ingrese una descripción general';
    }

    // Validate each item
    items.forEach((item, index) => {
      if (!item.deviceType) {
        newErrors[`item_${index}_deviceType`] = 'Seleccione el tipo de dispositivo';
      }
      if (!item.brand.trim()) {
        newErrors[`item_${index}_brand`] = 'Ingrese la marca';
      }
      if (!item.model.trim()) {
        newErrors[`item_${index}_model`] = 'Ingrese el modelo';
      }
      if (!item.problemDescription.trim()) {
        newErrors[`item_${index}_problemDescription`] = 'Describa el problema';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Error', 'Por favor complete los campos requeridos');
      return;
    }

    const orderData: CreateRepairOrderDto = {
      customerId: selectedCustomer!.id,
      technicianId: user?.id, // Auto-assign logged-in user
      status,
      description: description.trim(),
      notes: notes.trim() || undefined,
      initialReviewCost: initialReviewCost ? parseFloat(initialReviewCost) : undefined,
      items: items.map(item => ({
        deviceType: item.deviceType,
        brand: item.brand.trim(),
        model: item.model.trim(),
        serialNumber: item.serialNumber.trim() || undefined,
        problemDescription: item.problemDescription.trim(),
        accessories: item.accessories,
        quantity: item.quantity || 1,
        price: item.price ? parseFloat(item.price) : undefined,
      })),
    };

    try {
      await onSubmit(orderData);
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'No se pudo guardar la orden');
    }
  };

  // Render item form
  const renderItemForm = (item: OrderItem, index: number) => (
    <View key={index} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemTitleContainer}>
          <MaterialCommunityIcons name="devices" size={20} color="#3B82F6" />
          <Text style={styles.itemTitle}>Equipo {index + 1}</Text>
        </View>
        {items.length > 1 && (
          <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Device Type */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tipo de dispositivo <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity
          style={styles.select}
          onPress={() => updateItem(index, 'showDeviceTypePicker', !item.showDeviceTypePicker)}
        >
          <Text style={item.deviceType ? styles.selectText : styles.placeholderText}>
            {item.deviceType || 'Seleccionar tipo...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>
        {item.showDeviceTypePicker && (
          <View style={styles.pickerDropdown}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {DEVICE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.pickerItem}
                  onPress={() => {
                    updateItem(index, 'deviceType', type);
                    updateItem(index, 'showDeviceTypePicker', false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{type}</Text>
                  {item.deviceType === type && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {errors[`item_${index}_deviceType`] && (
          <Text style={styles.errorText}>{errors[`item_${index}_deviceType`]}</Text>
        )}
      </View>

      {/* Scan Label Button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => openScanner(index)}
      >
        <MaterialCommunityIcons name="camera" size={20} color="#3B82F6" />
        <Text style={styles.scanButtonText}>Escanear Etiqueta</Text>
        <Text style={styles.scanButtonHint}>Captura marca, modelo y serie</Text>
      </TouchableOpacity>

      {/* Brand & Model */}
      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Marca <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Samsung, LG..."
            placeholderTextColor="#9CA3AF"
            value={item.brand}
            onChangeText={(text) => updateItem(index, 'brand', text)}
          />
          {errors[`item_${index}_brand`] && (
            <Text style={styles.errorText}>{errors[`item_${index}_brand`]}</Text>
          )}
        </View>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Modelo <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Galaxy S21..."
            placeholderTextColor="#9CA3AF"
            value={item.model}
            onChangeText={(text) => updateItem(index, 'model', text)}
          />
          {errors[`item_${index}_model`] && (
            <Text style={styles.errorText}>{errors[`item_${index}_model`]}</Text>
          )}
        </View>
      </View>

      {/* Serial Number */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Número de Serie (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingrese el número de serie"
          placeholderTextColor="#9CA3AF"
          value={item.serialNumber}
          onChangeText={(text) => updateItem(index, 'serialNumber', text)}
        />
      </View>

      {/* Problem Description */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Descripción del problema <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describa detalladamente el problema"
          placeholderTextColor="#9CA3AF"
          value={item.problemDescription}
          onChangeText={(text) => updateItem(index, 'problemDescription', text)}
          multiline
          numberOfLines={3}
        />
        {errors[`item_${index}_problemDescription`] && (
          <Text style={styles.errorText}>{errors[`item_${index}_problemDescription`]}</Text>
        )}
      </View>

      {/* Accessories */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Accesorios incluidos</Text>
        <View style={styles.tagsContainer}>
          {ACCESSORY_OPTIONS.map((accessory) => (
            <TouchableOpacity
              key={accessory}
              style={[
                styles.tag,
                item.accessories.includes(accessory) && styles.tagSelected
              ]}
              onPress={() => toggleAccessory(index, accessory)}
            >
              <Text style={[
                styles.tagText,
                item.accessories.includes(accessory) && styles.tagTextSelected
              ]}>
                {accessory}
              </Text>
              {item.accessories.includes(accessory) && (
                <Ionicons name="checkmark" size={14} color="#fff" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quantity & Price */}
      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Cantidad <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={item.quantity.toString()}
            onChangeText={(text) => updateItem(index, 'quantity', parseInt(text) || 1)}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Precio estimado</Text>
          <TextInput
            style={styles.input}
            placeholder="S/ 0.00"
            placeholderTextColor="#9CA3AF"
            value={item.price}
            onChangeText={(text) => updateItem(index, 'price', text)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Technician Banner - Read Only */}
        <View style={styles.technicianBanner}>
          <MaterialCommunityIcons name="account-wrench" size={22} color="#3B82F6" />
          <View style={styles.technicianInfo}>
            <Text style={styles.technicianLabel}>Técnico asignado</Text>
            <Text style={styles.technicianName}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <View style={styles.technicianBadge}>
            <Text style={styles.technicianBadgeText}>Auto</Text>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>

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

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Equipos a Reparar</Text>
            <TouchableOpacity style={styles.addButton} onPress={addItem}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => renderItemForm(item, index))}
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
              placeholderTextColor="#9CA3AF"
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
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Initial Review Cost */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Costo de revisión inicial</Text>
            <TextInput
              style={styles.input}
              placeholder="S/ 0.00"
              placeholderTextColor="#9CA3AF"
              value={initialReviewCost}
              onChangeText={setInitialReviewCost}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Status (for editing) */}
          {initialData && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Estado</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setShowStatusPicker(!showStatusPicker)}
              >
                <Text style={styles.selectText}>
                  {STATUS_OPTIONS.find(s => s.value === status)?.label || status}
                </Text>
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
                      <Text style={styles.pickerItemText}>{option.label}</Text>
                      {status === option.value && (
                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {initialData ? 'Actualizar Orden' : 'Crear Orden'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Label Scanner Modal */}
      <LabelScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onConfirm={handleScanResult}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  technicianBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  technicianInfo: {
    flex: 1,
    marginLeft: 12,
  },
  technicianLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  technicianBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  technicianBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
    minHeight: 80,
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
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  pickerDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
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
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  removeButton: {
    padding: 4,
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
    backgroundColor: '#FFFFFF',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 80,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  scanButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  scanButtonHint: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
