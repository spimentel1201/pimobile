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
import { Sale } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import {
  colors,
  typography,
  spacing,
  radii,
  shadow,
  PAYMENT_METHOD,
  PaymentMethod,
} from '../theme';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import SectionHeader from '../components/ui/SectionHeader';
import MetricCard from '../components/ui/MetricCard';
import EmptyState from '../components/ui/EmptyState';
import SegmentedControl from '../components/ui/SegmentedControl';

type DateFilter = 'today' | 'week' | 'month' | 'all';

// Fecha relativa: "Hoy 14:22", "Ayer", "3 mar"
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
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

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
      // Sort sales by createdAt descending (newest first)
      const sortedData = data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSales(sortedData);
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

  const handleViewInvoice = (sale: Sale) => {
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
    <View style={styles.metricsGrid}>
      <MetricCard
        variant="hero"
        label="TOTAL VENTAS"
        value={`S/ ${metrics.total.toFixed(2)}`}
        icon="cash-multiple"
        style={styles.metricsHero}
      />
      <View style={styles.metricsRow}>
        <MetricCard label="TRANSACCIONES" value={String(metrics.count)} icon="receipt" />
        <MetricCard
          label="TICKET PROMEDIO"
          value={`S/ ${metrics.avgTicket.toFixed(2)}`}
          icon="chart-line"
        />
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <SegmentedControl<DateFilter>
        options={[
          { value: 'today', label: 'Hoy' },
          { value: 'week', label: 'Semana' },
          { value: 'month', label: 'Mes' },
          { value: 'all', label: 'Todas' },
        ]}
        value={dateFilter}
        onChange={setDateFilter}
      />
    </View>
  );

  const renderSaleCard = ({ item }: { item: Sale }) => {
    const method = PAYMENT_METHOD[item.paymentMethod as PaymentMethod];
    const customer = item.customerFullName || item.customerName || 'Cliente General';
    const itemCount = item.items?.length || 0;

    return (
      <Card
        style={styles.saleCard}
        accentColor={method?.color ?? colors.borderStrong}
        onPress={() => {
          setSelectedSale(item);
          setShowDetails(true);
        }}
      >
        {/* Fila 1: método de pago + monto héroe */}
        <View style={styles.saleTopRow}>
          {method ? (
            <StatusBadge label={method.label} color={method.color} soft={method.soft} />
          ) : (
            <StatusBadge
              label={String(item.paymentMethod)}
              color={colors.textSecondary}
              soft={colors.surfaceMuted}
            />
          )}
          <Text style={styles.saleAmount}>S/ {item.totalAmount.toFixed(2)}</Text>
        </View>

        {/* Fila 2: cliente como protagonista secundario */}
        <Text style={styles.saleCustomer} numberOfLines={1}>
          {customer}
        </Text>

        {/* Fila 3: ID + productos en caption */}
        <Text style={styles.saleMetaRow} numberOfLines={1}>
          #{item.id.slice(0, 8).toUpperCase()}
          {' · '}
          {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
        </Text>

        {/* Fila 4: fecha relativa + acciones de contorno etiquetadas */}
        <View style={styles.saleBottomRow}>
          <View style={styles.saleDate}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
            <Text style={styles.saleDateText} numberOfLines={1}>
              {formatRelativeDate(item.createdAt)}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleViewInvoice(item)}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="file-document-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.actionButtonText}>Detalle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePrintTicket(item)}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="printer" size={16} color={colors.textSecondary} />
              <Text style={styles.actionButtonText}>Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

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
            <Text style={styles.modalTitle}>Venta #{selectedSale.id.slice(0, 8).toUpperCase()}</Text>
            <TouchableOpacity
              onPress={() => setShowDetails(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailSection}>
              <SectionHeader title="Información general" />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cliente</Text>
                <Text style={styles.detailValue}>
                  {selectedSale.customerFullName || selectedSale.customerName || 'Cliente General'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendedor</Text>
                <Text style={styles.detailValue}>{selectedSale.userName || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método de pago</Text>
                <Text style={styles.detailValue}>
                  {PAYMENT_METHOD[selectedSale.paymentMethod as PaymentMethod]?.label || selectedSale.paymentMethod}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedSale.createdAt).toLocaleString()}
                </Text>
              </View>
            </Card>

            <Card style={styles.detailSection}>
              <SectionHeader title="Productos" />
              {selectedSale.items?.map((item, index) => (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.productName || 'Producto'}</Text>
                    <Text style={styles.productQty}>
                      {item.quantity} x S/ {item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.productTotal}>S/ {(item.quantity * item.price).toFixed(2)}</Text>
                </View>
              ))}
            </Card>

            <View style={styles.totalBand}>
              <Text style={styles.totalBandLabel}>Total</Text>
              <Text style={styles.totalBandValue}>S/ {selectedSale.totalAmount.toFixed(2)}</Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.footerButton}
              activeOpacity={0.85}
              onPress={() => {
                setShowDetails(false);
                handlePrintTicket(selectedSale);
              }}
            >
              <MaterialCommunityIcons name="printer" size={20} color={colors.white} />
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
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowTicket(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ticket de Venta</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.ticketContent}>
            <View style={styles.ticket}>
              {/* Ticket Header */}
              <View style={styles.ticketBrand}>
                <Text style={styles.ticketBrandName}>ELECTRONICA PIMENTEL</Text>
                <Text style={styles.ticketBrandSubtitle}>Reparación de Electrodomésticos en general y venta de componentes electrónicos</Text>
              </View>

              <View style={styles.ticketDivider} />

              <View style={styles.ticketInfo}>
                <Text style={styles.ticketInfoText}>Fecha: {new Date(selectedSale.createdAt).toLocaleString()}</Text>
                <Text style={styles.ticketInfoText}>Ticket: #{selectedSale.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.ticketInfoText}>Cliente: {selectedSale.customerFullName || selectedSale.customerName || 'Cliente General'}</Text>
                <Text style={styles.ticketInfoText}>Método: {PAYMENT_METHOD[selectedSale.paymentMethod as PaymentMethod]?.label || selectedSale.paymentMethod}</Text>
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
              style={[styles.ticketActionButton, { backgroundColor: colors.success }]}
              activeOpacity={0.85}
              onPress={() => handleShareTicket(selectedSale)}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color={colors.white} />
              <Text style={styles.ticketActionText}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ticketActionButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => handlePrintPDF(selectedSale)}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.white} />
              <Text style={styles.ticketActionText}>Descargar PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const generateTicketHTML = (sale: Sale) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recibo de Venta</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
            body { font-family: 'Roboto', Helvetica, Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; background: #fff; color: #333; }

            .header { text-align: center; margin-bottom: 30px; }
            .logo-placeholder { width: 48px; height: 48px; background: #EFF4FF; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: #1D4ED8; font-weight: bold; font-size: 24px; }
            .company-name { font-size: 22px; font-weight: 900; color: #1D4ED8; text-transform: uppercase; margin-bottom: 5px; letter-spacing: -0.5px; }
            .company-details { font-size: 10px; color: #98A2B3; line-height: 1.4; max-width: 80%; margin: 0 auto; }

            .receipt-title { margin-top: 25px; text-align: center; }
            .receipt-label { font-size: 18px; font-weight: 900; color: #101828; text-transform: uppercase; margin-bottom: 2px; }
            .receipt-no { font-size: 16px; font-weight: 700; color: #1D4ED8; margin-bottom: 5px; }
            .receipt-date { font-size: 10px; color: #98A2B3; text-transform: uppercase; font-weight: 500; }

            .section-divider { border-top: 1px dotted #E4E7EC; margin: 20px 0; }

            .info-block { margin-bottom: 15px; }
            .info-label { font-size: 10px; font-weight: 700; color: #98A2B3; text-transform: uppercase; margin-bottom: 3px; }
            .info-main { font-size: 13px; font-weight: 700; color: #101828; }
            .info-sub { font-size: 11px; color: #98A2B3; font-style: italic; }

            .table-title { font-size: 10px; font-weight: 700; color: #98A2B3; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 2px solid #1D4ED8; padding-bottom: 5px; display: inline-block; }

            .product-row { margin-bottom: 15px; }
            .sku-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
            .sku { font-size: 10px; font-weight: 700; color: #1D4ED8; }
            .badge { background: #F4F3FF; color: #5925DC; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
            .product-name { font-size: 13px; font-weight: 700; color: #101828; margin-bottom: 2px; }
            .price-row { display: flex; justify-content: space-between; font-size: 12px; color: #475467; }
            .price-total { font-weight: 700; color: #101828; }

            .summary-section { margin-top: 20px; border-top: 1px solid #E4E7EC; padding-top: 15px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; color: #475467; }
            .total-row { display: flex; justify-content: space-between; margin-top: 10px; align-items: center; border-top: 2px solid #1D4ED8; padding-top: 10px; }
            .total-label { font-size: 16px; font-weight: 900; color: #101828; text-transform: uppercase; }
            .total-value { font-size: 28px; font-weight: 900; color: #1D4ED8; }

            .warranty-box { margin-top: 30px; border: 1px dashed #E4E7EC; padding: 15px; border-radius: 8px; position: relative; }
            .warranty-title { display: flex; align-items: center; font-size: 10px; font-weight: 900; color: #1D4ED8; text-transform: uppercase; margin-bottom: 5px; }
            .warranty-text { font-size: 9px; color: #475467; line-height: 1.4; }

            .signatures { margin-top: 50px; border-top: 1px solid #E4E7EC; padding-top: 10px; text-align: center; }
            .sign-label { font-size: 9px; font-weight: 700; color: #98A2B3; text-transform: uppercase; letter-spacing: 0.5px; }

            .footer-strip { margin-top: 30px; background: #1D4ED8; color: #fff; text-align: center; padding: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-placeholder">EP</div>
            <div class="company-name">Electrónica Pimentel</div>
            <div class="company-details">
              Av. Principal 123, Lima<br>
              Tel: +51 555-123-456 • contacto@pimentel.com
            </div>
          </div>

          <div class="receipt-title">
            <div class="receipt-label">Recibo de Venta</div>
            <div class="receipt-no">No. ${sale.id.slice(0, 8).toUpperCase()}</div>
            <div class="receipt-date">${new Date(sale.createdAt).toLocaleDateString()} - ${new Date(sale.createdAt).toLocaleTimeString()}</div>
          </div>

          <div class="section-divider"></div>

          <div class="info-block">
            <div class="info-label">Facturado a:</div>
            <div class="info-main">${sale.customerFullName || sale.customerName || 'Cliente General'}</div>
          </div>

          <div class="info-block">
            <div class="info-label">Vendedor:</div>
            <div class="info-main">${sale.userName || 'Administrador'}</div>
          </div>

          <div class="section-divider"></div>

          <div style="margin-bottom: 20px;">
            <div class="table-title">Detalle de Productos</div>
            ${sale.items?.map((item, i) => `
              <div class="product-row">
                <div class="sku-row">
                  <span class="sku">SKU-${item.productId?.slice(0, 4).toUpperCase() || 'GEN'}</span>
                  <span class="badge">REPUESTO</span>
                </div>
                <div class="product-name">${item.productName || 'Producto'}</div>
                <div class="price-row">
                  <span>${item.quantity} x S/ ${item.price.toFixed(2)}</span>
                  <span class="price-total">S/ ${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              </div>
            `).join('') || ''}
          </div>

          <div class="summary-section">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>S/ ${sale.totalAmount.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Impuestos (0%)</span>
              <span>S/ 0.00</span>
            </div>
            <div class="total-row">
              <span class="total-label">TOTAL</span>
              <span class="total-value">S/ ${sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="warranty-box">
            <div class="warranty-title">
              <span style="font-size: 14px; margin-right: 5px;">✓</span> GARANTÍA
            </div>
            <div class="warranty-text">
              Componentes electrónicos: garantía por defectos de fábrica (30 días). No aplica en semiconductores con rastros de soldadura o mala manipulación.
            </div>
          </div>

          <div class="signatures">
            <div class="sign-label">FIRMA AUTORIZADA</div>
          </div>

          <div class="footer-strip">
            Gracias por su compra. Expertos desde 2010.
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintPDF = async (sale: Sale) => {
    try {
      const html = generateTicketHTML(sale);

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          const timer = setInterval(() => {
            if (printWindow.document.readyState === 'complete') {
              clearInterval(timer);
              printWindow.focus();
              printWindow.print();
            }
          }, 100);
        } else {
          Alert.alert('Error', 'Por favor permite las ventanas emergentes para imprimir el ticket.');
        }
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
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
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const handleShareTicket = async (sale: Sale) => {
    try {
      const html = generateTicketHTML(sale);

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          const timer = setInterval(() => {
            if (printWindow.document.readyState === 'complete') {
              clearInterval(timer);
              printWindow.focus();
              printWindow.print();
            }
          }, 100);
        } else {
          Alert.alert('Error', 'Por favor permite las ventanas emergentes para compartir el ticket.');
        }
        return;
      }

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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando ventas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSales} activeOpacity={0.85}>
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
          activeOpacity={0.85}
          onPress={() => router.push('/sales/new' as never)}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="cash-register"
              title="No hay ventas"
              description={
                dateFilter === 'all'
                  ? 'Las ventas que registres aparecerán aquí.'
                  : 'No hay ventas en el período seleccionado.'
              }
              ctaLabel="Registrar venta"
              onCta={() => router.push('/sales/new' as never)}
            />
          </Card>
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
    backgroundColor: colors.canvas,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.canvas,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.button,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 20,
  },
  newSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.button,
    gap: spacing.xs,
    ...shadow,
  },
  newSaleButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },

  // KPIs jerarquizados
  metricsGrid: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  metricsHero: {
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // Filtros
  filterContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },

  // Lista de ventas
  salesList: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  saleCard: {
    marginBottom: spacing.md,
  },
  saleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  saleAmount: {
    ...typography.display,
    fontSize: 24,
    color: colors.success,
    letterSpacing: -0.5,
  },
  saleCustomer: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  saleMetaRow: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  saleBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  saleDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  saleDateText: {
    ...typography.caption,
    flexShrink: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyCard: {
    marginTop: spacing.lg,
  },

  // Modal detalle
  modalContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.title,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalFooter: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  footerButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  detailSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
  },
  detailValue: {
    ...typography.bodyStrong,
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'right',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  productName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  productQty: {
    ...typography.caption,
  },
  productTotal: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  totalBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalBandLabel: {
    ...typography.title,
  },
  totalBandValue: {
    ...typography.display,
    fontSize: 24,
    color: colors.success,
  },

  // Ticket (estética de recibo conservada, tokens migrados)
  ticketContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  ticketContent: {
    flex: 1,
    padding: spacing.lg,
  },
  ticket: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  ticketBrand: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  ticketBrandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
  },
  ticketBrandSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  ticketDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
    marginVertical: spacing.md,
  },
  ticketInfo: {
    paddingVertical: spacing.sm,
  },
  ticketInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  ticketItems: {
    paddingVertical: spacing.sm,
  },
  ticketItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ticketItemHeaderText: {
    ...typography.micro,
    textTransform: 'none',
    flex: 1,
    textAlign: 'center',
  },
  ticketItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ticketItemName: {
    flex: 2,
    fontSize: 12,
    color: colors.textPrimary,
  },
  ticketItemQty: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ticketItemPrice: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ticketItemSubtotal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  ticketTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  ticketTotalLabel: {
    ...typography.title,
  },
  ticketTotalValue: {
    ...typography.display,
    fontSize: 24,
    color: colors.success,
  },
  ticketFooter: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  ticketFooterSmall: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 32,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ticketActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.button,
    gap: spacing.sm,
  },
  ticketActionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SalesScreen;
