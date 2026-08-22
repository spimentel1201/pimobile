import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Keyboard,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RepairOrder, BudgetPart, Budget, OrderStatus, StatusInfo, FormData, NotificationData } from '../../types/budget';
import { useTheme } from '../../hooks/useTheme';
import { colors, typography, spacing, radii, shadows } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { FilterChip } from '../../components/ui/FilterChip';
import { StatusBadge } from '../../components/ui/StatusBadge';

const ORDER_STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'Todas', icon: 'apps' },
  { value: 'pending', label: 'Pendientes', icon: 'clock-outline' },
  { value: 'in_progress', label: 'En Proceso', icon: 'tools' },
  { value: 'completed', label: 'Completadas', icon: 'check-circle-outline' },
  { value: 'delivered', label: 'Entregadas', icon: 'package-variant-closed' },
  { value: 'cancelled', label: 'Canceladas', icon: 'close-circle-outline' },
];

const DEVICE_TYPES = [
  { label: 'Smartphone', value: 'smartphone' },
  { label: 'Tablet', value: 'tablet' },
  { label: 'Otro', value: 'other' },
];

const PRIORITY_OPTIONS = [
  { label: 'Alta', value: 'high' },
  { label: 'Media', value: 'medium' },
  { label: 'Baja', value: 'low' },
];

const STATUS_CHANGE_OPTIONS: { status: OrderStatus; label: string; icon: string; color: string }[] = [
  { status: 'pending', label: 'Pendiente', icon: 'clock-outline', color: colors.warning },
  { status: 'in_progress', label: 'En Proceso', icon: 'tools', color: colors.primary },
  { status: 'completed', label: 'Completada', icon: 'check-circle-outline', color: colors.success },
  { status: 'delivered', label: 'Entregada', icon: 'package-variant-closed', color: colors.info },
  { status: 'cancelled', label: 'Cancelada', icon: 'close-circle-outline', color: colors.error },
];

const BudgetScreen = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Order management states
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<RepairOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState<boolean>(false);

  // Estados para modales
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState<boolean>(false);
  const [notifyModalVisible, setNotifyModalVisible] = useState<boolean>(false);

  // Picker modal state
  const [pickerModalVisible, setPickerModalVisible] = useState<boolean>(false);
  const [pickerOptions, setPickerOptions] = useState<{ label: string; value: string }[]>([]);
  const [pickerTitle, setPickerTitle] = useState<string>('');
  const [pickerOnSelect, setPickerOnSelect] = useState<((value: string) => void) | null>(null);

  // Estado para edición
  const [editingOrder, setEditingOrder] = useState<RepairOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);

  // Estado para formulario
  const [formData, setFormData] = useState<FormData>({
    customer: {
      id: '',
      name: '',
      phone: '',
      email: '',
    },
    device: {
      type: 'smartphone',
      brand: '',
      model: '',
      serialNumber: '',
      condition: '',
    },
    issue: '',
    notes: '',
    status: 'pending',
    priority: 'medium',
    technicianId: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    estimatedCompletionDate: new Date(),
    completedAt: null,
    budget: {
      labor: 0,
      parts: [],
      tax: 0,
      total: 0,
      approved: false,
      notes: ''
    },
    history: []
  });

  // Estado para presupuesto
  const [budgetData, setBudgetData] = useState<Budget>({
    labor: 0,
    parts: [],
    tax: 0,
    total: 0,
    approved: false,
    notes: ''
  });

  const [newPart, setNewPart] = useState<Partial<BudgetPart>>({
    name: '',
    price: 0,
    quantity: 1
  });

  // Notification state
  const [notificationData, setNotificationData] = useState<NotificationData>({
    method: 'sms',
    message: ''
  });

  // Datos de demostración
  const mockTechnicians = [
    { id: '1', name: 'Carlos Méndez', specialty: 'Apple', available: true },
    { id: '2', name: 'Ana Gómez', specialty: 'Samsung', available: true },
    { id: '3', name: 'Roberto Silva', specialty: 'Xiaomi', available: false },
    { id: '4', name: 'María Torres', specialty: 'Huawei', available: true },
  ];

  const mockCustomers = [
    { id: '1', name: 'Juan Pérez', phone: '612345678', email: 'juan@example.com' },
    { id: '2', name: 'Laura Fernández', phone: '698765432', email: 'laura@example.com' },
    { id: '3', name: 'Miguel López', phone: '634567890', email: 'miguel@example.com' },
  ];

  // ─── Picker helper ───────────────────────────────────
  const openPicker = (
    title: string,
    options: { label: string; value: string }[],
    currentValue: string,
    onSelect: (value: string) => void,
  ) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerOnSelect(() => onSelect);
    setPickerModalVisible(true);
  };

  const closePicker = () => {
    setPickerModalVisible(false);
    setPickerOnSelect(null);
  };

  const handlePickerSelect = (value: string) => {
    if (pickerOnSelect) {
      pickerOnSelect(value);
    }
    closePicker();
  };

  const getPickerLabel = (
    options: { label: string; value: string }[],
    currentValue: string,
  ): string => {
    const found = options.find(o => o.value === currentValue);
    return found ? found.label : 'Seleccionar...';
  };

  // ─── Efectos para filtrado ───────────────────────────
  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus, searchQuery]);

  useEffect(() => {
    // Simulamos una carga de datos
    const timer = setTimeout(() => {
      const mockOrders = [
        {
          id: 'ORD-2023-001',
          customer: {
            id: '1',
            name: 'Juan Pérez',
            phone: '612345678',
            email: 'juan@example.com',
          },
          device: {
            type: 'smartphone' as const,
            brand: 'Apple',
            model: 'iPhone 14',
            serialNumber: 'SN12345678',
            condition: 'Pantalla rota',
          },
          issue: 'La pantalla está rota después de una caída',
          notes: 'Cliente solicita rapidez',
          status: 'in_progress' as OrderStatus,
          priority: 'high' as const,
          technicianId: '1',
          createdAt: new Date('2023-12-10'),
          updatedAt: new Date('2023-12-11'),
          estimatedCompletionDate: new Date('2023-12-15'),
          completedAt: null,
          imageUrl: 'https://via.placeholder.com/60',
          budget: {
            labor: 50,
            parts: [{ id: 'p1', name: 'Pantalla LCD', price: 120, quantity: 1 }],
            tax: 10,
            total: 187,
            approved: false,
            notes: '',
          },
          history: [
            { date: new Date('2023-12-10T14:30:00').toISOString(), action: 'Orden creada', user: 'Admin' },
            { date: new Date('2023-12-10T16:45:00').toISOString(), action: 'Asignada a técnico Carlos Méndez', user: 'Admin' },
            { date: new Date('2023-12-11T09:30:00').toISOString(), action: 'Diagnóstico completado', user: 'Carlos Méndez' },
          ],
        },
      ] as RepairOrder[];

      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const filterOrders = () => {
    let filtered = [...orders];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.customer.name.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.device.brand.toLowerCase().includes(query) ||
        order.device.model.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  // ─── Formatear fecha ─────────────────────────────────
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ─── Obtener info de estado ──────────────────────────
  const getStatusInfo = (status: OrderStatus): StatusInfo => {
    switch (status) {
      case 'pending':
        return { text: 'Pendiente', color: colors.warning, icon: 'clock-outline' };
      case 'in_progress':
        return { text: 'En Proceso', color: colors.primary, icon: 'tools' };
      case 'completed':
        return { text: 'Completada', color: colors.success, icon: 'check-circle-outline' };
      case 'delivered':
        return { text: 'Entregada', color: colors.info, icon: 'package-variant-closed-check' };
      case 'cancelled':
        return { text: 'Cancelada', color: colors.error, icon: 'close-circle-outline' };
      default:
        return { text: 'Desconocido', color: colors.gray[500], icon: 'help-circle-outline' };
    }
  };

  // ─── Obtener info de prioridad ───────────────────────
  const getPriorityInfo = (priority: 'high' | 'medium' | 'low'): { text: string; color: string; icon: string } => {
    switch (priority) {
      case 'high':
        return { text: 'Alta', color: colors.error, icon: 'alert-circle' };
      case 'medium':
        return { text: 'Media', color: colors.warning, icon: 'alert' };
      case 'low':
        return { text: 'Baja', color: colors.success, icon: 'information' };
      default:
        return { text: 'Normal', color: colors.gray[500], icon: 'information-outline' };
    }
  };

  // ─── Obtener nombre del técnico ──────────────────────
  const getTechnicianName = (id: string): string => {
    const tech = mockTechnicians.find(t => t.id === id);
    return tech ? tech.name : 'No asignado';
  };

  // ─── Actualizar campo del formulario ─────────────────
  const updateFormField = <T extends keyof FormData>(
    field: T,
    value: any,
    nestedField?: string
  ) => {
    setFormData(prev => {
      if (nestedField && typeof prev[field] === 'object') {
        return {
          ...prev,
          [field]: {
            ...(prev[field] as object),
            [nestedField]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const openFormModal = (order: RepairOrder | null = null) => {
    if (order) {
      setFormData({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        estimatedCompletionDate: new Date(order.estimatedCompletionDate),
        completedAt: order.completedAt ? new Date(order.completedAt) : null
      });
      setEditingOrder(order);
    } else {
      const now = new Date();
      const newId = `ORD-${now.getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;

      const newOrder: FormData = {
        id: newId,
        customer: {
          id: '',
          name: '',
          phone: '',
          email: '',
        },
        device: {
          type: 'smartphone',
          brand: '',
          model: '',
          serialNumber: '',
          condition: '',
        },
        issue: '',
        notes: '',
        status: 'pending',
        priority: 'medium',
        technicianId: '',
        createdAt: now,
        updatedAt: now,
        estimatedCompletionDate: now,
        completedAt: null,
        budget: {
          labor: 0,
          parts: [],
          tax: 0,
          total: 0,
          approved: false,
          notes: ''
        },
        history: [
          { date: now.toISOString(), action: 'Orden creada', user: 'Admin' }
        ]
      };

      setFormData(newOrder);
      setEditingOrder(null);
    }

    setModalVisible(true);
  };

  const closeFormModal = () => {
    setModalVisible(false);
    setFormData({} as FormData);
  };

  const saveOrder = () => {
    if (!formData.customer.name || !formData.device.brand || !formData.device.model || !formData.issue) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    const now = new Date();
    const updatedFormData = {
      ...formData,
      updatedAt: now
    };

    if (editingOrder) {
      const updatedOrders = orders.map(order =>
        order.id === editingOrder.id ? updatedFormData as RepairOrder : order
      );
      setOrders(updatedOrders);
    } else {
      if (updatedFormData.id) {
        setOrders([updatedFormData as RepairOrder, ...orders]);
      } else {
        console.error('Cannot add order without id');
      }
    }

    setModalVisible(false);
    setFormData({} as FormData);
  };

  const deleteOrder = (id: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedOrders = orders.filter(order => order.id !== id);
            setOrders(updatedOrders);
            setDetailModalVisible(false);
          }
        }
      ]
    );
  };

  const viewOrderDetails = (order: RepairOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const openNotifyModal = (order: RepairOrder) => {
    setSelectedOrder(order);

    let defaultMessage = '';
    switch (order.status) {
      case 'pending':
        defaultMessage = `Estimado/a ${order.customer.name}, su orden #${order.id} ha sido recibida. Le informaremos cuando comience la reparación.`;
        break;
      case 'in_progress':
        defaultMessage = `Estimado/a ${order.customer.name}, su orden #${order.id} está siendo procesada. Estimamos terminarla el ${formatDate(order.estimatedCompletionDate)}.`;
        break;
      case 'completed':
        defaultMessage = `Estimado/a ${order.customer.name}, su orden #${order.id} ha sido completada. Ya puede pasar a recoger su dispositivo.`;
        break;
      case 'delivered':
        defaultMessage = `Estimado/a ${order.customer.name}, gracias por confiar en nosotros. Si tiene algún problema con la reparación, no dude en contactarnos.`;
        break;
      default:
        defaultMessage = `Estimado/a ${order.customer.name}, hay una actualización sobre su orden #${order.id}.`;
    }

    setNotificationData({
      method: 'sms',
      message: defaultMessage
    });

    setNotifyModalVisible(true);
  };

  const sendNotification = async () => {
    try {
      if (!selectedOrder || !notificationData.message) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }

      const notifyType = notificationData.method === 'sms' ? 'SMS' : 'Email';
      const now = new Date().toISOString();

      const updatedOrders = orders.map(order => {
        if (order.id === selectedOrder.id) {
          const updatedHistory = [
            ...order.history,
            {
              date: now,
              action: `${notifyType} enviado al cliente: "${notificationData.message.substring(0, 30)}..."`,
              user: 'Admin'
            }
          ];

          return {
            ...order,
            history: updatedHistory,
            updatedAt: new Date()
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      setNotifyModalVisible(false);
      Alert.alert('Éxito', `Notificación enviada por ${notifyType}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la notificación');
    }
  };

  const changeOrderStatus = async (id: string, newStatus: OrderStatus): Promise<void> => {
    try {
      if (!id) {
        throw new Error('Invalid order ID');
      }

      const now = new Date().toISOString();
      const statusTexts: Record<OrderStatus, string> = {
        pending: 'pendiente',
        in_progress: 'en proceso',
        completed: 'completada',
        delivered: 'entregada',
        cancelled: 'cancelada'
      };

      const updatedOrders = orders.map(order => {
        if (order.id === id) {
          return {
            ...order,
            status: newStatus,
            completedAt: newStatus === 'completed' ? now : order.completedAt,
            history: [
              ...order.history,
              {
                date: now,
                action: `Estado cambiado a ${statusTexts[newStatus]}`,
                user: 'Admin'
              }
            ],
            updatedAt: now
          };
        }
        return order;
      });

      setOrders(updatedOrders as RepairOrder[]);
      if (selectedOrder && selectedOrder.id === id) {
        const updatedOrder = updatedOrders.find(o => o.id === id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder as RepairOrder);
        }
      }
      Alert.alert('Éxito', `Estado actualizado a ${statusTexts[newStatus]}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo actualizar el estado');
    }
  };

  const openBudgetModal = (order: RepairOrder) => {
    setSelectedOrder(order);
    setBudgetData({
      labor: order.budget.labor || 0,
      parts: order.budget.parts || [],
      tax: order.budget.tax || 10,
      total: order.budget.total || 0,
      notes: order.budget.notes || '',
    });
    setBudgetModalVisible(true);
  };

  const addPartToBudget = () => {
    if (!newPart.name || !newPart.price) {
      Alert.alert('Error', 'Nombre y precio son requeridos');
      return;
    }

    const price = parseFloat(newPart.price?.toString() || '0');
    const quantity = parseInt(newPart.quantity?.toString() || '1');

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido');
      return;
    }

    const partId = Date.now().toString();
    const part = { id: partId, name: newPart.name!, price, quantity };
    const updatedParts = [...budgetData.parts, part];

    const laborCost = parseFloat(budgetData.labor.toString()) || 0;
    const partsCost = updatedParts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const subtotal = laborCost + partsCost;
    const taxAmount = (subtotal * budgetData.tax) / 100;
    const total = subtotal + taxAmount;

    setBudgetData({
      ...budgetData,
      parts: updatedParts,
      total: parseFloat(total.toFixed(2))
    });

    setNewPart({ name: '', price: 0, quantity: 1 });
  };

  const removePartFromBudget = (partId: string) => {
    const updatedParts = budgetData.parts.filter(part => part.id !== partId);
    const laborCost = parseFloat(budgetData.labor.toString()) || 0;
    const partsCost = updatedParts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const subtotal = laborCost + partsCost;
    const taxAmount = (subtotal * budgetData.tax) / 100;
    const total = subtotal + taxAmount;

    setBudgetData({
      ...budgetData,
      parts: updatedParts,
      total: parseFloat(total.toFixed(2))
    });
  };

  const saveBudget = () => {
    const now = new Date().toISOString();

    const updatedOrders = orders.map(order => {
      if (order.id === selectedOrder?.id) {
        const updatedHistory = [
          ...order.history,
          { date: now, action: `Presupuesto actualizado: $${budgetData.total}`, user: 'Admin' }
        ];
        return {
          ...order,
          budget: { ...budgetData, approved: order.budget.approved },
          history: updatedHistory,
          updatedAt: now
        };
      }
      return order;
    });

    setOrders(updatedOrders.map(order => ({
      ...order,
      updatedAt: new Date(order.updatedAt)
    })) as RepairOrder[]);
    setBudgetModalVisible(false);

    if (selectedOrder) {
      const updatedOrder = updatedOrders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder({ ...updatedOrder, updatedAt: new Date(updatedOrder.updatedAt) } as RepairOrder);
      }
    }

    Alert.alert('Éxito', 'Presupuesto guardado correctamente');
  };

  const updateBudgetApproval = (id: string, approved: boolean) => {
    const now = new Date().toISOString();

    const updatedOrders = orders.map(order => {
      if (order.id === id) {
        const updatedHistory = [
          ...order.history,
          { date: now, action: `Presupuesto ${approved ? 'aprobado' : 'rechazado'} por el cliente`, user: 'Admin' }
        ];
        return {
          ...order,
          budget: { ...order.budget, approved },
          history: updatedHistory,
          updatedAt: now
        };
      }
      return order;
    });

    setOrders(updatedOrders.map(order => ({
      ...order,
      updatedAt: new Date(order.updatedAt)
    })) as RepairOrder[]);

    if (selectedOrder && selectedOrder.id === id) {
      const updatedOrder = updatedOrders.find(o => o.id === id) as RepairOrder;
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  };

  const selectExistingCustomer = (customer: { id: string; name: string; phone: string; email: string }) => {
    setFormData(prev => ({
      ...prev,
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email }
    }));
  };

  const updateLabor = (value: string) => {
    const labor = parseFloat(value) || 0;
    setBudgetData(prev => ({
      ...prev,
      labor,
      total: calculateTotal({ ...prev, labor })
    }));
  };

  const updateTax = (value: string) => {
    const tax = parseFloat(value) || 0;
    setBudgetData(prev => ({
      ...prev,
      tax,
      total: calculateTotal({ ...prev, tax })
    }));
  };

  const calculateTotal = (budget: Budget): number => {
    const partsTotal = budget.parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const subtotal = partsTotal + budget.labor;
    return Number((subtotal + (subtotal * (budget.tax / 100))).toFixed(2));
  };

  const getCustomerOrders = (customerId: string) => {
    return orders.filter(order => order.customer.id === customerId);
  };

  // ─── Renderizar picker modal ─────────────────────────
  const renderPickerModal = () => (
    <Modal
      visible={pickerModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closePicker}
    >
      <Pressable style={styles.pickerOverlay} onPress={closePicker}>
        <Pressable style={[styles.pickerModal, { backgroundColor: theme.surface }]} onPress={e => e.stopPropagation()}>
          <View style={[styles.pickerHeader, { borderBottomColor: theme.divider }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>{pickerTitle}</Text>
            <TouchableOpacity onPress={closePicker}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {pickerOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.pickerOption, { borderBottomColor: theme.divider }]}
                onPress={() => handlePickerSelect(option.value)}
              >
                <Text style={[styles.pickerOptionText, { color: theme.text }]}>{option.label}</Text>
                <MaterialCommunityIcons name="check" size={20} color={colors.primary} style={{ opacity: 0 }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // ─── Renderizar encabezado ───────────────────────────
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
      <View style={styles.headerLeft}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Órdenes de Reparación</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>{filteredOrders.length} órdenes en total</Text>
      </View>
      <View style={styles.headerRight}>
        {showSearch ? (
          <Input
            placeholder="Buscar orden..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            onBlur={() => { if (searchQuery === '') setShowSearch(false); }}
            containerStyle={{ width: 150, marginBottom: 0 }}
            leftIcon={<MaterialCommunityIcons name="magnify" size={18} color={theme.textMuted} />}
          />
        ) : (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surfaceVariant }]}
            onPress={() => setShowSearch(true)}
          >
            <MaterialCommunityIcons name="magnify" size={24} color={theme.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.primary }]}
          onPress={() => openFormModal()}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Renderizar filtros ──────────────────────────────
  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {ORDER_STATUS_OPTIONS.map(opt => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            selected={filterStatus === opt.value}
            onPress={() => setFilterStatus(opt.value)}
            style={{ marginRight: spacing.sm }}
          />
        ))}
      </ScrollView>
    </View>
  );

  // ─── Renderizar lista de órdenes ─────────────────────
  const renderOrdersList = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonLoader lines={4} lineHeight={100} borderRadius={radii.lg} />
        </View>
      );
    }

    return (
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.base }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <Card
              variant="elevated"
              padding={spacing.md}
              style={{ marginHorizontal: spacing.md, marginBottom: spacing.sm }}
            >
              <TouchableOpacity onPress={() => viewOrderDetails(item)} activeOpacity={0.7}>
                <View style={styles.orderCardHeader}>
                  <View style={styles.orderIdContainer}>
                    <Text style={[styles.orderId, { color: theme.textSecondary }]}>{item.id}</Text>
                    <MaterialCommunityIcons
                      name={getPriorityInfo(item.priority).icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={16}
                      color={getPriorityInfo(item.priority).color}
                    />
                  </View>
                  <Badge
                    label={getStatusInfo(item.status).text}
                    variant={
                      item.status === 'completed' ? 'success' :
                      item.status === 'pending' ? 'warning' :
                      item.status === 'cancelled' ? 'error' :
                      item.status === 'delivered' ? 'info' : 'primary'
                    }
                    size="sm"
                  />
                </View>

                <View style={styles.orderContent}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={[styles.orderImage, { borderRadius: radii.md }]}
                  />

                  <View style={styles.orderDetails}>
                    <Text style={[styles.customerName, { color: theme.text }]}>{item.customer.name}</Text>
                    <Text style={[styles.deviceInfo, { color: theme.textSecondary }]}>{item.device.brand} {item.device.model}</Text>
                    <Text style={[styles.issueText, { color: theme.textMuted }]} numberOfLines={2}>{item.issue}</Text>

                    <View style={styles.orderFooter}>
                      <Text style={[styles.technicianName, { color: theme.textMuted }]}>
                        <MaterialCommunityIcons name="account-wrench" size={14} color={theme.textMuted} />
                        {' '}{getTechnicianName(item.technicianId)}
                      </Text>
                      <Text style={[styles.dateText, { color: theme.textMuted }]}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={{ padding: spacing.xl }}>
            <EmptyState
              icon="clipboard-text-outline"
              title="No hay órdenes"
              message="No hay órdenes que coincidan con los filtros"
            />
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary, borderRadius: radii.md }]}
              onPress={() => { setFilterStatus('all'); setSearchQuery(''); }}
            >
              <Text style={[styles.emptyButtonText, { color: colors.white }]}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  // ─── Renderizar modal de detalles ────────────────────
  const renderDetailModal = () => {
    if (!selectedOrder) return null;

    const statusInfo = getStatusInfo(selectedOrder.status);
    const priorityInfo = getPriorityInfo(selectedOrder.priority);

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.overlay }]}>
          <View style={[styles.detailModalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Detalles de la Orden</Text>
              <TouchableOpacity onPress={() => deleteOrder(selectedOrder.id)}>
                <MaterialCommunityIcons name="delete-outline" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailScrollView}>
              {/* Cabecera con ID y Estado */}
              <View style={[styles.detailHeader, { borderBottomColor: theme.divider }]}>
                <View style={styles.detailHeaderLeft}>
                  <Text style={[styles.detailOrderId, { color: theme.text }]}>{selectedOrder.id}</Text>
                  <View style={styles.detailDateContainer}>
                    <MaterialCommunityIcons name="calendar" size={14} color={theme.textMuted} />
                    <Text style={[styles.detailDate, { color: theme.textMuted }]}>{formatDate(selectedOrder.createdAt)}</Text>
                  </View>
                </View>
                <Badge
                  label={statusInfo.text}
                  variant={
                    selectedOrder.status === 'completed' ? 'success' :
                    selectedOrder.status === 'pending' ? 'warning' :
                    selectedOrder.status === 'cancelled' ? 'error' :
                    selectedOrder.status === 'delivered' ? 'info' : 'primary'
                  }
                  size="md"
                />
              </View>

              {/* Imagen y acciones rápidas */}
              <View style={[styles.detailImageSection, { borderBottomColor: theme.divider }]}>
                <Image source={{ uri: selectedOrder.imageUrl }} style={[styles.detailImage, { borderRadius: radii.md }]} />

                <View style={styles.quickActionsContainer}>
                  <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: theme.primary, borderRadius: radii.md }]}
                    onPress={() => openFormModal(selectedOrder)}
                  >
                    <MaterialCommunityIcons name="pencil" size={22} color={colors.white} />
                    <Text style={styles.quickActionText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: colors.success, borderRadius: radii.md }]}
                    onPress={() => openBudgetModal(selectedOrder)}
                  >
                    <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.white} />
                    <Text style={styles.quickActionText}>Presupuesto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: colors.warning, borderRadius: radii.md }]}
                    onPress={() => openNotifyModal(selectedOrder)}
                  >
                    <MaterialCommunityIcons name="message-text-outline" size={22} color={colors.white} />
                    <Text style={styles.quickActionText}>Notificar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sección de información del cliente */}
              <View style={[styles.detailSection, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
                  <MaterialCommunityIcons name="account" size={18} color={theme.primary} />
                  {' '}Cliente
                </Text>

                <View style={styles.detailSectionContent}>
                  <Text style={[styles.detailCustomerName, { color: theme.primary }]}>{selectedOrder.customer.name}</Text>

                  <View style={styles.detailContactRow}>
                    <TouchableOpacity style={styles.detailContactButton}>
                      <MaterialCommunityIcons name="phone" size={18} color={colors.success} />
                      <Text style={[styles.detailContactText, { color: theme.textSecondary }]}>{selectedOrder.customer.phone}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.detailContactButton}>
                      <MaterialCommunityIcons name="email-outline" size={18} color={theme.primary} />
                      <Text style={[styles.detailContactText, { color: theme.textSecondary }]}>{selectedOrder.customer.email}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.historyButton, { backgroundColor: theme.surfaceVariant, borderRadius: radii.md }]}
                    onPress={() => {
                      const customerOrders = getCustomerOrders(selectedOrder.customer.id);
                      Alert.alert('Historial del Cliente', `Este cliente tiene ${customerOrders.length} órdenes en total`);
                    }}
                  >
                    <Text style={[styles.historyButtonText, { color: theme.primary }]}>Ver historial de órdenes</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sección de información del dispositivo */}
              <View style={[styles.detailSection, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
                  <MaterialCommunityIcons name="cellphone" size={18} color={theme.primary} />
                  {' '}Dispositivo
                </Text>

                <View style={styles.detailSectionContent}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Tipo:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {selectedOrder.device.type === 'smartphone' ? 'Smartphone' :
                       selectedOrder.device.type === 'tablet' ? 'Tablet' : 'Otro'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Marca/Modelo:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {selectedOrder.device.brand} {selectedOrder.device.model}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Nº Serie:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{selectedOrder.device.serialNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Estado:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{selectedOrder.device.condition}</Text>
                  </View>
                </View>
              </View>

              {/* Sección de reparación */}
              <View style={[styles.detailSection, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
                  <MaterialCommunityIcons name="tools" size={18} color={theme.primary} />
                  {' '}Detalles de Reparación
                </Text>

                <View style={styles.detailSectionContent}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Problema:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{selectedOrder.issue}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Prioridad:</Text>
                    <View style={styles.detailValueWithIcon}>
                      <MaterialCommunityIcons name={priorityInfo.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={16} color={priorityInfo.color} />
                      <Text style={[styles.detailValue, { color: theme.text, marginLeft: spacing.xs }]}>{priorityInfo.text}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Técnico:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{getTechnicianName(selectedOrder.technicianId)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Fecha estimada:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {formatDate(selectedOrder.estimatedCompletionDate)}
                    </Text>
                  </View>

                  {selectedOrder.notes && (
                    <View style={[styles.detailNotesContainer, { backgroundColor: theme.surfaceVariant, borderRadius: radii.md }]}>
                      <Text style={[styles.detailNotesLabel, { color: theme.textMuted }]}>Notas:</Text>
                      <Text style={[styles.detailNotesText, { color: theme.text }]}>{selectedOrder.notes}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Sección de presupuesto */}
              <View style={[styles.detailSection, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={18} color={theme.primary} />
                  {' '}Presupuesto
                </Text>

                <View style={styles.detailSectionContent}>
                  <View style={[styles.budgetSummary, { backgroundColor: theme.surfaceVariant, borderRadius: radii.md }]}>
                    <View style={styles.budgetDetail}>
                      <Text style={[styles.budgetLabel, { color: theme.textMuted }]}>Mano de obra:</Text>
                      <Text style={[styles.budgetValue, { color: theme.text }]}>${selectedOrder.budget.labor}</Text>
                    </View>

                    <View style={styles.budgetDetail}>
                      <Text style={[styles.budgetLabel, { color: theme.textMuted }]}>Repuestos:</Text>
                      <Text style={[styles.budgetValue, { color: theme.text }]}>
                        ${selectedOrder.budget.parts.reduce((sum, part) => sum + (part.price * part.quantity), 0)}
                      </Text>
                    </View>

                    <View style={styles.budgetDetail}>
                      <Text style={[styles.budgetLabel, { color: theme.textMuted }]}>Impuestos:</Text>
                      <Text style={[styles.budgetValue, { color: theme.text }]}>${selectedOrder.budget.tax}</Text>
                    </View>

                    <View style={[styles.budgetDetail, { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: theme.divider }]}>
                      <Text style={[styles.budgetTotalLabel, { color: theme.text }]}>Total:</Text>
                      <Text style={[styles.budgetTotalValue, { color: theme.primary }]}>${selectedOrder.budget.total}</Text>
                    </View>
                  </View>

                  {selectedOrder.budget.parts.length > 0 && (
                    <View style={styles.partsList}>
                      <Text style={[styles.partsListTitle, { color: theme.textMuted }]}>Repuestos:</Text>
                      {selectedOrder.budget.parts.map((part) => (
                        <View key={part.id} style={[styles.partItem, { borderBottomColor: theme.divider }]}>
                          <Text style={[styles.partName, { color: theme.text }]}>{part.name}</Text>
                          <Text style={[styles.partPrice, { color: theme.textSecondary }]}>${part.price} x {part.quantity}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.budgetStatusContainer}>
                    <Text style={[styles.budgetStatusLabel, { color: theme.textMuted }]}>Estado:</Text>
                    <View style={styles.budgetApprovalContainer}>
                      {selectedOrder.budget.approved ? (
                        <View style={styles.budgetApproved}>
                          <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                          <Text style={[styles.budgetApprovalText, { color: colors.success }]}>Aprobado</Text>
                        </View>
                      ) : (
                        <View style={styles.budgetPending}>
                          <MaterialCommunityIcons name="clock-outline" size={16} color={colors.warning} />
                          <Text style={[styles.budgetApprovalText, { color: colors.warning }]}>Pendiente</Text>
                        </View>
                      )}

                      {!selectedOrder.budget.approved && (
                        <View style={styles.budgetActions}>
                          <Button
                            title="Aprobar"
                            variant="success"
                            size="sm"
                            onPress={() => updateBudgetApproval(selectedOrder.id, true)}
                            style={{ marginRight: spacing.sm }}
                          />
                          <Button
                            title="Rechazar"
                            variant="danger"
                            size="sm"
                            onPress={() => updateBudgetApproval(selectedOrder.id, false)}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Historial de la orden */}
              <View style={[styles.detailSection, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
                  <MaterialCommunityIcons name="history" size={18} color={theme.primary} />
                  {' '}Historial
                </Text>

                <View style={styles.historyContainer}>
                  {selectedOrder.history.map((event, index) => (
                    <View key={index} style={styles.historyItem}>
                      <View style={[styles.historyDot, { backgroundColor: theme.primary }]} />
                      {index < selectedOrder.history.length - 1 && (
                        <View style={[styles.historyLine, { backgroundColor: theme.divider }]} />
                      )}

                      <View style={styles.historyContent}>
                        <Text style={[styles.historyAction, { color: theme.text }]}>{event.action}</Text>
                        <View style={styles.historyMeta}>
                          <Text style={[styles.historyUser, { color: theme.textMuted }]}>{event.user}</Text>
                          <Text style={[styles.historyDate, { color: theme.textMuted }]}>{formatDate(event.date)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Sección de cambio de estado */}
              <View style={styles.changeStatusSection}>
                <Text style={[styles.changeStatusTitle, { color: theme.text }]}>Cambiar Estado</Text>

                <View style={styles.statusButtonsContainer}>
                  {STATUS_CHANGE_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.status}
                      style={[styles.statusButton, { backgroundColor: opt.color, borderRadius: radii.md }]}
                      onPress={() => changeOrderStatus(selectedOrder.id, opt.status)}
                    >
                      <MaterialCommunityIcons name={opt.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={colors.white} />
                      <Text style={[styles.statusButtonText, { color: colors.white }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Renderizar modal de formulario ──────────────────
  const renderFormModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <Pressable onPress={Keyboard.dismiss}>
        <View style={[styles.modalContainer, { backgroundColor: theme.overlay }]}>
          <View style={[styles.formModalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingOrder ? 'Editar Orden' : 'Nueva Orden'}
              </Text>
              <TouchableOpacity onPress={saveOrder}>
                <MaterialCommunityIcons name="content-save" size={24} color={colors.success} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScrollView}>
              {/* Sección de Cliente */}
              <View style={[styles.formSection, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.formSectionTitle, { color: theme.text }]}>
                  <MaterialCommunityIcons name="account" size={18} color={theme.primary} />
                  {' '}Información del Cliente
                </Text>

                <Input
                  placeholder="Nombre del cliente"
                  value={formData.customer?.name || ''}
                  onChangeText={(text) => updateFormField('customer', text, 'name')}
                />

                {/* Lista de clientes frecuentes */}
                <View style={styles.quickCustomersContainer}>
                  <Text style={[styles.quickCustomersTitle, { color: theme.textMuted }]}>Clientes recientes:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {mockCustomers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={[styles.quickCustomerChip, { backgroundColor: theme.surfaceVariant, borderRadius: radii['2xl'] }]}
                        onPress={() => selectExistingCustomer(customer)}
                      >
                        <MaterialCommunityIcons name="account-circle" size={18} color={theme.primary} />
                        <Text style={[styles.quickCustomerName, { color: theme.textSecondary }]}>{customer.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Input
                  placeholder="Teléfono de contacto"
                  value={formData.customer?.phone || ''}
                  onChangeText={(text) => updateFormField('customer', text, 'phone')}
                  keyboardType="phone-pad"
                />

                <Input
                  placeholder="Correo electrónico"
                  value={formData.customer?.email || ''}
                  onChangeText={(text) => updateFormField('customer', text, 'email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Sección de Dispositivo */}
              <View style={[styles.formSection, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.formSectionTitle, { color: theme.text }]}>
                  <MaterialCommunityIcons name="cellphone" size={18} color={theme.primary} />
                  {' '}Información del Dispositivo
                </Text>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Tipo:</Text>
                  <TouchableOpacity
                    style={[styles.pickerButton, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, borderRadius: radii.md }]}
                    onPress={() => openPicker(
                      'Tipo de Dispositivo',
                      DEVICE_TYPES,
                      formData.device.type,
                      (value) => updateFormField('device', value, 'type'),
                    )}
                  >
                    <Text style={[styles.pickerButtonText, { color: theme.text }]}>
                      {getPickerLabel(DEVICE_TYPES, formData.device.type)}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Marca:</Text>
                  <Input
                    placeholder="Marca del dispositivo"
                    value={formData.device?.brand || ''}
                    onChangeText={(text: string) => updateFormField('device', text, 'brand' as keyof typeof formData.device)}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Modelo:</Text>
                  <Input
                    placeholder="Modelo del dispositivo"
                    value={formData.device.model}
                    onChangeText={(text) => updateFormField('device', text, 'model')}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Nº Serie:</Text>
                  <Input
                    placeholder="IMEI o número de serie"
                    value={formData.device.serialNumber}
                    onChangeText={(text) => updateFormField('device', text, 'serialNumber')}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Condición:</Text>
                  <Input
                    placeholder="Estado físico del dispositivo"
                    value={formData.device.condition}
                    onChangeText={(text) => updateFormField('device', text, 'condition')}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>

              {/* Sección de Reparación */}
              <View style={[styles.formSection, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.formSectionTitle, { color: theme.text }]}>
                  <MaterialCommunityIcons name="tools" size={18} color={theme.primary} />
                  {' '}Detalles de Reparación
                </Text>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Problema:</Text>
                  <Input
                    placeholder="Descripción del problema"
                    value={formData.issue}
                    onChangeText={(text) => updateFormField('issue', text)}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Notas:</Text>
                  <Input
                    placeholder="Notas adicionales"
                    value={formData.notes || ''}
                    onChangeText={(text) => updateFormField('notes', text)}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Prioridad:</Text>
                  <TouchableOpacity
                    style={[styles.pickerButton, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, borderRadius: radii.md }]}
                    onPress={() => openPicker(
                      'Prioridad',
                      PRIORITY_OPTIONS,
                      formData.priority,
                      (value) => updateFormField('priority', value),
                    )}
                  >
                    <Text style={[styles.pickerButtonText, { color: theme.text }]}>
                      {getPickerLabel(PRIORITY_OPTIONS, formData.priority)}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Técnico:</Text>
                  <TouchableOpacity
                    style={[styles.pickerButton, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, borderRadius: radii.md }]}
                    onPress={() => openPicker(
                      'Seleccionar Técnico',
                      [{ label: 'Ninguno', value: '' }, ...mockTechnicians.map(t => ({ label: `${t.name} (${t.specialty})`, value: t.id }))],
                      formData.technicianId,
                      (value) => updateFormField('technicianId', value),
                    )}
                  >
                    <Text style={[styles.pickerButtonText, { color: theme.text }]}>
                      {formData.technicianId ? getTechnicianName(formData.technicianId) : 'Seleccionar técnico'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Fecha estimada:</Text>
                  <TouchableOpacity style={[styles.pickerButton, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, borderRadius: radii.md }]}>
                    <Text style={[styles.pickerButtonText, { color: theme.text }]}>
                      {formData.estimatedCompletionDate ? formatDate(formData.estimatedCompletionDate) : 'Seleccionar fecha'}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={18} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  // ─── Renderizar modal de notificaciones ──────────────
  const renderNotifyModal = () => (
    <Modal
      visible={notifyModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setNotifyModalVisible(false)}
    >
      <Pressable onPress={Keyboard.dismiss}>
        <View style={[styles.modalContainer, { backgroundColor: theme.overlay }]}>
          <Card variant="elevated" style={[styles.notifyModalContent, { alignSelf: 'center' }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
              <TouchableOpacity onPress={() => setNotifyModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Notificar al Cliente</Text>
              <TouchableOpacity onPress={sendNotification}>
                <MaterialCommunityIcons name="send" size={24} color={colors.success} />
              </TouchableOpacity>
            </View>

            <View style={styles.notifyContent}>
              <View style={[styles.customerInfoCard, { backgroundColor: theme.surfaceVariant, borderRadius: radii.md }]}>
                <MaterialCommunityIcons name="account-circle" size={36} color={theme.primary} />
                <View style={styles.customerInfoText}>
                  <Text style={[styles.customerInfoName, { color: theme.text }]}>{selectedOrder?.customer.name}</Text>
                  <Text style={[styles.customerInfoContact, { color: theme.textMuted }]}>
                    {selectedOrder?.customer.phone} • {selectedOrder?.customer.email}
                  </Text>
                </View>
              </View>

              <View style={styles.notifyMethodContainer}>
                <Text style={[styles.notifyLabel, { color: theme.textSecondary }]}>Método de Notificación:</Text>
                <View style={styles.notifyMethodButtons}>
                  <TouchableOpacity
                    style={[
                      styles.notifyMethodButton,
                      { backgroundColor: notificationData.method === 'sms' ? theme.primary : theme.surfaceVariant, borderRadius: radii.md }
                    ]}
                    onPress={() => setNotificationData({ ...notificationData, method: 'sms' })}
                  >
                    <MaterialCommunityIcons
                      name="message-text"
                      size={18}
                      color={notificationData.method === 'sms' ? colors.white : theme.primary}
                    />
                    <Text style={[
                      styles.notifyMethodText,
                      { color: notificationData.method === 'sms' ? colors.white : theme.textSecondary }
                    ]}>SMS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.notifyMethodButton,
                      { backgroundColor: notificationData.method === 'email' ? theme.primary : theme.surfaceVariant, borderRadius: radii.md }
                    ]}
                    onPress={() => setNotificationData({ ...notificationData, method: 'email' })}
                  >
                    <MaterialCommunityIcons
                      name="email"
                      size={18}
                      color={notificationData.method === 'email' ? colors.white : theme.primary}
                    />
                    <Text style={[
                      styles.notifyMethodText,
                      { color: notificationData.method === 'email' ? colors.white : theme.textSecondary }
                    ]}>Email</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.messageContainer}>
                <Text style={[styles.notifyLabel, { color: theme.textSecondary }]}>Mensaje:</Text>
                <Input
                  placeholder="Escriba el mensaje para el cliente..."
                  value={notificationData.message}
                  onChangeText={(text) => setNotificationData({ ...notificationData, message: text })}
                  multiline
                  numberOfLines={6}
                  containerStyle={{ minHeight: 120 }}
                />
              </View>

              <View style={styles.templateContainer}>
                <Text style={[styles.notifyLabel, { color: theme.textSecondary }]}>Plantillas:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
                  {[
                    {
                      label: 'Reparación Lista',
                      message: `Estimado/a ${selectedOrder?.customer.name}, su reparación (${selectedOrder?.id}) está lista para ser recogida. Horario de atención: L-V 9:00-18:00.`,
                    },
                    {
                      label: 'Iniciando Reparación',
                      message: `Estimado/a ${selectedOrder?.customer.name}, hemos comenzado a trabajar en su dispositivo. Le notificaremos cuando esté listo.`,
                    },
                    {
                      label: 'Aprobar Presupuesto',
                      message: `Estimado/a ${selectedOrder?.customer.name}, necesitamos autorización para el presupuesto de su reparación (${selectedOrder?.id}). Por favor contáctenos.`,
                    },
                  ].map((tpl, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.templateButton, { backgroundColor: theme.surfaceVariant, borderRadius: radii.md }]}
                      onPress={() => setNotificationData({ ...notificationData, message: tpl.message })}
                    >
                      <Text style={[styles.templateButtonText, { color: theme.primary }]}>{tpl.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Card>
        </View>
      </Pressable>
    </Modal>
  );

  // ─── Renderizar modal de presupuesto ─────────────────
  const renderBudgetModal = () => (
    <Modal
      visible={budgetModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setBudgetModalVisible(false)}
    >
      <Pressable onPress={Keyboard.dismiss}>
        <View style={[styles.modalContainer, { backgroundColor: theme.overlay }]}>
          <Card variant="elevated" style={[styles.budgetModalContent, { alignSelf: 'center' }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
              <TouchableOpacity onPress={() => setBudgetModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Presupuesto</Text>
              <TouchableOpacity onPress={saveBudget}>
                <MaterialCommunityIcons name="content-save" size={24} color={colors.success} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.budgetScrollView}>
              <View style={[styles.budgetOrderInfo, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.budgetOrderId, { color: theme.text }]}>{selectedOrder?.id}</Text>
                <Text style={[styles.budgetOrderDesc, { color: theme.textMuted }]}>
                  {selectedOrder?.device.brand} {selectedOrder?.device.model} • {selectedOrder?.customer.name}
                </Text>
              </View>

              <View style={styles.budgetFormSection}>
                <View style={styles.budgetFormRow}>
                  <Text style={[styles.budgetFormLabel, { color: theme.textSecondary }]}>Mano de obra:</Text>
                  <Input
                    value={budgetData.labor.toString()}
                    onChangeText={updateLabor}
                    keyboardType="numeric"
                    placeholder="0.00"
                    containerStyle={{ width: 100, marginBottom: 0 }}
                  />
                </View>

                <View style={styles.budgetFormRow}>
                  <Text style={[styles.budgetFormLabel, { color: theme.textSecondary }]}>Impuesto (%):</Text>
                  <Input
                    value={budgetData.tax.toString()}
                    onChangeText={updateTax}
                    keyboardType="numeric"
                    placeholder="0"
                    containerStyle={{ width: 100, marginBottom: 0 }}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                <Text style={[styles.budgetPartsTitle, { color: theme.text }]}>Repuestos:</Text>

                {budgetData.parts.map((part) => (
                  <View key={part.id} style={[styles.budgetPartItem, { borderBottomColor: theme.divider }]}>
                    <View style={styles.budgetPartInfo}>
                      <Text style={[styles.budgetPartName, { color: theme.text }]}>{part.name}</Text>
                      <Text style={[styles.budgetPartPrice, { color: theme.textMuted }]}>
                        ${part.price} x {part.quantity} = ${part.price * part.quantity}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.budgetPartDelete}
                      onPress={() => removePartFromBudget(part.id)}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={[styles.addPartForm, { backgroundColor: theme.surfaceVariant, borderRadius: radii.md }]}>
                  <Text style={[styles.addPartTitle, { color: theme.text }]}>Agregar Repuesto:</Text>

                  <View style={styles.addPartRow}>
                    <Input
                      placeholder="Nombre del repuesto"
                      value={newPart.name || ''}
                      onChangeText={(text) => setNewPart({ ...newPart, name: text })}
                    />
                  </View>

                  <View style={styles.addPartRow}>
                    <View style={styles.addPartPriceContainer}>
                      <Input
                        placeholder="Precio"
                        value={newPart.price?.toString() || ''}
                        onChangeText={(text) => setNewPart({ ...newPart, price: parseFloat(text) || 0 })}
                        keyboardType="numeric"
                        containerStyle={{ flex: 1, marginRight: spacing.sm, marginBottom: 0 }}
                      />

                      <Input
                        placeholder="Cant."
                        value={newPart.quantity?.toString() || ''}
                        onChangeText={(text) => setNewPart({ ...newPart, quantity: parseInt(text) || 1 })}
                        keyboardType="numeric"
                        containerStyle={{ width: 60, marginBottom: 0 }}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.addPartButton, { backgroundColor: colors.success, borderRadius: radii.md }]}
                      onPress={addPartToBudget}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                <View style={[styles.budgetTotalContainer, { backgroundColor: theme.primary, borderRadius: radii.md }]}>
                  <Text style={[styles.budgetTotalLabel, { color: colors.white }]}>TOTAL:</Text>
                  <Text style={[styles.budgetTotalValue, { color: colors.white }]}>${budgetData.total}</Text>
                </View>

                <View style={styles.budgetNotesContainer}>
                  <Text style={[styles.budgetNotesLabel, { color: theme.textSecondary }]}>Notas adicionales:</Text>
                  <Input
                    placeholder="Notas sobre el presupuesto..."
                    value={budgetData.notes || ''}
                    onChangeText={(text) => setBudgetData(prev => ({ ...prev, notes: text }))}
                    multiline
                    numberOfLines={3}
                    containerStyle={{ minHeight: 80 }}
                  />
                </View>
              </View>
            </ScrollView>
          </Card>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderHeader()}
      {renderFilters()}
      {renderOrdersList()}
      {renderDetailModal()}
      {renderFormModal()}
      {renderNotifyModal()}
      {renderBudgetModal()}
      {renderPickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
    borderRadius: radii.md,
  },
  filtersContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + spacing.xs,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginRight: spacing.xs + 2,
  },
  orderContent: {
    flexDirection: 'row',
  },
  orderImage: {
    width: 60,
    height: 60,
    marginRight: spacing.md,
  },
  orderDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  deviceInfo: {
    fontSize: typography.sizes.sm,
    marginBottom: 2,
  },
  issueText: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  technicianName: {
    fontSize: typography.sizes.xs,
  },
  dateText: {
    fontSize: typography.sizes.xs,
  },
  emptyButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  emptyButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    width: '100%',
    height: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  formModalContent: {
    width: '100%',
    height: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  notifyModalContent: {
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  budgetModalContent: {
    width: '90%',
    maxHeight: '80%',
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
  detailScrollView: {
    flex: 1,
  },
  formScrollView: {
    flex: 1,
  },
  budgetScrollView: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  detailHeaderLeft: {
    flex: 1,
  },
  detailOrderId: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  detailDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailDate: {
    fontSize: typography.sizes.xs,
    marginLeft: spacing.xs,
  },
  detailImageSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  detailImage: {
    width: '100%',
    height: 200,
    marginBottom: spacing.base,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  quickActionText: {
    color: colors.white,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.sm,
  },
  detailSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  detailSectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  detailSectionContent: {
    marginLeft: spacing.sm,
  },
  detailCustomerName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  detailContactRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  detailContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  detailContactText: {
    fontSize: typography.sizes.sm,
    marginLeft: spacing.xs,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  historyButtonText: {
    fontSize: typography.sizes.sm,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    width: 100,
  },
  detailValue: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  detailValueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailNotesContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  detailNotesLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  detailNotesText: {
    fontSize: typography.sizes.sm,
  },
  budgetSummary: {
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  budgetDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  budgetLabel: {
    fontSize: typography.sizes.sm,
  },
  budgetValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  budgetTotalLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  budgetTotalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  partsList: {
    marginBottom: spacing.base,
  },
  partsListTitle: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  partItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  partName: {
    fontSize: typography.sizes.sm,
  },
  partPrice: {
    fontSize: typography.sizes.sm,
  },
  budgetStatusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  budgetStatusLabel: {
    fontSize: typography.sizes.sm,
    width: 60,
  },
  budgetApprovalContainer: {
    flex: 1,
  },
  budgetApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetPending: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetApprovalText: {
    fontSize: typography.sizes.sm,
    marginLeft: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  budgetActions: {
    flexDirection: 'row',
  },
  historyContainer: {
    marginTop: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
    marginTop: spacing.xs,
    marginRight: spacing.sm,
    zIndex: 1,
  },
  historyLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: -spacing.sm,
    width: 2,
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyUser: {
    fontSize: typography.sizes.xs,
  },
  historyDate: {
    fontSize: typography.sizes.xs,
  },
  changeStatusSection: {
    padding: spacing.base,
  },
  changeStatusTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  statusButtonText: {
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs + 2,
  },
  formSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  formSectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.base,
  },
  formRow: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs + 2,
  },
  quickCustomersContainer: {
    marginBottom: spacing.md,
  },
  quickCustomersTitle: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.sm,
  },
  quickCustomerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  quickCustomerName: {
    fontSize: typography.sizes.xs,
    marginLeft: spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 48,
  },
  pickerButtonText: {
    fontSize: typography.sizes.sm,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModal: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: typography.sizes.base,
  },
  notifyContent: {
    padding: spacing.base,
  },
  customerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  customerInfoText: {
    marginLeft: spacing.md,
  },
  customerInfoName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  customerInfoContact: {
    fontSize: typography.sizes.xs,
  },
  notifyMethodContainer: {
    marginBottom: spacing.base,
  },
  notifyLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  notifyMethodButtons: {
    flexDirection: 'row',
  },
  notifyMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  notifyMethodText: {
    fontSize: typography.sizes.sm,
    marginLeft: spacing.sm,
  },
  messageContainer: {
    marginBottom: spacing.base,
  },
  templateContainer: {
    marginBottom: spacing.base,
  },
  templateScroll: {
    paddingVertical: spacing.sm,
  },
  templateButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  templateButtonText: {
    fontSize: typography.sizes.sm,
  },
  budgetOrderInfo: {
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  budgetOrderId: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  budgetOrderDesc: {
    fontSize: typography.sizes.sm,
  },
  budgetFormSection: {
    padding: spacing.base,
  },
  budgetFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  budgetFormLabel: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: spacing.base,
  },
  budgetPartsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.md,
  },
  budgetPartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  budgetPartInfo: {
    flex: 1,
  },
  budgetPartName: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  budgetPartPrice: {
    fontSize: typography.sizes.xs,
  },
  budgetPartDelete: {
    padding: spacing.sm,
  },
  addPartForm: {
    padding: spacing.md,
    marginTop: spacing.base,
    marginBottom: spacing.base,
  },
  addPartTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  addPartRow: {
    marginBottom: spacing.sm,
  },
  addPartPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addPartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  budgetTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.base,
  },
  budgetNotesContainer: {
    marginBottom: spacing.base,
  },
  budgetNotesLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
});

export default BudgetScreen;
