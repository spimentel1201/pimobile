import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SearchableSelector from './SearchableSelector';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Customer,
  RepairOrder,
  CreateRepairOrderDto,
  RepairOrderStatus,
} from '../types/api';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radii } from '../../constants/theme';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';

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
  const { theme } = useTheme();

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
    <Card key={index} variant="flat" padding={spacing.base} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemTitleContainer}>
          <MaterialCommunityIcons name="devices" size={20} color={theme.primary} />
          <Text style={[styles.itemTitle, { color: theme.text }]}>Equipo {index + 1}</Text>
        </View>
        {items.length > 1 && (
          <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.text === '#F8FAFC' ? '#F87171' : '#EF4444'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Device Type */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Tipo de dispositivo <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity
          style={[styles.select, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
          onPress={() => updateItem(index, 'showDeviceTypePicker', !item.showDeviceTypePicker)}
        >
          <Text style={item.deviceType ? [styles.selectText, { color: theme.text }] : [styles.placeholderText, { color: theme.textMuted }]}>
            {item.deviceType || 'Seleccionar tipo...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        {item.showDeviceTypePicker && (
          <View style={[styles.pickerDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {DEVICE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerItem, { borderBottomColor: theme.borderLight }]}
                  onPress={() => {
                    updateItem(index, 'deviceType', type);
                    updateItem(index, 'showDeviceTypePicker', false);
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: theme.text }]}>{type}</Text>
                  {item.deviceType === type && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {errors[`item_${index}_deviceType`] && (
          <Text style={[styles.errorText, { color: theme.text === '#F8FAFC' ? '#F87171' : '#EF4444' }]}>{errors[`item_${index}_deviceType`]}</Text>
        )}
      </View>

      {/* Brand & Model */}
      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Input
            label="Marca *"
            placeholder="Ej: Samsung, LG..."
            value={item.brand}
            onChangeText={(text) => updateItem(index, 'brand', text)}
            error={errors[`item_${index}_brand`]}
          />
        </View>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Input
            label="Modelo *"
            placeholder="Ej: Galaxy S21..."
            value={item.model}
            onChangeText={(text) => updateItem(index, 'model', text)}
            error={errors[`item_${index}_model`]}
          />
        </View>
      </View>

      {/* Serial Number */}
      <Input
        label="Número de Serie (opcional)"
        placeholder="Ingrese el número de serie"
        value={item.serialNumber}
        onChangeText={(text) => updateItem(index, 'serialNumber', text)}
      />

      {/* Problem Description */}
      <Input
        label="Descripción del problema *"
        placeholder="Describa detalladamente el problema"
        value={item.problemDescription}
        onChangeText={(text) => updateItem(index, 'problemDescription', text)}
        multiline
        numberOfLines={3}
        error={errors[`item_${index}_problemDescription`]}
        containerStyle={styles.textAreaContainer}
        style={styles.textAreaInput}
      />

      {/* Accessories */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Accesorios incluidos</Text>
        <View style={styles.tagsContainer}>
          {ACCESSORY_OPTIONS.map((accessory) => {
            const isSelected = item.accessories.includes(accessory);
            return (
              <TouchableOpacity
                key={accessory}
                style={[
                  styles.tag,
                  { backgroundColor: theme.card, borderColor: theme.inputBorder },
                  isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => toggleAccessory(index, accessory)}
              >
                <Badge
                  label={accessory}
                  variant={isSelected ? 'primary' : 'default'}
                  size="sm"
                  style={isSelected ? styles.badgeSelected : undefined}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Quantity & Price */}
      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Input
            label="Cantidad *"
            value={item.quantity.toString()}
            onChangeText={(text) => updateItem(index, 'quantity', parseInt(text) || 1)}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Input
            label="Precio estimado"
            placeholder="S/ 0.00"
            value={item.price}
            onChangeText={(text) => updateItem(index, 'price', text)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </Card>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {/* Technician Banner - Read Only */}
      <Card variant="outlined" padding={spacing.md} style={styles.technicianBanner}>
        <View style={styles.technicianBannerContent}>
          <MaterialCommunityIcons name="account-wrench" size={22} color={theme.primary} />
          <View style={styles.technicianInfo}>
            <Text style={[styles.technicianLabel, { color: theme.textSecondary }]}>Técnico asignado</Text>
            <Text style={[styles.technicianName, { color: theme.text }]}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <Badge label="Auto" variant="primary" size="sm" />
        </View>
      </Card>

      {/* Customer Section */}
      <Card variant="elevated" padding={spacing.base} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Cliente</Text>

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
        {errors.customer && <Text style={[styles.errorText, { color: theme.text === '#F8FAFC' ? '#F87171' : '#EF4444' }]}>{errors.customer}</Text>}
      </Card>

      {/* Items Section */}
      <Card variant="elevated" padding={spacing.base} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Equipos a Reparar</Text>
          <Button
            title="Agregar"
            variant="success"
            size="sm"
            onPress={addItem}
            icon={<MaterialCommunityIcons name="plus" size={18} color="#fff" />}
          />
        </View>

        {items.map((item, index) => renderItemForm(item, index))}
      </Card>

      {/* Order Details Section */}
      <Card variant="elevated" padding={spacing.base} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Detalles de la Orden</Text>

        {/* Description */}
        <Input
          label="Descripción general *"
          placeholder="Resumen general de la orden de reparación"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          error={errors.description}
          containerStyle={styles.textAreaContainer}
          style={styles.textAreaInput}
        />

        {/* Notes */}
        <Input
          label="Notas adicionales (opcional)"
          placeholder="Notas internas o instrucciones especiales"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          containerStyle={styles.textAreaContainer}
          style={styles.textAreaInput}
        />

        {/* Initial Review Cost */}
        <Input
          label="Costo de revisión inicial"
          placeholder="S/ 0.00"
          value={initialReviewCost}
          onChangeText={setInitialReviewCost}
          keyboardType="decimal-pad"
        />

        {/* Status (for editing) */}
        {initialData && (
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Estado</Text>
            <TouchableOpacity
              style={[styles.select, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
            >
              <Text style={[styles.selectText, { color: theme.text }]}>
                {STATUS_OPTIONS.find(s => s.value === status)?.label || status}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            {showStatusPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pickerItem, { borderBottomColor: theme.borderLight }]}
                    onPress={() => {
                      setStatus(option.value);
                      setShowStatusPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, { color: theme.text }]}>{option.label}</Text>
                    {status === option.value && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </Card>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          title={initialData ? 'Actualizar Orden' : 'Crear Orden'}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
          onPress={handleSubmit}
          icon={!loading ? <Ionicons name="save" size={20} color="#fff" /> : undefined}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  technicianBanner: {
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
  },
  technicianBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  technicianInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  technicianLabel: {
    fontSize: typography.sizes.xs,
  },
  technicianName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  section: {
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  required: {
    color: '#EF4444',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  selectText: {
    fontSize: typography.sizes.base,
  },
  placeholderText: {
    fontSize: typography.sizes.base,
  },
  pickerDropdown: {
    borderWidth: 1,
    borderRadius: radii.md,
    marginTop: spacing.xs,
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: typography.sizes.base,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing['2xs'] - 1,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: spacing['2xs'] + 1,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  itemCard: {
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
  removeButton: {
    padding: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    borderRadius: radii.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  badgeSelected: {
    backgroundColor: 'transparent',
  },
  textAreaContainer: {
    minHeight: 80,
  },
  textAreaInput: {
    textAlignVertical: 'top',
    minHeight: 72,
    paddingTop: spacing.md,
  },
  footer: {
    padding: spacing.base,
    paddingBottom: 80,
  },
});
