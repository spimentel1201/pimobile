import { colors } from '../../theme';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { api } from '../../services/api';
import { RepairOrder, RepairOrderStatus } from '../../types/api';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusMeta: Record<RepairOrderStatus, { label: string; color: string }> = {
  RECEIVED: { label: 'Recibido', color: colors.warning },
  DIAGNOSED: { label: 'Diagnosticado', color: colors.violet },
  IN_PROGRESS: { label: 'En Progreso', color: colors.primary },
  WAITING_FOR_PARTS: { label: 'Esperando Repuestos', color: colors.violet },
  COMPLETED: { label: 'Completado', color: colors.success },
  DELIVERED: { label: 'Entregado', color: colors.success },
  CANCELLED: { label: 'Cancelado', color: colors.danger },
};

export default function OrdersIndexScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RepairOrderStatus | 'all'>('all');

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await api.getRepairOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error al cargar las órdenes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status === selectedStatus);

  const onRefresh = () => fetchOrders(true);

  const renderOrderItem = ({ item }: { item: RepairOrder }) => {
    const meta = statusMeta[item.status];
    return (
      <TouchableOpacity activeOpacity={0.7}
        style={styles.orderCard}
        onPress={() => router.push(`/orders/${item.id}` as never)}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Orden #{item.id.slice(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${meta.color}1A` }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <Text style={styles.deviceName}>
          {item.items?.length
            ? item.items.map(i => `${i.deviceType} ${i.brand}`).join(' • ')
            : item.description}
        </Text>
        <Text style={styles.customerName}>{item.customerName || 'Cliente no especificado'}</Text>

        <View style={styles.orderFooter}>
          <Text style={styles.dateText}>
            {format(new Date(item.createdAt), "d 'de' MMM, yyyy", { locale: es })}
          </Text>
          {item.totalCost != null && (
            <Text style={styles.costText}>S/ {item.totalCost.toFixed(2)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (status: RepairOrderStatus | 'all', label: string) => (
    <TouchableOpacity activeOpacity={0.7}
      key={status}
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
        <TouchableOpacity activeOpacity={0.7} style={styles.retryButton} onPress={() => fetchOrders()}>
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
            <TouchableOpacity activeOpacity={0.7}
              style={styles.addButton}
              onPress={() => router.push('/orders/new')}
            >
              <MaterialIcons name="add" size={24} color={colors.surface} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'Todas')}
        {(Object.keys(statusMeta) as RepairOrderStatus[]).map(status =>
          renderFilterButton(status, statusMeta[status].label)
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="assignment" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No hay órdenes</Text>
          <Text style={styles.emptySubtext}>
            {selectedStatus === 'all'
              ? 'No hay órdenes de servicio registradas.'
              : `No hay órdenes con estado "${statusMeta[selectedStatus].label}".`}
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
    backgroundColor: colors.surface,
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.canvas,
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 2,
    backgroundColor: colors.canvas,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
});
