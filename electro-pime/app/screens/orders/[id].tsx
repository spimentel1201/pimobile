import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useServiceOrders } from '../../../contexts/ServiceOrderContext';
import { ServiceOrder, ServiceOrderStatus } from '../../../types/api';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { colors, typography, spacing, radii, shadows } from '../../../constants/theme';

interface StatusInfoType {
  [key: string]: {
    label: string;
    color: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  };
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOrderById, updateOrderStatus, loading, error } = useServiceOrders();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusActions, setShowStatusActions] = useState(false);

  const statusInfo: StatusInfoType = {
    pending: { label: 'Pendiente', color: theme.warning, icon: 'clock-outline' },
    in_progress: { label: 'En Progreso', color: theme.primary, icon: 'wrench-outline' },
    waiting_approval: { label: 'Esperando Aprobación', color: colors.info, icon: 'clock-alert-outline' },
    completed: { label: 'Completado', color: theme.success, icon: 'check-circle-outline' },
    cancelled: { label: 'Cancelado', color: theme.error, icon: 'close-circle-outline' },
  };

  const loadOrder = async () => {
    if (!id) return;
    try {
      const orderData = await getOrderById(id);
      setOrder(orderData);
    } catch (err) {
      console.error('Error loading order:', err);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus: ServiceOrderStatus) => {
    if (!order) return;

    try {
      setUpdating(true);
      const updatedOrder = await updateOrderStatus(order.id, newStatus);
      setOrder(updatedOrder);
      setShowStatusActions(false);

      const statusText = statusInfo[newStatus as keyof typeof statusInfo]?.label || newStatus;

      Alert.alert(
        '¡Éxito!',
        `La orden ha sido actualizada a: ${statusText}`
      );
    } catch (err) {
      console.error('Error updating status:', err);
      Alert.alert(
        'Error',
        'No se pudo actualizar el estado de la orden'
      );
    } finally {
      setUpdating(false);
    }
  };

  const renderStatusBadge = (status: ServiceOrderStatus) => {
    const info = statusInfo[status];
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${info.color}1A`, borderColor: info.color }]}>
        <MaterialCommunityIcons
          name={info.icon}
          size={16}
          color={info.color}
          style={styles.statusIcon}
        />
        <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
      </View>
    );
  };

  const renderSection = (title: string, content: string | number | undefined, isLast = false) => (
    <View style={[styles.section, !isLast && styles.sectionBorder]}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      <Text style={[styles.sectionContent, content ? { color: theme.text } : { color: theme.textMuted, fontStyle: 'italic' }]}>
        {content || 'No especificado'}
      </Text>
    </View>
  );

  const renderStatusAction = (status: ServiceOrderStatus, label: string) => {
    if (order?.status === status) return null;

    return (
      <TouchableOpacity
        key={status}
        style={[styles.statusAction, { borderColor: statusInfo[status].color }]}
        onPress={() => handleStatusUpdate(status)}
        disabled={updating}
      >
        <Text style={[styles.statusActionText, { color: statusInfo[status].color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && !order) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    const errorMessage = (error as Error)?.message ||
      (typeof error === 'string' ? error : 'No se pudo cargar la orden');
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <MaterialIcons name="error-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={loadOrder}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: `Orden #${order.id.slice(0, 8)}`,
          headerRight: () => (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                if (order) {
                  router.push(`/orders/${order.id}/edit` as any);
                }
              }}
            >
              <MaterialIcons name="edit" size={24} color={theme.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.orderNumber, { color: theme.text }]}>Orden #{order.id.slice(0, 8)}</Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {format(new Date(order.createdAt), 'PPP')} a las {format(new Date(order.createdAt), 'p')}
          </Text>
        </View>
        {renderStatusBadge(order.status)}
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Dispositivo</Text>
          <Text style={[styles.deviceName, { color: theme.text }]}>{order.device.name}</Text>
          <Text style={[styles.deviceDetails, { color: theme.textSecondary }]}>
            {order.device.brand} • {order.device.model}
          </Text>
          {order.device.serialNumber && (
            <Text style={[styles.deviceDetails, { color: theme.textSecondary }]}>
              N° de serie: {order.device.serialNumber}
            </Text>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.row}>
          <View style={styles.infoBox}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Cliente</Text>
            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
              {order.customer.name}
            </Text>
            <Text style={[styles.infoSubtext, { color: theme.textSecondary }]}>{order.customer.email}</Text>
          </View>

          {order.technician && (
            <View style={styles.infoBox}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Técnico</Text>
              <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
                {order.technician.name}
              </Text>
              <Text style={[styles.infoSubtext, { color: theme.textSecondary }]}>{order.technician.email}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        {renderSection('Descripción del problema', order.description)}
        {renderSection('Diagnóstico', order.diagnosis)}
        {renderSection('Detalles de la reparación', order.repairDetails)}

        <View style={styles.row}>
          <View style={[styles.infoBox, styles.halfWidth]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Costo estimado</Text>
            <Text style={[styles.cost, { color: theme.success }]}>
              {order.cost ? `$${order.cost.toFixed(2)}` : 'No especificado'}
            </Text>
          </View>

          <View style={[styles.infoBox, styles.halfWidth]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Fecha estimada</Text>
            <Text style={{ color: theme.text }}>
              {order.estimatedCompletion
                ? format(new Date(order.estimatedCompletion), 'PPP')
                : 'No especificada'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Acciones</Text>
            <TouchableOpacity onPress={() => setShowStatusActions(!showStatusActions)}>
              <MaterialIcons
                name={showStatusActions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {showStatusActions && (
            <View style={styles.statusActions}>
              {renderStatusAction('pending', 'Marcar como Pendiente')}
              {renderStatusAction('in_progress', 'Comenzar Reparación')}
              {renderStatusAction('waiting_approval', 'Esperando Aprobación')}
              {renderStatusAction('completed', 'Marcar como Completado')}
              {renderStatusAction('cancelled', 'Cancelar Orden')}
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Última actualización: {format(new Date(order.updatedAt), 'PPP p')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  orderNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  date: {
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  statusAction: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  statusActionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  card: {
    borderRadius: radii.lg,
    margin: spacing.base,
    marginBottom: 0,
    ...shadows.sm,
  },
  section: {
    padding: spacing.base,
  },
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  sectionContent: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.base,
  },
  row: {
    flexDirection: 'row',
    padding: spacing.base,
  },
  infoBox: {
    flex: 1,
  },
  halfWidth: {
    flex: 0.5,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: typography.sizes.sm,
  },
  deviceName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: typography.sizes.sm,
    marginBottom: 2,
  },
  cost: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginTop: 4,
  },
  statusActions: {
    marginTop: spacing.sm,
  },
  footer: {
    padding: spacing.base,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.xs,
  },
  errorText: {
    fontSize: typography.sizes.md,
    marginTop: spacing.base,
    marginBottom: spacing.base,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
  },
  editButton: {
    marginRight: spacing.base,
    padding: spacing.sm,
  },
});
