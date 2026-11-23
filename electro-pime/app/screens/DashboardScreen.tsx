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
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RepairOrder } from '../types/api';
import { colors, typography, spacing, radii, shadow, ORDER_STATUS, RepairOrderStatus } from '../theme';
import * as Haptics from 'expo-haptics';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import { summarizeQuotesByStatus, QuoteSummaryRow } from '../utils/quoteStats';

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
  // null = no cargado (o falló): la sección de presupuestos se omite en vez de
  // mostrar ceros falsos
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

      // KPIs, órdenes y presupuestos en paralelo; degradan en silencio si fallan
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
        // GET /quotes es solo-lectura (está permitido para técnicos)
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.companyLabel}>Electrónica Pimentel</Text>
          <Text style={styles.greeting}>¡{saludo}, {user?.firstName || 'Usuario'}!</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.scanButton}
            onPress={async () => {
              if (!scanPermission?.granted) {
                const res = await requestScanPermission();
                if (!res.granted) {
                  // no toast util here; use console + alert not needed
                  return;
                }
              }
              setScanProcessed(false);
              setScanVisible(true);
            }}
            android_ripple={{ color: 'rgba(20,184,166,0.15)', borderless: true }}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={'#14B8A6'} />
          </Pressable>
          <Pressable
            style={styles.avatar}
            onPress={() => router.push('/profile')}
            android_ripple={{ color: 'rgba(20,184,166,0.15)', borderless: true }}
          >
            <Text style={styles.avatarText}>{initials || 'EP'}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderKpis = () => {
    const fmt = (v: number | null, isMoney: boolean) =>
      v === null ? '—' : isMoney ? `S/ ${v.toFixed(2)}` : String(v);

    return (
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue} selectable>{fmt(kpis.active, false)}</Text>
          <Text style={styles.kpiLabel}>Activas</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue} selectable>{fmt(kpis.pending, false)}</Text>
          <Text style={styles.kpiLabel}>Por cobrar</Text>
        </View>
        <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
          <Text style={[styles.kpiValue, kpis.salesToday !== null && styles.kpiMoney]} numberOfLines={1} selectable>
            {fmt(kpis.salesToday, true)}
          </Text>
          <Text style={styles.kpiLabel}>Ventas hoy</Text>
        </View>
      </View>
    );
  };

  const renderQuoteSummary = () => {
    // Sin datos (falló la carga) → la sección no se muestra
    if (!quoteRows) return null;

    const visible = quoteRows.filter((row) => row.count > 0);
    const totalCount = visible.reduce((sum, row) => sum + row.count, 0);
    const totalAmount = visible.reduce((sum, row) => sum + row.amount, 0);

    return (
      <View style={styles.section}>
        <SectionHeader
          title="Presupuestos"
          actionLabel="Ver todos"
          onAction={() => router.push('/budgets')}
        />
        <Card>
          {visible.length === 0 ? (
            <EmptyState
              icon="file-document-outline"
              title="Aún no hay presupuestos"
              description="Los presupuestos que emitas a tus clientes aparecerán aquí."
            />
          ) : (
            <>
              {visible.map((row, index) => (
                <Pressable
                  key={row.status}
                  style={[styles.quoteRow, index > 0 && styles.quoteRowDivider]}
                  onPress={() => router.push('/budgets')}
                  android_ripple={{ color: colors.border }}
                  accessibilityLabel={`Filtrar presupuestos en estado ${row.style.label}`}
                >
                  {/* Barra de acento del color del estado, igual que en las órdenes */}
                  <View style={[styles.quoteAccent, { backgroundColor: row.style.color }]} />
                  <StatusBadge
                    label={row.style.label}
                    color={row.style.color}
                    soft={row.style.soft}
                  />
                  <View style={styles.quoteCountPill}>
                    <Text style={styles.quoteCountText}>
                      {row.count} {row.count === 1 ? 'ppto' : 'pptos'}
                    </Text>
                  </View>
                  <Text style={styles.quoteAmount}>S/ {row.amount.toFixed(2)}</Text>
                </Pressable>
              ))}

              {visible.length > 1 && (
                <View style={styles.quoteTotal}>
                  <Text style={styles.quoteTotalLabel}>
                    Total · {totalCount} {totalCount === 1 ? 'presupuesto' : 'presupuestos'}
                  </Text>
                  <Text style={styles.quoteTotalAmount}>S/ {totalAmount.toFixed(2)}</Text>
                </View>
              )}
            </>
          )}
        </Card>
      </View>
    );
  };

  const renderQuickActions = () => {
    // Cada acción con su propio color (pareja soft + color AA sobre blanco)
    const actions: {
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
      label: string;
      route: string;
      fg: string;
      bg: string;
      primary?: boolean;
    }[] = [
      { icon: 'plus', label: 'Nueva Orden', route: '/orders/new', fg: colors.white, bg: colors.primary, primary: true },
      { icon: 'account-plus-outline', label: 'Clientes', route: '/customers', fg: colors.violet, bg: colors.violetSoft },
      { icon: 'package-variant-closed', label: 'Productos', route: '/products', fg: colors.warning, bg: colors.warningSoft },
      { icon: 'file-document-outline', label: 'Presupuestos', route: '/budgets', fg: colors.success, bg: colors.successSoft },
    ];

    if (user?.role === 'ADMIN') {
      actions.push({ icon: 'account-group-outline', label: 'Usuarios', route: '/users', fg: colors.danger, bg: colors.dangerSoft });
    }

    // Reparte las acciones en filas parejas: hasta 4 caben en una sola fila;
    // con más de 4 se divide en dos filas equilibradas (ej. 5 → 3 + 2).
    const columns = actions.length <= 4 ? actions.length : Math.ceil(actions.length / 2);
    const pillWidth = `${(100 / columns).toFixed(4)}%` as DimensionValue;

    return (
      <View style={styles.section}>
        <SectionHeader title="Acciones Rápidas" />
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={[styles.actionPill, { width: pillWidth }, action.primary && styles.actionPillPrimary]}
              onPress={() => { Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(action.route as never); }}
              android_ripple={{ color: 'rgba(20,184,166,0.15)', borderless: true }}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }, action.primary && styles.actionIconPrimary]}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.fg} />
              </View>
              <Text style={[styles.actionLabel, action.primary && styles.actionLabelPrimary]} numberOfLines={2} ellipsizeMode="tail">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
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
          const reviewAmount = order.initialReviewCost ?? order.totalCost;

          return (
            <Card
              key={order.id}
              accentColor={status.color}
              style={styles.orderCard}
              onPress={() => router.push(`/orders/${order.id}` as never)}
            >
              <View style={styles.orderTopRow}>
                <StatusBadge label={status.label} color={status.color} soft={status.soft} />
                {reviewAmount != null && (
                  <View style={styles.orderAmountBlock}>
                    <Text style={styles.orderAmountLabel}>Revisión</Text>
                    <Text style={styles.orderAmount} numberOfLines={1}>
                      S/ {reviewAmount.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.orderCustomer} numberOfLines={1}>
                {order.customer?.name || order.customerName || 'Cliente'}
              </Text>

              {device && (
                <View style={styles.orderDeviceRow}>
                  <MaterialCommunityIcons
                    name="devices"
                    size={16}
                    color={'#94A3B8'}
                  />
                  <Text style={styles.orderDevice} numberOfLines={1}>
                    <Text style={styles.orderDeviceUpper}>
                      {device.brand} {device.model}
                    </Text>{' '}
                    · {device.deviceType}
                  </Text>
                </View>
              )}

              <View style={styles.orderBottomRow}>
                <Text style={styles.orderDescription} numberOfLines={1}>
                  {order.description || 'Sin descripción'}
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
        <ActivityIndicator size="large" color={'#14B8A6'} />
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#14B8A6'} />
      }
    >
      {renderHeader()}
      {renderKpis()}

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={'#F87171'} />
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
                if (order) router.push(`/orders/${order.id}` as never);
              } catch {
                setScanVisible(false);
              }
            }}
          />
          <Pressable
            style={styles.scanClose}
            onPress={() => setScanVisible(false)}
            android_ripple={{ color: 'rgba(20,184,166,0.15)', borderless: true }}
          >
            <MaterialCommunityIcons name="close" size={24} color={'#FFFFFF'} />
          </Pressable>
          <Text style={styles.scanHint}>Apunta al código QR de la etiqueta</Text>
        </View>
      </Modal>
    )}
    </>
  );
};

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    borderCurve: 'continuous',
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanOverlay: {
    flex: 1,
    backgroundColor: colors.textPrimary,
  },
  scanCamera: {
    flex: 1,
  },
  scanClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanHint: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    // Deja espacio para el TabBar flotante (pill margin 12 + altura ~66)
    paddingBottom: 110,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
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
    ...typography.micro,    color: '#14B8A6',
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.display,
    color: '#F1F5F9',
    fontSize: 24,
  },
  date: {
    ...typography.caption,
    color: '#94A3B8',
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(20,184,166,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14B8A6',
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
    backgroundColor: '#1E293B',
    borderRadius: radii.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...shadow,
  },
  kpiCardHighlight: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: colors.success,
  },
  kpiValue: {
    ...typography.title,
    color: '#F1F5F9',
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  kpiMoney: {
    color: '#34D399',
  },
  kpiLabel: {
    ...typography.caption,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#F87171',
  },

  // Secciones
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },

  // Acciones rápidas — grilla equilibrada: el ancho por píldora lo calcula
  // el número de acciones para que ninguna fila quede huérfana
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: -spacing.xs,
  },
  actionPill: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.button,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    minHeight: 32,
  },
  actionIconPrimary: {
    backgroundColor: 'transparent',
  },
  actionPillPrimary: {
    backgroundColor: '#14B8A6',
    borderRadius: radii.card,
    paddingVertical: spacing.sm,
  },
  actionLabelPrimary: {
    color: colors.white,
    fontWeight: '700',
  },

  // Filas de presupuestos por estado
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  quoteRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quoteAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    borderCurve: 'continuous',
  },
  quoteCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: '#334155',
  },
  quoteCountText: {
    ...typography.caption,
    fontSize: 12,
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
  quoteAmount: {
    ...typography.bodyStrong,
    color: '#F1F5F9',
    marginLeft: 'auto',
    paddingRight: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  quoteTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
  },
  quoteTotalLabel: {
    ...typography.caption,
    color: '#94A3B8',
  },
  quoteTotalAmount: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: '#F1F5F9',
    fontVariant: ['tabular-nums'],
    paddingRight: spacing.md,
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
  orderAmountBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  orderAmountLabel: {
    ...typography.micro,
    color: '#64748B',
  },
  orderAmount: {
    ...typography.display,
    fontSize: 22,
    color: '#14B8A6',
    letterSpacing: -0.5,
  },
  orderCustomer: {
    ...typography.bodyStrong,
    fontSize: 17,
    color: '#F1F5F9',
    marginBottom: spacing.xs,
  },
  orderDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  orderDevice: {
    ...typography.caption,
    color: '#94A3B8',
    flex: 1,
  },
  orderDeviceUpper: {
    textTransform: 'uppercase',
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  orderDescription: {
    ...typography.caption,    color: '#64748B',
    flex: 1,
  },
  orderDate: {
    ...typography.caption,
    color: '#94A3B8',
    flexShrink: 0,
  },
});

export default DashboardScreen;



