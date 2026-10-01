import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '../services/api';
import { RepairOrder, RepairOrderStatus } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';
import StatusBadge from '../components/ui/StatusBadge';
import { NO_PHONE_MESSAGE, buildTelUrl, buildWhatsAppUrl } from '../utils/phone';
import { colors, typography, radii, shadow, spacing, ORDER_STATUS } from '../theme';

const STATUS_COLORS: Record<RepairOrderStatus, string> = {
  RECEIVED: '#9CA3AF',
  DIAGNOSED: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  WAITING_FOR_PARTS: '#8B5CF6',
  COMPLETED: '#10B981',
  DELIVERED: '#059669',
  CANCELLED: '#EF4444',
};

const STATUS_LABELS: Record<RepairOrderStatus, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSED: 'Diagnosticado',
  IN_PROGRESS: 'En Progreso',
  WAITING_FOR_PARTS: 'Esperando Repuestos',
  COMPLETED: 'Completado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

type FilterStatus = RepairOrderStatus | 'ALL';

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

const OrdersScreen = () => {
  const router = useRouter();
  const { openOrderId } = useLocalSearchParams<{ openOrderId: string }>();
  const { user } = useAuth();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [statusPickerOrder, setStatusPickerOrder] = useState<RepairOrder | null>(null);
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

  // Refresca la lista cada vez que la pantalla recupera el foco (p. ej. al
  // volver de editar una orden) para que el estado mostrado siempre esté al día.
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }, [user, fetchOrders])
  );

  // Handle deep linking / query param: navegar a la pantalla de detalle
  useEffect(() => {
    if (openOrderId) {
      router.push(`/orders/${openOrderId}` as never);
    }
  }, [openOrderId, router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  /** Abre el marcador con prefijo internacional: tel:+51<numero> */
  const openPhone = (phone: string) => {
    const url = buildTelUrl(phone);
    if (!url) {
      showToast(NO_PHONE_MESSAGE, 'error');
      return;
    }
    Linking.openURL(url).catch(() => showToast('No se pudo abrir el teléfono', 'error'));
  };

  /** Abre WhatsApp en wa.me/51<numero> */
  const openWhatsApp = (phone: string) => {
    const url = buildWhatsAppUrl(phone);
    if (!url) {
      showToast(NO_PHONE_MESSAGE, 'error');
      return;
    }
    Linking.openURL(url).catch(() => showToast('No se pudo abrir WhatsApp', 'error'));
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
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

  const handleDeleteOrder = async (orderId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar esta orden?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteRepairOrder(orderId);
              Alert.alert('Éxito', 'Orden eliminada correctamente');
              fetchOrders();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar la orden');
            }
          },
        },
      ]
    );
  };

  const filteredOrders = useMemo(
    () =>
      filterStatus === 'ALL'
        ? orders
        : orders.filter(order => order.status === filterStatus),
    [orders, filterStatus]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Órdenes de Reparación</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/orders/new')}
        >
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={styles.addButtonText}>Nueva Orden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['ALL', ...Object.keys(STATUS_LABELS)] as FilterStatus[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              filterStatus === status && styles.filterChipActive
            ]}
            onPress={() => setFilterStatus(status)}
          >
            {status !== 'ALL' && (
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status as RepairOrderStatus] }]} />
            )}
            <Text style={[
              styles.filterChipText,
              filterStatus === status && styles.filterChipTextActive
            ]}>
              {status === 'ALL' ? 'Todas' : STATUS_LABELS[status as RepairOrderStatus]}
            </Text>
          </TouchableOpacity>
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

  const renderOrderCard = ({ item }: { item: RepairOrder }) => {
    const status = ORDER_STATUS[item.status];
    const firstItem = item.items?.[0];
    const customerPhone = item.customer?.phone;

    return (
      <View style={styles.orderCard}>
        {/* Barra de estado 4px del color del estado */}
        <View style={[styles.cardAccent, { backgroundColor: status.color }]} />

        <TouchableOpacity
          onPress={() => router.push(`/orders/${item.id}` as never)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeader}>
            <StatusBadge label={status.label} color={status.color} soft={status.soft} />
            <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          </View>

          <Text style={styles.orderCustomer} numberOfLines={1}>
            {item.customer?.name || item.customerName || 'Sin cliente'}
          </Text>

          {firstItem && (
            <View style={styles.deviceInfo}>
              <MaterialCommunityIcons name="devices" size={16} color={colors.textSecondary} />
              <Text style={styles.deviceText} numberOfLines={1}>
                <Text style={styles.deviceTextUpper}>
                  {firstItem.brand} {firstItem.model}
                </Text>{' '}
                · {firstItem.deviceType}
              </Text>
            </View>
          )}

          <Text style={styles.orderDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.orderFooter}>
            <View style={styles.technicianInfo}>
              {(item.technician?.firstName || item.technicianName) ? (
                <>
                  <MaterialCommunityIcons name="account-wrench" size={16} color={colors.primary} />
                  <Text style={styles.technicianName} numberOfLines={1}>
                    {item.technician
                      ? `${item.technician.firstName} ${item.technician.lastName}`
                      : item.technicianName}
                  </Text>
                </>
              ) : (
                <Text style={styles.noTechnician}>Sin técnico asignado</Text>
              )}
            </View>
            <Text style={styles.orderDate}>{formatRelativeDate(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.orderActions}>
          {customerPhone && (
            <>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => openPhone(customerPhone)}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <MaterialCommunityIcons name="phone" size={16} color={colors.primary} />
                <Text style={styles.contactButtonText}>Llamar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactButton, styles.contactButtonWhatsapp]}
                onPress={() => openWhatsApp(customerPhone)}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <MaterialCommunityIcons name="whatsapp" size={16} color={colors.success} />
                <Text style={[styles.contactButtonText, styles.contactButtonTextWhatsapp]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.actionSpacer} />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => router.push(`/orders/${item.id}/edit`)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => setStatusPickerOrder(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => handlePrintReceipt(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="printer" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={() => handleDeleteOrder(item.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="delete" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStatusPicker = () => {
    if (!statusPickerOrder) return null;

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => setStatusPickerOrder(null)}
      >
        <TouchableOpacity
          style={styles.statusOverlay}
          activeOpacity={1}
          onPress={() => setStatusPickerOrder(null)}
        >
          <TouchableOpacity
            style={styles.statusSheet}
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={styles.statusSheetTitle}>Cambiar estado</Text>
            <Text style={styles.statusSheetSubtitle}>
              Orden #{statusPickerOrder.id.slice(0, 8)} · Estado actual: {STATUS_LABELS[statusPickerOrder.status]}
            </Text>
            {(Object.entries(STATUS_LABELS) as [RepairOrderStatus, string][]).map(([status, label]) => {
              const isActive = status === statusPickerOrder.status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusOption, isActive && styles.statusOptionActive]}
                  activeOpacity={0.85}
                  disabled={isActive}
                  onPress={() => handleStatusUpdate(statusPickerOrder.id, status)}
                >
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
                  <Text
                    style={[styles.statusOptionText, isActive && styles.statusOptionTextActive]}
                  >
                    {label}
                  </Text>
                  {isActive && (
                    <MaterialCommunityIcons name="check-circle" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando órdenes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.contentContainer}>
          {renderFilters()}
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.ordersList}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No hay órdenes</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/orders/new')}
                >
                  <Text style={styles.emptyButtonText}>Crear primera orden</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </SafeAreaView>
      {renderStatusPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  safeArea: {
    flex: 1,
  },
  statusOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.45)',
    justifyContent: 'flex-end',
  },
  statusSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  statusSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusSheetSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  statusOptionTextActive: {
    color: '#3B82F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: 'white',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  ordersList: {
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  cardAccent: {
    width: 4,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingLeft: spacing.md + 4,
    paddingRight: spacing.lg,
    paddingTop: spacing.lg,
  },
  orderId: {
    ...typography.caption,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  orderCustomer: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
    paddingLeft: spacing.md + 4,
    paddingRight: spacing.lg,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingLeft: spacing.md + 4,
    paddingRight: spacing.lg,
  },
  deviceText: {
    marginLeft: spacing.sm,
    flex: 1,
    ...typography.caption,
    color: colors.textSecondary,
  },
  deviceTextUpper: {
    textTransform: 'uppercase',
  },
  orderDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingLeft: spacing.md + 4,
    paddingRight: spacing.lg,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginLeft: spacing.md + 4,
    marginRight: spacing.lg,
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  technicianName: {
    marginLeft: 6,
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  noTechnician: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  orderDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingLeft: spacing.md + 4,
    paddingRight: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: colors.primarySoft,
  },
  contactButtonWhatsapp: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  contactButtonTextWhatsapp: {
    color: colors.success,
  },
  actionSpacer: {
    flex: 1,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default OrdersScreen;