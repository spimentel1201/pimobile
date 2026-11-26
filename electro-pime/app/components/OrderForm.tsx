// ponytail: M3 OrderForm with 3-step progressive stepper, appliance icons and OCR integration
import React, { useState, useEffect, useMemo } from 'react';
import {
  Platform,
  View,
  StyleSheet,
  TextInput,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NewCustomerModal from './NewCustomerModal';
import ScanLabelButton from './ScanLabelButton';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  colors,
  spacing,
  radii,
  typography,
  tonalElevation,
  ORDER_STATUS,
  RepairOrderStatus,
  getDeviceIcon,
} from '../theme';
import * as Haptics from 'expo-haptics';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';
import M3TextField from './ui/M3TextField';
import {
  Customer,
  RepairOrder,
  CreateRepairOrderDto,
  PaymentMethod,
} from '../types/api';

interface OrderFormProps {
  initialData?: RepairOrder;
  onSubmit: (data: CreateRepairOrderDto) => Promise<void>;
  loading: boolean;
  moneyLocked?: boolean;
  paidTotal?: number;
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
  'Lavadora',
  'Refrigerador',
  'Horno Microondas',
  'TV LED',
  'TV LCD',
  'Equipo de sonido',
  'Aire Acondicionado',
  'Licuadora',
  'Olla arrocera',
  'Laptop',
  'Ventilador',
  'Plancha',
  'PC de Escritorio',
  'Celular',
  'Tablet',
  'Monitor',
  'Otro',
];

const ACCESSORY_OPTIONS = [
  'Cable de Poder',
  'Control Remoto',
  'Cargador',
  'Manguera de agua',
  'Pedestal (Patas)',
  'Base',
  'Funda / Estuche',
  'Cable HDMI',
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'YAPE', label: 'Yape', icon: 'cellphone' },
  { value: 'PLIN', label: 'Plin', icon: 'cellphone' },
  { value: 'CASH', label: 'Efectivo', icon: 'cash' },
  { value: 'CREDIT_CARD', label: 'Tarjeta', icon: 'credit-card' },
  { value: 'TRANSFER', label: 'Transferencia', icon: 'bank-transfer' },
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
  moneyLocked = false,
  paidTotal,
}: OrderFormProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [isDark]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerVisible, setNewCustomerVisible] = useState(false);
  const [newCustomerInitialName, setNewCustomerInitialName] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  // Live customer search
  useEffect(() => {
    if (selectedCustomer) return;
    if (!customerSearchQuery.trim()) {
      setCustomerSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const results = await searchCustomers(customerSearchQuery.trim());
        setCustomerSearchResults(results);
      } catch {
        setCustomerSearchResults([]);
      } finally {
        setSearchingCustomer(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearchQuery, selectedCustomer]);

  // Order details
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [initialReviewCost, setInitialReviewCost] = useState('');
  const [reviewPaid, setReviewPaid] = useState(false);
  const [reviewPaymentMethod, setReviewPaymentMethod] = useState<PaymentMethod>('YAPE');
  const [reviewPaymentCode, setReviewPaymentCode] = useState('');
  const [status, setStatus] = useState<RepairOrderStatus>('RECEIVED');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Multiple items
  const [items, setItems] = useState<OrderItem[]>([createEmptyItem()]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    if (query.length < 2) {
      return api.getCustomers();
    }
    return api.searchCustomers(query);
  };

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
        setItems(
          initialData.items.map((item) => ({
            deviceType: item.deviceType || '',
            brand: item.brand || '',
            model: item.model || '',
            serialNumber: item.serialNumber || '',
            problemDescription: item.problemDescription || '',
            accessories: item.accessories || [],
            quantity: item.quantity || 1,
            price: item.price?.toString() || '',
            showDeviceTypePicker: false,
          }))
        );
      }
    }
  }, [initialData]);

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleAccessory = (itemIndex: number, accessory: string) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = updated[itemIndex].accessories;
      updated[itemIndex].accessories = current.includes(accessory)
        ? current.filter((a) => a !== accessory)
        : [...current, accessory];
      return updated;
    });
  };

  const addItem = () => {
    if (moneyLocked) return;
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    if (moneyLocked) return;
    if (items.length === 1) {
      Alert.alert('Aviso', 'La orden debe contener al menos un equipo');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedCustomer) errs.customer = 'Seleccione o registre un cliente';
    if (!description.trim()) errs.description = 'Ingrese una descripción general del trabajo';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (moneyLocked) return true;
    const errs: Record<string, string> = {};
    items.forEach((item, index) => {
      if (!item.deviceType) errs[`item_${index}_deviceType`] = 'Seleccione el tipo de artefacto';
      if (!item.brand.trim()) errs[`item_${index}_brand`] = 'Ingrese la marca';
      if (!item.model.trim()) errs[`item_${index}_model`] = 'Ingrese el modelo';
      if (!item.problemDescription.trim()) errs[`item_${index}_problemDescription`] = 'Describa la falla';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    Platform.OS !== 'web' && Haptics.selectionAsync();
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    Platform.OS !== 'web' && Haptics.selectionAsync();
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async () => {
    Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const step1Valid = validateStep1();
    const step2Valid = validateStep2();
    if (!step1Valid) {
      setCurrentStep(1);
      Alert.alert('Cliente requerido', 'Seleccione o registre el cliente titular de la orden.');
      return;
    }
    if (!step2Valid) {
      setCurrentStep(2);
      Alert.alert('Datos requeridos', 'Complete los campos obligatorios del artefacto (marca, modelo, falla).');
      return;
    }

    const orderData: CreateRepairOrderDto = {
      customerId: selectedCustomer!.id,
      technicianId: user?.id,
      status,
      description: description.trim(),
      notes: notes.trim() || undefined,
      initialReviewCost: initialReviewCost ? parseFloat(initialReviewCost) : undefined,
      reviewPaid,
      reviewPaymentMethod: reviewPaid ? reviewPaymentMethod : undefined,
      reviewPaymentCode: reviewPaid && reviewPaymentMethod === 'YAPE' && reviewPaymentCode.trim()
        ? reviewPaymentCode.trim()
        : undefined,
      reviewPaidAt: reviewPaid ? new Date().toISOString() : undefined,
      items: items.map((item) => ({
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

    if (moneyLocked) {
      const patchable = orderData as Partial<CreateRepairOrderDto>;
      delete patchable.items;
      delete patchable.initialReviewCost;
    }

    try {
      await onSubmit(orderData);
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'No se pudo guardar la orden');
    }
  };

  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      <Pressable
        style={styles.stepItem}
        onPress={() => setCurrentStep(1)}
      >
        <View style={[styles.stepCircle, currentStep === 1 && styles.stepCircleActive, selectedCustomer && styles.stepCircleDone]}>
          {selectedCustomer ? (
            <MaterialCommunityIcons name="check" size={16} color={colors.onSuccess} />
          ) : (
            <Text style={[styles.stepNumber, currentStep === 1 && styles.stepNumberActive]}>1</Text>
          )}
        </View>
        <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>Cliente</Text>
      </Pressable>

      <View style={[styles.stepLine, selectedCustomer && styles.stepLineDone]} />

      <Pressable
        style={styles.stepItem}
        onPress={() => setCurrentStep(2)}
      >
        <View style={[styles.stepCircle, currentStep === 2 && styles.stepCircleActive, items.some(i => i.brand && i.model) && styles.stepCircleDone]}>
          {items.some(i => i.brand && i.model) ? (
            <MaterialCommunityIcons name="check" size={16} color={colors.onSuccess} />
          ) : (
            <Text style={[styles.stepNumber, currentStep === 2 && styles.stepNumberActive]}>2</Text>
          )}
        </View>
        <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>Equipos</Text>
      </Pressable>

      <View style={[styles.stepLine, items.some(i => i.brand && i.model) && styles.stepLineDone]} />

      <Pressable
        style={styles.stepItem}
        onPress={() => setCurrentStep(3)}
      >
        <View style={[styles.stepCircle, currentStep === 3 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, currentStep === 3 && styles.stepNumberActive]}>3</Text>
        </View>
        <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>Costos</Text>
      </Pressable>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepBody}>
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>1. Cliente Titular</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedCustomer ? 'Cliente asignado a la orden' : 'Busca por nombre, teléfono o DNI, o registra uno nuevo'}
            </Text>
          </View>
        </View>

        {selectedCustomer ? (
          <View style={styles.selectedCustomerCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {selectedCustomer.name?.slice(0, 2).toUpperCase() || 'CL'}
              </Text>
            </View>
            <View style={styles.customerCardInfo}>
              <Text style={styles.customerCardName} numberOfLines={1}>{selectedCustomer.name}</Text>
              <View style={styles.customerChipsRow}>
                {selectedCustomer.phone ? (
                  <View style={styles.customerChip}>
                    <MaterialCommunityIcons name="phone" size={13} color={colors.primary} />
                    <Text style={styles.customerChipText}>{selectedCustomer.phone}</Text>
                  </View>
                ) : null}
                {selectedCustomer.documentNumber ? (
                  <View style={styles.customerChip}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.customerChipText}>
                      {selectedCustomer.documentType?.toUpperCase() || 'DOC'}: {selectedCustomer.documentNumber}
                    </Text>
                  </View>
                ) : null}
              </View>
              {selectedCustomer.address ? (
                <Text style={styles.customerCardAddress} numberOfLines={1}>
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textMuted} /> {selectedCustomer.address}
                </Text>
              ) : null}
            </View>
            <Pressable
              style={styles.changeCustomerBtn}
              onPress={() => setSelectedCustomer(null)}
              android_ripple={{ color: colors.ripple, borderless: true, radius: 20 }}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
              <Text style={styles.changeCustomerText}>Cambiar</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.customerSearchBlock}>
            <View style={styles.searchRow}>
              <View style={styles.searchInputWrapper}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.customerLiveInput}
                  placeholder="Escribe nombre, DNI o teléfono..."
                  placeholderTextColor={colors.textMuted}
                  value={customerSearchQuery}
                  onChangeText={(text) => {
                    setCustomerSearchQuery(text);
                    if (errors.customer) setErrors((e) => ({ ...e, customer: '' }));
                  }}
                  autoCapitalize="words"
                />
                {customerSearchQuery ? (
                  <Pressable onPress={() => { setCustomerSearchQuery(''); setCustomerSearchResults([]); }}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                style={styles.newCustomerBtn}
                onPress={() => {
                  setNewCustomerInitialName(customerSearchQuery.trim());
                  setNewCustomerVisible(true);
                }}
                android_ripple={{ color: colors.rippleOnPrimary }}
              >
                <MaterialCommunityIcons name="account-plus" size={18} color={colors.onPrimary} />
                <Text style={styles.newCustomerBtnText}>Nuevo</Text>
              </Pressable>
            </View>

            {errors.customer && <Text style={styles.errorText}>{errors.customer}</Text>}

            {/* Sugerencias en tiempo real */}
            {searchingCustomer ? (
              <View style={styles.searchSpinnerBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.searchSpinnerText}>Buscando clientes...</Text>
              </View>
            ) : customerSearchResults.length > 0 ? (
              <View style={styles.suggestionsContainer}>
                {customerSearchResults.slice(0, 4).map((c) => (
                  <Pressable
                    key={c.id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSelectedCustomer(c);
                      setCustomerSearchQuery('');
                      setCustomerSearchResults([]);
                      if (errors.customer) setErrors((e) => ({ ...e, customer: '' }));
                    }}
                    android_ripple={{ color: colors.ripple }}
                  >
                    <View style={styles.suggestionAvatar}>
                      <Text style={styles.suggestionAvatarText}>{c.name?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.suggestionTexts}>
                      <Text style={styles.suggestionName}>{c.name}</Text>
                      <Text style={styles.suggestionMeta}>
                        {c.phone ? `Tel: ${c.phone}` : 'Sin teléfono'} {c.documentNumber ? ` • ${c.documentType?.toUpperCase() || 'Doc'}: ${c.documentNumber}` : ''}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            ) : customerSearchQuery.trim().length >= 2 ? (
              <View style={styles.emptySearchPrompt}>
                <Text style={styles.emptySearchPromptText}>No encontramos ningún cliente registrado con "{customerSearchQuery}"</Text>
                <Pressable
                  style={styles.promptCreateBtn}
                  onPress={() => {
                    setNewCustomerInitialName(customerSearchQuery.trim());
                    setNewCustomerVisible(true);
                  }}
                >
                  <MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.primary} />
                  <Text style={styles.promptCreateBtnText}>Registrar a "{customerSearchQuery}"</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Descripción General del Trabajo</Text>

        <M3TextField
          label="Resumen de la orden *"
          placeholder="Ej: Mantenimiento correctivo y cambio de rodajes..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          error={errors.description}
          leadingIcon="clipboard-text-outline"
        />

        <M3TextField
          label="Notas técnicas internas (opcional)"
          placeholder="Observaciones visibles solo para el taller..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          leadingIcon="note-text-outline"
        />

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Estado Inicial:</Text>
          <Pressable
            style={styles.statusBtn}
            onPress={() => setShowStatusPicker(!showStatusPicker)}
            android_ripple={{ color: colors.ripple }}
          >
            <StatusBadge
              label={ORDER_STATUS[status].label}
              color={ORDER_STATUS[status].color}
              soft={ORDER_STATUS[status].soft}
              icon={ORDER_STATUS[status].icon}
            />
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {showStatusPicker && (
          <View style={styles.statusDropdown}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.statusOption, status === opt.value && styles.statusOptionActive]}
                onPress={() => {
                  setStatus(opt.value);
                  setShowStatusPicker(false);
                }}
              >
                <Text style={[styles.statusOptionLabel, status === opt.value && styles.statusOptionLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepBody}>
      {moneyLocked && (
        <View style={styles.lockedNotice}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={colors.warning} />
          <Text style={styles.lockedNoticeText}>
            Equipos congelados: Esta orden tiene un presupuesto pagado (S/ {paidTotal?.toFixed(2)}).
          </Text>
        </View>
      )}

      {items.map((item, idx) => {
        const iconName = getDeviceIcon(item.deviceType);

        return (
          <Card key={idx} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <View style={styles.deviceIconCircle}>
                  <MaterialCommunityIcons name={iconName as any} size={22} color={colors.primary} />
                </View>
                <Text style={styles.itemTitle}>Equipo #{idx + 1}</Text>
              </View>

              {!moneyLocked && items.length > 1 && (
                <Pressable
                  onPress={() => removeItem(idx)}
                  style={styles.deleteBtn}
                  android_ripple={{ color: 'rgba(186, 26, 26, 0.2)', borderless: true, radius: 20 }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                </Pressable>
              )}
            </View>

            {/* OCR Scanner Button */}
            {!moneyLocked && (
              <ScanLabelButton
                onScanned={(fields) => {
                  if (fields.deviceType) updateItem(idx, 'deviceType', fields.deviceType);
                  if (fields.brand) updateItem(idx, 'brand', fields.brand);
                  if (fields.model) updateItem(idx, 'model', fields.model);
                  if (fields.serialNumber) updateItem(idx, 'serialNumber', fields.serialNumber);
                }}
              />
            )}

            {/* Device Type Chips / Selector */}
            <Text style={styles.fieldLabel}>Tipo de artefacto *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deviceChipsScroll}>
              {DEVICE_TYPES.map((dt) => {
                const isSelected = item.deviceType === dt;
                return (
                  <Pressable
                    key={dt}
                    style={[styles.deviceChip, isSelected && styles.deviceChipSelected]}
                    onPress={() => updateItem(idx, 'deviceType', dt)}
                    disabled={moneyLocked}
                  >
                    <MaterialCommunityIcons
                      name={getDeviceIcon(dt) as any}
                      size={16}
                      color={isSelected ? colors.onPrimary : colors.textSecondary}
                    />
                    <Text style={[styles.deviceChipText, isSelected && styles.deviceChipTextSelected]}>
                      {dt}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {errors[`item_${idx}_deviceType`] && (
              <Text style={styles.errorText}>{errors[`item_${idx}_deviceType`]}</Text>
            )}

            <View style={styles.gridRow}>
              <M3TextField
                containerStyle={styles.halfField}
                label="Marca *"
                placeholder="Ej: LG, Samsung..."
                value={item.brand}
                onChangeText={(v) => updateItem(idx, 'brand', v)}
                editable={!moneyLocked}
                error={errors[`item_${idx}_brand`]}
              />
              <M3TextField
                containerStyle={styles.halfField}
                label="Modelo *"
                placeholder="Ej: WD10WP6..."
                value={item.model}
                onChangeText={(v) => updateItem(idx, 'model', v)}
                editable={!moneyLocked}
                error={errors[`item_${idx}_model`]}
              />
            </View>

            <M3TextField
              label="Número de Serie (opcional)"
              placeholder="S/N de la placa del equipo..."
              value={item.serialNumber}
              onChangeText={(v) => updateItem(idx, 'serialNumber', v)}
              editable={!moneyLocked}
              leadingIcon="barcode"
            />

            <M3TextField
              label="Falla o avería reportada *"
              placeholder="¿Qué problema presenta el equipo según el cliente?..."
              value={item.problemDescription}
              onChangeText={(v) => updateItem(idx, 'problemDescription', v)}
              editable={!moneyLocked}
              multiline
              numberOfLines={2}
              error={errors[`item_${idx}_problemDescription`]}
              leadingIcon="alert-circle-outline"
            />

            {/* Accesorios checklist */}
            <Text style={styles.fieldLabel}>Accesorios que deja el cliente:</Text>
            <View style={styles.accessoryGrid}>
              {ACCESSORY_OPTIONS.map((acc) => {
                const checked = item.accessories.includes(acc);
                return (
                  <Pressable
                    key={acc}
                    style={[styles.accessoryChip, checked && styles.accessoryChipChecked]}
                    onPress={() => toggleAccessory(idx, acc)}
                    disabled={moneyLocked}
                  >
                    <MaterialCommunityIcons
                      name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={18}
                      color={checked ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.accessoryText, checked && styles.accessoryTextChecked]}>
                      {acc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        );
      })}

      {!moneyLocked && (
        <Pressable
          style={styles.addDeviceBtn}
          onPress={addItem}
          android_ripple={{ color: colors.ripple }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.addDeviceText}>Agregar otro artefacto a la orden</Text>
        </Pressable>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepBody}>
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. Costo Inicial y Revisión</Text>
        <Text style={styles.sectionSubtitle}>Registra si el cliente paga el costo de diagnóstico inicial.</Text>

        <M3TextField
          label="Costo de revisión técnica (S/)"
          placeholder="0.00"
          value={initialReviewCost}
          onChangeText={setInitialReviewCost}
          keyboardType="decimal-pad"
          editable={!moneyLocked}
          leadingText="S/"
          helperText="Monto acordado por apertura y revisión técnica."
        />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>¿Revisión Pagada al ingresar?</Text>
            <Text style={styles.switchDesc}>Habilitar si el cliente abona el costo en recepción.</Text>
          </View>
          <Pressable
            style={[styles.customSwitch, reviewPaid && styles.customSwitchActive]}
            onPress={() => setReviewPaid(!reviewPaid)}
          >
            <View style={[styles.switchThumb, reviewPaid && styles.switchThumbActive]} />
          </Pressable>
        </View>

        {reviewPaid && (
          <View style={styles.paymentSection}>
            <Text style={styles.fieldLabel}>Método de Pago:</Text>
            <View style={styles.paymentMethodsRow}>
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = reviewPaymentMethod === pm.value;
                return (
                  <Pressable
                    key={pm.value}
                    style={[styles.paymentChip, isSelected && styles.paymentChipSelected]}
                    onPress={() => setReviewPaymentMethod(pm.value)}
                  >
                    <MaterialCommunityIcons
                      name={pm.icon as any}
                      size={18}
                      color={isSelected ? colors.onPrimary : colors.textPrimary}
                    />
                    <Text style={[styles.paymentChipText, isSelected && styles.paymentChipTextSelected]}>
                      {pm.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {reviewPaymentMethod === 'YAPE' && (
              <M3TextField
                label="Código de Operación / Aprobación"
                placeholder="Ej: 148920"
                value={reviewPaymentCode}
                onChangeText={setReviewPaymentCode}
                leadingIcon="numeric"
              />
            )}
          </View>
        )}
      </Card>

      {/* Resumen Final */}
      <Card variant="filled" style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen de la Orden</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cliente:</Text>
          <Text style={styles.summaryValue}>{selectedCustomer?.name || '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Artefactos:</Text>
          <Text style={styles.summaryValue}>{items.length} equipo(s)</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Revisión:</Text>
          <Text style={styles.summaryValueHighlight}>
            {initialReviewCost ? `S/ ${parseFloat(initialReviewCost).toFixed(2)}` : 'Por determinar'}
          </Text>
        </View>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderStepper()}

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Stepper Navigation Footer */}
      <View style={styles.footerNav}>
        {currentStep > 1 ? (
          <Pressable
            style={styles.backStepBtn}
            onPress={handlePrevStep}
            android_ripple={{ color: colors.ripple }}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
            <Text style={styles.backStepText}>Anterior</Text>
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        )}

        {currentStep < 3 ? (
          <Pressable
            style={styles.nextStepBtn}
            onPress={handleNextStep}
            android_ripple={{ color: colors.rippleOnPrimary }}
          >
            <Text style={styles.nextStepText}>Siguiente</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            android_ripple={{ color: colors.rippleOnPrimary }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onSuccess} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={22} color={colors.onSuccess} />
                <Text style={styles.submitText}>
                  {initialData ? 'Guardar Cambios' : 'Registrar Orden'}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Modal Nuevo Cliente */}
      {newCustomerVisible && (
        <NewCustomerModal
          visible={newCustomerVisible}
          initialName={newCustomerInitialName}
          onClose={() => setNewCustomerVisible(false)}
          onCreated={(c) => {
            setSelectedCustomer(c);
            setNewCustomerVisible(false);
          }}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleDone: {
    backgroundColor: colors.success,
  },
  stepNumber: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: colors.onPrimary,
  },
  stepLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.surfaceContainerHigh,
    marginHorizontal: spacing.sm,
    marginBottom: 16,
  },
  stepLineDone: {
    backgroundColor: colors.success,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  stepBody: {
    gap: spacing.md,
  },
  sectionCard: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statusLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.xs,
    borderRadius: radii.md,
  },
  statusDropdown: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
  statusOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  statusOptionActive: {
    backgroundColor: colors.primarySoft,
  },
  statusOptionLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  statusOptionLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  itemCard: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
  },
  fieldLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  deviceChipsScroll: {
    marginVertical: spacing.xs,
  },
  deviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  deviceChipText: {
    ...typography.labelSmall,
    color: colors.textPrimary,
  },
  deviceChipTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  accessoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  accessoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accessoryChipChecked: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  accessoryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  accessoryTextChecked: {
    color: colors.primary,
    fontWeight: '600',
  },
  addDeviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    marginTop: spacing.xs,
  },
  addDeviceText: {
    ...typography.labelLarge,
    color: colors.primary,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  switchInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  switchTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  switchDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  customSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  customSwitchActive: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  switchThumbActive: {
    backgroundColor: colors.onPrimary,
    alignSelf: 'flex-end',
  },
  paymentSection: {
    marginTop: spacing.md,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  paymentChipSelected: {
    backgroundColor: colors.primary,
  },
  paymentChipText: {
    ...typography.labelSmall,
    color: colors.textPrimary,
  },
  paymentChipTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  summaryCard: {
    padding: spacing.lg,
  },
  summaryTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  summaryValueHighlight: {
    ...typography.titleSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    marginBottom: 72,
  },
  spacer: {
    flex: 1,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  backStepText: {
    ...typography.labelLarge,
    color: colors.primary,
    fontWeight: '600',
  },
  nextStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    elevation: 2,
  },
  nextStepText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    elevation: 2,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    ...typography.labelLarge,
    color: colors.onSuccess,
    fontWeight: '700',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: 2,
  },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  lockedNoticeText: {
    ...typography.bodySmall,
    color: colors.warning,
    flex: 1,
  },
  sectionHeaderRow: {
    marginBottom: spacing.sm,
  },
  selectedCustomerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  customerCardInfo: {
    flex: 1,
  },
  customerCardName: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  customerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerChipText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  customerCardAddress: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 4,
  },
  changeCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  changeCustomerText: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '600',
  },
  customerSearchBlock: {
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  customerLiveInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  newCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radii.input,
    gap: 4,
  },
  newCustomerBtnText: {
    ...typography.labelMedium,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  searchSpinnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchSpinnerText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  suggestionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.canvas,
    gap: spacing.md,
  },
  suggestionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionAvatarText: {
    ...typography.titleSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  suggestionTexts: {
    flex: 1,
  },
  suggestionName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  suggestionMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptySearchPrompt: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptySearchPromptText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  promptCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
  },
  promptCreateBtnText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '700',
  },
});
