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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radii, shadows, brandColors } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { RepairOrder } from '../../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTION_COLUMNS = 3;
const ACTION_GAP = spacing.md;
const ACTION_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - ACTION_GAP * (ACTION_COLUMNS - 1)) / ACTION_COLUMNS;

const QUICK_ACTIONS = [
  { icon: 'plus-circle', label: 'Nueva Orden', route: '/orders/new', color: brandColors.blue.color, bg: brandColors.blue.bg },
  { icon: 'account-plus', label: 'Clientes', route: '/customers', color: brandColors.emerald.color, bg: brandColors.emerald.bg },
  { icon: 'package-variant', label: 'Productos', route: '/products', color: brandColors.amber.color, bg: brandColors.amber.bg },
  { icon: 'file-document', label: 'Presupuestos', route: '/budgets', color: brandColors.indigo.color, bg: brandColors.indigo.bg },
  { icon: 'account-group', label: 'Usuarios', route: '/users', color: brandColors.pink.color, bg: brandColors.pink.bg, adminOnly: true },
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  companyName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  date: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
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
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ACTION_GAP,
  },
  actionCard: {
    width: ACTION_CARD_WIDTH,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
    numberOfLines: 1,
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
