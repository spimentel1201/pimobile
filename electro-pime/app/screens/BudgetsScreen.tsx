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
  Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { RepairOrder, BudgetPart, Budget, OrderStatus, StatusInfo, FormData, NotificationData } from '../types/budget';
import DateTimePicker from '@react-native-community/datetimepicker';

const BudgetsScreen = () => {
  // Order management states
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<RepairOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);

  // Estados para modales
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState<boolean>(false);
  const [notifyModalVisible, setNotifyModalVisible] = useState<boolean>(false);

  // Estado para edición
  const [editingOrder, setEditingOrder] = useState<RepairOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);

  // Estado para calendario
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
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
    notes: '' // Initialize notes
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

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false); // Oculta el calendario después de seleccionar una fecha
    if (date) {
      setSelectedDate(date); // Actualiza la fecha seleccionada
      updateFormField('estimatedCompletionDate', date); // Actualiza el campo en el formulario
    }
  };

  // Efectos para filtrado
  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus, searchQuery]);

  const filterOrders = () => {
    let filtered = [...orders];
  
    // Filtra por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (order) => order.status === filterStatus
      );
    }
  
    // Filtra por búsqueda
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        // Verifica que las propiedades existan antes de acceder a ellas
        const customerName = order.customer?.name?.toLowerCase() || '';
        const deviceModel = order.device?.model?.toLowerCase() || '';
        const orderId = order.id?.toLowerCase() || '';
  
        return (
          customerName.includes(query) ||
          deviceModel.includes(query) ||
          orderId.includes(query)
        );
      });
    }
  
    setFilteredOrders(filtered);
  };
  // Cargar datos de prueba al iniciar
  useEffect(() => {
    // Simulamos una carga de datos
    const mockOrders = [
      {
        id: 'ORD-2023-001',
        customer: {
          id: '1',
          name: 'Juan Pérez', // Asegúrate de que esta propiedad exista
          phone: '612345678',
          email: 'juan@example.com',
        },
        device: {
          type: 'smartphone',
          brand: 'Samsung', // Asegúrate de que esta propiedad exista
          model: 'Galaxy S21', // Asegúrate de que esta propiedad exista
          serialNumber: '123456789',
          condition: 'Buen estado',
        },
        issue: 'Pantalla rota',
        notes: '',
        status: 'pending',
        priority: 'medium',
        technicianId: '1',
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
          notes: '',
        },
        history: [],
      },
    ];
    
    setOrders(mockOrders as RepairOrder[]);
    setFilteredOrders(mockOrders as RepairOrder[]);
    
  }, []);

  // Filtrar órdenes por estado y búsqueda
  useEffect(() => {
    let result = [...orders];

    // Filtrar por estado
    if (filterStatus !== 'all') {
      result = result.filter(order => order.status === filterStatus);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.device.brand.toLowerCase().includes(query) ||
        order.device.model.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(result);
  }, [orders, filterStatus, searchQuery]);

  // Formatear fecha para mostrar
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

  // Obtener texto y color según estado
  const getStatusInfo = (status: OrderStatus): StatusInfo => {
    switch (status) {
      case 'pending':
        return { text: 'Pendiente', color: '#ffc107', icon: 'clock-outline' };
      case 'in_progress':
        return { text: 'En Proceso', color: '#0056b3', icon: 'tools' };
      case 'completed':
        return { text: 'Completada', color: '#28a745', icon: 'check-circle-outline' };
      case 'delivered':
        return { text: 'Entregada', color: '#6610f2', icon: 'package-variant-closed-check' };
      case 'cancelled':
        return { text: 'Cancelada', color: '#dc3545', icon: 'close-circle-outline' };
      default:
        return { text: 'Desconocido', color: '#6c757d', icon: 'help-circle-outline' };
    }
  };

  // Obtener información de prioridad
  const getPriorityInfo = (priority: 'high' | 'medium' | 'low'): { text: string; color: string; icon: string; } => {
    switch (priority) {
      case 'high':
        return { text: 'Alta', color: '#dc3545', icon: 'alert-circle' };
      case 'medium':
        return { text: 'Media', color: '#ffc107', icon: 'alert' };
      case 'low':
        return { text: 'Baja', color: '#28a745', icon: 'information' };
      default:
        return { text: 'Normal', color: '#6c757d', icon: 'information-outline' };
    }
  };

  // Obtener nombre del técnico por ID
  const getTechnicianName = (id: string): string => {
    const tech = mockTechnicians.find(t => t.id === id);
    return tech ? tech.name : 'No asignado';
  };

  // Actualizar campo del formulario
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

  // Cerrar modal
  const closeFormModal = () => {
    setModalVisible(false);
    setFormData({} as FormData);
  };

  // Guardar orden (nueva o editada)
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
      // Ensure updatedFormData has required id before adding to orders
      if (updatedFormData.id) {
        setOrders([updatedFormData as RepairOrder, ...orders]);
      } else {
        console.error('Cannot add order without id');
      }
    }
  
    setModalVisible(false);
    setFormData({} as FormData);
  };

  // Eliminar orden
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

  // Ver detalles de una orden
  const viewOrderDetails = (order: RepairOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  // Abrir modal de notificaciones
  const openNotifyModal = (order: RepairOrder) => {
    setSelectedOrder(order);
  
    // Generar mensaje predeterminado según el estado
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

  // Enviar notificación
  const sendNotification = async () => {
    try {
      if (!selectedOrder || !notificationData.message) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }
  
      const notifyType = notificationData.method === 'sms' ? 'SMS' : 'Email';
      const now = new Date().toISOString();  // Store as ISO string
  
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
            updatedAt: new Date()  // Keep as Date object for RepairOrder
          };
        }
        return order;
      });
  
      setOrders(updatedOrders);
      // ... rest of the function
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la notificación');
    }
  };

  // Cambiar estado de orden
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
      // Update selected order if it matches the changed order
      if (selectedOrder && selectedOrder.id === id) {
        const updatedOrder = updatedOrders.find(o => o.id === id);
        if (updatedOrder) {
          // Cast the updatedOrder to RepairOrder to ensure type safety
          setSelectedOrder(updatedOrder as RepairOrder);
        }
      }
      Alert.alert('Éxito', `Estado actualizado a ${statusTexts[newStatus]}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo actualizar el estado');
    }
  };

  // Abrir modal de presupuesto
  const openBudgetModal = (order: RepairOrder) => {
    setSelectedOrder(order);
    setBudgetData({
      labor: order.budget.labor || 0,
      parts: order.budget.parts || [],
      tax: order.budget.tax || 10,
      total: order.budget.total || 0,
    });
    setBudgetModalVisible(true);
  };

  // Añadir pieza al presupuesto
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
    const part = {
      id: partId,
      name: newPart.name,
      price,
      quantity
    };

    const updatedParts = [...budgetData.parts, part];

    // Recalcular total
    const laborCost = parseFloat(budgetData.labor.toString()) || 0;
    const partsCost = updatedParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const subtotal = laborCost + partsCost;
    const taxAmount = (subtotal * budgetData.tax) / 100;
    const total = subtotal + taxAmount;

    setBudgetData({
      ...budgetData,
      parts: updatedParts,
      total: parseFloat(total.toFixed(2))
    });

    // Limpiar formulario de nueva pieza
    setNewPart({
      name: '',
      price: 0,
      quantity: 1,
    });
  };

  // Eliminar parte del presupuesto
  const removePartFromBudget = (partId: string) => {
    const updatedParts = budgetData.parts.filter(part => part.id !== partId);

    // Recalcular total
    const laborCost = parseFloat(budgetData.labor.toString()) || 0;
    const partsCost = updatedParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const subtotal = laborCost + partsCost;
    const taxAmount = (subtotal * budgetData.tax) / 100;
    const total = subtotal + taxAmount;

    setBudgetData({
      ...budgetData,
      parts: updatedParts,
      total: parseFloat(total.toFixed(2))
    });
  };

  // Guardar presupuesto
  const saveBudget = () => {
    const now = new Date().toISOString();

    const updatedOrders = orders.map(order => {
      if (order.id === selectedOrder?.id) {
        const updatedHistory = [
          ...order.history,
          {
            date: now,
            action: `Presupuesto actualizado: $${budgetData.total}`,
            user: 'Admin'
          }
        ];

        return {
          ...order,
          budget: {
            ...budgetData,
            approved: order.budget.approved
          },
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

    // Actualizar también el pedido seleccionado si estamos en la vista de detalles
    if (selectedOrder) {
      const updatedOrder = updatedOrders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder({
          ...updatedOrder,
          updatedAt: new Date(updatedOrder.updatedAt)
        } as RepairOrder);
      }
    }

    Alert.alert('Éxito', 'Presupuesto guardado correctamente');
  };

  // Actualizar estado de aprobación del presupuesto
  const updateBudgetApproval = (id: string, approved: boolean) => {
    const now = new Date().toISOString();

    const updatedOrders = orders.map(order => {
      if (order.id === id) {
        const updatedHistory = [
          ...order.history,
          {
            date: now,
            action: `Presupuesto ${approved ? 'aprobado' : 'rechazado'} por el cliente`,
            user: 'Admin'
          }
        ];

        return {
          ...order,
          budget: {
            ...order.budget,
            approved
          },
          history: updatedHistory,
          updatedAt: now
        };
      }
      return order;
    }
  );

    setOrders(updatedOrders.map(order => ({
      ...order,
      updatedAt: new Date(order.updatedAt)
    })) as RepairOrder[]);

        // Actualizar también el pedido seleccionado
        if (selectedOrder && selectedOrder.id === id) {
          const updatedOrder = updatedOrders.find(o => o.id === id) as RepairOrder;
          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
          }
        }
      };

  // Seleccionar cliente existente
  const selectExistingCustomer = (customer: { id: string; name: string; phone: string; email: string; }) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      }
    }));
  };
  

  // Funciones de utilidad para el presupuesto
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

  // Utility functions with proper typing
  const calculateTotal = (budget: Budget): number => {
    const partsTotal = budget.parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const subtotal = partsTotal + budget.labor;
    return Number((subtotal + (subtotal * (budget.tax / 100))).toFixed(2));
  };

  // Actualizar otros costos
  const updateOthersCost = (value: string) => {
    const others = parseFloat(value) || 0;
    const laborCost = parseFloat(budgetData.labor.toString()) || 0;
    const compCost = budgetData.parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const subtotal = laborCost + compCost + others;
    const taxAmount = (subtotal * (parseFloat(budgetData.tax.toString()) || 0)) / 100;
    const total = subtotal + taxAmount;

    setBudgetData({
      ...budgetData,
      total: parseFloat(total.toFixed(2))
    });
  };

  // Obtener órdenes de un cliente
  const getCustomerOrders = (customerId: string) => {
    return orders.filter(order => order.customer.id === customerId);
  };

  // Renderizar encabezado
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Órdenes de Reparación</Text>
        <Text style={styles.headerSubtitle}>{filteredOrders.length} órdenes en total</Text>
      </View>
      <View style={styles.headerRight}>
        {showSearch ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar orden..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            onBlur={() => {
              if (searchQuery === '') {
                setShowSearch(false);
              }
            }}
          />
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSearch(true)}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="#0056b3" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.iconButton, styles.addButton]}
          onPress={() => openFormModal()}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar filtros
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
          onPress={() => setFilterStatus('pending')}
        >
          <MaterialCommunityIcons name="clock-outline" size={16} color={filterStatus === 'pending' ? "white" : "#ffc107"} />
          <Text style={[styles.filterChipText, filterStatus === 'pending' && styles.filterChipTextActive]}>
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'in_progress' && styles.filterChipActive]}
          onPress={() => setFilterStatus('in_progress')}
        >
          <MaterialCommunityIcons name="tools" size={16} color={filterStatus === 'in_progress' ? "white" : "#0056b3"} />
          <Text style={[styles.filterChipText, filterStatus === 'in_progress' && styles.filterChipTextActive]}>
            En Proceso
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'completed' && styles.filterChipActive]}
          onPress={() => setFilterStatus('completed')}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={filterStatus === 'completed' ? "white" : "#28a745"} />
          <Text style={[styles.filterChipText, filterStatus === 'completed' && styles.filterChipTextActive]}>
            Completadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'delivered' && styles.filterChipActive]}
          onPress={() => setFilterStatus('delivered')}
        >
          <MaterialCommunityIcons name="package-variant-closed" size={16} color={filterStatus === 'delivered' ? "white" : "#6610f2"} />
          <Text style={[styles.filterChipText, filterStatus === 'delivered' && styles.filterChipTextActive]}>
            Entregadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'cancelled' && styles.filterChipActive]}
          onPress={() => setFilterStatus('cancelled')}
        >
          <MaterialCommunityIcons name="close-circle-outline" size={16} color={filterStatus === 'cancelled' ? "white" : "#dc3545"} />
          <Text style={[styles.filterChipText, filterStatus === 'cancelled' && styles.filterChipTextActive]}>
            Canceladas
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Renderizar lista de órdenes
  const renderOrdersList = () => (
    <FlatList
      data={filteredOrders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        // Verifica que el item y sus propiedades estén definidos
        if (!item || !item.customer || !item.device) {
          return null; // O puedes renderizar un componente de error o un placeholder
        }
  
        return (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => viewOrderDetails(item)}
          >
            <View style={styles.orderCardHeader}>
              <View style={styles.orderIdContainer}>
                <Text style={styles.orderId}>{item.id}</Text>
                <MaterialCommunityIcons
                  name={getPriorityInfo(item.priority).icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={16}
                  color={getPriorityInfo(item.priority).color}
                />
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusInfo(item.status).color }]}>
                <MaterialCommunityIcons name={getStatusInfo(item.status).icon as keyof typeof MaterialCommunityIcons.glyphMap} size={12} color="white" />
                <Text style={styles.statusText}>{getStatusInfo(item.status).text}</Text>
              </View>
            </View>
  
            <View style={styles.orderContent}>
              <Image source={{ uri: item.imageUrl }} style={styles.orderImage} />
  
              <View style={styles.orderDetails}>
                <Text style={styles.customerName}>{item.customer.name}</Text>
                <Text style={styles.deviceInfo}>{item.device.brand} {item.device.model}</Text>
                <Text style={styles.issueText} numberOfLines={2}>{item.issue}</Text>
  
                <View style={styles.orderFooter}>
                  <Text style={styles.technicianName}>
                    <MaterialCommunityIcons name="account-wrench" size={14} color="#6c757d" />
                    {' '}{getTechnicianName(item.technicianId)}
                  </Text>
                  <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#dee2e6" />
          <Text style={styles.emptyText}>No hay órdenes que coincidan con los filtros</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              setFilterStatus('all');
              setSearchQuery('');
            }}
          >
            <Text style={styles.emptyButtonText}>Limpiar filtros</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );

  // Renderizar modal de detalles de orden
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
        <View style={styles.modalContainer}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#0056b3" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Detalles de la Orden</Text>
              <TouchableOpacity onPress={() => deleteOrder(selectedOrder.id)}>
                <MaterialCommunityIcons name="delete-outline" size={24} color="#dc3545" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailScrollView}>
              {/* Cabecera con ID y Estado */}
              <View style={styles.detailHeader}>
                <View style={styles.detailHeaderLeft}>
                  <Text style={styles.detailOrderId}>{selectedOrder.id}</Text>
                  <View style={styles.detailDateContainer}>
                    <MaterialCommunityIcons name="calendar" size={14} color="#6c757d" />
                    <Text style={styles.detailDate}>{formatDate(selectedOrder.createdAt)}</Text>
                  </View>
                </View>

                <View style={[styles.detailStatusBadge, {backgroundColor: statusInfo.color}]}>
                  <MaterialCommunityIcons name={statusInfo.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={14} color="white" />
                  <Text style={styles.detailStatusText}>{statusInfo.text}</Text>
                </View>
              </View>

              {/* Imagen y acciones rápidas */}
              <View style={styles.detailImageSection}>
                <Image source={{ uri: selectedOrder.imageUrl }} style={styles.detailImage} />

                <View style={styles.quickActionsContainer}>
                  <TouchableOpacity
                    style={[styles.quickActionButton, {backgroundColor: '#0056b3'}]}
                    onPress={() => openFormModal(selectedOrder)}
                  >
                    <MaterialCommunityIcons name="pencil" size={22} color="white" />
                    <Text style={styles.quickActionText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickActionButton, {backgroundColor: '#28a745'}]}
                    onPress={() => openBudgetModal(selectedOrder)}
                  >
                    <MaterialCommunityIcons name="cash-multiple" size={22} color="white" />
                    <Text style={styles.quickActionText}>Presupuesto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickActionButton, {backgroundColor: '#ffc107'}]}
                    onPress={() => openNotifyModal(selectedOrder)}
                  >
                    <MaterialCommunityIcons name="message-text-outline" size={22} color="white" />
                    <Text style={styles.quickActionText}>Notificar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sección de información del cliente */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  <MaterialCommunityIcons name="account" size={18} color="#0056b3" />
                  {' '}Cliente
                </Text>

                <View style={styles.detailSectionContent}>
                  <Text style={styles.detailCustomerName}>{selectedOrder.customer.name}</Text>

                  <View style={styles.detailContactRow}>
                    <TouchableOpacity style={styles.detailContactButton}>
                      <MaterialCommunityIcons name="phone" size={18} color="#28a745" />
                      <Text style={styles.detailContactText}>{selectedOrder.customer.phone}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.detailContactButton}>
                      <MaterialCommunityIcons name="email-outline" size={18} color="#0056b3" />
                      <Text style={styles.detailContactText}>{selectedOrder.customer.email}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={styles.historyButton}
                    onPress={() => {
                      const customerOrders = getCustomerOrders(selectedOrder.customer.id);
                      // Here you could show these orders in a new modal or navigate to a history screen
                      Alert.alert(
                        'Historial del Cliente',
                        `Este cliente tiene ${customerOrders.length} órdenes en total`
                      );
                    }}
                  >
                    <Text style={styles.historyButtonText}>Ver historial de órdenes</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#0056b3" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sección de información del dispositivo */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  <MaterialCommunityIcons name="cellphone" size={18} color="#0056b3" />
                  {' '}Dispositivo
                </Text>

                <View style={styles.detailSectionContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.device.type === 'smartphone' ? 'Smartphone' :
                       selectedOrder.device.type === 'tablet' ? 'Tablet' : 'Otro'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Marca/Modelo:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.device.brand} {selectedOrder.device.model}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nº Serie:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.device.serialNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Estado:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.device.condition}</Text>
                  </View>
                </View>
              </View>

              {/* Sección de reparación */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  <MaterialCommunityIcons name="tools" size={18} color="#0056b3" />
                  {' '}Detalles de Reparación
                </Text>

                <View style={styles.detailSectionContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Problema:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.issue}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Prioridad:</Text>
                    <View style={styles.detailValueWithIcon}>
                      <MaterialCommunityIcons name={priorityInfo.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={16} color={priorityInfo.color} />
                      <Text style={styles.detailValue}>{priorityInfo.text}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Técnico:</Text>
                    <Text style={styles.detailValue}>{getTechnicianName(selectedOrder.technicianId)}</Text>
                  </View>

                  <View style={styles.formRow}>
                    <Text style={styles.formLabel}>Fecha estimada:</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(true)} // Abre el calendario al hacer clic
                    >
                      <Text style={styles.datePickerText}>
                        {formData.estimatedCompletionDate
                          ? formatDate(formData.estimatedCompletionDate)
                          : 'Seleccionar fecha'}
                      </Text>
                      <MaterialCommunityIcons name="calendar" size={18} color="#0056b3" />
                    </TouchableOpacity>

                    {/* Muestra el calendario si showDatePicker es true */}
                    {showDatePicker && (
                      <DateTimePicker
                        value={selectedDate}
                        mode="datetime" // Permite seleccionar fecha y hora
                        display="default"
                        onChange={handleDateChange}
                      />
                    )}
                  </View>

                  {selectedOrder.notes && (
                    <View style={styles.detailNotesContainer}>
                      <Text style={styles.detailNotesLabel}>Notas:</Text>
                      <Text style={styles.detailNotesText}>{selectedOrder.notes}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Sección de presupuesto */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  <MaterialCommunityIcons name="cash-multiple" size={18} color="#0056b3" />
                  {' '}Presupuesto
                </Text>

                <View style={styles.detailSectionContent}>
                  <View style={styles.budgetSummary}>
                    <View style={styles.budgetDetail}>
                      <Text style={styles.budgetLabel}>Mano de obra:</Text>
                      <Text style={styles.budgetValue}>${selectedOrder.budget.labor}</Text>
                    </View>

                    <View style={styles.budgetDetail}>
                      <Text style={styles.budgetLabel}>Repuestos:</Text>
                      <Text style={styles.budgetValue}>
                        ${selectedOrder.budget.parts.reduce((sum, part) => sum + (part.price * part.quantity), 0)}
                      </Text>
                    </View>

                    <View style={styles.budgetDetail}>
                      <Text style={styles.budgetLabel}>Impuestos:</Text>
                      <Text style={styles.budgetValue}>${selectedOrder.budget.tax}</Text>
                    </View>

                    <View style={[styles.budgetDetail, styles.budgetTotal]}>
                      <Text style={styles.budgetTotalLabel}>Total:</Text>
                      <Text style={styles.budgetTotalValue}>${selectedOrder.budget.total}</Text>
                    </View>
                  </View>

                  {selectedOrder.budget.parts.length > 0 && (
                    <View style={styles.partsList}>
                      <Text style={styles.partsListTitle}>Repuestos:</Text>
                      {selectedOrder.budget.parts.map((part) => (
                        <View key={part.id} style={styles.partItem}>
                          <Text style={styles.partName}>{part.name}</Text>
                          <Text style={styles.partPrice}>${part.price} x {part.quantity}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.budgetStatusContainer}>
                    <Text style={styles.budgetStatusLabel}>Estado:</Text>
                    <View style={styles.budgetApprovalContainer}>
                      {selectedOrder.budget.approved ? (
                        <View style={styles.budgetApproved}>
                          <MaterialCommunityIcons name="check-circle" size={16} color="#28a745" />
                          <Text style={[styles.budgetApprovalText, {color: '#28a745'}]}>Aprobado</Text>
                        </View>
                      ) : (
                        <View style={styles.budgetPending}>
                          <MaterialCommunityIcons name="clock-outline" size={16} color="#ffc107" />
                          <Text style={[styles.budgetApprovalText, {color: '#ffc107'}]}>Pendiente</Text>
                        </View>
                      )}

                      {!selectedOrder.budget.approved && (
                        <View style={styles.budgetActions}>
                          <TouchableOpacity
                            style={styles.budgetApproveButton}
                            onPress={() => updateBudgetApproval(selectedOrder.id, true)}
                          >
                            <Text style={styles.budgetApproveText}>Aprobar</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.budgetRejectButton}
                            onPress={() => updateBudgetApproval(selectedOrder.id, false)}
                          >
                            <Text style={styles.budgetRejectText}>Rechazar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Historial de la orden */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  <MaterialCommunityIcons name="history" size={18} color="#0056b3" />
                  {' '}Historial
                </Text>

                <View style={styles.historyContainer}>
                  {selectedOrder.history.map((event, index) => (
                    <View key={index} style={styles.historyItem}>
                      <View style={styles.historyDot} />
                      {index < selectedOrder.history.length - 1 && <View style={styles.historyLine} />}

                      <View style={styles.historyContent}>
                        <Text style={styles.historyAction}>{event.action}</Text>
                        <View style={styles.historyMeta}>
                          <Text style={styles.historyUser}>{event.user}</Text>
                          <Text style={styles.historyDate}>{formatDate(event.date)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Sección de cambio de estado */}
              <View style={styles.changeStatusSection}>
                <Text style={styles.changeStatusTitle}>Cambiar Estado</Text>

                <View style={styles.statusButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.statusButton, {backgroundColor: '#ffc107'}]}
                    onPress={() => changeOrderStatus(selectedOrder.id, 'pending')}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={18} color="white" />
                    <Text style={styles.statusButtonText}>Pendiente</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusButton, {backgroundColor: '#0056b3'}]}
                    onPress={() => changeOrderStatus(selectedOrder.id, 'in_progress')}
                  >
                    <MaterialCommunityIcons name="tools" size={18} color="white" />
                    <Text style={styles.statusButtonText}>En Proceso</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusButton, {backgroundColor: '#28a745'}]}
                    onPress={() => changeOrderStatus(selectedOrder.id, 'completed')}
                  >
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color="white" />
                    <Text style={styles.statusButtonText}>Completada</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusButton, {backgroundColor: '#6610f2'}]}
                    onPress={() => changeOrderStatus(selectedOrder.id, 'delivered')}
                  >
                    <MaterialCommunityIcons name="package-variant-closed" size={18} color="white" />
                    <Text style={styles.statusButtonText}>Entregada</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusButton, {backgroundColor: '#dc3545'}]}
                    onPress={() => changeOrderStatus(selectedOrder.id, 'cancelled')}
                  >
                    <MaterialCommunityIcons name="close-circle-outline" size={18} color="white" />
                    <Text style={styles.statusButtonText}>Cancelada</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Renderizar modal de formulario de orden
  const renderFormModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <Pressable onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <View style={styles.formModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingOrder ? 'Editar Orden' : 'Nueva Orden'}
              </Text>
              <TouchableOpacity onPress={saveOrder}>
                <MaterialCommunityIcons name="content-save" size={24} color="#28a745" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScrollView}>
              {/* Sección de Cliente */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>
                  <MaterialCommunityIcons name="account" size={18} color="#0056b3" />
                  {' '}Información del Cliente
                </Text>

                <TextInput
                  style={styles.formInput}
                  placeholder="Nombre del cliente"
                  value={formData.customer?.name || ''}
                  onChangeText={(text) => updateFormField('customer', text, 'name')}
                />

                {/* Lista de clientes frecuentes */}
                <View style={styles.quickCustomersContainer}>
                  <Text style={styles.quickCustomersTitle}>Clientes recientes:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {mockCustomers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={styles.quickCustomerChip}
                        onPress={() => selectExistingCustomer(customer)}
                      >
                        <MaterialCommunityIcons name="account-circle" size={18} color="#0056b3" />
                        <Text style={styles.quickCustomerName}>{customer.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <TextInput
                  style={styles.formInput}
                  placeholder="Teléfono de contacto"
                  value={formData.customer?.phone || ''}
                  onChangeText={(text) => updateFormField('customer', text, 'phone')}
                  keyboardType="phone-pad"
                />

                <TextInput
                  style={styles.formInput}
                  placeholder="Correo electrónico"
                  value={formData.customer?.email || ''}
                  onChangeText={(text) => updateFormField('customer', text, 'email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Sección de Dispositivo */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>
                  <MaterialCommunityIcons name="cellphone" size={18} color="#0056b3" />
                  {' '}Información del Dispositivo
                </Text>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Tipo:</Text>
                  <View style={styles.formPickerContainer}>
                    <Picker
                      selectedValue={formData.device.type}
                      onValueChange={(value) => updateFormField('device', value, 'type')}
                      style={styles.formPicker}
                      mode="dropdown"
                    >
                      <Picker.Item label="Smartphone" value="smartphone" />
                      <Picker.Item label="Tablet" value="tablet" />
                      <Picker.Item label="Otro" value="other" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Marca:</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Marca del dispositivo"
                    value={formData.device?.brand || ''}
                    onChangeText={(text: string) => updateFormField('device', text, 'brand' as keyof typeof formData.device)}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Modelo:</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Modelo del dispositivo"
                    value={formData.device.model}
                    onChangeText={(text) => updateFormField('device', text, 'model')}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Nº Serie:</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="IMEI o número de serie"
                    value={formData.device.serialNumber}
                    onChangeText={(text) => updateFormField('device', text, 'serialNumber')}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Condición:</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Estado físico del dispositivo"
                    value={formData.device.condition}
                    onChangeText={(text) => updateFormField('device', text, 'condition')}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>

              {/* Sección de Reparación */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>
                  <MaterialCommunityIcons name="tools" size={18} color="#0056b3" />
                  {' '}Detalles de Reparación
                </Text>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Problema:</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Descripción del problema"
                    value={formData.issue}
                    onChangeText={(text) => updateFormField('issue', text)}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Notas:</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Notas adicionales"
                    value={formData.notes}
                    onChangeText={(text) => updateFormField('notes', text)}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Prioridad:</Text>
                  <View style={styles.formPickerContainer}>
                    <Picker
                      selectedValue={formData.priority}
                      onValueChange={(value) => updateFormField('priority', value)}
                      style={styles.formPicker}
                      mode="dropdown"
                    >
                      <Picker.Item label="Alta" value="high" />
                      <Picker.Item label="Media" value="medium" />
                      <Picker.Item label="Baja" value="low" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Técnico:</Text>
                  <View style={styles.formPickerContainer}>
                    <Picker
                      selectedValue={formData.technicianId}
                      onValueChange={(value) => updateFormField('technicianId', value)}
                      style={styles.formPicker}
                      mode="dropdown"
                    >
                      <Picker.Item label="Seleccionar técnico" value="" />
                      {mockTechnicians.map((tech) => (
                        <Picker.Item
                          key={tech.id}
                          label={`${tech.name} (${tech.specialty})`}
                          value={tech.id}
                          enabled={tech.available}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Fecha estimada:</Text>
                  <TouchableOpacity style={styles.datePickerButton}>
                    <Text style={styles.datePickerText}>
                      {formData.estimatedCompletionDate ?
                        formatDate(formData.estimatedCompletionDate) :
                        'Seleccionar fecha'}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={18} color="#0056b3" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  // Renderizar modal de notificaciones
  const renderNotifyModal = () => (
    <Modal
      visible={notifyModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setNotifyModalVisible(false)}
    >
      <Pressable onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <View style={styles.notifyModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setNotifyModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notificar al Cliente</Text>
              <TouchableOpacity onPress={sendNotification}>
                <MaterialCommunityIcons name="send" size={24} color="#28a745" />
              </TouchableOpacity>
            </View>

            <View style={styles.notifyContent}>
              <View style={styles.customerInfoCard}>
                <MaterialCommunityIcons name="account-circle" size={36} color="#0056b3" />
                <View style={styles.customerInfoText}>
                  <Text style={styles.customerInfoName}>{selectedOrder?.customer.name}</Text>
                  <Text style={styles.customerInfoContact}>
                    {selectedOrder?.customer.phone} • {selectedOrder?.customer.email}
                  </Text>
                </View>
              </View>

              <View style={styles.notifyMethodContainer}>
                <Text style={styles.notifyLabel}>Método de Notificación:</Text>
                <View style={styles.notifyMethodButtons}>
                  <TouchableOpacity
                    style={[
                      styles.notifyMethodButton,
                      notificationData.method === 'sms' && styles.notifyMethodButtonActive
                    ]}
                    onPress={() => setNotificationData({...notificationData, method: 'sms'})}
                  >
                    <MaterialCommunityIcons
                      name="message-text"
                      size={18}
                      color={notificationData.method === 'sms' ? "white" : "#0056b3"}
                    />
                    <Text style={[
                      styles.notifyMethodText,
                      notificationData.method === 'sms' && styles.notifyMethodTextActive
                    ]}>SMS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.notifyMethodButton,
                      notificationData.method === 'email' && styles.notifyMethodButtonActive
                    ]}
                    onPress={() => setNotificationData({...notificationData, method: 'email'})}
                  >
                    <MaterialCommunityIcons
                      name="email"
                      size={18}
                      color={notificationData.method === 'email' ? "white" : "#0056b3"}
                    />
                    <Text style={[
                      styles.notifyMethodText,
                      notificationData.method === 'email' && styles.notifyMethodTextActive
                    ]}>Email</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.messageContainer}>
                <Text style={styles.notifyLabel}>Mensaje:</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Escriba el mensaje para el cliente..."
                  value={notificationData.message}
                  onChangeText={(text) => setNotificationData({...notificationData, message: text})}
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={styles.templateContainer}>
                <Text style={styles.notifyLabel}>Plantillas:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
                  <TouchableOpacity
                    style={styles.templateButton}
                    onPress={() => setNotificationData({
                      ...notificationData,
                      message: `Estimado/a ${selectedOrder?.customer.name}, su reparación (${selectedOrder?.id}) está lista para ser recogida. Horario de atención: L-V 9:00-18:00.`
                    })}
                  >
                    <Text style={styles.templateButtonText}>Reparación Lista</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.templateButton}
                    onPress={() => setNotificationData({
                      ...notificationData,
                      message: `Estimado/a ${selectedOrder?.customer.name}, hemos comenzado a trabajar en su dispositivo. Le notificaremos cuando esté listo.`
                    })}
                  >
                    <Text style={styles.templateButtonText}>Iniciando Reparación</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.templateButton}
                    onPress={() => setNotificationData({
                      ...notificationData,
                      message: `Estimado/a ${selectedOrder?.customer.name}, necesitamos autorización para el presupuesto de su reparación (${selectedOrder?.id}). Por favor contáctenos.`
                    })}
                  >
                    <Text style={styles.templateButtonText}>Aprobar Presupuesto</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  // Renderizar modal de presupuesto
  const renderBudgetModal = () => (
    <Modal
      visible={budgetModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setBudgetModalVisible(false)}
    >
      <Pressable onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <View style={styles.budgetModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setBudgetModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Presupuesto</Text>
              <TouchableOpacity onPress={saveBudget}>
                <MaterialCommunityIcons name="content-save" size={24} color="#28a745" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.budgetScrollView}>
              <View style={styles.budgetOrderInfo}>
                <Text style={styles.budgetOrderId}>{selectedOrder?.id}</Text>
                <Text style={styles.budgetOrderDesc}>
                  {selectedOrder?.device.brand} {selectedOrder?.device.model} • {selectedOrder?.customer.name}
                </Text>
              </View>

              <View style={styles.budgetFormSection}>
                <View style={styles.budgetFormRow}>
                  <Text style={styles.budgetFormLabel}>Mano de obra:</Text>
                  <TextInput
                    style={styles.budgetFormInput}
                    value={budgetData.labor.toString()}
                    onChangeText={updateLabor}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>

                <View style={styles.budgetFormRow}>
                  <Text style={styles.budgetFormLabel}>Impuesto (%):</Text>
                  <TextInput
                    style={styles.budgetFormInput}
                    value={budgetData.tax.toString()}
                    onChangeText={updateTax}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.divider} />

                <Text style={styles.budgetPartsTitle}>Repuestos:</Text>

                {budgetData.parts.map((part) => (
                  <View key={part.id} style={styles.budgetPartItem}>
                    <View style={styles.budgetPartInfo}>
                      <Text style={styles.budgetPartName}>{part.name}</Text>
                      <Text style={styles.budgetPartPrice}>
                        ${part.price} x {part.quantity} = ${part.price * part.quantity}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.budgetPartDelete}
                      onPress={() => removePartFromBudget(part.id)}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.addPartForm}>
                  <Text style={styles.addPartTitle}>Agregar Repuesto:</Text>

                  <View style={styles.addPartRow}>
                    <TextInput
                      style={styles.addPartInput}
                      placeholder="Nombre del repuesto"
                      value={newPart.name}
                      onChangeText={(text) => setNewPart({...newPart, name: text})}
                    />
                  </View>

                  <View style={styles.addPartRow}>
                    <View style={styles.addPartPriceContainer}>
                      <TextInput
                        style={styles.addPartPriceInput}
                        placeholder="Precio"
                        value={newPart.price?.toString()}
                        onChangeText={(text) => setNewPart({...newPart, price: parseFloat(text) || 0})}
                        keyboardType="numeric"
                      />

                      <TextInput
                        style={styles.addPartQuantityInput}
                        placeholder="Cant."
                        value={newPart.quantity?.toString()}
                        onChangeText={(text) => setNewPart({...newPart, quantity: parseInt(text) || 1})}
                        keyboardType="numeric"
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.addPartButton}
                      onPress={addPartToBudget}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.budgetTotalContainer}>
                  <Text style={styles.budgetTotalLabel}>TOTAL:</Text>
                  <Text style={styles.budgetTotalValue}>${budgetData.total}</Text>
                </View>

                <View style={styles.budgetNotesContainer}>
                  <Text style={styles.budgetNotesLabel}>Notas adicionales:</Text>
                  <TextInput
                    style={styles.budgetNotesInput}
                    placeholder="Notas sobre el presupuesto..."
                    value={budgetData.notes}
                    onChangeText={(text) => setBudgetData(prev => ({...prev, notes: text}))}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      {renderOrdersList()}
      {renderDetailModal()}
      {renderFormModal()}
      {renderNotifyModal()}
      {renderBudgetModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#0056b3',
  },
  searchInput: {
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 150,
    marginRight: 8,
  },
  filtersContainer: {
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0056b3',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: 'white',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 8,
    marginBottom: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginRight: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  orderContent: {
    flexDirection: 'row',
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  deviceInfo: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  issueText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  technicianName: {
    fontSize: 11,
    color: '#6c757d',
  },
  dateText: {
    fontSize: 11,
    color: '#6c757d',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#0056b3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  formModalContent: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  notifyModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  budgetModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailHeaderLeft: {
    flex: 1,
  },
  detailOrderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  detailDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailDate: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  detailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  detailImageSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  detailSectionContent: {
    marginLeft: 8,
  },
  detailCustomerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0056b3',
    marginBottom: 8,
  },
  detailContactRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContactText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 4,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  historyButtonText: {
    fontSize: 14,
    color: '#0056b3',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
  },
  detailValueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailNotesContainer: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  detailNotesLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  detailNotesText: {
    fontSize: 14,
    color: '#212529',
  },
  budgetSummary: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  budgetDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  budgetValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  budgetTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  budgetTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  budgetTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  partsList: {
    marginBottom: 16,
  },
  partsListTitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  partItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  partName: {
    fontSize: 14,
    color: '#212529',
  },
  partPrice: {
    fontSize: 14,
    color: '#495057',
  },
  budgetStatusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  budgetStatusLabel: {
    fontSize: 14,
    color: '#6c757d',
    width: 60,
  },
  budgetApprovalContainer: {
    flex: 1,
  },
  budgetApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetPending: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetApprovalText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  budgetActions: {
    flexDirection: 'row',
  },
  budgetApproveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  budgetApproveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  budgetRejectButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  budgetRejectText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0056b3',
    marginTop: 4,
    marginRight: 8,
    zIndex: 1,
  },
  historyLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: -8,
    width: 2,
    backgroundColor: '#dee2e6',
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyUser: {
    fontSize: 12,
    color: '#6c757d',
  },
  historyDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  changeStatusSection: {
    padding: 16,
  },
  changeStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
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
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
  },
  formSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  customerSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectCustomerButton: {
    padding: 8,
    marginLeft: 8,
  },
  quickCustomersContainer: {
    marginBottom: 12,
  },
  quickCustomersTitle: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  quickCustomerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  quickCustomerName: {
    fontSize: 12,
    color: '#495057',
    marginLeft: 4,
  },
  formPickerContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  formPicker: {
    height: 40,
    width: '100%',
  },
  notifyContent: {
    padding: 16,
  },
  customerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  customerInfoText: {
    marginLeft: 12,
  },
  customerInfoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  customerInfoContact: {
    fontSize: 12,
    color: '#6c757d',
  },
  notifyMethodContainer: {
    marginBottom: 16,
  },
  notifyLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  notifyMethodButtons: {
    flexDirection: 'row',
  },
  notifyMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  notifyMethodButtonActive: {
    backgroundColor: '#0056b3',
  },
  notifyMethodText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
  },
  notifyMethodTextActive: {
    color: 'white',
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  templateContainer: {
    marginBottom: 16,
  },
  templateScroll: {
    paddingVertical: 8,
  },
  templateButton: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  templateButtonText: {
    fontSize: 14,
    color: '#0056b3',
  },
  budgetOrderInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  budgetOrderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  budgetOrderDesc: {
    fontSize: 14,
    color: '#6c757d',
  },
  budgetFormSection: {
    padding: 16,
  },
  budgetFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetFormLabel: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  budgetFormInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 100,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 16,
  },
  budgetPartsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 12,
  },
  budgetPartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  budgetPartInfo: {
    flex: 1,
  },
  budgetPartName: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 4,
  },
  budgetPartPrice: {
    fontSize: 12,
    color: '#6c757d',
  },
  budgetPartDelete: {
    padding: 8,
  },
  addPartForm: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  addPartTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 8,
  },
  addPartRow: {
    marginBottom: 8,
  },
  addPartInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addPartPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addPartPriceInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  addPartQuantityInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 60,
    marginRight: 8,
  },
  addPartButton: {
    backgroundColor: '#28a745',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0056b3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  budgetNotesContainer: {
    marginBottom: 16,
  },
  budgetNotesLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  budgetNotesInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  datePickerText: {
    fontSize: 14,
    color: '#495057',
  },
});

export default BudgetsScreen;