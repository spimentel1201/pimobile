import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useServiceOrders } from '../../../contexts/ServiceOrderContext';
import { ServiceOrder, ServiceOrderStatus } from '../../../types/api';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../../hooks/useTheme';
import { colors, typography, spacing, radii, shadows } from '../../../constants/theme';

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
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ServiceOrderStatus | 'all'>('all');

  const statusColors: Record<string, string> = {
    pending: theme.warning,
    in_progress: theme.primary,
    waiting_approval: colors.info,
    completed: theme.success,
    cancelled: theme.error,
  };

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
      style={[styles.orderCard, { backgroundColor: theme.surface, ...shadows.sm }]}
      onPress={() => router.push(`/orders/${item.id}`)}
    >
      <View style={styles.orderHeader}>
        <Text style={[styles.orderNumber, { color: theme.text }]}>Orden #{item.id.slice(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || theme.primary }]}>
          <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
        </View>
      </View>

      <Text style={[styles.deviceName, { color: theme.text }]}>{item.device.name} - {item.device.brand}</Text>
      <Text style={[styles.customerName, { color: theme.textSecondary }]}>{item.customer.name}</Text>

      <View style={[styles.orderFooter, { borderTopColor: theme.border }]}>
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
          {format(new Date(item.createdAt), 'PPP', { locale: es })}
        </Text>
        {item.cost && (
          <Text style={[styles.costText, { color: theme.text }]}>${item.cost.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (status: ServiceOrderStatus | 'all', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: theme.surfaceVariant },
        selectedStatus === status && [styles.filterButtonActive, { backgroundColor: theme.primary }],
      ]}
      onPress={() => setSelectedStatus(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          { color: theme.textSecondary },
          selectedStatus === status && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>Error al cargar las órdenes</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={fetchOrders}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Órdenes de Servicio',
          headerRight: () => (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/orders/new')}
            >
              <MaterialIcons name="add" size={24} color={theme.textInverse} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {renderFilterButton('all', 'Todas')}
        {Object.entries(statusLabels).map(([status, label]) =>
          renderFilterButton(status as ServiceOrderStatus, label)
        )}
      </View>

      {loading && !refreshing ? (
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <MaterialIcons name="assignment" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No hay órdenes</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
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
  },
  listContent: {
    padding: spacing.base,
  },
  orderCard: {
    borderRadius: radii.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderNumber: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  statusText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  deviceName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    marginBottom: 4,
  },
  customerName: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  dateText: {
    fontSize: typography.sizes.xs,
  },
  costText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderBottomWidth: 1,
  },
  filterButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginHorizontal: 4,
  },
  filterButtonActive: {},
  filterButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.md,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: typography.weights.medium,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
});
