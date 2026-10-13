import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Quote } from '../types/api';
import { colors, typography, spacing, radii } from '../theme';
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

/**
 * Reportes del ciclo quote-to-cash: totales por etapa de cobro (aprobado,
 * pagado, facturado) y la tabla de presupuestos agrupados por estado.
 * Fuente única: GET /quotes (solo lectura, permitido para técnicos).
 */
const ReportsScreen = () => {
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
    } catch (err) {
      console.error('Error fetching quotes for reports:', err);
      setError((err as Error)?.message || 'No se pudieron cargar los reportes');
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes</Text>
        <Text style={styles.headerSubtitle}>Presupuestos y cobros</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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
          <SectionHeader title="Estado de cobro" />
          <View style={styles.metricRow}>
            <MetricCard
              label="Por cobrar"
              value={`S/ ${totals.porCobrar.toFixed(2)}`}
              icon="clock-outline"
              style={styles.metricCard}
            />
            <MetricCard
              label="Cobrado"
              value={`S/ ${totals.cobrado.toFixed(2)}`}
              icon="cash-multiple"
              style={styles.metricCard}
            />
            <MetricCard
              label="Facturado"
              value={`S/ ${totals.facturado.toFixed(2)}`}
              icon="receipt"
              style={styles.metricCard}
            />
          </View>
          <Text style={styles.metricHint}>
            Por cobrar = aprobado sin pagar · Cobrado = pagado · Facturado = venta generada
          </Text>
        </View>

        {/* Tabla de presupuestos por estado */}
        <View style={styles.section}>
          <SectionHeader title="Presupuestos por estado" />

          {totalQuotes === 0 ? (
            <Card>
              <EmptyState
                icon="file-document-outline"
                title="Aún no hay presupuestos"
                description="Cuando emitas presupuestos verás aquí el conteo y el monto agrupados por estado."
              />
            </Card>
          ) : (
            <Card>
              <View style={styles.tableHead}>
                <Text style={styles.tableHeadLabel}>Estado</Text>
                <Text style={[styles.tableHeadLabel, styles.countCol]}>Cant.</Text>
                <Text style={[styles.tableHeadLabel, styles.amountCol]}>Monto</Text>
              </View>

              {rows.map((row, index) => (
                <View key={row.status} style={[styles.tableRow, index > 0 && styles.tableDivider]}>
                  <View style={styles.stateCol}>
                    <StatusBadge
                      label={row.style.label}
                      color={row.style.color}
                      soft={row.style.soft}
                    />
                  </View>
                  <Text style={[styles.countValue, styles.countCol]}>{row.count}</Text>
                  <Text
                    style={[
                      styles.amountValue,
                      styles.amountCol,
                      row.count === 0 && styles.amountEmpty,
                    ]}
                  >
                    S/ {row.amount.toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.tableTotal}>
                <Text style={styles.tableTotalLabel}>Total</Text>
                <Text style={styles.tableTotalCount}>{totalQuotes}</Text>
                <Text style={styles.tableTotalAmount}>S/ {totalAmount.toFixed(2)}</Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.display,
    fontSize: 24,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  content: {
    // Deja espacio para el TabBar flotante (pill margin 12 + altura ~66)
    paddingTop: spacing.lg,
    paddingBottom: 110,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },

  // Error (si hubo datos previos se muestra como banner, si no como pantalla)
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

  // KPIs de cobro
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    padding: spacing.md,
  },
  metricHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Tabla por estado
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeadLabel: {
    ...typography.micro,
    color: colors.textMuted,
    flex: 1,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tableDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  stateCol: {
    flex: 1,
    flexDirection: 'row',
  },
  countCol: {
    width: 48,
    textAlign: 'right',
  },
  amountCol: {
    width: 104,
    textAlign: 'right',
  },
  countValue: {
    ...typography.body,
    color: colors.textSecondary,
  },
  amountValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  amountEmpty: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  tableTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  tableTotalLabel: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
  },
  tableTotalCount: {
    ...typography.bodyStrong,
    width: 48,
    textAlign: 'right',
    color: colors.textSecondary,
  },
  tableTotalAmount: {
    ...typography.bodyStrong,
    width: 104,
    textAlign: 'right',
    color: colors.success,
  },
});

export default ReportsScreen;
