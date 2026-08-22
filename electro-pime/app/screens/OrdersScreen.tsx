import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '../../services/api';
import { RepairOrder, RepairOrderStatus } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { StatusBadge, STATUS_COLORS, STATUS_LABELS } from '../../components/ui/StatusBadge';
import { FilterChip } from '../../components/ui/FilterChip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { colors, spacing, typography, radii, shadows } from '../../constants/theme';

type FilterStatus = RepairOrderStatus | 'ALL';

const OrdersScreen = () => {
  const router = useRouter();
  const { openOrderId } = useLocalSearchParams<{ openOrderId: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; variant: 'danger' | 'success' | 'warning' | 'info'; onConfirm: () => void }>({ title: '', message: '', variant: 'info', onConfirm: () => {} });

  const showConfirm = (title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info', onConfirm: () => void) => {
    setConfirmConfig({ title, message, variant, onConfirm });
    setConfirmVisible(true);
  };

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await api.getRepairOrders();
      // Sort orders by createdAt descending (newest first)
      const sortedData = data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, fetchOrders]);

  // Handle deep linking / query param to open modal
  useEffect(() => {
    if (orders.length > 0 && openOrderId) {
      const orderToOpen = orders.find(o => o.id === openOrderId);
      if (orderToOpen) {
        setSelectedOrder(orderToOpen);
        setShowOrderDetails(true);
      }
    }
  }, [orders, openOrderId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: RepairOrderStatus) => {
    try {
      await api.updateRepairOrder(orderId, { status: newStatus });
      showConfirm('Éxito', 'Estado actualizado correctamente', 'success', () => {});
      fetchOrders();
    } catch (err: any) {
      console.error('Error updating status:', err);
      Alert.alert('Error', err.message || 'No se pudo actualizar el estado');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    showConfirm('Eliminar Orden', '¿Está seguro que desea eliminar esta orden? This action cannot be undone.', 'danger', async () => {
      try {
        await api.deleteRepairOrder(orderId);
        showConfirm('Éxito', 'Orden eliminada correctamente', 'success', () => { fetchOrders(); });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo eliminar la orden');
      }
    });
  };

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Órdenes de Reparación</Text>
        <Button
          title="Nueva Orden"
          onPress={() => router.push('/orders/new')}
          variant="primary"
          size="sm"
          icon={<MaterialCommunityIcons name="plus" size={18} color={colors.white} />}
        />
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['ALL', ...Object.keys(STATUS_LABELS)] as FilterStatus[]).map((status) => (
          <FilterChip
            key={status}
            label={status === 'ALL' ? 'Todas' : STATUS_LABELS[status]}
            selected={filterStatus === status}
            onPress={() => setFilterStatus(status)}
            style={{ marginRight: spacing.sm }}
          />
        ))}
      </ScrollView>
    </View>
  );

  /* Receipt Printing Logic */
  const generateReceiptHTML = (order: RepairOrder) => {
    const termsRequest = "En caso de que la oferta de servicio no sea aceptada y/o el equipo no sea retirado dentro de 120 días depués del ingreso se considerará abandonado. En este caso la empresa adquiere su derecho sobre el equipo quedando facultado de disponer del equipo, perdiendo el cliente todo derecho, reclamo o indemnización alguna. Al efectuar la reparación le garantizamos las piezas renovadas por un peiodo de 90 días, pero no por todo el equipo. Todo servicio incluyendo la revisión tiene un costo.";

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; padding: 40px; color: #1F2937; background: #fff; line-height: 1.5; -webkit-print-color-adjust: exact; }
            
            .brand-header { text-align: center; margin-bottom: 30px; }
            .brand-name { font-size: 28px; font-weight: 800; color: #1E40AF; text-transform: uppercase; margin-bottom: 5px; letter-spacing: -0.5px; }
            .brand-details { font-size: 11px; color: #6B7280; line-height: 1.4; max-width: 80%; margin: 0 auto; }
            
            .header-badge { background: #DBEAFE; color: #1E40AF; padding: 4px 12px; border-radius: 999px; display: inline-block; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px; }
            .page-title { font-size: 24px; font-weight: 800; margin: 0; color: #111827; letter-spacing: -0.5px; }
            .page-subtitle { color: #6B7280; font-size: 13px; margin-top: 5px; }
            
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
            .card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .card-title { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
            .card-content h3 { margin: 0 0 5px 0; font-size: 16px; color: #111827; font-weight: 700; }
            .card-content p { margin: 0; color: #4B5563; font-size: 13px; line-height: 1.6; }

            .table-section { margin-top: 30px; }
            .table-title { font-size: 16px; font-weight: 700; margin-bottom: 15px; color: #111827; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; }
            th { text-align: left; padding: 12px 15px; background: #F9FAFB; color: #6B7280; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; letter-spacing: 0.5px; }
            td { padding: 12px 15px; border-bottom: 1px solid #E5E7EB; font-size: 13px; color: #1F2937; vertical-align: top; }
            tr:last-child td { border-bottom: none; }
            .price-col { font-weight: 600; color: #2563EB; text-align: right; }
            
            .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-top: 30px; }
            .terms-box { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; background: #F9FAFB; }
            .terms-title { font-size: 11px; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; color: #111827; }
            .terms-text { font-size: 9px; color: #6B7280; text-align: justify; line-height: 1.6; }
            
            .summary-box { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; background: #fff; }
            .summary-title { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.5px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #374151; }
            .total-row { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #E5E7EB; font-size: 20px; font-weight: 800; color: #2563EB; }

            .badge-acc { font-size: 11px; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; border: 1px solid #E5E7EB; margin-right: 4px; display: inline-block; margin-bottom: 4px; color: #4B5563; }
            
            .signature-section { margin-top: 60px; display: flex; justify-content: flex-end; padding-right: 20px; }
            .signature-line { border-top: 1px solid #9CA3AF; width: 200px; text-align: center; padding-top: 10px; }
            .signature-text { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="brand-header">
            <div class="brand-name">Electrónica Pimentel</div>
            <div class="brand-details">
              Av. Principal 123, Lima • Tel: 555-0123 • contacto@pimentel.com<br>
              Especialistas en Reparación de Electrodomésticos
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div class="header-badge">Orden en Reparación</div>
            <h1 class="page-title">Orden #${order.id.slice(0, 8).toUpperCase()}</h1>
            <div class="page-subtitle">Generado el ${new Date().toLocaleString()}</div>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title">Detalles del Cliente</div>
              <div class="card-content">
                <h3>${order.customer?.name || order.customerName || 'Cliente General'}</h3>
                ${order.customer?.email ? `<p>${order.customer.email}</p>` : ''}
                ${order.customer?.address ? `<p>${order.customer.address || ''}</p>` : ''}
                ${order.customer?.phone ? `<p>${order.customer.phone}</p>` : ''}
              </div>
            </div>
            
            <div class="card">
              <div class="card-title">Técnico de Servicio</div>
              <div class="card-content">
                <h3>${order.technician ? `${order.technician.firstName} ${order.technician.lastName}` : 'No Asignado'}</h3>
                ${order.technician?.email ? `<p>${order.technician.email}</p>` : ''}
                <p>Nivel: Técnico Certificado</p>
              </div>
            </div>
          </div>

          <div class="table-section">
            <h2 class="table-title">Equipos Registrados</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 40%">Marca y Modelo</th>
                  <th style="width: 20%">N° de Serie</th>
                  <th style="width: 25%">Problema/Accesorios</th>
                  <th style="width: 15%; text-align: right">Cargo</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <div style="font-weight: 600; color: #111827;">${item.deviceType || 'Equipo'} - ${item.brand}</div>
                      <div style="color: #6B7280;">Modelo: ${item.model}</div>
                    </td>
                    <td style="font-family: monospace; color: #4B5563;">${item.serialNumber || 'N/A'}</td>
                    <td>
                      <div style="margin-bottom: 5px;">${item.problemDescription}</div>
                      <!-- Si hubiera accesorios se mostrarían aquí, por ahora mockeamos -->
                      <span class="badge-acc">✓ Cargador</span>
                    </td>
                    <td class="price-col">S/ ${(order.initialReviewCost || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer-grid">
            <div class="terms-box">
              <div class="terms-title">Términos y Condiciones</div>
              <div class="terms-text">
                ${termsRequest}
              </div>
            </div>

            <div class="summary-box">
              <div class="summary-title">Resumen Total</div>
              <div class="summary-row">
                <span>Revisión Inicial</span>
                <span>S/ ${(order.initialReviewCost || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Impuestos Estimados (0%)</span>
                <span>S/ 0.00</span>
              </div>
              <div class="total-row">
                <span>Total General</span>
                <span>S/ ${(order.totalCost || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-line">
              <div class="signature-text">Firma del Cliente</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintReceipt = async (order: RepairOrder) => {
    try {
      const html = generateReceiptHTML(order);

      if (Platform.OS === 'web') {
        // En web, abrimos una nueva ventana para imprimir solo el recibo
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();

          // Esperar a que cargue y luego imprimir
          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };

          // Fallback por si onload no dispara
          setTimeout(() => {
            if (printWindow) {
              printWindow.print();
            }
          }, 500);

          return;
        }
      }

      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error printing receipt:', error);
      Alert.alert('Error', 'No se pudo generar el recibo');
    }
  };

  const renderOrderCard = ({ item, index }: { item: RepairOrder; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Card style={{ marginBottom: spacing.md }}>
        <TouchableOpacity
          onPress={() => {
            setSelectedOrder(item);
            setShowOrderDetails(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.orderId, { color: theme.primary }]}>#{item.id.slice(0, 8)}</Text>
              <Text style={[styles.orderCustomer, { color: theme.text }]}>
                {item.customer?.name || item.customerName || 'Sin cliente'}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>

          {item.items && item.items.length > 0 && (
            <View style={styles.deviceInfo}>
              <MaterialCommunityIcons name="devices" size={20} color={theme.textSecondary} />
              <Text style={[styles.deviceText, { color: theme.textSecondary }]}>
                {item.items[0].brand} {item.items[0].model} - {item.items[0].deviceType}
              </Text>
            </View>
          )}

          <Text style={[styles.orderDescription, { color: theme.textMuted }]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={[styles.orderFooter, { borderTopColor: theme.border }]}>
            <View style={styles.technicianInfo}>
              {(item.technician?.firstName || item.technicianName) ? (
                <>
                  <MaterialCommunityIcons name="account-wrench" size={20} color={theme.primary} />
                  <Text style={[styles.technicianName, { color: theme.primary }]}>
                    {item.technician
                      ? `${item.technician.firstName} ${item.technician.lastName}`
                      : item.technicianName}
                  </Text>
                </>
              ) : (
                <Text style={[styles.noTechnician, { color: theme.textMuted }]}>Sin técnico asignado</Text>
              )}
            </View>
            <Text style={[styles.orderDate, { color: theme.textMuted }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.orderActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/orders/${item.id}/edit`)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="pencil" size={18} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => {
              Alert.alert('Cambiar Estado', 'Seleccione el nuevo estado', [
                ...Object.entries(STATUS_LABELS).map(([status, label]) => ({
                  text: label,
                  onPress: () => handleStatusUpdate(item.id, status as RepairOrderStatus),
                })),
                { text: 'Cancelar', style: 'cancel' },
              ]);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={18} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.info }]}
            onPress={() => handlePrintReceipt(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="printer" size={18} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => handleDeleteOrder(item.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="delete" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={showOrderDetails}
        animationType="slide"
        onRequestClose={() => setShowOrderDetails(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.surfaceVariant }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Orden #{selectedOrder.id.slice(0, 8)}
            </Text>
            <TouchableOpacity onPress={() => setShowOrderDetails(false)}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Status */}
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Estado</Text>
              <StatusBadge status={selectedOrder.status} />
            </Card>

            {/* Customer */}
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Cliente</Text>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="account" size={20} color={theme.textSecondary} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {selectedOrder.customer?.name || selectedOrder.customerName || 'N/A'}
                </Text>
              </View>
              {selectedOrder.customer?.phone && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="phone" size={20} color={theme.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    {selectedOrder.customer.phone}
                  </Text>
                </View>
              )}
            </Card>

            {/* Device(s) */}
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Dispositivo(s)</Text>
              {selectedOrder.items?.map((item, index) => (
                <Card key={index} variant="flat" padding={spacing.md} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="devices" size={20} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                      {item.brand} {item.model}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="tag" size={20} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                      {item.deviceType}
                    </Text>
                  </View>
                  {item.serialNumber && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="barcode" size={20} color={theme.textSecondary} />
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                        {item.serialNumber}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                      {item.problemDescription}
                    </Text>
                  </View>
                </Card>
              ))}
            </Card>

            {/* Technician */}
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Técnico Asignado</Text>
              {(selectedOrder.technician?.firstName || selectedOrder.technicianName) ? (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="account-wrench" size={20} color={theme.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    {selectedOrder.technician
                      ? `${selectedOrder.technician.firstName} ${selectedOrder.technician.lastName}`
                      : selectedOrder.technicianName}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.noTechnician, { color: theme.textMuted }]}>Sin técnico asignado</Text>
              )}
            </Card>

            {/* Description */}
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Descripción</Text>
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {selectedOrder.description}
              </Text>
            </Card>

            {/* Notes */}
            {selectedOrder.notes && (
              <Card style={{ marginBottom: spacing.md }}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Notas</Text>
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {selectedOrder.notes}
                </Text>
              </Card>
            )}

            {/* Costs */}
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Costos</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Revisión inicial:</Text>
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  S/ {selectedOrder.initialReviewCost?.toFixed(2) || '0.00'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Total:</Text>
                <Text style={[styles.detailText, { color: colors.successDark, fontWeight: typography.weights.semibold, fontSize: typography.sizes.base }]}>
                  S/ {selectedOrder.totalCost?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </Card>

            {/* Dates */}
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Fechas</Text>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={theme.textSecondary} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  Creada: {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="update" size={20} color={theme.textSecondary} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  Actualizada: {new Date(selectedOrder.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </Card>
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Button
              title="Editar"
              onPress={() => {
                setShowOrderDetails(false);
                router.push(`/orders/${selectedOrder.id}/edit`);
              }}
              variant="primary"
              fullWidth
              icon={<MaterialCommunityIcons name="pencil" size={20} color={colors.white} />}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border, paddingTop: insets.top + spacing.base }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Órdenes de Reparación</Text>
          </View>
        </View>
        <View style={{ padding: spacing.base }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} style={{ marginBottom: spacing.md }}>
              <SkeletonLoader lines={4} lineHeight={14} borderRadius={radii.sm} />
            </Card>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <EmptyState icon="alert-circle" title={error} />
          <View style={{ marginTop: spacing.base }}>
            <Button title="Reintentar" onPress={fetchOrders} variant="primary" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.contentContainer}>
          {renderFilters()}
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderCard}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              styles.ordersList,
              { paddingBottom: insets.bottom + spacing.xl },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View>
                <EmptyState
                  icon="clipboard-text-outline"
                  title="No hay órdenes"
                  message="Crea tu primera orden para comenzar"
                />
                <View style={{ alignItems: 'center' }}>
                  <Button
                    title="Crear primera orden"
                    onPress={() => router.push('/orders/new')}
                    variant="primary"
                  />
                </View>
              </View>
            }
          />
        </View>
      </SafeAreaView>
      {renderOrderDetails()}
      <ConfirmDialog
        visible={confirmVisible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmLabel={confirmConfig.variant === 'danger' ? 'Eliminar' : 'Aceptar'}
        onConfirm={() => { confirmConfig.onConfirm(); setConfirmVisible(false); }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  contentContainer: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
  },
  ordersList: {
    padding: spacing.base,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderId: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  orderCustomer: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginTop: spacing['2xs'],
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deviceText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  orderDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  technicianName: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.sm,
  },
  noTechnician: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
  },
  orderDate: {
    fontSize: typography.sizes.xs,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  modalContent: {
    flex: 1,
    padding: spacing.base,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.base,
    borderTopWidth: 1,
  },
  detailSectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    width: 120,
  },
});

export default OrdersScreen;
