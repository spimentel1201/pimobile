import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../services/api';
import { Sale, PaymentMethod } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { FilterChip } from '../components/ui/FilterChip';
import { spacing, typography, radii, shadows, colors } from '../../constants/theme';

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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.metricsContainer, { backgroundColor: theme.surface }]}>
      <Card variant="flat" padding={spacing.base} style={styles.metricCard}>
        <MaterialCommunityIcons name="cash-multiple" size={24} color={colors.success} />
        <Text style={[styles.metricValue, { color: theme.text }]}>S/ {metrics.total.toFixed(2)}</Text>
        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Ventas</Text>
      </Card>
      <Card variant="flat" padding={spacing.base} style={styles.metricCard}>
        <MaterialCommunityIcons name="receipt" size={24} color={colors.primary} />
        <Text style={[styles.metricValue, { color: theme.text }]}>{metrics.count}</Text>
        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>N° Transacciones</Text>
      </Card>
      <Card variant="flat" padding={spacing.base} style={styles.metricCard}>
        <MaterialCommunityIcons name="chart-line" size={24} color={colors.warning} />
        <Text style={[styles.metricValue, { color: theme.text }]}>S/ {metrics.avgTicket.toFixed(2)}</Text>
        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Ticket Promedio</Text>
      </Card>
    </ScrollView>
  );

  const renderFilters = () => (
    <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'today', label: 'Hoy' },
          { key: 'week', label: 'Semana' },
          { key: 'month', label: 'Mes' },
          { key: 'all', label: 'Todas' },
        ].map((filter) => (
          <FilterChip
            key={filter.key}
            label={filter.label}
            selected={dateFilter === filter.key}
            onPress={() => setDateFilter(filter.key as typeof dateFilter)}
            style={{ marginRight: spacing.sm }}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderSaleCard = ({ item, index }: { item: Sale; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          setSelectedSale(item);
          setShowDetails(true);
        }}
      >
        <Card variant="elevated" padding={spacing.base} style={{ marginBottom: spacing.md }}>
          <View style={styles.saleHeader}>
            <Text style={[styles.saleId, { color: theme.primary }]}>#{item.id.slice(0, 8)}</Text>
            <View style={styles.paymentBadge}>
              <MaterialCommunityIcons
                name={PAYMENT_METHOD_ICONS[item.paymentMethod] as any}
                size={14}
                color={theme.primary}
              />
              <Badge label={PAYMENT_METHOD_LABELS[item.paymentMethod]} variant="primary" />
            </View>
          </View>

          <View style={styles.saleInfo}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account" size={18} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>{item.customerFullName || item.customerName || 'Cliente General'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={18} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="package-variant" size={18} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>{item.items?.length || 0} productos</Text>
            </View>
          </View>

          <View style={[styles.saleFooter, { borderTopColor: theme.borderLight }]}>
            <Text style={[styles.saleTotal, { color: colors.success }]}>S/ {item.totalAmount.toFixed(2)}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={() => handleViewInvoice(item)}
              >
                <MaterialCommunityIcons name="file-document" size={18} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={() => handlePrintTicket(item)}
              >
                <MaterialCommunityIcons name="printer" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSaleDetails = () => {
    if (!selectedSale) return null;

    return (
      <Modal
        visible={showDetails}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Venta #{selectedSale.id.slice(0, 8)}</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Card variant="outlined" padding={spacing.base} style={{ marginBottom: spacing.md }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Información General</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Cliente:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {selectedSale.customerFullName || selectedSale.customerName || 'Cliente General'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Vendedor:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{selectedSale.userName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Método de Pago:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{PAYMENT_METHOD_LABELS[selectedSale.paymentMethod]}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Fecha:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {new Date(selectedSale.createdAt).toLocaleString()}
                </Text>
              </View>
            </Card>

            <Card variant="outlined" padding={spacing.base} style={{ marginBottom: spacing.md }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Productos</Text>
              {selectedSale.items?.map((item, index) => (
                <View key={index} style={[styles.productItem, { borderBottomColor: theme.borderLight }]}>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: theme.text }]}>{item.productName || 'Producto'}</Text>
                    <Text style={[styles.productQty, { color: theme.textSecondary }]}>{item.quantity} x S/ {item.price.toFixed(2)}</Text>
                  </View>
                  <Text style={[styles.productTotal, { color: theme.text }]}>S/ {(item.quantity * item.price).toFixed(2)}</Text>
                </View>
              ))}
            </Card>

            <Card variant="outlined" padding={spacing.base}>
              <View style={styles.totalSection}>
                <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.success }]}>S/ {selectedSale.totalAmount.toFixed(2)}</Text>
              </View>
            </Card>
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Button
              title="Ver Ticket"
              variant="success"
              onPress={() => {
                setShowDetails(false);
                handlePrintTicket(selectedSale);
              }}
              icon={<MaterialCommunityIcons name="printer" size={20} color={colors.white} />}
              fullWidth
            />
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
        <View style={[styles.ticketContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.ticketHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
            <TouchableOpacity onPress={() => setShowTicket(false)}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.ticketHeaderTitle, { color: theme.text }]}>Ticket de Venta</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.ticketContent}>
            <Card variant="elevated" padding={spacing.lg}>
              {/* Ticket Header */}
              <View style={styles.ticketBrand}>
                <Text style={[styles.ticketBrandName, { color: theme.primary }]}>ELECTRONICA PIMENTEL</Text>
                <Text style={[styles.ticketBrandSubtitle, { color: theme.textSecondary }]}>Reparación de Electrodomésticos en general y venta de componentes electrónicos</Text>
              </View>

              <View style={[styles.ticketDivider, { borderBottomColor: theme.border }]} />

              <View style={styles.ticketInfo}>
                <Text style={[styles.ticketInfoText, { color: theme.textSecondary }]}>Fecha: {new Date(selectedSale.createdAt).toLocaleString()}</Text>
                <Text style={[styles.ticketInfoText, { color: theme.textSecondary }]}>Ticket: #{selectedSale.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={[styles.ticketInfoText, { color: theme.textSecondary }]}>Cliente: {selectedSale.customerFullName || selectedSale.customerName || 'Cliente General'}</Text>
                <Text style={[styles.ticketInfoText, { color: theme.textSecondary }]}>Método: {PAYMENT_METHOD_LABELS[selectedSale.paymentMethod]}</Text>
              </View>

              <View style={[styles.ticketDivider, { borderBottomColor: theme.border }]} />

              {/* Items */}
              <View style={styles.ticketItems}>
                <View style={[styles.ticketItemHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.ticketItemHeaderText, { color: theme.textSecondary }]}>ITEM</Text>
                  <Text style={[styles.ticketItemHeaderText, { color: theme.textSecondary }]}>CANT</Text>
                  <Text style={[styles.ticketItemHeaderText, { color: theme.textSecondary }]}>P.U</Text>
                  <Text style={[styles.ticketItemHeaderText, { color: theme.textSecondary }]}>TOTAL</Text>
                </View>
                {selectedSale.items?.map((item, index) => (
                  <View key={index} style={[styles.ticketItemRow, { borderBottomColor: theme.borderLight }]}>
                    <Text style={[styles.ticketItemName, { color: theme.text }]}>{item.productName || 'Producto'}</Text>
                    <Text style={[styles.ticketItemQty, { color: theme.textSecondary }]}>{item.quantity}</Text>
                    <Text style={[styles.ticketItemPrice, { color: theme.textSecondary }]}>{item.price.toFixed(2)}</Text>
                    <Text style={[styles.ticketItemSubtotal, { color: theme.text }]}>S/ {(item.quantity * item.price).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.ticketDivider, { borderBottomColor: theme.border }]} />

              {/* Total */}
              <View style={styles.ticketTotal}>
                <Text style={[styles.ticketTotalLabel, { color: theme.text }]}>TOTAL:</Text>
                <Text style={[styles.ticketTotalValue, { color: colors.success }]}>S/ {selectedSale.totalAmount.toFixed(2)}</Text>
              </View>

              <View style={[styles.ticketDivider, { borderBottomColor: theme.border }]} />

              <Text style={[styles.ticketFooter, { color: theme.textSecondary }]}>¡Gracias por su compra!</Text>
              <Text style={[styles.ticketFooterSmall, { color: theme.textMuted }]}>Conserve su ticket</Text>
            </Card>
          </ScrollView>

          <View style={[styles.ticketActions, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Button
                title="Compartir"
                variant="success"
                onPress={() => handleShareTicket(selectedSale)}
                icon={<MaterialCommunityIcons name="share-variant" size={20} color={colors.white} />}
                fullWidth
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Descargar PDF"
                variant="primary"
                onPress={() => handlePrintPDF(selectedSale)}
                icon={<MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.white} />}
                fullWidth
              />
            </View>
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
            .logo-placeholder { width: 48px; height: 48px; background: #E0E7FF; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: #2563EB; font-weight: bold; font-size: 24px; }
            .company-name { font-size: 22px; font-weight: 900; color: #2563EB; text-transform: uppercase; margin-bottom: 5px; letter-spacing: -0.5px; }
            .company-details { font-size: 10px; color: #6B7280; line-height: 1.4; max-width: 80%; margin: 0 auto; }
            
            .receipt-title { margin-top: 25px; text-align: center; }
            .receipt-label { font-size: 18px; font-weight: 900; color: #000; text-transform: uppercase; margin-bottom: 2px; }
            .receipt-no { font-size: 16px; font-weight: 700; color: #2563EB; margin-bottom: 5px; }
            .receipt-date { font-size: 10px; color: #6B7280; text-transform: uppercase; font-weight: 500; }
            
            .section-divider { border-top: 1px dotted #D1D5DB; margin: 20px 0; }
            
            .info-block { margin-bottom: 15px; }
            .info-label { font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 3px; }
            .info-main { font-size: 13px; font-weight: 700; color: #111827; }
            .info-sub { font-size: 11px; color: #6B7280; font-style: italic; }
            
            .table-title { font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 2px solid #2563EB; padding-bottom: 5px; display: inline-block; }
            
            .product-row { margin-bottom: 15px; }
            .sku-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
            .sku { font-size: 10px; font-weight: 700; color: #2563EB; }
            .badge { background: #EEF2FF; color: #4F46E5; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
            .product-name { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px; }
            .price-row { display: flex; justify-content: space-between; font-size: 12px; color: #4B5563; }
            .price-total { font-weight: 700; color: #000; }
            
            .summary-section { margin-top: 20px; border-top: 1px solid #E5E7EB; padding-top: 15px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; color: #6B7280; }
            .total-row { display: flex; justify-content: space-between; margin-top: 10px; align-items: center; border-top: 2px solid #2563EB; padding-top: 10px; }
            .total-label { font-size: 16px; font-weight: 900; color: #000; text-transform: uppercase; }
            .total-value { font-size: 28px; font-weight: 900; color: #2563EB; }
            
            .warranty-box { margin-top: 30px; border: 1px dashed #D1D5DB; padding: 15px; border-radius: 8px; position: relative; }
            .warranty-title { display: flex; align-items: center; font-size: 10px; font-weight: 900; color: #2563EB; text-transform: uppercase; margin-bottom: 5px; }
            .warranty-text { font-size: 9px; color: #6B7280; line-height: 1.4; }
            
            .signatures { margin-top: 50px; border-top: 1px solid #E5E7EB; padding-top: 10px; text-align: center; }
            .sign-label { font-size: 9px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }
            
            .footer-strip { margin-top: 30px; background: #2563EB; color: #fff; text-align: center; padding: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
          <SkeletonLoader lines={1} lineHeight={22} />
        </View>
        <SkeletonLoader lines={3} lineHeight={spacing.lg} borderRadius={radii.lg} />
        <SkeletonLoader lines={4} lineHeight={120} borderRadius={radii.lg} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Button
          title="Reintentar"
          variant="primary"
          onPress={fetchSales}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ventas</Text>
        <Button
          title="Nueva Venta"
          variant="success"
          size="sm"
          onPress={() => router.push('/sales/new')}
          icon={<MaterialCommunityIcons name="plus" size={20} color={colors.white} />}
        />
      </View>

      {renderMetrics()}
      {renderFilters()}

      <Animated.FlatList
        data={sales}
        renderItem={renderSaleCard}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.salesList, { paddingBottom: spacing['4xl'] + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="cash-register"
            title="No hay ventas"
            message="Las ventas aparecerán aquí una vez registradas"
          />
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  metricsContainer: {
    padding: spacing.base,
  },
  metricCard: {
    marginRight: spacing.md,
    minWidth: 140,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.sm,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  filterContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  salesList: {
    padding: spacing.base,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  saleId: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  saleInfo: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  saleTotal: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  actionButtons: {
    flexDirection: 'row',
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
    padding: spacing.base,
    borderTopWidth: 1,
  },
  detailSection: {
    padding: spacing.base,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
  },
  detailValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: typography.sizes.sm,
  },
  productQty: {
    fontSize: typography.sizes.xs,
  },
  productTotal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  totalValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  // Ticket styles
  ticketContainer: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  ticketHeaderTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  ticketContent: {
    flex: 1,
    padding: spacing.base,
  },
  ticket: {
    borderRadius: radii.lg,
  },
  ticketBrand: {
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  ticketBrandName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  ticketBrandSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  ticketDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: spacing.md,
  },
  ticketInfo: {
    paddingVertical: spacing.sm,
  },
  ticketInfoText: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  ticketItems: {
    paddingVertical: spacing.sm,
  },
  ticketItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  ticketItemHeaderText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    flex: 1,
    textAlign: 'center',
  },
  ticketItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  ticketItemName: {
    flex: 2,
    fontSize: typography.sizes.xs,
  },
  ticketItemQty: {
    flex: 1,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  ticketItemPrice: {
    flex: 1,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  ticketItemSubtotal: {
    flex: 1,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textAlign: 'right',
  },
  ticketTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  ticketTotalLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  ticketTotalValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  ticketFooter: {
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },
  ticketFooterSmall: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
  },
});

export default SalesScreen;
