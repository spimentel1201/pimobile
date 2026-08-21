import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radii, shadows, brandColors } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';

interface ReportStat {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}

const ReportsScreen = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReportStat[]>([]);
  const [hasData, setHasData] = useState(false);

  const fetchReportData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const orders = await api.getRepairOrders();

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthOrders = orders.filter(
        (o) => new Date(o.createdAt) >= monthStart
      );
      const activeCustomers = new Set(monthOrders.map((o) => o.customerName)).size;
      const pendingBudgets = monthOrders.filter(
        (o) => o.status === 'RECEIVED' || o.status === 'DIAGNOSED'
      ).length;

      const completed = monthOrders.filter(
        (o) => o.status === 'COMPLETED' || o.status === 'DELIVERED'
      );
      const income = completed.reduce(
        (sum, o) => sum + (o.totalAmount ?? 0),
        0
      );

      const reportStats: ReportStat[] = [
        {
          icon: 'clipboard-text-outline',
          label: 'Órdenes del mes',
          value: monthOrders.length,
          color: theme.primary,
          bg: theme.primaryLight,
        },
        {
          icon: 'currency-usd',
          label: 'Ingresos del mes',
          value: `S/ ${income.toFixed(2)}`,
          color: brandColors.emerald.color,
          bg: brandColors.emerald.bg,
        },
        {
          icon: 'file-document-edit-outline',
          label: 'Presupuestos pendientes',
          value: pendingBudgets,
          color: brandColors.amber.color,
          bg: brandColors.amber.bg,
        },
        {
          icon: 'account-group',
          label: 'Clientes activos',
          value: activeCustomers,
          color: brandColors.indigo.color,
          bg: brandColors.indigo.bg,
        },
      ];

      setStats(reportStats);
      setHasData(monthOrders.length > 0);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, theme]);

  useEffect(() => {
    if (user) {
      fetchReportData();
    } else {
      setLoading(false);
    }
  }, [user, fetchReportData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReportData();
  }, [fetchReportData]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.text }]}>Reportes</Text>
        </View>
      </Animated.View>

      {!hasData ? (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <EmptyState
            icon="chart-bar"
            title="Los reportes estarán disponibles pronto"
            message="Crea órdenes de reparación para generar datos de reportes"
          />
        </Animated.View>
      ) : (
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Animated.View
              key={stat.label}
              entering={FadeInDown.delay(200 + index * 80).springify()}
              style={styles.statWrapper}
            >
              <Card variant="elevated" padding={spacing.base} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                  <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </Card>
            </Animated.View>
          ))}
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.base,
    gap: spacing.md,
  },
  statWrapper: {
    width: '47%',
  },
  statCard: {
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing['2xs'],
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
});

export default ReportsScreen;
