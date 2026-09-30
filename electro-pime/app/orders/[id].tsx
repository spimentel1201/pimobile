import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../services/api';
import { RepairOrder, RepairOrderStatus } from '../types/api';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors, radii, shadow, spacing, typography, ORDER_STATUS } from '../theme';
import StatusBadge from '../components/ui/StatusBadge';
import Toast from '../components/ui/Toast';
import { printOrderReceipt } from '../utils/orderReceipt';

const statusIcons: Record<RepairOrderStatus, keyof typeof MaterialCommunityIcons.glyphMap> = {
  RECEIVED: 'clock-outline',
  DIAGNOSED: 'clipboard-text-search-outline',
  IN_PROGRESS: 'wrench-outline',
  WAITING_FOR_PARTS: 'package-variant-closed',
  COMPLETED: 'check-circle-outline',
  DELIVERED: 'package-variant',
  CANCELLED: 'close-circle-outline',
};

const deviceIcon = (deviceType: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const t = (deviceType || '').toLowerCase();
  if (t.includes('tv') || t.includes('televisor') || t.includes('television')) return 'television';
  if (t.includes('lavadora')) return 'washing-machine';
  if (t.includes('refri') || t.includes('nevera')) return 'fridge';
  if (t.includes('micro')) return 'microwave';
  if (t.includes('laptop') || t.includes('comput')) return 'laptop';
  if (t.includes('celular') || t.includes('fono') || t.includes('movil')) return 'cellphone';
  if (t.includes('audio') || t.includes('bocina')) return 'speaker';
  return 'devices';
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

type PillTone = { label: string; color: string; soft: string };

function Pill({ label, color, soft }: PillTone) {
  return (
    <View style={[styles.pill, { backgroundColor: soft }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function SectionCard({
  icon,
  title,
  pill,
  headerRight,
  onHeaderPress,
  children,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  pill?: PillTone;
  headerRight?: React.ReactNode;
  onHeaderPress?: () => void;
  children: React.ReactNode;
}) {
  const header = (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
        <Text style={styles.sectionLabel}>{title}</Text>
      </View>
      {headerRight ?? (pill ? <Pill {...pill} /> : null)}
    </View>
  );
  return (
    <View style={styles.sectionCard}>
      {onHeaderPress ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onHeaderPress}>
          {header}
        </TouchableOpacity>
      ) : (
        header
      )}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Callout({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'danger' | 'success';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  const palette =
    tone === 'danger'
      ? { color: colors.danger, soft: colors.dangerSoft }
      : { color: colors.success, soft: colors.successSoft };
  return (
    <View style={[styles.callout, { backgroundColor: palette.soft }]}>
      <View style={styles.calloutHeader}>
        <MaterialCommunityIcons name={icon} size={18} color={palette.color} />
        <Text style={[styles.calloutTitle, { color: palette.color }]}>{title}</Text>
      </View>
      <Text style={styles.calloutText}>{children}</Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusActions, setShowStatusActions] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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
    } catch (err) {
      console.error('Error loading order:', err);
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la orden');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleStatusUpdate = async (newStatus: RepairOrderStatus) => {
    if (!order) return;

    try {
      setUpdating(true);
      const updatedOrder = await api.updateRepairOrderStatus(order.id, newStatus);
      setOrder(updatedOrder);
      setShowStatusActions(false);
      showToast(`Estado actualizado a: ${ORDER_STATUS[newStatus].label}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('No se pudo actualizar el estado de la orden', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = async () => {
    if (!order) return;
    try {
      await printOrderReceipt(order);
    } catch (err) {
      console.error('Error printing receipt:', err);
      showToast('No se pudo generar el ticket', 'error');
    }
  };

  const handleShare = async () => {
    if (!order) return;
    const first = order.items?.[0];
    const lines = [
      `Orden #${order.id.slice(0, 8)} · ${ORDER_STATUS[order.status].label}`,
      `Cliente: ${order.customer?.name || order.customerName || 'Cliente General'}`,
      first ? `Equipo: ${first.brand} ${first.model} (${first.deviceType})` : '',
      `Total: ${order.totalCost != null ? `S/ ${order.totalCost.toFixed(2)}` : 'Por definir'}`,
      `Creada: ${format(new Date(order.createdAt), "d 'de' MMMM, yyyy HH:mm", { locale: es })}`,
    ].filter(Boolean);
    const text = lines.join('\n');

    try {
      if (Platform.OS === 'web') {
        const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
        if (typeof nav.share === 'function') {
          await nav.share({ title: `Orden #${order.id.slice(0, 8)}`, text });
          return;
        }
        if (nav.clipboard) {
          await nav.clipboard.writeText(text);
          showToast('Resumen copiado al portapapeles');
          return;
        }
        showToast('No se pudo compartir en este navegador', 'error');
        return;
      }
      await Share.share({ message: text });
    } catch (err) {
      console.error('Error sharing order:', err);
      showToast('No se pudo compartir la orden', 'error');
    }
  };

  const renderStatusAction = (status: RepairOrderStatus, label: string) => {
    if (order?.status === status) return null;
    const info = ORDER_STATUS[status];
    return (
      <TouchableOpacity
        key={status}
        style={[styles.statusAction, { borderColor: info.color }]}
        onPress={() => handleStatusUpdate(status)}
        disabled={updating}
        activeOpacity={0.7}
      >
        <Text style={[styles.statusActionText, { color: info.color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrder}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const status = ORDER_STATUS[order.status];
  const items = order.items || [];
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const firstItem = items[0];
  const fallaText = firstItem?.problemDescription || order.description || 'Sin falla registrada.';
  const customerName = order.customer?.name || order.customerName || 'Cliente General';
  const customerPhone = order.customer?.phone;
  const technicianName = order.technician
    ? `${order.technician.firstName} ${order.technician.lastName}`.trim()
    : order.technicianName;
  const customerCode = `CL-${(order.customer?.id || order.customerId || '------').slice(0, 4).toUpperCase()}`;

  const openPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => showToast('No se pudo abrir el teléfono', 'error'));
  };
  const openWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${digits}`).catch(() =>
      showToast('No se pudo abrir WhatsApp', 'error')
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Stack.Screen
        options={{
          title: `Orden #${order.id.slice(0, 8)}`,
          headerShown: true,
        }}
      />

      {/* Hero: orden + estado */}
      <View style={styles.hero}>
        <View style={styles.heroInfo}>
          <Text style={styles.heroLabel}>ORDEN DE SERVICIO</Text>
          <Text style={styles.heroId}>#{order.id.slice(0, 8)}</Text>
        </View>
        <StatusBadge label={status.label} color={status.color} soft={status.soft} />
      </View>

      {/* Dispositivo en servicio */}
      <SectionCard
        icon="clipboard-text"
        title="DISPOSITIVO EN SERVICIO"
        pill={{
          label: `${totalUnits} ${totalUnits === 1 ? 'Unidad' : 'Unidades'}`,
          color: colors.primary,
          soft: colors.primarySoft,
        }}
      >
        {items.length === 0 ? (
          <Text style={styles.emptyText}>Sin equipos registrados</Text>
        ) : (
          items.map((item, index) => (
            <View
              key={item.id || index}
              style={[styles.deviceRow, index > 0 && styles.deviceRowBorder]}
            >
              <View style={styles.deviceIcon}>
                <MaterialCommunityIcons
                  name={deviceIcon(item.deviceType)}
                  size={24}
                  color={colors.white}
                />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName} numberOfLines={1}>
                  {item.brand} {item.model}
                </Text>
                {item.serialNumber ? (
                  <Text style={styles.deviceMeta}>
                    S/N: <Text style={styles.deviceMetaUpper}>{item.serialNumber}</Text>
                  </Text>
                ) : (
                  <Text style={styles.deviceMeta}>Sin número de serie</Text>
                )}
                {item.accessories && item.accessories.length > 0 && (
                  <View style={styles.accessoryRow}>
                    {item.accessories.map((acc, accIndex) => (
                      <View key={accIndex} style={styles.accessoryChip}>
                        <Text style={styles.accessoryText}>{acc}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Pill
                label={item.deviceType || 'Equipo'}
                color={colors.primary}
                soft={colors.primarySoft}
              />
            </View>
          ))
        )}
      </SectionCard>

      {/* Falla inicial */}
      <Callout tone="danger" icon="alert-circle" title="Falla inicial reportada">
        {fallaText}
      </Callout>

      {/* Diagnóstico & solución */}
      <Callout tone="success" icon="stethoscope" title="Diagnóstico & Solución técnica">
        {order.notes || 'Pendiente de diagnóstico y solución técnica.'}
      </Callout>

      {/* Propietario / Cliente */}
      <SectionCard
        icon="account-outline"
        title="PROPIETARIO / CLIENTE"
        pill={{
          label: customerCode,
          color: colors.violet,
          soft: colors.violetSoft,
        }}
      >
        <View style={styles.personRow}>
          <View style={[styles.avatar, styles.avatarDark]}>
            <Text style={styles.avatarTextLight}>{getInitials(customerName)}</Text>
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.personName} numberOfLines={1}>
              {customerName}
            </Text>
            <View style={styles.personMetaRow}>
              <Text style={styles.personMeta} numberOfLines={1}>
                {order.customer ? 'Cliente registrado' : 'Cliente particular'}
                {customerPhone ? ` · ${customerPhone}` : ''}
              </Text>
              {order.customer && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={colors.success}
                  style={styles.verifiedIcon}
                />
              )}
            </View>
          </View>
          {customerPhone && (
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => openPhone(customerPhone)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MaterialCommunityIcons name="phone" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.whatsappButton]}
                onPress={() => openWhatsApp(customerPhone)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MaterialCommunityIcons name="whatsapp" size={18} color={colors.success} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SectionCard>

      {/* Técnico certificado */}
      <SectionCard
        icon="certificate-outline"
        title="TÉCNICO CERTIFICADO"
        pill={
          technicianName
            ? {
                label: order.technician?.role === 'ADMIN' ? 'Administrador' : 'Técnico Certificado',
                color: colors.success,
                soft: colors.successSoft,
              }
            : { label: 'Sin asignar', color: colors.danger, soft: colors.dangerSoft }
        }
      >
        {technicianName ? (
          <View style={styles.personRow}>
            <View style={[styles.avatar, styles.avatarSoft]}>
              <Text style={styles.avatarTextPrimary}>{getInitials(technicianName)}</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName} numberOfLines={1}>
                {technicianName}
              </Text>
              <Text style={styles.personMeta} numberOfLines={1}>
                {order.technician?.email || 'Especialista en reparación'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Sin técnico asignado a esta orden</Text>
        )}
      </SectionCard>

      {/* Descripción */}
      <SectionCard icon="format-text" title="DESCRIPCIÓN">
        <Text style={styles.bodyText}>{order.description || 'No especificado'}</Text>
      </SectionCard>

      {/* Costos */}
      <SectionCard icon="cash-multiple" title="COSTOS">
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Revisión inicial</Text>
          <Text style={styles.costValue}>
            {order.initialReviewCost != null ? `S/ ${order.initialReviewCost.toFixed(2)}` : '—'}
          </Text>
        </View>
        <View style={styles.costDivider} />
        <View style={styles.costRow}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalCaption}>Incluye IGV</Text>
          </View>
          <Text style={styles.totalValue}>
            {order.totalCost != null ? `S/ ${order.totalCost.toFixed(2)}` : '—'}
          </Text>
        </View>
      </SectionCard>

      {/* Fechas */}
      <SectionCard icon="calendar-clock" title="FECHAS">
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-outline" size={16} color={colors.textMuted} />
          <Text style={styles.dateLabel}>Creada</Text>
          <Text style={styles.dateValue}>
            {format(new Date(order.createdAt), 'd/M/yyyy')}
          </Text>
        </View>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textMuted} />
          <Text style={styles.dateLabel}>Actualizada</Text>
          <Text style={styles.dateValue}>
            {format(new Date(order.updatedAt), 'd/M/yyyy')}
          </Text>
        </View>
      </SectionCard>

      {/* Acciones de estado */}
      <SectionCard
        icon="swap-horizontal"
        title="ACTUALIZAR ESTADO"
        headerRight={
          <MaterialCommunityIcons
            name={showStatusActions ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textSecondary}
          />
        }
        onHeaderPress={() => setShowStatusActions(!showStatusActions)}
      >
        {showStatusActions ? (
          <View style={styles.statusActions}>
            {renderStatusAction('RECEIVED', 'Marcar como Recibido')}
            {renderStatusAction('DIAGNOSED', 'Marcar como Diagnosticado')}
            {renderStatusAction('IN_PROGRESS', 'Comenzar Reparación')}
            {renderStatusAction('WAITING_FOR_PARTS', 'Esperando Repuestos')}
            {renderStatusAction('COMPLETED', 'Marcar como Completado')}
            {renderStatusAction('DELIVERED', 'Marcar como Entregado')}
            {renderStatusAction('CANCELLED', 'Cancelar Orden')}
          </View>
        ) : (
          <Text style={styles.emptyText}>Estado actual: {status.label}</Text>
        )}
      </SectionCard>

      {/* Acciones principales */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push(`/orders/${order.id}/edit` as never)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="edit" size={18} color={colors.white} />
        <Text style={styles.primaryButtonText}>Editar</Text>
      </TouchableOpacity>

      <View style={styles.secondaryRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handlePrint} activeOpacity={0.85}>
          <MaterialCommunityIcons name="printer" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Imprimir Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare} activeOpacity={0.85}>
          <MaterialCommunityIcons name="share-variant" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Compartir</Text>
        </TouchableOpacity>
      </View>

      </ScrollView>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.canvas,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow,
  },
  heroInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  heroLabel: {
    ...typography.micro,
    color: colors.textMuted,
  },
  heroId: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  sectionLabel: {
    ...typography.micro,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  sectionBody: {
    padding: spacing.lg,
  },
  pill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deviceRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.input,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  deviceMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deviceMetaUpper: {
    textTransform: 'uppercase',
  },
  accessoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  accessoryChip: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  accessoryText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  callout: {
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  calloutText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarDark: {
    backgroundColor: colors.textPrimary,
  },
  avatarSoft: {
    backgroundColor: colors.primarySoft,
  },
  avatarTextLight: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  avatarTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  personMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  personMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
  },
  bodyText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  costValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  costDivider: {
    height: 1,
    backgroundColor: colors.border,
    borderStyle: 'dashed',
    marginVertical: spacing.md,
  },
  totalLabel: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  totalCaption: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.success,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dateLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  dateValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  statusActions: {
    gap: spacing.sm,
  },
  statusAction: {
    padding: spacing.sm + 2,
    borderRadius: radii.button,
    borderWidth: 1,
  },
  statusActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 14,
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.button,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.button,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});
