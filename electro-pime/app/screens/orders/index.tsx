import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useServiceOrders } from '../../contexts/ServiceOrderContext';
import { ServiceOrder, ServiceOrderStatus } from '../../types/api';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusColors = {
  pending: '#F59E0B', // amber-500
  in_progress: '#3B82F6', // blue-500
  waiting_approval: '#8B5CF6', // violet-500
  completed: '#10B981', // emerald-500
  cancelled: '#EF4444', // red-500
};

const statusLabels = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  waiting_approval: 'Esperando Aprobación',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loading, error, fetchOrders } = useServiceOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ServiceOrderStatus | 'all'>('all');

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const renderOrderItem = ({ item }: { item: ServiceOrder }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => router.push(`/orders/${item.id}`)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Orden #{item.id.slice(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
          <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
        </View>
      </View>
      
      <Text style={styles.deviceName}>{item.device.name} - {item.device.brand}</Text>
      <Text style={styles.customerName}>{item.customer.name}</Text>
      
      <View style={styles.orderFooter}>
        <Text style={styles.dateText}>
          {format(new Date(item.createdAt), 'PPP', { locale: es })}
        </Text>
        {item.cost && (
          <Text style={styles.costText}>${item.cost.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (status: ServiceOrderStatus | 'all', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedStatus === status && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedStatus(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedStatus === status && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error al cargar las órdenes</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Órdenes de Servicio',
          headerRight: () => (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/orders/new')}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'Todas')}
        {Object.entries(statusLabels).map(([status, label]) => (
          renderFilterButton(status as ServiceOrderStatus, label)
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="assignment" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No hay órdenes</Text>
          <Text style={styles.emptySubtext}>
            {selectedStatus === 'all' 
              ? 'No hay órdenes de servicio registradas.' 
              : `No hay órdenes con estado "${statusLabels[selectedStatus as ServiceOrderStatus]}".`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
});
