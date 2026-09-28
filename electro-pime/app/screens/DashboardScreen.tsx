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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RepairOrder } from '../types/api';
import { colors, typography, spacing, radii, shadow, ORDER_STATUS, RepairOrderStatus } from '../theme';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';

const ACTIVE_STATUSES: RepairOrderStatus[] = [
  'RECEIVED',
  'DIAGNOSED',
  'IN_PROGRESS',
  'WAITING_FOR_PARTS',
];

// Fecha relativa: "Hoy 12:40", "Ayer", "3 mar"
function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  if (date >= startOfToday) return `Hoy ${time}`;
  if (date >= startOfYesterday) return `Ayer ${time}`;
  const day = date.getDate();
  const month = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
  return `${day} ${month}`;
}

const DashboardScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<RepairOrder[]>([]);
  const [kpis, setKpis] = useState<{ active: number | null; pending: number | null; salesToday: number | null }>({
    active: null,
    pending: null,
    salesToday: null,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // KPIs y órdenes en paralelo; los KPIs degradan a "—" si fallan
      const [orders, salesResult] = await Promise.allSettled([
        api.getRepairOrders(),
        api.getSales({ startDate: new Date().toISOString().split('T')[0] }),
      ]);

      if (orders.status === 'fulfilled') {
        const sorted = orders.value
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setRecentOrders(sorted.slice(0, 5));
        setKpis((prev) => ({
          ...prev,
          active: sorted.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
          pending: sorted.filter((o) => o.status === 'COMPLETED').length,
        }));
      } else {
        console.error('Error fetching orders:', orders.reason);
        setError('No se pudieron cargar las órdenes');
      }

      if (salesResult.status === 'fulfilled') {
        const totalToday = salesResult.value.reduce((sum, sale) => sum + sale.totalAmount, 0);
        setKpis((prev) => ({ ...prev, salesToday: totalToday }));
      } else {
        console.error('Error fetching sales for KPIs:', salesResult.reason);
      }
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

  const renderHeader = () => {
    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || user?.firstName?.[1] || ''}`.toUpperCase();
    const dateStr = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.companyLabel}>Electrónica Pimentel</Text>
          <Text style={styles.greeting}>¡Hola, {user?.firstName || 'Usuario'} 👋</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/profile')}
          activeOpacity={0.85}
        >
          <Text style={styles.avatarText}>{initials || 'EP'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderKpis = () => {
    const fmt = (v: number | null, isMoney: boolean) =>
      v === null ? '—' : isMoney ? `S/ ${v.toFixed(2)}` : String(v);

    return (
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{fmt(kpis.active, false)}</Text>
          <Text style={styles.kpiLabel}>Activas</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{fmt(kpis.pending, false)}</Text>
          <Text style={styles.kpiLabel}>Por cobrar</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, kpis.salesToday !== null && styles.kpiMoney]} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(kpis.salesToday, true)}
          </Text>
          <Text style={styles.kpiLabel}>Ventas hoy</Text>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => {
    const actions: {
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
      label: string;
      route: string;
      primary?: boolean;
    }[] = [
      { icon: 'plus', label: 'Nueva Orden', route: '/orders/new', primary: true },
      { icon: 'account-plus-outline', label: 'Clientes', route: '/customers' },
      { icon: 'package-variant-closed', label: 'Productos', route: '/products' },
      { icon: 'file-document-outline', label: 'Presupuestos', route: '/budgets' },
    ];

    if (user?.role === 'ADMIN') {
      actions.push({ icon: 'account-group-outline', label: 'Usuarios', route: '/users' });
    }

    return (
      <View style={styles.section}>
        <SectionHeader title="Acciones Rápidas" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionPill}
              onPress={() => router.push(action.route as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, action.primary && styles.actionIconPrimary]}>
                <MaterialCommunityIcons
                  name={action.icon}
                  size={22}
                  color={action.primary ? colors.white : colors.primary}
                />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderRecentOrders = () => (
    <View style={styles.section}>
      <SectionHeader
        title="Órdenes Recientes"
        actionLabel="Ver todas"
        onAction={() => router.push('/orders')}
      />

      {recentOrders.length === 0 ? (
        <Card>
          <EmptyState
            icon="clipboard-text-outline"
            title="Aún no hay órdenes"
            description="Las órdenes de reparación que crees aparecerán aquí."
            ctaLabel="Crear primera orden"
            onCta={() => router.push('/orders/new')}
          />
        </Card>
      ) : (
        recentOrders.map((order) => {
          const status = ORDER_STATUS[order.status];
          const device = order.items?.[0];

          return (
            <Card
              key={order.id}
              accentColor={status.color}
              style={styles.orderCard}
              onPress={() => router.push(`/orders/${order.id}` as never)}
            >
              <View style={styles.orderTopRow}>
                <StatusBadge label={status.label} color={status.color} soft={status.soft} />
                {order.totalCost != null && (
                  <Text style={styles.orderAmount}>S/ {order.totalCost.toFixed(2)}</Text>
                )}
              </View>
              <Text style={styles.orderCustomer} numberOfLines={1}>
                {order.customerName || 'Cliente'}
              </Text>
              <View style={styles.orderBottomRow}>
                <Text style={styles.orderDevice} numberOfLines={1}>
                  {device ? `${device.brand || ''} ${device.model || ''}`.trim() || device.deviceType : order.description}
                </Text>
                <Text style={styles.orderDate}>{formatRelativeDate(order.createdAt)}</Text>
              </View>
            </Card>
          );
        })
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {renderHeader()}
      {renderKpis()}

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {renderQuickActions()}
      {renderRecentOrders()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    // Deja espacio para el TabBar flotante (pill margin 12 + altura ~66)
    paddingBottom: 110,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },

  // Header hero
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  companyLabel: {
    ...typography.micro,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.display,
    fontSize: 24,
  },
  date: {
    ...typography.caption,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },

  // KPIs
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...shadow,
  },
  kpiValue: {
    ...typography.title,
    fontSize: 20,
  },
  kpiMoney: {
    color: colors.success,
  },
  kpiLabel: {
    ...typography.caption,
    marginTop: 2,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
  },

  // Secciones
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },

  // Acciones rápidas
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionPill: {
    width: 88,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.button,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionIconPrimary: {
    backgroundColor: colors.primary,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Cards de orden
  orderCard: {
    marginBottom: spacing.md,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  orderAmount: {
    ...typography.display,
    fontSize: 18,
    flexShrink: 0,
    textAlign: 'right',
  },
  orderCustomer: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orderDevice: {
    ...typography.caption,
    flex: 1,
  },
  orderDate: {
    ...typography.caption,
    flexShrink: 0,
  },
});

export default DashboardScreen;
