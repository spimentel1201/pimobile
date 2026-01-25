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
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '../services/api';
import { RepairOrder, RepairOrderStatus } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

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

const OrdersScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: RepairOrderStatus) => {
    try {
      await api.updateRepairOrder(orderId, { status: newStatus });
      Alert.alert('Éxito', 'Estado actualizado correctamente');
      fetchOrders();
    } catch (err: any) {
      console.error('Error updating status:', err);
      Alert.alert('Error', err.message || 'No se pudo actualizar el estado');
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

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter(order => order.status === filterStatus);

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
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; padding: 40px; color: #1F2937; background: #fff; line-height: 1.5; -webkit-print-color-adjust: exact; }
            .header-badge { background: #DBEAFE; color: #1E40AF; padding: 4px 12px; border-radius: 999px; display: inline-block; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 15px; }
            .page-title { font-size: 32px; font-weight: 800; margin: 0; color: #111827; letter-spacing: -0.5px; }
            .page-subtitle { color: #6B7280; font-size: 14px; margin-top: 5px; }
            
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
            .card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .card-title { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
            .card-content h3 { margin: 0 0 5px 0; font-size: 18px; color: #111827; font-weight: 700; }
            .card-content p { margin: 0; color: #4B5563; font-size: 14px; line-height: 1.6; }

            .table-section { margin-top: 30px; }
            .table-title { font-size: 18px; font-weight: 700; margin-bottom: 15px; color: #111827; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; }
            th { text-align: left; padding: 12px 20px; background: #F9FAFB; color: #6B7280; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; letter-spacing: 0.5px; }
            td { padding: 16px 20px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #1F2937; vertical-align: top; }
            tr:last-child td { border-bottom: none; }
            .price-col { font-weight: 600; color: #2563EB; text-align: right; }
            
            .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-top: 30px; }
            .terms-box { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; background: #F9FAFB; }
            .terms-title { font-size: 12px; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; color: #111827; }
            .terms-text { font-size: 10px; color: #6B7280; text-align: justify; line-height: 1.6; }
            
            .summary-box { border: 1px solid #E5E7EB; border-radius: 12px; padding: 25px; background: #fff; }
            .summary-title { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.5px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #374151; }
            .total-row { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #E5E7EB; font-size: 24px; font-weight: 800; color: #2563EB; }

            .badge-acc { font-size: 11px; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; border: 1px solid #E5E7EB; margin-right: 4px; display: inline-block; margin-bottom: 4px; color: #4B5563; }
          </style>
        </head>
        <body>
          <div class="header-badge">Orden en Reparación</div>
          <h1 class="page-title">Orden de Reparación #${order.id.slice(0, 8).toUpperCase()}</h1>
          <div class="page-subtitle">Generado el ${new Date().toLocaleString()}</div>

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
          
          <div style="margin-top: 30px; text-align: center; color: #9CA3AF; font-size: 12px;">
            <p>Electrónica Pimentel - Av. Principal 123 - Tel: 555-0123</p>
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

  const renderOrderCard = ({ item }: { item: RepairOrder }) => (
    <View style={styles.orderCard}>
      <TouchableOpacity
        onPress={() => {
          setSelectedOrder(item);
          setShowOrderDetails(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
            <Text style={styles.orderCustomer}>{item.customer?.name || item.customerName || 'Sin cliente'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </View>

        {item.items && item.items.length > 0 && (
          <View style={styles.deviceInfo}>
            <MaterialCommunityIcons name="devices" size={20} color="#6c757d" />
            <Text style={styles.deviceText}>
              {item.items[0].brand} {item.items[0].model} - {item.items[0].deviceType}
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
                <MaterialCommunityIcons name="account-wrench" size={20} color="#3B82F6" />
                <Text style={styles.technicianName}>
                  {item.technician
                    ? `${item.technician.firstName} ${item.technician.lastName}`
                    : item.technicianName}
                </Text>
              </>
            ) : (
              <Text style={styles.noTechnician}>Sin técnico asignado</Text>
            )}
          </View>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
          onPress={() => router.push(`/orders/${item.id}/edit`)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="pencil" size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10B981' }]}
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

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={showOrderDetails}
        animationType="slide"
        onRequestClose={() => setShowOrderDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Orden #{selectedOrder.id.slice(0, 8)}</Text>
            <TouchableOpacity onPress={() => setShowOrderDetails(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Status */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Estado</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedOrder.status], alignSelf: 'flex-start' }]}>
                <Text style={styles.statusText}>{STATUS_LABELS[selectedOrder.status]}</Text>
              </View>
            </View>

            {/* Customer */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Cliente</Text>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="account" size={20} color="#6B7280" />
                <Text style={styles.detailText}>{selectedOrder.customer?.name || selectedOrder.customerName || 'N/A'}</Text>
              </View>
              {selectedOrder.customer?.phone && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="phone" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>{selectedOrder.customer.phone}</Text>
                </View>
              )}
            </View>

            {/* Device(s) */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Dispositivo(s)</Text>
              {selectedOrder.items?.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="devices" size={20} color="#6B7280" />
                    <Text style={styles.detailText}>{item.brand} {item.model}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="tag" size={20} color="#6B7280" />
                    <Text style={styles.detailText}>{item.deviceType}</Text>
                  </View>
                  {item.serialNumber && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="barcode" size={20} color="#6B7280" />
                      <Text style={styles.detailText}>{item.serialNumber}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color="#6B7280" />
                    <Text style={styles.detailText}>{item.problemDescription}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Technician */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Técnico Asignado</Text>
              {(selectedOrder.technician?.firstName || selectedOrder.technicianName) ? (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="account-wrench" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {selectedOrder.technician
                      ? `${selectedOrder.technician.firstName} ${selectedOrder.technician.lastName}`
                      : selectedOrder.technicianName}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noTechnician}>Sin técnico asignado</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Descripción</Text>
              <Text style={styles.detailText}>{selectedOrder.description}</Text>
            </View>

            {/* Notes */}
            {selectedOrder.notes && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Notas</Text>
                <Text style={styles.detailText}>{selectedOrder.notes}</Text>
              </View>
            )}

            {/* Costs */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Costos</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Revisión inicial:</Text>
                <Text style={styles.detailText}>S/ {selectedOrder.initialReviewCost?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total:</Text>
                <Text style={[styles.detailText, styles.totalCost]}>S/ {selectedOrder.totalCost?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>

            {/* Dates */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Fechas</Text>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={20} color="#6B7280" />
                <Text style={styles.detailText}>Creada: {new Date(selectedOrder.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="update" size={20} color="#6B7280" />
                <Text style={styles.detailText}>Actualizada: {new Date(selectedOrder.updatedAt).toLocaleDateString()}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => {
                setShowOrderDetails(false);
                router.push(`/orders/${selectedOrder.id}/edit`);
              }}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="white" />
              <Text style={styles.modalButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.contentContainer}>
          {renderFilters()}
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.ordersList}
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
      {renderOrderDetails()}
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  orderDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  technicianName: {
    marginLeft: 6,
    fontSize: 14,
    color: '#3B82F6',
  },
  noTechnician: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  detailSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 120,
  },
  totalCost: {
    fontWeight: '600',
    color: '#059669',
    fontSize: 16,
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default OrdersScreen;