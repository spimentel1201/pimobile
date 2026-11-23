// ponytail: M3 Dashboard screen with tonal cards, device icons and quick actions
import React, { useState, useEffect, useCallback } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  RefreshControl,
  ActivityIndicator,
  DimensionValue,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RepairOrder } from '../types/api';
import {
  colors,
  typography,
  spacing,
  radii,
  tonalElevation,
  ORDER_STATUS,
  RepairOrderStatus,
  getDeviceIcon,
} from '../theme';
import * as Haptics from 'expo-haptics';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import SectionHeader from '../components/ui/SectionHeader';
import MetricCard from '../components/ui/MetricCard';
import EmptyState from '../components/ui/EmptyState';
import { summarizeQuotesByStatus, QuoteSummaryRow } from '../utils/quoteStats';

const ACTIVE_STATUSES: RepairOrderStatus[] = [
  'RECEIVED',
  'DIAGNOSED',
  'IN_PROGRESS',
  'WAITING_FOR_PARTS',
];

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
  const insets = useSafeAreaInsets();
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
  const [quoteRows, setQuoteRows] = useState<QuoteSummaryRow[] | null>(null);
  const [scanVisible, setScanVisible] = useState(false);
  const [scanProcessed, setScanProcessed] = useState(false);
  const [scanPermission, requestScanPermission] = useCameraPermissions();

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const [orders, salesResult, quotesResult] = await Promise.allSettled([
        api.getRepairOrders(),
        api.getSales({ startDate: new Date().toISOString().split('T')[0] }),
        api.getQuotes(),
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

      if (quotesResult.status === 'fulfilled') {
        setQuoteRows(summarizeQuotesByStatus(quotesResult.value));
      } else {
        console.error('Error fetching quotes:', quotesResult.reason);
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
    const hour = new Date().getHours();
    const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    const dateStr = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });

    return (
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.tagline}>ELECTRO-PIME · TALLER</Text>
          <Text style={styles.greeting}>¡{saludo}, {user?.firstName || 'Técnico'}!</Text>
          <Text style={styles.dateText}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconButton}
            onPress={async () => {
              if (!scanPermission?.granted) {
                const res = await requestScanPermission();
                if (!res.granted) return;
              }
              setScanProcessed(false);
              setScanVisible(true);
            }}
            android_ripple={{ color: 'rgba(0, 82, 255, 0.15)', borderless: true, radius: 24 }}
            accessibilityRole="button"
            accessibilityLabel="Escanear QR de orden"
          >
            <MaterialCommunityIcons name="qrcode-scan" size={22} color={colors.primary} />
          </Pressable>

          <Pressable
            style={styles.avatarButton}
            onPress={() => router.push('/profile')}
            android_ripple={{ color: 'rgba(0, 82, 255, 0.15)', borderless: true, radius: 24 }}
            accessibilityRole="button"
            accessibilityLabel="Ir a perfil"
          >
            <Text style={styles.avatarText}>{initials || 'EP'}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderKpis = () => {
    const fmtMoney = (v: number | null) => (v === null ? '—' : `S/ ${v.toFixed(2)}`);
    const fmtNumber = (v: number | null) => (v === null ? '—' : String(v));

    return (
      <View style={styles.kpiContainer}>
        <View style={styles.kpiRow}>
          <MetricCard
            label="En Taller"
            value={fmtNumber(kpis.active)}
            subtitle="Órdenes en proceso"
            icon="wrench"
            iconColor={colors.secondary}
            iconBg={colors.secondarySoft}
            style={styles.kpiCard}
          />
          <MetricCard
            label="Listas p/ Entrega"
            value={fmtNumber(kpis.pending)}
            subtitle="Esperando cliente"
            icon="check-circle-outline"
            iconColor={colors.success}
            iconBg={colors.successSoft}
            style={styles.kpiCard}
          />
        </View>
        <MetricCard
          label="Ingresos Registrados Hoy"
          value={fmtMoney(kpis.salesToday)}
          subtitle="Cobros directos en caja"
          icon="cash-multiple"
          variant="hero"
          style={styles.kpiHeroCard}
        />
      </View>
    );
  };

  const renderQuickActions = () => {
    const actions: {
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
      label: string;
      route: string;
      color: string;
      bg: string;
      isMain?: boolean;
    }[] = [
      {
        icon: 'wrench-outline',
        label: 'Nueva Orden',
        route: '/orders/new',
        color: colors.white,
        bg: colors.primary,
        isMain: true,
      },
      {
        icon: 'account-multiple-outline',
        label: 'Clientes',
        route: '/customers',
        color: colors.violet,
        bg: colors.violetSoft,
      },
      {
        icon: 'package-variant-closed',
        label: 'Repuestos',
        route: '/products',
        color: colors.secondary,
        bg: colors.secondarySoft,
      },
      {
        icon: 'file-document-edit-outline',
        label: 'Presupuestos',
        route: '/budgets',
        color: colors.success,
        bg: colors.successSoft,
      },
    ];

    if (user?.role === 'ADMIN') {
      actions.push({
        icon: 'shield-account-outline',
        label: 'Personal',
        route: '/users',
        color: colors.danger,
        bg: colors.dangerSoft,
      });
    }

    return (
      <View style={styles.section}>
        <SectionHeader title="Accesos Rápidos" />
        <View style={styles.actionGrid}>
          {actions.map((act) => (
            <Pressable
              key={act.label}
              style={[styles.actionTile, act.isMain && styles.actionTileMain]}
              onPress={() => {
                Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(act.route as any);
              }}
              android_ripple={{ color: 'rgba(0, 82, 255, 0.12)' }}
              accessibilityRole="button"
              accessibilityLabel={act.label}
            >
              <View style={[styles.actionIconBubble, { backgroundColor: act.bg }]}>
                <MaterialCommunityIcons name={act.icon} size={24} color={act.color} />
              </View>
              <Text style={[styles.actionTileLabel, act.isMain && styles.actionTileLabelMain]}>
                {act.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderQuoteSummary = () => {
    if (!quoteRows) return null;

    const visible = quoteRows.filter((row) => row.count > 0);
    const totalAmount = visible.reduce((sum, row) => sum + row.amount, 0);

    return (
      <View style={styles.section}>
        <SectionHeader
          title="Resumen de Cotizaciones"
          actionLabel="Ver todas"
          onAction={() => router.push('/budgets')}
        />
        <Card variant="filled" style={styles.quoteCard}>
          {visible.length === 0 ? (
            <EmptyState
              icon="file-document-outline"
              title="Sin cotizaciones activas"
              description="Los presupuestos emitidos a clientes se sincronizarán aquí."
            />
          ) : (
            <>
              {visible.map((row, index) => (
                <Pressable
                  key={row.status}
                  style={[styles.quoteRow, index > 0 && styles.quoteRowDivider]}
                  onPress={() => router.push('/budgets')}
                  android_ripple={{ color: 'rgba(0, 82, 255, 0.08)' }}
                >
                  <StatusBadge
                    label={row.style.label}
                    color={row.style.color}
                    soft={row.style.soft}
                    icon={row.style.icon}
                  />
                  <View style={styles.quoteMeta}>
                    <Text style={styles.quoteCount}>
                      {row.count} {row.count === 1 ? 'doc' : 'docs'}
                    </Text>
                    <Text style={styles.quoteAmount}>S/ {row.amount.toFixed(2)}</Text>
                  </View>
                </Pressable>
              ))}

              <View style={styles.quoteFooter}>
                <Text style={styles.quoteFooterLabel}>Total en Presupuestos:</Text>
                <Text style={styles.quoteFooterAmount}>S/ {totalAmount.toFixed(2)}</Text>
              </View>
            </>
          )}
        </Card>
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
        <Card variant="outlined">
          <EmptyState
            icon="clipboard-text-outline"
            title="No hay órdenes registradas"
            description="Empieza creando la primera orden de recepción en el taller."
            ctaLabel="Nueva Orden"
            onCta={() => router.push('/orders/new')}
          />
        </Card>
      ) : (
        recentOrders.map((order) => {
          const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.RECEIVED;
          const device = order.items?.[0];
          const reviewAmount = order.initialReviewCost ?? order.totalCost;
          const iconName = getDeviceIcon(device?.deviceType);

          return (
            <Card
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push(`/orders/${order.id}` as any)}
            >
              <View style={styles.orderTopRow}>
                <View style={styles.deviceHeader}>
                  <View style={[styles.deviceIconCircle, { backgroundColor: status.soft }]}>
                    <MaterialCommunityIcons
                      name={iconName as any}
                      size={20}
                      color={status.color}
                    />
                  </View>
                  <View style={styles.deviceTextCol}>
                    <Text style={styles.orderCode}>ORD-{order.id.slice(-4).toUpperCase()}</Text>
                    <Text style={styles.orderCustomer} numberOfLines={1}>
                      {order.customer?.name || order.customerName || 'Cliente'}
                    </Text>
                  </View>
                </View>

                <StatusBadge
                  label={status.label}
                  color={status.color}
                  soft={status.soft}
                  icon={status.icon}
                  compact
                />
              </View>

              {device && (
                <View style={styles.deviceDescRow}>
                  <Text style={styles.deviceModel} numberOfLines={1}>
                    {device.brand} {device.model} · {device.deviceType}
                  </Text>
                </View>
              )}

              <View style={styles.orderBottomRow}>
                <Text style={styles.orderDate}>{formatRelativeDate(order.createdAt)}</Text>
                {reviewAmount != null && (
                  <Text style={styles.orderPrice}>S/ {reviewAmount.toFixed(2)}</Text>
                )}
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
    <>
      <ScrollView
        style={styles.container}
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
        {renderHeader()}
        {renderKpis()}

        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {renderQuickActions()}
        {renderQuoteSummary()}
        {renderRecentOrders()}
      </ScrollView>

      {scanVisible && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setScanVisible(false)}>
          <View style={styles.scanOverlay}>
            <CameraView
              style={styles.scanCamera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={async ({ data }) => {
                if (scanProcessed) return;
                setScanProcessed(true);
                try {
                  let order: RepairOrder | null = null;
                  if (data.startsWith('serial:')) {
                    order = await api.getRepairOrderBySerial(data.slice('serial:'.length));
                  } else if (data.startsWith('order:')) {
                    order = await api.getRepairOrderById(data.slice('order:'.length));
                  } else {
                    try {
                      order = await api.getRepairOrderBySerial(data);
                    } catch {
                      order = await api.getRepairOrderById(data);
                    }
                  }
                  setScanVisible(false);
                  if (order) router.push(`/orders/${order.id}` as any);
                } catch {
                  setScanVisible(false);
                }
              }}
            />
            <View style={styles.scanFrame}>
              <View style={styles.scanBox} />
              <Text style={styles.scanHint}>Apunta al código QR de la orden</Text>
              <Pressable
                style={styles.scanCloseBtn}
                onPress={() => setScanVisible(false)}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Text style={styles.scanCloseText}>Cerrar Cámara</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  tagline: {
    ...typography.labelSmall,
    color: colors.primary,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  greeting: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dateText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  kpiContainer: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  kpiCard: {
    flex: 1,
  },
  kpiHeroCard: {
    width: '100%',
  },
  section: {
    marginBottom: spacing.xl,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionTile: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195, 199, 208, 0.4)',
    ...tonalElevation.level1,
  },
  actionTileMain: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  actionIconBubble: {
    width: 46,
    height: 46,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionTileLabel: {
    ...typography.labelSmall,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionTileLabelMain: {
    color: colors.primary,
    fontWeight: '700',
  },
  quoteCard: {
    padding: spacing.md,
    borderRadius: radii.card,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  quoteRowDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.3)',
  },
  quoteMeta: {
    alignItems: 'flex-end',
  },
  quoteCount: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  quoteAmount: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.4)',
  },
  quoteFooterLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  quoteFooterAmount: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  orderCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceTextCol: {
    flex: 1,
  },
  orderCode: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  orderCustomer: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  deviceDescRow: {
    marginVertical: spacing.xs,
    paddingLeft: 44,
  },
  deviceModel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingLeft: 44,
  },
  orderDate: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  orderPrice: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.danger,
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanCamera: {
    flex: 1,
  },
  scanFrame: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: radii.lg,
    backgroundColor: 'transparent',
  },
  scanHint: {
    ...typography.bodyMedium,
    color: colors.white,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  scanCloseBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  scanCloseText: {
    ...typography.labelLarge,
    color: colors.white,
    fontWeight: '600',
  },
});

export default DashboardScreen;
