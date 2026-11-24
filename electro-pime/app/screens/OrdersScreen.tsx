// ponytail: M3 OrdersScreen with SearchBar, Filter Chips, OrderCard and Extended FAB
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Linking,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { api } from '../services/api';
import { RepairOrder, RepairOrderStatus } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';
import BottomSheet from '../components/ui/BottomSheet';
import EmptyState from '../components/ui/EmptyState';
import M3Fab from '../components/ui/M3Fab';
import OrderCard from '../components/OrderCard';
import ReceiptPreview from '../components/ReceiptPreview';
import { NO_PHONE_MESSAGE, buildTelUrl, buildWhatsAppUrl } from '../utils/phone';
import {
  colors,
  typography,
  radii,
  spacing,
  ORDER_STATUS,
} from '../theme';

type FilterStatus = RepairOrderStatus | 'ALL';

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

const OrdersScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openOrderId } = useLocalSearchParams<{ openOrderId: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  // Orden canónico del flujo de reparación (mayor = más avanzado). Solo ADMIN
  // puede retroceder a un estado anterior; el backend valida la transición.
  const STATUS_RANK: Record<RepairOrderStatus, number> = {
    RECEIVED: 0,
    DIAGNOSED: 1,
    IN_PROGRESS: 2,
    WAITING_FOR_PARTS: 3,
    COMPLETED: 4,
    DELIVERED: 5,
    CANCELLED: -1,
  };
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [scanVisible, setScanVisible] = useState(false);
  const [scanProcessed, setScanProcessed] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [statusPickerOrder, setStatusPickerOrder] = useState<RepairOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<RepairOrder | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await api.getRepairOrders();
      const sortedData = data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sortedData);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Error al cargar las órdenes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }, [user, fetchOrders])
  );

  useEffect(() => {
    if (openOrderId) {
      router.push(`/orders/${openOrderId}` as never);
    }
  }, [openOrderId, router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const openPhone = (phone: string) => {
    const url = buildTelUrl(phone);
    if (!url) {
      showToast(NO_PHONE_MESSAGE, 'error');
      return;
    }
    Linking.openURL(url).catch(() => showToast('No se pudo abrir el teléfono', 'error'));
  };

  const openWhatsApp = (phone: string, name?: string) => {
    const message = name
      ? `Hola, ${name}, te escribe Electrónica Pimentel sobre tu equipo en taller.`
      : null;
    const url = buildWhatsAppUrl(phone, message);
    if (!url) {
      showToast(NO_PHONE_MESSAGE, 'error');
      return;
    }
    Linking.openURL(url).catch(() => showToast('No se pudo abrir WhatsApp', 'error'));
  };

  const handleStatusUpdate = async (orderId: string, newStatus: RepairOrderStatus) => {
    try {
      await api.updateRepairOrder(orderId, { status: newStatus });
      setStatusPickerOrder(null);
      showToast('Estado actualizado correctamente');
      fetchOrders();
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast(err.message || 'No se pudo actualizar el estado', 'error');
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (filterStatus !== 'ALL') {
      result = result.filter((o) => o.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const idMatch = o.id.toLowerCase().includes(q);
        const customerMatch = (o.customer?.name || o.customerName || '').toLowerCase().includes(q);
        const descMatch = (o.description || '').toLowerCase().includes(q);
        const deviceMatch = o.items?.some(
          (it) =>
            it.brand.toLowerCase().includes(q) ||
            it.model.toLowerCase().includes(q) ||
            it.deviceType.toLowerCase().includes(q) ||
            (it.serialNumber && it.serialNumber.toLowerCase().includes(q))
        );
        return idMatch || customerMatch || descMatch || deviceMatch;
      });
    }

    return result;
  }, [orders, filterStatus, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const renderSearchBar = () => (
    <View style={styles.searchBarContainer}>
      <View style={styles.searchField}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cliente, orden, equipo..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <Pressable
        style={styles.scanBtn}
        onPress={async () => {
          if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) {
              showToast('Se necesita permiso de cámara', 'error');
              return;
            }
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
    </View>
  );

  const renderFilterChips = () => {
    const statuses: FilterStatus[] = ['ALL', ...(Object.keys(ORDER_STATUS) as RepairOrderStatus[])];

    return (
      <View style={styles.filtersScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {statuses.map((st) => {
            const isSelected = filterStatus === st;
            const styleObj = st === 'ALL' ? null : ORDER_STATUS[st];
            const count = statusCounts[st] || 0;

            return (
              <Pressable
                key={st}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setFilterStatus(st)}
                android_ripple={{ color: 'rgba(0, 82, 255, 0.15)' }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                {styleObj && (
                  <MaterialCommunityIcons
                    name={(styleObj.icon || 'circle') as any}
                    size={15}
                    color={isSelected ? colors.white : styleObj.color}
                    style={styles.chipIcon}
                  />
                )}
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {st === 'ALL' ? 'Todas' : styleObj?.label}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    isSelected ? styles.countBadgeSelected : styles.countBadgeUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isSelected && styles.countTextSelected,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
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
    <SafeAreaView style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: insets.top + spacing.xs }]}>
        <Text style={styles.screenTitle}>Órdenes de Servicio</Text>
      </View>

      {renderSearchBar()}
      {renderFilterChips()}

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.listContainer}>
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon="clipboard-text-outline"
            title="No se encontraron órdenes"
            description={
              searchQuery
                ? `No hay coincidencias para "${searchQuery}".`
                : 'No hay órdenes en esta categoría.'
            }
            ctaLabel={searchQuery ? 'Limpiar búsqueda' : 'Nueva Orden'}
            onCta={
              searchQuery ? () => setSearchQuery('') : () => router.push('/orders/new')
            }
          />
        ) : (
          <FlashList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onCall={openPhone}
                onWhatsApp={openWhatsApp}
                onChangeStatus={(o) => setStatusPickerOrder(o)}
                onPrintReceipt={(o) => setReceiptOrder(o)}
                formatRelativeDate={formatRelativeDate}
              />
            )}
            estimatedItemSize={200}
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

      {/* Extended FAB for creating orders */}
      <View style={[styles.fabWrapper, { bottom: insets.bottom + 80 }]}>
        <M3Fab
          label="Nueva Orden"
          icon="wrench-outline"
          onPress={() => router.push('/orders/new')}
        />
      </View>

      {/* Change Status Modal BottomSheet */}
      {statusPickerOrder && (
        <BottomSheet
          visible={Boolean(statusPickerOrder)}
          title="Cambiar Estado de la Orden"
          subtitle={`ORD-${statusPickerOrder.id.slice(0, 8).toUpperCase()}`}
          onClose={() => setStatusPickerOrder(null)}
        >
          <ScrollView style={styles.statusOptionsList}>
            {(Object.keys(ORDER_STATUS) as RepairOrderStatus[]).map((st) => {
              const info = ORDER_STATUS[st];
              const isCurrent = statusPickerOrder.status === st;
              const isBackward =
                st !== 'CANCELLED' &&
                statusPickerOrder.status !== 'CANCELLED' &&
                STATUS_RANK[st] < STATUS_RANK[statusPickerOrder.status];
              const disabled = isBackward && !isAdmin;

              return (
                <Pressable
                  key={st}
                  disabled={disabled}
                  style={[
                    styles.statusOptionRow,
                    isCurrent && styles.statusOptionRowCurrent,
                    disabled && styles.statusOptionRowDisabled,
                  ]}
                  onPress={() => {
                    if (disabled) return;
                    handleStatusUpdate(statusPickerOrder.id, st);
                  }}
                  android_ripple={disabled ? undefined : { color: 'rgba(0, 82, 255, 0.12)' }}
                >
                  <View style={[styles.statusOptionIcon, { backgroundColor: info.soft }]}>
                    <MaterialCommunityIcons name={(info.icon || 'tag') as any} size={20} color={info.color} />
                  </View>
                  <Text style={[styles.statusOptionText, isCurrent && styles.statusOptionTextCurrent]}>
                    {info.label}
                  </Text>
                  {isCurrent && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </BottomSheet>
      )}

      {/* Receipt Preview */}
      {receiptOrder && (
        <ReceiptPreview
          order={receiptOrder}
          visible={Boolean(receiptOrder)}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* QR Scanner */}
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

      {/* Toast Feedback */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </SafeAreaView>
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
  topHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  screenTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersScrollWrapper: {
    marginVertical: spacing.xs,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(195, 199, 208, 0.5)',
    gap: 6,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIcon: {
    marginRight: 2,
  },
  chipText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  countBadgeUnselected: {
    backgroundColor: colors.surfaceContainer,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  countTextSelected: {
    color: colors.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 110,
  },
  fabWrapper: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 99,
  },
  statusOptionsList: {
    maxHeight: 380,
  },
  statusOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  statusOptionRowCurrent: {
    backgroundColor: colors.primarySoft,
  },
  statusOptionRowDisabled: {
    opacity: 0.4,
  },
  statusOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    flex: 1,
  },
  statusOptionTextCurrent: {
    color: colors.primary,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radii.md,
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

export default OrdersScreen;
