import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../services/api';
import { RepairOrder, RepairOrderStatus } from '../types/api';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusInfo: Record<RepairOrderStatus, { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  RECEIVED: { label: 'Recibido', color: '#F59E0B', icon: 'clock-outline' },
  DIAGNOSED: { label: 'Diagnosticado', color: '#8B5CF6', icon: 'clipboard-text-search-outline' },
  IN_PROGRESS: { label: 'En Progreso', color: '#3B82F6', icon: 'wrench-outline' },
  WAITING_FOR_PARTS: { label: 'Esperando Repuestos', color: '#6366F1', icon: 'package-variant-closed' },
  COMPLETED: { label: 'Completado', color: '#10B981', icon: 'check-circle-outline' },
  DELIVERED: { label: 'Entregado', color: '#059669', icon: 'package-variant' },
  CANCELLED: { label: 'Cancelado', color: '#EF4444', icon: 'close-circle-outline' },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusActions, setShowStatusActions] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const orderData = await api.getRepairOrderById(id);
      setOrder(orderData);
    } catch (err) {
      console.error('Error loading order:', err);
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la orden');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStatusUpdate = async (newStatus: RepairOrderStatus) => {
    if (!order) return;

    try {
      setUpdating(true);
      const updatedOrder = await api.updateRepairOrderStatus(order.id, newStatus);
      setOrder(updatedOrder);
      setShowStatusActions(false);
      Alert.alert(
        '¡Éxito!',
        `La orden ha sido actualizada a: ${statusInfo[newStatus].label}`
      );
    } catch (err) {
      console.error('Error updating status:', err);
      Alert.alert('Error', 'No se pudo actualizar el estado de la orden');
    } finally {
      setUpdating(false);
    }
  };

  const renderStatusBadge = (status: RepairOrderStatus) => {
    const info = statusInfo[status];
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${info.color}1A`, borderColor: info.color }]}>
        <MaterialCommunityIcons name={info.icon} size={16} color={info.color} />
        <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
      </View>
    );
  };

  const renderSection = (title: string, content: string | number | undefined, isLast = false) => (
    <View style={[styles.section, !isLast && styles.sectionBorder]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={content ? styles.sectionContent : styles.emptyContent}>
        {content || 'No especificado'}
      </Text>
    </View>
  );

  const renderStatusAction = (status: RepairOrderStatus, label: string) => {
    if (order?.status === status) return null;
    return (
      <TouchableOpacity
        key={status}
        style={[styles.statusAction, { borderColor: statusInfo[status].color }]}
        onPress={() => handleStatusUpdate(status)}
        disabled={updating}
      >
        <Text style={[styles.statusActionText, { color: statusInfo[status].color }]}>
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

  if (loadError) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{loadError}</Text>
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
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/orders/${order.id}/edit` as never)}
            >
              <MaterialIcons name="edit" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.orderNumber}>Orden #{order.id.slice(0, 8)}</Text>
          <Text style={styles.date}>
            {format(new Date(order.createdAt), "d 'de' MMMM, yyyy", { locale: es })} a las{' '}
            {format(new Date(order.createdAt), 'HH:mm')}
          </Text>
        </View>
        {renderStatusBadge(order.status)}
      </View>

      <View style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.infoValue}>{order.customerName || 'No especificado'}</Text>
          {order.technicianName && (
            <>
              <Text style={styles.infoLabel}>Técnico asignado</Text>
              <Text style={styles.infoValue}>{order.technicianName}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.card}>
        {order.items?.map((item, index) => (
          <View key={item.id || index} style={[styles.section, index < (order.items?.length || 0) - 1 && styles.sectionBorder]}>
            <Text style={styles.sectionTitle}>Equipo {index + 1}</Text>
            <Text style={styles.deviceName}>
              {item.deviceType} {item.brand} {item.model}
            </Text>
            {item.serialNumber ? (
              <Text style={styles.deviceDetails}>N° de serie: {item.serialNumber}</Text>
            ) : null}
            {item.accessories && item.accessories.length > 0 ? (
              <Text style={styles.deviceDetails}>Accesorios: {item.accessories.join(', ')}</Text>
            ) : null}
            <Text style={styles.sectionContent}>{item.problemDescription}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        {renderSection('Descripción del problema', order.description)}
        {renderSection('Notas', order.notes)}

        <View style={styles.row}>
          <View style={[styles.infoBox, styles.halfWidth]}>
            <Text style={styles.infoLabel}>Costo de revisión</Text>
            <Text style={styles.sectionContent}>
              {order.initialReviewCost != null ? `S/ ${order.initialReviewCost.toFixed(2)}` : 'No especificado'}
            </Text>
          </View>

          <View style={[styles.infoBox, styles.halfWidth]}>
            <Text style={styles.infoLabel}>Costo total</Text>
            <Text style={styles.cost}>
              {order.totalCost != null ? `S/ ${order.totalCost.toFixed(2)}` : 'No especificado'}
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
              {renderStatusAction('RECEIVED', 'Marcar como Recibido')}
              {renderStatusAction('DIAGNOSED', 'Marcar como Diagnosticado')}
              {renderStatusAction('IN_PROGRESS', 'Comenzar Reparación')}
              {renderStatusAction('WAITING_FOR_PARTS', 'Esperando Repuestos')}
              {renderStatusAction('COMPLETED', 'Marcar como Completado')}
              {renderStatusAction('DELIVERED', 'Marcar como Entregado')}
              {renderStatusAction('CANCELLED', 'Cancelar Orden')}
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Última actualización: {format(new Date(order.updatedAt), "d 'de' MMM, yyyy HH:mm", { locale: es })}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  deviceName: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  deviceDetails: {
    color: '#6B7280',
    marginBottom: 2,
  },
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
  },
  section: {
    padding: 16,
  },
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionContent: {
    color: '#111827',
  },
  emptyContent: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    padding: 16,
  },
  infoBox: {
    flex: 1,
  },
  halfWidth: {
    flex: 0.5,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  cost: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  statusActions: {
    marginTop: 8,
    gap: 8,
  },
  statusAction: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusActionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  editButton: {
    marginRight: 16,
    padding: 8,
  },
});
