import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useServiceOrders } from '../../contexts/ServiceOrderContext';
import { ServiceOrder, ServiceOrderStatus } from '../../types/api';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Define the type for status info
interface StatusInfoType {
  [key: string]: {
    label: string;
    color: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  };
}

const statusInfo: StatusInfoType = {
  pending: { label: 'Pendiente', color: '#F59E0B', icon: 'clock-outline' },
  in_progress: { label: 'En Progreso', color: '#3B82F6', icon: 'wrench-outline' },
  waiting_approval: { label: 'Esperando Aprobación', color: '#8B5CF6', icon: 'clock-alert-outline' },
  completed: { label: 'Completado', color: '#10B981', icon: 'check-circle-outline' },
  cancelled: { label: 'Cancelado', color: '#EF4444', icon: 'close-circle-outline' },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOrderById, updateOrderStatus, loading, error } = useServiceOrders();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [errorState, setErrorState] = useState<{ message: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusActions, setShowStatusActions] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    try {
      const orderData = await getOrderById(id);
      setOrder(orderData);
    } catch (err) {
      console.error('Error loading order:', err);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus: ServiceOrderStatus) => {
    if (!order) return;
    
    try {
      setUpdating(true);
      const updatedOrder = await updateOrderStatus(order.id, newStatus);
      setOrder(updatedOrder);
      setShowStatusActions(false);
      
      // Get status display text safely
      const statusText = statusInfo[newStatus as keyof typeof statusInfo]?.label || newStatus;
      
      // Using Alert.alert with title and message only
      Alert.alert(
        '¡Éxito!',
        `La orden ha sido actualizada a: ${statusText}`
      );
    } catch (err) {
      console.error('Error updating status:', err);
      // Using Alert.alert with title and message only
      Alert.alert(
        'Error',
        'No se pudo actualizar el estado de la orden'
      );
    } finally {
      setUpdating(false);
    }
  };

  const renderStatusBadge = (status: ServiceOrderStatus) => {
    const info = statusInfo[status];
    const badgeStyle: ViewStyle = {
      ...styles.statusBadge,
      backgroundColor: `${info.color}1A`,
      borderColor: info.color,
    };

    const textStyle: TextStyle = {
      ...styles.statusText,
      color: info.color,
    };

    return (
      <View style={badgeStyle}>
        <MaterialCommunityIcons 
          name={info.icon} 
          size={16} 
          color={info.color} 
          style={styles.statusIcon as ImageStyle} 
        />
        <Text style={textStyle as TextStyle}>
          {info.label}
        </Text>
      </View>
    );
  };

  const renderSection = (title: string, content: string | number | undefined, isLast = false) => {
    const sectionStyle: ViewStyle = {
      ...styles.section,
      ...(isLast ? {} : styles.sectionBorder)
    };
    
    // Explicitly type the styles to avoid type conflicts
    const titleStyle = styles.sectionTitle as TextStyle;
    const contentStyle = content ? 
      (styles.sectionContent as TextStyle) : 
      (styles.emptyContent as TextStyle);
    
    return (
      <View style={sectionStyle}>
        <Text style={titleStyle}>
          {title}
        </Text>
        <Text style={contentStyle}>
          {content || 'No especificado'}
        </Text>
      </View>
    );
  };

  const renderStatusAction = (status: ServiceOrderStatus, label: string) => {
    if (order?.status === status) return null;
    
    const actionStyle: ViewStyle = {
      ...styles.statusAction,
      borderColor: statusInfo[status].color,
    };
    
    const textStyle: TextStyle = {
      ...styles.statusActionText,
      color: statusInfo[status].color,
    };
    
    return (
      <TouchableOpacity
        key={status}
        style={actionStyle}
        onPress={() => handleStatusUpdate(status)}
        disabled={updating}
      >
        <Text style={textStyle}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading && !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    const errorMessage = (error as Error)?.message || 
                       (typeof error === 'string' ? error : 
                       'No se pudo cargar la orden');
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>
          {errorMessage}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrder}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: `Orden #${order.id.slice(0, 8)}`,
          headerRight: () => (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                if (order) {
                  // Using string template for router.push to avoid type issues
                  router.push(`/orders/${order.id}/edit` as any);
                }
              }}
            >
              <MaterialIcons name="edit" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>Orden #{order.id.slice(0, 8)}</Text>
          <Text style={styles.date}>
            {format(new Date(order.createdAt), 'PPP')} a las {format(new Date(order.createdAt), 'p')}
          </Text>
        </View>
        {renderStatusBadge(order.status)}
      </View>

      <View style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispositivo</Text>
          <Text style={styles.deviceName}>{order.device.name}</Text>
          <Text style={styles.deviceDetails}>
            {order.device.brand} • {order.device.model}
          </Text>
          {order.device.serialNumber && (
            <Text style={styles.deviceDetails}>
              N° de serie: {order.device.serialNumber}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {order.customer.name}
            </Text>
            <Text style={styles.infoSubtext}>{order.customer.email}</Text>
          </View>
          
          {order.technician && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Técnico</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {order.technician.name}
              </Text>
              <Text style={styles.infoSubtext}>{order.technician.email}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.card}>
        {renderSection('Descripción del problema', order.description)}
        {renderSection('Diagnóstico', order.diagnosis)}
        {renderSection('Detalles de la reparación', order.repairDetails)}
        
        <View style={styles.row}>
          <View style={[styles.infoBox, styles.halfWidth]}>
            <Text style={styles.infoLabel}>Costo estimado</Text>
            <Text style={styles.cost}>
              {order.cost ? `$${order.cost.toFixed(2)}` : 'No especificado'}
            </Text>
          </View>
          
          <View style={[styles.infoBox, styles.halfWidth]}>
            <Text style={styles.infoLabel}>Fecha estimada</Text>
            <Text>
              {order.estimatedCompletion 
                ? format(new Date(order.estimatedCompletion), 'PPP')
                : 'No especificada'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Acciones</Text>
            <TouchableOpacity onPress={() => setShowStatusActions(!showStatusActions)}>
              <MaterialIcons 
                name={showStatusActions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                size={24} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>

          {showStatusActions && (
            <View style={styles.statusActions}>
              {renderStatusAction('pending', 'Marcar como Pendiente')}
              {renderStatusAction('in_progress', 'Comenzar Reparación')}
              {renderStatusAction('waiting_approval', 'Esperando Aprobación')}
              {renderStatusAction('completed', 'Marcar como Completado')}
              {renderStatusAction('cancelled', 'Cancelar Orden')}
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Última actualización: {format(new Date(order.updatedAt), 'PPP p')}
        </Text>
      </View>
    </ScrollView>
  );
}

// Define style types
type Styles = {
  container: ViewStyle;
  centered: ViewStyle;
  header: ViewStyle;
  orderNumber: TextStyle;
  date: TextStyle;
  statusBadge: ViewStyle;
  statusIcon: ViewStyle;
  statusText: TextStyle;
  scrollContainer: ViewStyle;
  content: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  sectionContent: ViewStyle;
  row: ViewStyle;
  label: TextStyle;
  value: TextStyle;
  description: TextStyle;
  statusActions: ViewStyle;
  statusAction: ViewStyle;
  statusActionText: TextStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;
  editButton: ViewStyle;
  card: ViewStyle;
  deviceName: TextStyle;
  deviceDetails: ViewStyle;
  divider: ViewStyle;
  infoBox: ViewStyle;
  infoLabel: TextStyle;
  infoValue: TextStyle;
  infoSubtext: TextStyle;
  halfWidth: ViewStyle;
  cost: TextStyle;
  sectionHeader: ViewStyle;
  footer: ViewStyle;
  footerText: TextStyle;
  emptyContent: ViewStyle;
  sectionBorder: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  } as ViewStyle,
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  } as TextStyle,
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  } as TextStyle,
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  } as ViewStyle,
  statusIcon: {
    marginRight: 4,
  } as ImageStyle,
  statusAction: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  } as ViewStyle,
  statusActionText: {
    fontSize: 14,
    fontWeight: '500',
  } as TextStyle,
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  } as TextStyle,
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  } as ViewStyle,
  sectionContent: {
    color: '#111827',
  } as TextStyle,
  emptyContent: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  } as TextStyle,
  deviceName: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  } as TextStyle,
  deviceDetails: {
    color: '#6B7280',
    marginBottom: 2,
  } as TextStyle,
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  } as ViewStyle,
  section: {
    padding: 16,
  } as ViewStyle,
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    padding: 16,
  } as ViewStyle,
  infoBox: {
    flex: 1,
  } as ViewStyle,
  halfWidth: {
    flex: 0.5,
  } as ViewStyle,
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  } as TextStyle,
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  } as TextStyle,
  infoSubtext: {
    fontSize: 14,
    color: '#6B7280',
  } as TextStyle,
  costLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  } as TextStyle,
  cost: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  } as TextStyle,
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 4,
  } as TextStyle,
  cost: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  statusActions: {
    marginTop: 8,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  } as TextStyle,
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  } as ViewStyle,
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  } as TextStyle,
  editButton: {
    marginRight: 16,
    padding: 8,
  } as ViewStyle,
});
