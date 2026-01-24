import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '../services/api';
import { Sale, PaymentMethod } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta de Crédito',
  DEBIT_CARD: 'Tarjeta de Débito',
  TRANSFER: 'Transferencia',
  YAPE: 'Yape',
  PLIN: 'Plin',
};

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  CASH: 'cash',
  CREDIT_CARD: 'credit-card',
  DEBIT_CARD: 'credit-card-outline',
  TRANSFER: 'bank-transfer',
  YAPE: 'cellphone',
  PLIN: 'cellphone',
};

const SalesScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const fetchSales = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const params: { startDate?: string; endDate?: string } = {};

      const today = new Date();
      if (dateFilter === 'today') {
        params.startDate = today.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = weekAgo.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
        params.startDate = monthAgo.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      }

      const data = await api.getSales(params);
      setSales(data);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      setError(err.message || 'Error al cargar las ventas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter, user]);

  useEffect(() => {
    if (user) {
      fetchSales();
    } else {
      setLoading(false);
    }
  }, [user, fetchSales]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSales();
  }, [fetchSales]);

  const handleViewInvoice = async (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
  };

  const handlePrintTicket = (sale: Sale) => {
    setSelectedSale(sale);
    setShowTicket(true);
  };

  const calculateMetrics = () => {
    const total = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const avgTicket = sales.length > 0 ? total / sales.length : 0;
    return { total, avgTicket, count: sales.length };
  };

  const metrics = calculateMetrics();

  const renderMetrics = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsContainer}>
      <View style={styles.metricCard}>
        <MaterialCommunityIcons name="cash-multiple" size={24} color="#10B981" />
        <Text style={styles.metricValue}>S/ {metrics.total.toFixed(2)}</Text>
        <Text style={styles.metricLabel}>Total Ventas</Text>
      </View>
      <View style={styles.metricCard}>
        <MaterialCommunityIcons name="receipt" size={24} color="#3B82F6" />
        <Text style={styles.metricValue}>{metrics.count}</Text>
        <Text style={styles.metricLabel}>N° Transacciones</Text>
      </View>
      <View style={styles.metricCard}>
        <MaterialCommunityIcons name="chart-line" size={24} color="#F59E0B" />
        <Text style={styles.metricValue}>S/ {metrics.avgTicket.toFixed(2)}</Text>
        <Text style={styles.metricLabel}>Ticket Promedio</Text>
      </View>
    </ScrollView>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'today', label: 'Hoy' },
          { key: 'week', label: 'Semana' },
          { key: 'month', label: 'Mes' },
          { key: 'all', label: 'Todas' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              dateFilter === filter.key && styles.filterChipActive
            ]}
            onPress={() => setDateFilter(filter.key as typeof dateFilter)}
          >
            <Text style={[
              styles.filterChipText,
              dateFilter === filter.key && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSaleCard = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => {
        setSelectedSale(item);
        setShowDetails(true);
      }}
    >
      <View style={styles.saleHeader}>
        <Text style={styles.saleId}>#{item.id.slice(0, 8)}</Text>
        <View style={styles.paymentBadge}>
          <MaterialCommunityIcons
            name={PAYMENT_METHOD_ICONS[item.paymentMethod] as any}
            size={14}
            color="#3B82F6"
          />
          <Text style={styles.paymentText}>{PAYMENT_METHOD_LABELS[item.paymentMethod]}</Text>
        </View>
      </View>

      <View style={styles.saleInfo}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={18} color="#6B7280" />
          <Text style={styles.infoText}>{item.customerFullName || item.customerName || 'Cliente General'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" />
          <Text style={styles.infoText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="package-variant" size={18} color="#6B7280" />
          <Text style={styles.infoText}>{item.items?.length || 0} productos</Text>
        </View>
      </View>

      <View style={styles.saleFooter}>
        <Text style={styles.saleTotal}>S/ {item.totalAmount.toFixed(2)}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => handleViewInvoice(item)}
          >
            <MaterialCommunityIcons name="file-document" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => handlePrintTicket(item)}
          >
            <MaterialCommunityIcons name="printer" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSaleDetails = () => {
    if (!selectedSale) return null;

    return (
      <Modal
        visible={showDetails}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Venta #{selectedSale.id.slice(0, 8)}</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Información General</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cliente:</Text>
                <Text style={styles.detailValue}>
                  {selectedSale.customerFullName || selectedSale.customerName || 'Cliente General'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendedor:</Text>
                <Text style={styles.detailValue}>{selectedSale.userName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método de Pago:</Text>
                <Text style={styles.detailValue}>{PAYMENT_METHOD_LABELS[selectedSale.paymentMethod]}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedSale.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Productos</Text>
              {selectedSale.items?.map((item, index) => (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.productName || 'Producto'}</Text>
                    <Text style={styles.productQty}>{item.quantity} x S/ {item.price.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.productTotal}>S/ {(item.quantity * item.price).toFixed(2)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>S/ {selectedSale.totalAmount.toFixed(2)}</Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: '#10B981' }]}
              onPress={() => {
                setShowDetails(false);
                handlePrintTicket(selectedSale);
              }}
            >
              <MaterialCommunityIcons name="printer" size={20} color="white" />
              <Text style={styles.footerButtonText}>Ver Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderTicketModal = () => {
    if (!selectedSale) return null;

    return (
      <Modal
        visible={showTicket}
        animationType="slide"
        onRequestClose={() => setShowTicket(false)}
      >
        <View style={styles.ticketContainer}>
          <View style={styles.ticketHeader}>
            <TouchableOpacity onPress={() => setShowTicket(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.ticketHeaderTitle}>Ticket de Venta</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.ticketContent}>
            <View style={styles.ticket}>
              {/* Ticket Header */}
              <View style={styles.ticketBrand}>
                <Text style={styles.ticketBrandName}>ELECTRO PIME</Text>
                <Text style={styles.ticketBrandSubtitle}>Reparación de Electrodomésticos</Text>
              </View>

              <View style={styles.ticketDivider} />

              <View style={styles.ticketInfo}>
                <Text style={styles.ticketInfoText}>Fecha: {new Date(selectedSale.createdAt).toLocaleString()}</Text>
                <Text style={styles.ticketInfoText}>Ticket: #{selectedSale.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.ticketInfoText}>Cliente: {selectedSale.customerFullName || selectedSale.customerName || 'Cliente General'}</Text>
                <Text style={styles.ticketInfoText}>Método: {PAYMENT_METHOD_LABELS[selectedSale.paymentMethod]}</Text>
              </View>

              <View style={styles.ticketDivider} />

              {/* Items */}
              <View style={styles.ticketItems}>
                <View style={styles.ticketItemHeader}>
                  <Text style={styles.ticketItemHeaderText}>ITEM</Text>
                  <Text style={styles.ticketItemHeaderText}>CANT</Text>
                  <Text style={styles.ticketItemHeaderText}>P.U</Text>
                  <Text style={styles.ticketItemHeaderText}>TOTAL</Text>
                </View>
                {selectedSale.items?.map((item, index) => (
                  <View key={index} style={styles.ticketItemRow}>
                    <Text style={styles.ticketItemName}>{item.productName || 'Producto'}</Text>
                    <Text style={styles.ticketItemQty}>{item.quantity}</Text>
                    <Text style={styles.ticketItemPrice}>{item.price.toFixed(2)}</Text>
                    <Text style={styles.ticketItemSubtotal}>{(item.quantity * item.price).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.ticketDivider} />

              {/* Total */}
              <View style={styles.ticketTotal}>
                <Text style={styles.ticketTotalLabel}>TOTAL:</Text>
                <Text style={styles.ticketTotalValue}>S/ {selectedSale.totalAmount.toFixed(2)}</Text>
              </View>

              <View style={styles.ticketDivider} />

              <Text style={styles.ticketFooter}>¡Gracias por su compra!</Text>
              <Text style={styles.ticketFooterSmall}>Conserve su ticket</Text>
            </View>
          </ScrollView>

          <View style={styles.ticketActions}>
            <TouchableOpacity
              style={[styles.ticketActionButton, { backgroundColor: '#10B981' }]}
              onPress={() => handleShareTicket(selectedSale)}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="white" />
              <Text style={styles.ticketActionText}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ticketActionButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => handlePrintPDF(selectedSale)}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={20} color="white" />
              <Text style={styles.ticketActionText}>Descargar PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const generateTicketHTML = (sale: Sale) => {
    const itemsHTML = sale.items?.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName || 'Producto'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/ ${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">S/ ${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join('') || '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket de Venta</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #ccc; padding-bottom: 15px; }
            .brand { font-size: 24px; font-weight: bold; color: #3B82F6; }
            .subtitle { font-size: 12px; color: #666; }
            .info { margin: 15px 0; }
            .info-row { margin: 5px 0; font-size: 13px; }
            .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f5f5f5; padding: 10px 8px; text-align: left; font-size: 12px; }
            .total-row { background: #f0f9ff; }
            .total-label { font-size: 18px; font-weight: bold; }
            .total-value { font-size: 24px; font-weight: bold; color: #10B981; }
            .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #ccc; }
            .footer-thanks { font-size: 14px; color: #333; }
            .footer-small { font-size: 11px; color: #999; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">ELECTRO PIME</div>
            <div class="subtitle">Reparación de Electrodomésticos</div>
          </div>
          
          <div class="info">
            <div class="info-row"><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString()}</div>
            <div class="info-row"><strong>Ticket:</strong> #${sale.id.slice(0, 8).toUpperCase()}</div>
            <div class="info-row"><strong>Cliente:</strong> ${sale.customerFullName || sale.customerName || 'Cliente General'}</div>
            <div class="info-row"><strong>Método de Pago:</strong> ${PAYMENT_METHOD_LABELS[sale.paymentMethod]}</div>
          </div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">P.Unit.</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <table>
            <tr class="total-row">
              <td class="total-label" style="padding: 12px;">TOTAL:</td>
              <td class="total-value" style="padding: 12px; text-align: right;">S/ ${sale.totalAmount.toFixed(2)}</td>
            </tr>
          </table>
          
          <div class="footer">
            <div class="footer-thanks">¡Gracias por su compra!</div>
            <div class="footer-small">Conserve este ticket</div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintPDF = async (sale: Sale) => {
    try {
      const html = generateTicketHTML(sale);
      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Ticket de Venta',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('PDF Generado', `El archivo se guardó en: ${uri}`);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const handleShareTicket = async (sale: Sale) => {
    try {
      const html = generateTicketHTML(sale);
      const { uri } = await Print.printToFileAsync({ html });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Ticket de Venta',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('No disponible', 'La función de compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      console.error('Error sharing ticket:', error);
      Alert.alert('Error', 'No se pudo compartir el ticket');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando ventas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSales}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ventas</Text>
        <TouchableOpacity
          style={styles.newSaleButton}
          onPress={() => router.push('/sales/new')}
        >
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={styles.newSaleButtonText}>Nueva Venta</Text>
        </TouchableOpacity>
      </View>

      {renderMetrics()}
      {renderFilters()}

      <FlatList
        data={sales}
        renderItem={renderSaleCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.salesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cash-register" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay ventas</Text>
          </View>
        }
      />

      {renderSaleDetails()}
      {renderTicketModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  newSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newSaleButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  metricsContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  metricCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filterContainer: {
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
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
  salesList: {
    padding: 16,
    paddingBottom: 100,
  },
  saleCard: {
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
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  paymentText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  saleInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saleTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  actionButtons: {
    flexDirection: 'row',
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
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  footerButtonText: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: '#111827',
  },
  productQty: {
    fontSize: 12,
    color: '#6B7280',
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  // Ticket styles
  ticketContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  ticketHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  ticketContent: {
    flex: 1,
    padding: 16,
  },
  ticket: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketBrand: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ticketBrandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3B82F6',
    letterSpacing: 1,
  },
  ticketBrandSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  ticketDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  ticketInfo: {
    paddingVertical: 8,
  },
  ticketInfoText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 6,
  },
  ticketItems: {
    paddingVertical: 8,
  },
  ticketItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  ticketItemHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  ticketItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ticketItemName: {
    flex: 2,
    fontSize: 12,
    color: '#111827',
  },
  ticketItemQty: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  ticketItemPrice: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  ticketItemSubtotal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  ticketTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  ticketTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  ticketTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  ticketFooter: {
    textAlign: 'center',
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  ticketFooterSmall: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ticketActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  ticketActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SalesScreen;