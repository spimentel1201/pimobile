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
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RepairOrder, RepairOrderStatus, Sale, Product } from '../types/api';

const { width } = Dimensions.get('window');

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

// Mock data for charts
const MOCK_WEEKLY_SALES = {
  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  datasets: [
    {
      data: [1200, 1900, 1500, 2200, 1800, 2500, 1100],
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

const MOCK_ORDER_DISTRIBUTION = [
  { name: 'Laptops', count: 35, color: '#3B82F6', legendFontColor: '#4B5563', legendFontSize: 12 },
  { name: 'Celulares', count: 28, color: '#10B981', legendFontColor: '#4B5563', legendFontSize: 12 },
  { name: 'TV/Monitores', count: 20, color: '#F59E0B', legendFontColor: '#4B5563', legendFontSize: 12 },
  { name: 'Otros', count: 17, color: '#8B5CF6', legendFontColor: '#4B5563', legendFontSize: 12 },
];

interface DashboardData {
  orders: RepairOrder[];
  sales: Sale[];
  products: Product[];
}

const DashboardScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    orders: [],
    sales: [],
    products: [],
  });

  const fetchDashboardData = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [orders, sales, products] = await Promise.all([
        api.getRepairOrders().catch(() => []),
        api.getSales().catch(() => []),
        api.getProducts().catch(() => []),
      ]);
      setData({ orders, sales, products });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Error al cargar el dashboard');
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

  // Calculate metrics from real data
  const pendingOrders = data.orders.filter(o =>
    o.status === 'RECEIVED' || o.status === 'DIAGNOSED'
  ).length;
  const inProgressOrders = data.orders.filter(o =>
    o.status === 'IN_PROGRESS' || o.status === 'WAITING_FOR_PARTS'
  ).length;
  const completedToday = data.orders.filter(o => {
    const today = new Date().toISOString().split('T')[0];
    return o.status === 'COMPLETED' && o.updatedAt.startsWith(today);
  }).length;

  const todaySales = data.sales.filter(s => {
    const today = new Date().toISOString().split('T')[0];
    return s.createdAt.startsWith(today);
  });
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  const recentOrders = data.orders.slice(0, 5);

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

  const renderMetrics = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsContainer}>
      <TouchableOpacity
        style={[styles.metricCard, { backgroundColor: '#FEF3C7' }]}
        onPress={() => router.push('/orders')}
      >
        <MaterialCommunityIcons name="clipboard-clock" size={28} color="#F59E0B" />
        <Text style={styles.metricValue}>{pendingOrders}</Text>
        <Text style={styles.metricLabel}>Órdenes Pendientes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.metricCard, { backgroundColor: '#DBEAFE' }]}
        onPress={() => router.push('/orders')}
      >
        <MaterialCommunityIcons name="progress-wrench" size={28} color="#3B82F6" />
        <Text style={styles.metricValue}>{inProgressOrders}</Text>
        <Text style={styles.metricLabel}>En Progreso</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.metricCard, { backgroundColor: '#D1FAE5' }]}
        onPress={() => router.push('/orders')}
      >
        <MaterialCommunityIcons name="check-circle" size={28} color="#10B981" />
        <Text style={styles.metricValue}>{completedToday}</Text>
        <Text style={styles.metricLabel}>Completados Hoy</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.metricCard, { backgroundColor: '#E0E7FF' }]}
        onPress={() => router.push('/sales')}
      >
        <MaterialCommunityIcons name="cash-multiple" size={28} color="#6366F1" />
        <Text style={styles.metricValue}>S/ {todayRevenue.toFixed(0)}</Text>
        <Text style={styles.metricLabel}>Ventas Hoy</Text>
      </TouchableOpacity>
    </ScrollView>
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

  const renderCharts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Estadísticas</Text>

      {/* Weekly Sales Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Ventas de la Semana</Text>
        <LineChart
          data={MOCK_WEEKLY_SALES}
          width={width - 64}
          height={180}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 12,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#3B82F6',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Orders Distribution */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Distribución por Tipo</Text>
        <PieChart
          data={MOCK_ORDER_DISTRIBUTION}
          width={width - 64}
          height={180}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
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
          <Text style={styles.emptyText}>No hay órdenes</Text>
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
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
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
      {renderMetrics()}
      {renderQuickActions()}
      {renderCharts()}
      {renderRecentOrders()}
      <View style={styles.bottomPadding} />
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
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  metricCard: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  chartCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
  },
  orderCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    color: '#3B82F6',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  orderDevice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 32,
  },
});

export default DashboardScreen;
