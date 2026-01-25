import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RepairOrder, RepairOrderStatus } from '../types/api';

const STATUS_COLORS: Record<RepairOrderStatus, string> = {
  RECEIVED: '#9CA3AF',
  DIAGNOSED: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  WAITING_FOR_PARTS: '#8B5CF6',
  COMPLETED: '#10B981',
  DELIVERED: '#059669',
  CANCELLED: '#EF4444',
};

const STATUS_LABELS: Record<RepairOrderStatus, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSED: 'Diagnosticado',
  IN_PROGRESS: 'En Progreso',
  WAITING_FOR_PARTS: 'Esperando',
  COMPLETED: 'Completado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const DashboardScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<RepairOrder[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      // Fetch only orders to show recent ones
      const orders = await api.getRepairOrders();
      // Sort by newest and take 5
      const sorted = orders.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);

      setRecentOrders(sorted);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      // Don't show error if it fails, just show empty list
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>
          ¡Hola, {user?.firstName || 'Usuario'}!
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => router.push('/notifications' as any)}
      >
        <Ionicons name="notifications-outline" size={24} color="#374151" />
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/orders/new')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.actionText}>Nueva Orden</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/customers')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
            <MaterialCommunityIcons name="account-plus" size={24} color="#10B981" />
          </View>
          <Text style={styles.actionText}>Clientes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/products')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="package-variant" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.actionText}>Productos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/budgets')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
            <MaterialCommunityIcons name="file-document" size={24} color="#6366F1" />
          </View>
          <Text style={styles.actionText}>Presupuestos</Text>
        </TouchableOpacity>

        {user?.role === 'ADMIN' && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/users')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
              <MaterialCommunityIcons name="account-group" size={24} color="#EC4899" />
            </View>
            <Text style={styles.actionText}>Usuarios</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderRecentOrders = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Órdenes Recientes</Text>
        <TouchableOpacity onPress={() => router.push('/orders')}>
          <Text style={styles.seeAll}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {recentOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No hay órdenes recientes</Text>
        </View>
      ) : (
        recentOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => router.push(`/orders/${order.id}` as any)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] }]}>
                <Text style={styles.statusText}>{STATUS_LABELS[order.status]}</Text>
              </View>
            </View>
            <Text style={styles.orderCustomer}>{order.customerName}</Text>
            {order.items && order.items[0] && (
              <Text style={styles.orderDevice}>
                {order.items[0].brand} {order.items[0].model}
              </Text>
            )}
            <Text style={styles.orderDate}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderHeader()}
      {renderQuickActions()}
      {renderRecentOrders()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  notificationButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  orderDevice: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default DashboardScreen;
