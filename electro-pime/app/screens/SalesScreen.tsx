// ponytail: M3 SalesScreen with financial KPIs, FlashList, BottomSheet and Ticket print
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '../services/api';
import { Sale } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { FlashList } from '@shopify/flash-list';
import { printSaleReceipt, type TicketSize } from '../utils/orderReceipt';
import {
  colors,
  typography,
  spacing,
  radii,
  tonalElevation,
  PAYMENT_METHOD,
  PaymentMethod,
} from '../theme';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import MetricCard from '../components/ui/MetricCard';
import EmptyState from '../components/ui/EmptyState';
import BottomSheet from '../components/ui/BottomSheet';
import M3Fab from '../components/ui/M3Fab';
import Toast from '../components/ui/Toast';

type DateFilter = 'today' | 'week' | 'month' | 'all';

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

export default function SalesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketSize, setTicketSize] = useState<TicketSize>('80');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [printing, setPrinting] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSales = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const params: { startDate?: string; endDate?: string } = {};
      const today = new Date();
      const startOfLocalDay = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const endOfLocalDay = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

      let rangeStart: Date | null = null;
      let rangeEnd: Date | null = null;

      if (dateFilter === 'today') {
        rangeStart = startOfLocalDay(today);
        rangeEnd = endOfLocalDay(today);
      } else if (dateFilter === 'week') {
        // Lunes de la semana actual (la semana empieza en lunes).
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        rangeStart = startOfLocalDay(monday);
        rangeEnd = endOfLocalDay(today);
      } else if (dateFilter === 'month') {
        rangeStart = startOfLocalDay(new Date(today.getFullYear(), today.getMonth(), 1));
        rangeEnd = endOfLocalDay(today);
      }

      // Se envían instantes ISO completos: el backend compara contra createdAt
      // y una fecha suelta (YYYY-MM-DD) dejaba fuera las ventas del día.
      if (rangeStart && rangeEnd) {
        params.startDate = rangeStart.toISOString();
        params.endDate = rangeEnd.toISOString();
      }

      const data = await api.getSales(params);
      const sorted = data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSales(sorted);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      setError(err.message || 'Error al cargar las ventas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter, user]);

  useEffect(() => {
    if (user) {
      fetchSales();
    } else {
      setLoading(false);
    }
  }, [fetchSales, user]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSales();
  }, [fetchSales]);

  const metrics = useMemo(() => {
    const total = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const avg = sales.length > 0 ? total / sales.length : 0;
    return { total, avg, count: sales.length };
  }, [sales]);

  const handlePrint = async (sale: Sale) => {
    if (printing) return;
    setPrinting(true);
    // Se cierra la hoja emergente antes de imprimir: en Android el diálogo de
    // impresión del SO puede quedar detrás del Modal si se lanza con él abierto.
    setShowDetails(false);
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      await printSaleReceipt(sale, ticketSize);
      showToast('Ticket enviado a impresión', 'success');
    } catch (e: any) {
      console.error('Error printing sale receipt:', e);
      showToast(
        e?.message ? `No se pudo imprimir: ${e.message}` : 'No se pudo abrir la impresión',
        'error'
      );
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async (sale: Sale) => {
    try {
      const html = `
        <html>
          <body>
            <h2>Comprobante de Venta - Electro-Pime</h2>
            <p><strong>Ticket:</strong> #${sale.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Cliente:</strong> ${sale.customerFullName || sale.customerName || 'General'}</p>
            <p><strong>Total:</strong> S/ ${sale.totalAmount.toFixed(2)}</p>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri);
      } else {
        showToast('Compartir no está disponible en este dispositivo', 'error');
      }
    } catch (e: any) {
      console.error(e);
      showToast(e?.message ? `No se pudo compartir: ${e.message}` : 'No se pudo compartir', 'error');
    }
  };

  const renderFilters = () => {
    const filters: { key: DateFilter; label: string }[] = [
      { key: 'all', label: 'Todas' },
      { key: 'today', label: 'Hoy' },
      { key: 'week', label: 'Esta Semana' },
      { key: 'month', label: 'Este Mes' },
    ];

    return (
      <View style={styles.filtersContent}>
        {filters.map((f) => {
          const active = dateFilter === f.key;
          return (
            <Pressable
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setDateFilter(f.key)}
              android_ripple={{ color: 'rgba(0, 82, 255, 0.15)' }}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderSaleCard = ({ item }: { item: Sale }) => {
    const method = PAYMENT_METHOD[item.paymentMethod as PaymentMethod] ?? PAYMENT_METHOD.CASH;
    const customer = item.customerFullName || item.customerName || 'Cliente General';
    const items = item.items || [];
    const firstProduct = items[0]?.productName || items[0]?.description || 'Producto';

    return (
      <Card
        style={styles.saleCard}
        onPress={() => {
          setSelectedSale(item);
          setShowDetails(true);
        }}
      >
        <View style={styles.cardTopRow}>
          <StatusBadge
            label={method.label}
            color={method.color}
            soft={method.soft}
            icon={method.icon}
            compact
          />
          <Text style={styles.saleAmount}>S/ {item.totalAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.customerRow}>
          <MaterialCommunityIcons name="account-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.customerName} numberOfLines={1}>
            {customer}
          </Text>
        </View>

        <View style={styles.productsRow}>
          <MaterialCommunityIcons name="package-variant-closed" size={16} color={colors.textMuted} />
          <Text style={styles.productsSummary} numberOfLines={1}>
            {items.length === 0
              ? 'Sin ítems'
              : `${items.length} ítem(s) · ${firstProduct}${items.length > 1 ? ` +${items.length - 1} más` : ''}`}
          </Text>
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.sellerName} numberOfLines={1}>
            {item.userName ? `Atendido por ${item.userName}` : 'Venta en caja'}
          </Text>
          <Text style={styles.dateText}>{formatRelativeDate(item.createdAt)}</Text>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: insets.top + spacing.xs }]}>
        <Text style={styles.screenTitle}>Control de Ventas</Text>
      </View>

      {/* Metrics Banner */}
      <View style={styles.metricsWrapper}>
        <MetricCard
          label="INGRESOS EN EL PERÍODO"
          value={`S/ ${metrics.total.toFixed(2)}`}
          subtitle={`${metrics.count} tickets emitidos · Promedio S/ ${metrics.avg.toFixed(2)}`}
          icon="cash-multiple"
          variant="hero"
        />
      </View>

      {renderFilters()}

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.listContainer}>
        {sales.length === 0 ? (
          <EmptyState
            icon="cash-register"
            title="No hay ventas registradas"
            description="Empieza realizando una venta directa de repuestos o mano de obra."
            ctaLabel="Nueva Venta"
            onCta={() => router.push('/sales/new')}
          />
        ) : (
          <FlashList
            data={sales}
            keyExtractor={(item) => item.id}
            renderItem={renderSaleCard}
            estimatedItemSize={140}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
      </View>

      {/* Extended FAB for New Sale */}
      <View style={[styles.fabWrapper, { bottom: insets.bottom + 80 }]}>
        <M3Fab
          label="Nueva Venta"
          icon="cart-plus"
          onPress={() => router.push('/sales/new')}
        />
      </View>

      {/* Sale Details BottomSheet */}
      {selectedSale && (
        <BottomSheet
          visible={showDetails}
          title={`Ticket #${selectedSale.id.slice(0, 8).toUpperCase()}`}
          subtitle={formatRelativeDate(selectedSale.createdAt)}
          onClose={() => setShowDetails(false)}
          footer={
            <View>
              <View style={styles.ticketSizeRow}>
                {([
                  { key: '58', label: '58 mm' },
                  { key: '80', label: '80 mm' },
                  { key: 'A4', label: 'A4' },
                  { key: 'LETTER', label: 'Carta' },
                ] as { key: TicketSize; label: string }[]).map((opt) => {
                  const active = ticketSize === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      style={[styles.ticketSizeChip, active && styles.ticketSizeChipActive]}
                      onPress={() => setTicketSize(opt.key)}
                      android_ripple={{ color: 'rgba(0, 82, 255, 0.15)' }}
                    >
                      <Text
                        style={[
                          styles.ticketSizeText,
                          active && styles.ticketSizeTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.sheetFooterRow}>
                <Pressable
                  style={styles.sheetBtnSecondary}
                  onPress={() => handleShare(selectedSale)}
                  android_ripple={{ color: 'rgba(0, 82, 255, 0.12)' }}
                >
                  <MaterialCommunityIcons name="share-variant" size={20} color={colors.primary} />
                  <Text style={styles.sheetBtnSecondaryText}>Compartir</Text>
                </Pressable>
                <Pressable
                  style={[styles.sheetBtnPrimary, printing && styles.sheetBtnDisabled]}
                  onPress={() => handlePrint(selectedSale)}
                  disabled={printing}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
                >
                  {printing ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <MaterialCommunityIcons name="printer" size={20} color={colors.white} />
                  )}
                  <Text style={styles.sheetBtnPrimaryText}>
                    {printing ? 'Abriendo…' : 'Imprimir Ticket'}
                  </Text>
                </Pressable>
              </View>
            </View>
          }
        >
          <ScrollView style={styles.sheetBody}>
            <View style={styles.sheetDetailRow}>
              <Text style={styles.sheetLabel}>Cliente:</Text>
              <Text style={styles.sheetValue}>
                {selectedSale.customerFullName || selectedSale.customerName || 'Cliente General'}
              </Text>
            </View>
            <View style={styles.sheetDetailRow}>
              <Text style={styles.sheetLabel}>Método de Pago:</Text>
              <StatusBadge
                label={PAYMENT_METHOD[selectedSale.paymentMethod as PaymentMethod]?.label || selectedSale.paymentMethod}
                color={PAYMENT_METHOD[selectedSale.paymentMethod as PaymentMethod]?.color || colors.primary}
                soft={PAYMENT_METHOD[selectedSale.paymentMethod as PaymentMethod]?.soft || colors.primarySoft}
                compact
              />
            </View>
            <View style={styles.sheetDetailRow}>
              <Text style={styles.sheetLabel}>Atendido por:</Text>
              <Text style={styles.sheetValue}>{selectedSale.userName || 'Técnico'}</Text>
            </View>

            <Text style={styles.itemsHeader}>Productos / Repuestos:</Text>
            {(selectedSale.items || []).map((it, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{it.productName || it.description}</Text>
                  <Text style={styles.itemQtyPrice}>
                    {it.quantity} x S/ {it.price.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  S/ {(it.quantity * it.price).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelText}>TOTAL COBRADO:</Text>
              <Text style={styles.totalAmountText}>
                S/ {selectedSale.totalAmount.toFixed(2)}
              </Text>
            </View>
          </ScrollView>
        </BottomSheet>
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </View>
  );
}

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
  topHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  screenTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  metricsWrapper: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  filtersContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(195, 199, 208, 0.4)',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 110,
  },
  saleCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleAmount: {
    ...typography.titleLarge,
    color: colors.primary,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  customerName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  productsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  productsSummary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.3)',
  },
  sellerName: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  fabWrapper: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 99,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.danger,
    flex: 1,
  },
  sheetBody: {
    maxHeight: 380,
    paddingVertical: spacing.xs,
  },
  sheetDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  sheetLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  sheetValue: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  itemsHeader: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 199, 208, 0.2)',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  itemQtyPrice: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemTotal: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  totalDivider: {
    height: 1,
    backgroundColor: 'rgba(195, 199, 208, 0.4)',
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabelText: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  totalAmountText: {
    ...typography.headlineSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  ticketSizeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  ticketSizeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(195, 199, 208, 0.5)',
    backgroundColor: colors.surface,
  },
  ticketSizeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ticketSizeText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ticketSizeTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  sheetFooterRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sheetBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    minHeight: 48,
  },
  sheetBtnSecondaryText: {
    ...typography.labelLarge,
    color: colors.primary,
    fontWeight: '700',
  },
  sheetBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minHeight: 48,
  },
  sheetBtnDisabled: {
    opacity: 0.7,
  },
  sheetBtnPrimaryText: {
    ...typography.labelLarge,
    color: colors.white,
    fontWeight: '700',
  },
});
