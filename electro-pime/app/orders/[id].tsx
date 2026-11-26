// ponytail: M3 Order Detail Screen with Hero Header, Progress Timeline and Collapsible Sections
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../services/api';
import { RepairOrder, RepairOrderStatus, Quote, QuoteStatus, PaymentMethod } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import {
  colors,
  radii,
  spacing,
  typography,
  tonalElevation,
  ORDER_STATUS,
  quoteStatusStyle,
  PAYMENT_METHOD,
  getDeviceIcon,
} from '../theme';
import StatusBadge from '../components/ui/StatusBadge';
import Card from '../components/ui/Card';
import BottomSheet from '../components/ui/BottomSheet';
import Toast from '../components/ui/Toast';
import M3TextField from '../components/ui/M3TextField';
import ReceiptPreview from '../components/ReceiptPreview';
import { NO_PHONE_MESSAGE, buildTelUrl, buildWhatsAppUrl } from '../utils/phone';
import { buildQrPayload, printQrLabel } from '../utils/qr';
import QRCode from 'react-native-qrcode-svg';

const BILLABLE_QUOTE_STATUSES: QuoteStatus[] = ['APPROVED', 'PAID', 'INVOICED'];

const TIMELINE_STEPS: RepairOrderStatus[] = [
  'RECEIVED',
  'DIAGNOSED',
  'IN_PROGRESS',
  'WAITING_FOR_PARTS',
  'COMPLETED',
  'DELIVERED',
];

const STATUS_RANK: Record<RepairOrderStatus, number> = {
  RECEIVED: 0,
  DIAGNOSED: 1,
  IN_PROGRESS: 2,
  WAITING_FOR_PARTS: 3,
  COMPLETED: 4,
  DELIVERED: 5,
  CANCELLED: -1,
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const isAdmin = user?.role === 'ADMIN';
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [reviewPayVisible, setReviewPayVisible] = useState(false);
  const [reviewPayMethod, setReviewPayMethod] = useState<PaymentMethod>('YAPE');
  const [reviewPayCode, setReviewPayCode] = useState('');
  const [reviewPaySaving, setReviewPaySaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<RepairOrder | null>(null);
  const [orderQuotes, setOrderQuotes] = useState<Quote[]>([]);
  const [lastPaymentAt, setLastPaymentAt] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const orderData = await api.getRepairOrderById(id);
      setOrder(orderData);

      if (orderData.billing && orderData.billing.salesCount > 0) {
        try {
          const sales = await api.getSalesByRepairOrder(id);
          if (sales.length > 0) {
            const latest = sales.reduce((a, b) =>
              new Date(a.createdAt) > new Date(b.createdAt) ? a : b
            );
            setLastPaymentAt(latest.createdAt);
          }
        } catch {
          setLastPaymentAt(null);
        }
      }

      try {
        const quotes = await api.getQuotesByRepairOrder(id);
        setOrderQuotes(quotes);
      } catch (quoteErr) {
        console.error('Error loading order quotes:', quoteErr);
        setOrderQuotes([]);
      }
    } catch (err: any) {
      console.error('Error loading order:', err);
      setLoadError(err.message || 'No se pudo cargar la orden');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStatusUpdate = async (newStatus: RepairOrderStatus) => {
    if (!order) return;
    // Solo ADMIN puede retroceder el estado de una orden.
    if (!isAdmin && STATUS_RANK[newStatus] < STATUS_RANK[order.status]) {
      showToast('Solo un administrador puede retroceder el estado', 'error');
      return;
    }
    try {
      setUpdating(true);
      const updatedOrder = await api.updateRepairOrderStatus(order.id, newStatus);
      setOrder(updatedOrder);
      setShowStatusSheet(false);
      showToast(`Estado actualizado a: ${ORDER_STATUS[newStatus].label}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('No se pudo actualizar el estado', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handlePayReview = async () => {
    if (!order) return;
    try {
      setReviewPaySaving(true);
      const updated = await api.updateRepairOrder(order.id, {
        reviewPaid: true,
        reviewPaymentMethod: reviewPayMethod,
        reviewPaymentCode: reviewPayCode.trim() || undefined,
        reviewPaidAt: new Date().toISOString(),
      });
      setOrder(updated);
      setReviewPayVisible(false);
      showToast('Revisión inicial marcada como pagada');
    } catch (err: any) {
      console.error('Error paying review:', err);
      showToast(err.message || 'No se pudo registrar el pago', 'error');
    } finally {
      setReviewPaySaving(false);
    }
  };

  const handleShare = async () => {
    if (!order) return;
    const first = order.items?.[0];
    const text = [
      `Orden #${order.id.slice(0, 8).toUpperCase()} · ${ORDER_STATUS[order.status].label}`,
      `Cliente: ${order.customer?.name || order.customerName || 'Cliente General'}`,
      first ? `Equipo: ${first.brand} ${first.model} (${first.deviceType})` : '',
      `Total: ${order.totalCost != null ? `S/ ${order.totalCost.toFixed(2)}` : 'Por definir'}`,
      `Fecha: ${format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({ message: text });
    } catch {
      showToast('No se pudo compartir la orden', 'error');
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadError || !order) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{loadError || 'Orden no encontrada'}</Text>
        <Pressable style={styles.retryBtn} onPress={loadOrder}>
          <Text style={styles.retryBtnText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.RECEIVED;
  const paidQuote = orderQuotes.find((q) => q.status === 'PAID');
  const items = order.items || [];
  const firstItem = items[0];
  const customerName = order.customer?.name || order.customerName || 'Cliente General';
  const customerPhone = order.customer?.phone;
  const cost = order.totalCost ?? order.initialReviewCost;
  const currentIndex = TIMELINE_STEPS.indexOf(order.status);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
          headerShown: true,
          headerRight: () => (
            <View style={styles.headerRightActions}>
              <Pressable
                onPress={() => setReceiptOrder(order)}
                style={styles.headerActionBtn}
                hitSlop={8}
                android_ripple={{ color: colors.ripple, borderless: true, radius: 20 }}
              >
                <MaterialCommunityIcons name="printer" size={22} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={handleShare}
                style={styles.headerActionBtn}
                hitSlop={8}
                android_ripple={{ color: colors.ripple, borderless: true, radius: 20 }}
              >
                <MaterialCommunityIcons name="share-variant" size={22} color={colors.primary} />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Header Card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIconCircle, { backgroundColor: status.soft }]}>
              <MaterialCommunityIcons
                name={getDeviceIcon(firstItem?.deviceType) as any}
                size={28}
                color={status.color}
              />
            </View>
            <View style={styles.heroTitles}>
              <Text style={styles.heroCode}>ORD-{order.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.heroCustomer} numberOfLines={1}>
                {customerName}
              </Text>
            </View>
            <StatusBadge
              label={status.label}
              color={status.color}
              soft={status.soft}
              icon={status.icon}
            />
          </View>

          {/* Progress Timeline (vertical, todos los pasos visibles) */}
          <Text style={styles.timelineLabel}>Flujo de Reparación:</Text>
          <View style={styles.timelineVertical}>
            {TIMELINE_STEPS.map((st, idx) => {
              const stepInfo = ORDER_STATUS[st];
              const isPast = currentIndex > idx;
              const isCurrent = currentIndex === idx;
              const isLast = idx === TIMELINE_STEPS.length - 1;
              const canTap =
                !updating &&
                (isAdmin || STATUS_RANK[st] >= STATUS_RANK[order.status]);

              return (
                <View key={st} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <Pressable
                      style={[
                        styles.timelineCircle,
                        isPast && styles.timelineCirclePast,
                        isCurrent && [styles.timelineCircleCurrent, { backgroundColor: stepInfo.color }],
                      ]}
                      onPress={() => canTap && handleStatusUpdate(st)}
                      disabled={!canTap}
                      android_ripple={{ color: colors.ripple, borderless: true, radius: 18 }}
                    >
                      {isPast ? (
                        <MaterialCommunityIcons name="check" size={14} color={colors.onPrimary} />
                      ) : (
                        <MaterialCommunityIcons
                          name={(stepInfo.icon || 'circle') as any}
                          size={14}
                          color={isCurrent ? colors.onPrimary : colors.textMuted}
                        />
                      )}
                    </Pressable>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineConnectorV,
                          (isPast || isCurrent) && styles.timelineConnectorPast,
                        ]}
                      />
                    )}
                  </View>
                  <Pressable
                    style={styles.timelineRowBody}
                    onPress={() => canTap && handleStatusUpdate(st)}
                    disabled={!canTap}
                    android_ripple={{ color: colors.ripple }}
                  >
                    <Text
                      style={[
                        styles.timelineItemText,
                        isCurrent && [styles.timelineItemTextCurrent, { color: stepInfo.color }],
                        !canTap && styles.timelineItemTextDisabled,
                      ]}
                    >
                      {stepInfo.label}
                    </Text>
                    {isCurrent && (
                      <Text style={[styles.timelineCurrentHint, { color: stepInfo.color }]}>
                        Estado actual
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Lock notice if paid */}
        {paidQuote && (
          <View style={styles.noticeBanner}>
            <MaterialCommunityIcons name="shield-check" size={20} color={colors.success} />
            <Text style={styles.noticeText}>
              Presupuesto Pagado (S/ {paidQuote.totalAmount.toFixed(2)}): Equipos y costo congelados.
            </Text>
          </View>
        )}

        {/* Cliente */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="account-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Cliente Titular</Text>
            </View>
          </View>

          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {customerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerNameTitle}>{customerName}</Text>
              <Text style={styles.customerPhoneText}>
                {customerPhone || 'Sin teléfono registrado'}
              </Text>
            </View>

            {customerPhone && (
              <View style={styles.customerActions}>
                <Pressable
                  style={styles.contactBtn}
                  onPress={() => {
                    const u = buildTelUrl(customerPhone);
                    if (u) Linking.openURL(u);
                  }}
                  android_ripple={{ color: colors.ripple, borderless: true, radius: 20 }}
                >
                  <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
                </Pressable>
                <Pressable
                  style={[styles.contactBtn, styles.whatsappBtn]}
                  onPress={() => {
                    const u = buildWhatsAppUrl(customerPhone, `Hola ${customerName}, te escribimos de Electro-Pime.`);
                    if (u) Linking.openURL(u);
                  }}
                  android_ripple={{ color: 'rgba(0, 109, 68, 0.15)', borderless: true, radius: 20 }}
                >
                  <MaterialCommunityIcons name="whatsapp" size={20} color={colors.success} />
                </Pressable>
              </View>
            )}
          </View>
        </Card>

        {/* Equipos */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="tools" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Equipos en Reparación ({items.length})</Text>
          </View>

          {items.map((it, idx) => (
            <View key={idx} style={[styles.deviceItem, idx > 0 && styles.deviceDivider]}>
              <View style={styles.deviceItemHeader}>
                <MaterialCommunityIcons
                  name={getDeviceIcon(it.deviceType) as any}
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.deviceItemTextCol}>
                  <Text style={styles.deviceBrandModel}>
                    {it.brand} {it.model}
                  </Text>
                  <Text style={styles.deviceCategory}>{it.deviceType}</Text>
                </View>
              </View>

              {it.serialNumber ? (
                <Text style={styles.deviceSerial}>S/N: {it.serialNumber}</Text>
              ) : null}

              <Text style={styles.problemLabel}>Falla reportada:</Text>
              <Text style={styles.problemDesc}>{it.problemDescription || 'Sin detalle de falla'}</Text>

              {it.accessories && it.accessories.length > 0 && (
                <View style={styles.accessoriesWrapper}>
                  <Text style={styles.problemLabel}>Accesorios dejados:</Text>
                  <View style={styles.accessoriesChipsRow}>
                    {it.accessories.map((acc, aIdx) => (
                      <View key={aIdx} style={styles.accChip}>
                        <Text style={styles.accChipText}>{acc}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </Card>

        {/* Costos y Revisión */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Costos y Facturación</Text>
          </View>

          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Revisión inicial:</Text>
            <Text style={styles.costValue}>
              {order.initialReviewCost != null ? `S/ ${order.initialReviewCost.toFixed(2)}` : 'S/ 0.00'}
            </Text>
          </View>

          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Estado de revisión:</Text>
            {order.reviewPaid ? (
              <View style={styles.paidBadge}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                <Text style={styles.paidBadgeText}>
                  Pagado ({order.reviewPaymentMethod || 'Efectivo'})
                </Text>
              </View>
            ) : (
              <Pressable
                style={styles.payReviewBtn}
                onPress={() => setReviewPayVisible(true)}
              >
                <Text style={styles.payReviewBtnText}>Marcar Pagado</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.costDivider} />

          <View style={styles.costRow}>
            <Text style={styles.totalLabel}>Monto Total de Orden:</Text>
            <Text style={styles.totalValue}>
              {cost != null ? `S/ ${cost.toFixed(2)}` : 'Por determinar'}
            </Text>
          </View>
        </Card>

        {/* Presupuestos vinculados */}
        {orderQuotes.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Presupuestos Emitidos ({orderQuotes.length})</Text>
            </View>

            {orderQuotes.map((q) => {
              const qStyle = quoteStatusStyle(q.status);
              return (
                <Pressable
                  key={q.id}
                  style={styles.quoteItemRow}
                  onPress={() => router.push('/budgets' as never)}
                  android_ripple={{ color: colors.ripple }}
                >
                  <View style={styles.quoteInfo}>
                    <Text style={styles.quoteCode}>COT-{q.id.slice(0, 6).toUpperCase()}</Text>
                    <StatusBadge
                      label={qStyle.label}
                      color={qStyle.color}
                      soft={qStyle.soft}
                      icon={qStyle.icon}
                      compact
                    />
                    <Text style={styles.quoteMeta}>
                      {new Date(q.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {q.items?.length ? ` · ${q.items.length} ítem${q.items.length > 1 ? 's' : ''}` : ''}
                    </Text>
                  </View>
                  <View style={styles.quoteRight}>
                    <Text style={styles.quoteAmount}>S/ {q.totalAmount.toFixed(2)}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
                  </View>
                </Pressable>
              );
            })}
          </Card>
        )}

        {/* Acción: crear presupuesto para esta orden */}
        <Pressable
          style={styles.createQuoteBtn}
          onPress={() => router.push(`/budgets?repairOrderId=${order.id}` as never)}
          android_ripple={{ color: colors.ripple }}
        >
          <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.onPrimary} />
          <Text style={styles.createQuoteBtnText}>Crear presupuesto para esta orden</Text>
        </Pressable>

        {/* Etiqueta QR del taller */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="qrcode" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Etiqueta de Trazabilidad QR</Text>
          </View>

          <View style={styles.qrContainer}>
            <QRCode
              value={buildQrPayload(firstItem?.serialNumber || null, order.id)}
              size={130}
              backgroundColor={colors.surface}
              color={colors.textPrimary}
            />
            <Pressable
              style={styles.printQrBtn}
              onPress={async () => {
                try {
                  await printQrLabel({
                    payload: buildQrPayload(firstItem?.serialNumber || null, order.id),
                    title: 'Electro-Pime Taller',
                    subtitle: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
                    serial: firstItem?.serialNumber || null,
                    customer: customerName,
                    device: firstItem ? `${firstItem.brand} ${firstItem.model}` : null,
                  });
                } catch {
                  showToast('No se pudo imprimir la etiqueta QR', 'error');
                }
              }}
              android_ripple={{ color: colors.rippleOnPrimary }}
            >
              <MaterialCommunityIcons name="printer" size={18} color={colors.onPrimary} />
              <Text style={styles.printQrBtnText}>Imprimir Etiqueta</Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>

      {/* Floating Bottom Actions Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.bottomActionSecondary}
          onPress={() => router.push(`/orders/${order.id}/edit` as any)}
          android_ripple={{ color: colors.ripple }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
          <Text style={styles.bottomSecondaryText}>Editar</Text>
        </Pressable>

        <Pressable
          style={styles.bottomActionPrimary}
          onPress={() => setShowStatusSheet(true)}
          android_ripple={{ color: colors.rippleOnPrimary }}
        >
          <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.onPrimary} />
          <Text style={styles.bottomPrimaryText}>Cambiar Estado</Text>
        </Pressable>
      </View>

      {/* Status Picker BottomSheet */}
      {showStatusSheet && (
        <BottomSheet
          visible={showStatusSheet}
          title="Actualizar Estado de la Orden"
          onClose={() => setShowStatusSheet(false)}
        >
          <ScrollView style={styles.statusSheetScroll}>
            {(Object.keys(ORDER_STATUS) as RepairOrderStatus[]).map((st) => {
              const info = ORDER_STATUS[st];
              const isSelected = order.status === st;

              return (
                <Pressable
                  key={st}
                  style={[styles.statusSheetRow, isSelected && styles.statusSheetRowActive]}
                  onPress={() => handleStatusUpdate(st)}
                  android_ripple={{ color: colors.ripple }}
                >
                  <View style={[styles.statusSheetIcon, { backgroundColor: info.soft }]}>
                    <MaterialCommunityIcons name={(info.icon || 'tag') as any} size={20} color={info.color} />
                  </View>
                  <Text style={[styles.statusSheetText, isSelected && styles.statusSheetTextActive]}>
                    {info.label}
                  </Text>
                  {isSelected && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </BottomSheet>
      )}

      {/* Pay Review BottomSheet */}
      {reviewPayVisible && (
        <BottomSheet
          visible={reviewPayVisible}
          title="Registrar Pago de Revisión"
          onClose={() => setReviewPayVisible(false)}
          footer={
            <Pressable
              style={styles.savePaymentBtn}
              onPress={handlePayReview}
              disabled={reviewPaySaving}
              android_ripple={{ color: colors.rippleOnPrimary }}
            >
              {reviewPaySaving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.savePaymentText}>Confirmar Pago</Text>
              )}
            </Pressable>
          }
        >
          <View style={styles.paySheetBody}>
            <Text style={styles.paySheetLabel}>Selecciona Medio de Pago:</Text>
            <View style={styles.payMethodsRow}>
              {(['YAPE', 'PLIN', 'CASH', 'CREDIT_CARD'] as PaymentMethod[]).map((pm) => {
                const isSelected = reviewPayMethod === pm;
                const info = PAYMENT_METHOD[pm];
                return (
                  <Pressable
                    key={pm}
                    style={[styles.payMethodChip, isSelected && styles.payMethodChipSelected]}
                    onPress={() => setReviewPayMethod(pm)}
                  >
                    <MaterialCommunityIcons
                      name={(info.icon || 'cash') as any}
                      size={18}
                      color={isSelected ? colors.onPrimary : colors.textPrimary}
                    />
                    <Text style={[styles.payMethodText, isSelected && styles.payMethodTextSelected]}>
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {reviewPayMethod === 'YAPE' && (
              <M3TextField
                label="Código de Aprobación Yape (opcional)"
                placeholder="Ej: 891230"
                value={reviewPayCode}
                onChangeText={setReviewPayCode}
                leadingIcon="numeric"
              />
            )}
          </View>
        </BottomSheet>
      )}

      {/* Ticket Preview Modal */}
      {receiptOrder && (
        <ReceiptPreview
          order={receiptOrder}
          visible={Boolean(receiptOrder)}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
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
    padding: spacing.xl,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.full,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: spacing.md,
  },
  heroCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitles: {
    flex: 1,
  },
  heroCode: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  heroCustomer: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  timelineLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  timelineScroll: {
    paddingVertical: spacing.xs,
  },
  timelineContent: {
    alignItems: 'center',
  },
  timelineItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 72,
  },
  timelineCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineCirclePast: {
    backgroundColor: colors.success,
  },
  timelineCircleCurrent: {
    elevation: 2,
  },
  timelineItemText: {
    ...typography.labelSmall,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  timelineItemTextCurrent: {
    fontWeight: '700',
  },
  timelineConnector: {
    width: 24,
    height: 2,
    backgroundColor: colors.border,
    marginTop: -22,
    marginRight: spacing.xs,
    borderRadius: 1,
  },
  timelineConnectorPast: {
    backgroundColor: colors.success,
  },
  timelineVertical: {
    paddingVertical: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 44,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  timelineConnectorV: {
    width: 2,
    flex: 1,
    minHeight: 16,
    backgroundColor: colors.border,
    marginTop: 2,
    borderRadius: 1,
  },
  timelineRowBody: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  timelineCurrentHint: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  timelineItemTextDisabled: {
    opacity: 0.45,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  noticeText: {
    ...typography.bodySmall,
    color: colors.success,
    flex: 1,
    fontWeight: '600',
  },
  sectionCard: {
    padding: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  customerInfo: {
    flex: 1,
  },
  customerNameTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  customerPhoneText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappBtn: {
    backgroundColor: colors.successSoft,
  },
  deviceItem: {
    paddingVertical: spacing.sm,
  },
  deviceDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  deviceItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  deviceItemTextCol: {
    flex: 1,
  },
  deviceBrandModel: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  deviceCategory: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  deviceSerial: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  problemLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  problemDesc: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: 2,
  },
  accessoriesWrapper: {
    marginTop: spacing.xs,
  },
  accessoriesChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  accChip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  accChipText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  costLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  costValue: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  costDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.headlineSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  paidBadgeText: {
    ...typography.labelSmall,
    color: colors.success,
    fontWeight: '600',
  },
  payReviewBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  payReviewBtnText: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  quoteItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  quoteInfo: {
    gap: 4,
  },
  quoteCode: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  quoteAmount: {
    ...typography.titleSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  quoteMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  quoteRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  createQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.button,
    marginBottom: spacing.lg,
  },
  createQuoteBtnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  printQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  printQrBtnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
  },
  bottomActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    minHeight: 48,
  },
  bottomSecondaryText: {
    ...typography.labelLarge,
    color: colors.primary,
    fontWeight: '700',
  },
  bottomActionPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minHeight: 48,
  },
  bottomPrimaryText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  statusSheetScroll: {
    maxHeight: 360,
  },
  statusSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  statusSheetRowActive: {
    backgroundColor: colors.primarySoft,
  },
  statusSheetIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSheetText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    flex: 1,
  },
  statusSheetTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  paySheetBody: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  paySheetLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  payMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  payMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  payMethodChipSelected: {
    backgroundColor: colors.primary,
  },
  payMethodText: {
    ...typography.labelSmall,
    color: colors.textPrimary,
  },
  payMethodTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  savePaymentBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savePaymentText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  retryBtnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '600',
  },
});
