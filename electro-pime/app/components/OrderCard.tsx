// ponytail: M3 OrderCard component with appliance icon, status chip and 48dp action buttons
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RepairOrder } from '../types/api';
import {
  colors,
  radii,
  spacing,
  typography,
  ORDER_STATUS,
  getDeviceIcon,
} from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import StatusBadge from './ui/StatusBadge';
import Card from './ui/Card';

interface OrderCardProps {
  order: RepairOrder;
  onCall?: (phone: string) => void;
  onWhatsApp?: (phone: string, name?: string) => void;
  onChangeStatus?: (order: RepairOrder) => void;
  onPrintReceipt?: (order: RepairOrder) => void;
  formatRelativeDate: (iso: string) => string;
}

export default function OrderCard({
  order,
  onCall,
  onWhatsApp,
  onChangeStatus,
  onPrintReceipt,
  formatRelativeDate,
}: OrderCardProps) {
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [isDark]);
  const router = useRouter();
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.RECEIVED;
  const firstItem = order.items?.[0];
  const customerPhone = order.customer?.phone;
  const customerName = order.customer?.name || order.customerName || 'Cliente no registrado';
  const iconName = getDeviceIcon(firstItem?.deviceType);
  const cost = order.totalCost ?? order.initialReviewCost;

  return (
    <Card
      style={styles.card}
      onPress={() => router.push(`/orders/${order.id}` as any)}
    >
      {/* Top Header: Appliance Icon + Code & Customer + Status Chip */}
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <View style={[styles.deviceIconBubble, { backgroundColor: status.soft }]}>
            <MaterialCommunityIcons name={iconName as any} size={22} color={status.color} />
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.orderId}>ORD-{order.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.customerName} numberOfLines={1}>
              {customerName}
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

      {/* Device Info & Problem */}
      {firstItem && (
        <View style={styles.deviceDetails}>
          <Text style={styles.deviceTitle} numberOfLines={1}>
            {firstItem.brand} {firstItem.model} · <Text style={styles.deviceType}>{firstItem.deviceType}</Text>
          </Text>
        </View>
      )}

      {order.description ? (
        <Text style={styles.problemText} numberOfLines={2}>
          {order.description}
        </Text>
      ) : null}

      {/* Meta row: Technician + Date + Price */}
      <View style={styles.metaRow}>
        <View style={styles.techCol}>
          {order.technician?.firstName || order.technicianName ? (
            <View style={styles.techRow}>
              <MaterialCommunityIcons name="account-wrench" size={14} color={colors.primary} />
              <Text style={styles.techName} numberOfLines={1}>
                {order.technician
                  ? `${order.technician.firstName} ${order.technician.lastName}`
                  : order.technicianName}
              </Text>
            </View>
          ) : (
            <Text style={styles.noTech}>Sin técnico</Text>
          )}
        </View>

        <Text style={styles.dateText}>{formatRelativeDate(order.createdAt)}</Text>

        {cost != null && cost > 0 && (
          <Text style={styles.priceText}>S/ {cost.toFixed(2)}</Text>
        )}
      </View>

      {/* Quick Action Buttons (Min 48dp touch target) */}
      <View style={styles.actionsRow}>
        {customerPhone ? (
          <>
            <Pressable
              style={styles.actionBtn}
              onPress={() => onCall && onCall(customerPhone)}
              android_ripple={{ color: 'rgba(0, 97, 164, 0.15)', borderless: true, radius: 24 }}
              accessibilityRole="button"
              accessibilityLabel="Llamar al cliente"
            >
              <MaterialCommunityIcons name="phone" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Llamar</Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => onWhatsApp && onWhatsApp(customerPhone, customerName)}
              android_ripple={{ color: 'rgba(0, 109, 68, 0.15)', borderless: true, radius: 24 }}
              accessibilityRole="button"
              accessibilityLabel="Enviar WhatsApp"
            >
              <MaterialCommunityIcons name="whatsapp" size={18} color={colors.success} />
              <Text style={[styles.actionBtnText, { color: colors.success }]}>WhatsApp</Text>
            </Pressable>
          </>
        ) : null}

        <View style={styles.spacer} />

        {onChangeStatus && (
          <Pressable
            style={[styles.actionBtn, styles.statusActionBtn]}
            onPress={() => onChangeStatus(order)}
            android_ripple={{ color: 'rgba(0, 97, 164, 0.15)', borderless: true, radius: 24 }}
            accessibilityRole="button"
            accessibilityLabel="Cambiar estado"
          >
            <MaterialCommunityIcons name="tag-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>Estado</Text>
          </Pressable>
        )}

        {onPrintReceipt && (
          <Pressable
            style={[styles.actionBtn, styles.printActionBtn]}
            onPress={() => onPrintReceipt(order)}
            android_ripple={{ color: 'rgba(117, 75, 156, 0.15)', borderless: true, radius: 24 }}
            accessibilityRole="button"
            accessibilityLabel="Ver e imprimir ticket"
          >
            <MaterialCommunityIcons name="printer" size={18} color={colors.violet} />
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  deviceIconBubble: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  orderId: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  customerName: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  deviceDetails: {
    marginTop: spacing.xs,
    paddingLeft: 48,
  },
  deviceTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  deviceType: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  problemText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    paddingLeft: 48,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  techCol: {
    flex: 1,
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  techName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  noTech: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  priceText: {
    ...typography.labelLarge,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    minHeight: 38,
    backgroundColor: colors.surfaceContainerLow,
  },
  statusActionBtn: {
    backgroundColor: colors.primarySoft,
  },
  printActionBtn: {
    backgroundColor: colors.violetSoft,
    paddingHorizontal: spacing.sm,
  },
  actionBtnText: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
});
