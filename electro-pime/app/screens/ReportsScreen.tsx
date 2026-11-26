// ponytail: M3 ReportsScreen with tonal quote-to-cash metrics and analytics table
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { Quote } from '../types/api';
import { colors, typography, spacing, radii, tonalElevation } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import MetricCard from '../components/ui/MetricCard';
import {
  summarizeQuotesByStatus,
  quoteMoneyTotals,
  QuoteSummaryRow,
} from '../utils/quoteStats';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [rows, setRows] = useState<QuoteSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getQuotes();
      setQuotes(data);
      setRows(summarizeQuotesByStatus(data));
    } catch (err: any) {
      console.error('Error fetching quotes for reports:', err);
      setError(err?.message || 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, [fetchReports]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totals = quoteMoneyTotals(quotes);
  const totalQuotes = rows.reduce((sum, row) => sum + row.count, 0);
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.screenTitle}>Reportes Financieros</Text>
        <Text style={styles.screenSubtitle}>Balance de Presupuestos y Cobros</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Totales por etapa de cobro */}
        <View style={styles.section}>
          <SectionHeader title="Ciclo de Cobro (Quote-to-Cash)" />
          <View style={styles.metricGrid}>
            <MetricCard
              label="Por Cobrar"
              value={`S/ ${totals.porCobrar.toFixed(2)}`}
              subtitle="Aprobado por el cliente"
              icon="clock-alert-outline"
              iconColor={colors.secondary}
              iconBg={colors.secondarySoft}
              style={styles.metricCard}
            />
            <MetricCard
              label="Cobrado en Caja"
              value={`S/ ${totals.cobrado.toFixed(2)}`}
              subtitle="Pagado en taller"
              icon="cash-check"
              iconColor={colors.success}
              iconBg={colors.successSoft}
              style={styles.metricCard}
            />
          </View>
          <MetricCard
            label="Total Facturado / Concretado"
            value={`S/ ${totals.facturado.toFixed(2)}`}
            subtitle="Ventas registradas y finalizadas"
            icon="receipt"
            variant="hero"
            style={styles.heroCard}
          />
        </View>

        {/* Tabla de presupuestos por estado */}
        <View style={styles.section}>
          <SectionHeader title="Presupuestos por Estado" />

          {totalQuotes === 0 ? (
            <Card variant="outlined">
              <EmptyState
                icon="file-document-outline"
                title="Aún no hay cotizaciones"
                description="Cuando emitas presupuestos a tus clientes verás aquí el conteo y monto agrupados."
              />
            </Card>
          ) : (
            <Card variant="filled" style={styles.tableCard}>
              <View style={styles.tableHead}>
                <Text style={styles.tableHeadLabel}>Estado</Text>
                <Text style={[styles.tableHeadLabel, styles.countCol]}>Cant.</Text>
                <Text style={[styles.tableHeadLabel, styles.amountCol]}>Total (S/)</Text>
              </View>

              {rows.map((row, index) => (
                <View key={row.status} style={[styles.tableRow, index > 0 && styles.tableDivider]}>
                  <View style={styles.stateCol}>
                    <StatusBadge
                      label={row.style.label}
                      color={row.style.color}
                      soft={row.style.soft}
                      icon={row.style.icon}
                      compact
                    />
                  </View>
                  <Text style={[styles.cellText, styles.countCol]}>{row.count}</Text>
                  <Text style={[styles.cellText, styles.amountCol, styles.amountText]}>
                    S/ {row.amount.toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.tableFooter}>
                <Text style={styles.footerLabel}>Total Global ({totalQuotes} docs):</Text>
                <Text style={styles.footerAmount}>S/ {totalAmount.toFixed(2)}</Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  topHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 199, 208, 0.3)',
  },
  screenTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  screenSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
  },
  heroCard: {
    marginTop: spacing.xs,
  },
  tableCard: {
    padding: spacing.md,
    borderRadius: radii.card,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 199, 208, 0.4)',
  },
  tableHeadLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: '700',
    flex: 1,
  },
  stateCol: {
    flex: 1.5,
  },
  countCol: {
    flex: 0.6,
    textAlign: 'center',
  },
  amountCol: {
    flex: 1.2,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tableDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.2)',
  },
  cellText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  amountText: {
    fontWeight: '700',
    color: colors.primary,
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.4)',
  },
  footerLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  footerAmount: {
    ...typography.titleLarge,
    color: colors.primary,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.danger,
    flex: 1,
  },
});
