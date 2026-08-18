import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { typography, spacing, radii, shadows } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { RepairOrder } from '../types/api';

const QUICK_ACTIONS = [
  { icon: 'plus-circle', label: 'Nueva Orden', route: '/orders/new', color: '#2563EB', bg: '#DBEAFE' },
  { icon: 'account-plus', label: 'Clientes', route: '/customers', color: '#10B981', bg: '#D1FAE5' },
  { icon: 'package-variant', label: 'Productos', route: '/products', color: '#F59E0B', bg: '#FEF3C7' },
  { icon: 'file-document', label: 'Presupuestos', route: '/budgets', color: '#6366F1', bg: '#E0E7FF' },
  { icon: 'account-group', label: 'Usuarios', route: '/users', color: '#EC4899', bg: '#FCE7F3', adminOnly: true },
];

const DashboardScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RepairOrder[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const orders = await api.getRepairOrders();
      const sorted = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentOrders(sorted);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchDashboardData(); else setLoading(false);
  }, [user, fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const actions = QUICK_ACTIONS.filter(a => !a.adminOnly || user?.role === 'ADMIN');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
          <View>
            <Text style={[styles.companyName, { color: theme.primary }]}>Electrónica Pimentel</Text>
            <Text style={[styles.greeting, { color: theme.text }]}>
              ¡Hola, {user?.firstName || 'Usuario'}!
            </Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <Animated.View key={action.label} entering={FadeInDown.delay(250 + index * 50).springify()}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: theme.card }]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                  <MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
            Órdenes Recientes
          </Text>
          <TouchableOpacity onPress={() => router.push('/orders')}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <EmptyState
            icon="clipboard-text-outline"
            title="No hay órdenes recientes"
            message="Las órdenes que crees aparecerán aquí"
          />
        ) : (
          recentOrders.map((order, index) => (
            <Animated.View
              key={order.id}
              entering={FadeInDown.delay(500 + index * 80).springify()}
            >
              <TouchableOpacity
                style={[styles.orderCard, { backgroundColor: theme.card }]}
                onPress={() => router.push(`/orders?openOrderId=${order.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderId, { color: theme.textSecondary }]}>
                    #{order.id.slice(0, 8)}
                  </Text>
                  <StatusBadge status={order.status} />
                </View>
                <Text style={[styles.orderCustomer, { color: theme.text }]}>{order.customerName}</Text>
                {order.items?.[0] && (
                  <Text style={[styles.orderDevice, { color: theme.textSecondary }]}>
                    {order.items[0].brand} {order.items[0].model}
                  </Text>
                )}
                <Text style={[styles.orderDate, { color: theme.textMuted }]}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  companyName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    marginBottom: spacing['2xs'],
  },
  greeting: {
    fontSize: typography.sizes['xl'],
    fontWeight: typography.weights.bold,
  },
  date: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.base,
  },
  seeAll: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: '30%',
    padding: spacing.base,
    borderRadius: radii.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  orderCard: {
    padding: spacing.base,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderId: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  orderCustomer: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing['2xs'],
  },
  orderDevice: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  orderDate: {
    fontSize: typography.sizes.xs,
  },
});

export default DashboardScreen;
