import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Quote, CreateQuoteDto, Customer, RepairOrder } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import SearchableSelector from '../components/SearchableSelector';
import {
  colors,
  typography,
  spacing,
  radii,
  shadow,
  QUOTE_STATUS,
} from '../theme';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import SegmentedControl from '../components/ui/SegmentedControl';

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

interface QuoteItem {
  description: string;
  quantity: number;
  price: number;
}

// Fecha corta para listas: "10 mar"
function formatShortDate(iso: string): string {
  const date = new Date(iso);
  const month = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
  return `${date.getDate()} ${month}`;
}

// Urgencia calculada desde expiresAt (o validDays como fallback)
function getUrgency(quote: Quote): { text: string; color: string } | null {
  let expires: Date | null = null;
  if (quote.expiresAt) {
    expires = new Date(quote.expiresAt);
  } else if (quote.validDays != null) {
    expires = new Date(new Date(quote.createdAt).getTime() + quote.validDays * 24 * 60 * 60 * 1000);
  }
  if (!expires || isNaN(expires.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfExpiry = new Date(expires.getFullYear(), expires.getMonth(), expires.getDate());
  const days = Math.round((startOfExpiry.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

  if (days < 0) return { text: 'Vencido', color: colors.danger };
  if (days === 0) return { text: 'Vence hoy', color: colors.warning };
  if (days <= 3) return { text: `Vence en ${days} día${days === 1 ? '' : 's'}`, color: colors.warning };
  return { text: `Vence en ${days} días`, color: colors.textSecondary };
}

const BudgetsScreen = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for new quote
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState<RepairOrder | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<{
    customer?: string;
    order?: string;
    items?: string;
  }>({});

  // New item state
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [itemError, setItemError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await api.getQuotes();
      const sorted = data
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setQuotes(sorted);
    } catch (err: any) {
      console.error('Error fetching quotes:', err);
      setError(err.message || 'Error al cargar los presupuestos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchQuotes();
    } else {
      setLoading(false);
    }
  }, [user, fetchQuotes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchQuotes();
  }, [fetchQuotes]);

  const filteredQuotes = useMemo(() => {
    if (statusFilter === 'ALL') return quotes;
    return quotes.filter((q) => q.status === statusFilter);
  }, [quotes, statusFilter]);

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    if (query.length < 2) {
      return api.getCustomers();
    }
    return api.searchCustomers(query);
  };

  const searchRepairOrders = async (query: string): Promise<RepairOrder[]> => {
    try {
      const orders = await api.getRepairOrders();
      if (query.length < 2) return orders;
      const q = query.toLowerCase();
      return orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q)
      );
    } catch {
      return [];
    }
  };

  const addItem = () => {
    if (!newItemDescription.trim()) {
      setItemError('Escribe una descripción para el item');
      return;
    }
    if (!newItemPrice) {
      setItemError('Indica el precio del item');
      return;
    }

    const item: QuoteItem = {
      description: newItemDescription.trim(),
      quantity: parseInt(newItemQuantity) || 1,
      price: parseFloat(newItemPrice) || 0,
    };

    setQuoteItems([...quoteItems, item]);
    setNewItemDescription('');
    setNewItemQuantity('1');
    setNewItemPrice('');
    setItemError(null);
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  };

  const removeItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedRepairOrder(null);
    setQuoteItems([]);
    setNotes('');
    setNewItemDescription('');
    setNewItemQuantity('1');
    setNewItemPrice('');
    setFormErrors({});
    setItemError(null);
  };

  const handleCreateQuote = async () => {
    // Validación inline (sin Alert.alert centralizado)
    const errors: typeof formErrors = {};
    if (!selectedCustomer) errors.customer = 'Selecciona un cliente';
    if (!selectedRepairOrder) errors.order = 'Selecciona la orden de reparación';
    if (quoteItems.length === 0) errors.items = 'Agrega al menos un item al presupuesto';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar al técnico');
      return;
    }

    setSaving(true);
    try {
      const totalAmount = calculateTotal();

      const quoteData: CreateQuoteDto = {
        repairOrderId: selectedRepairOrder!.id,
        customerId: selectedCustomer!.id,
        technicianId: user.id,
        totalAmount,
        notes: notes.trim() || undefined,
        items: quoteItems.map((item) => ({
          quantity: item.quantity,
          price: item.price,
          description: item.description || undefined,
        })),
      };

      await api.createQuote(quoteData);
      setShowNewQuoteModal(false);
      resetForm();
      fetchQuotes();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el presupuesto');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveQuote = async (quote: Quote) => {
    try {
      await api.updateQuote(quote.id, { status: 'APPROVED' });
      fetchQuotes();
      setShowQuoteDetails(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo aprobar el presupuesto');
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    try {
      await api.updateQuote(quote.id, { status: 'REJECTED' });
      fetchQuotes();
      setShowQuoteDetails(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo rechazar el presupuesto');
    }
  };

  const handleDeleteQuote = (quote: Quote) => {
    Alert.alert(
      'Eliminar Presupuesto',
      '¿Está seguro que desea eliminar este presupuesto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteQuote(quote.id);
              fetchQuotes();
              setShowQuoteDetails(false);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const renderQuoteCard = (item: Quote) => {
    const status = QUOTE_STATUS[item.status as keyof typeof QUOTE_STATUS] || QUOTE_STATUS.PENDING;
    const urgency = getUrgency(item);
    const itemCount = item.items?.length || 0;
    const orderRef = item.repairOrderId ? ` · Orden #${item.repairOrderId.slice(0, 8).toUpperCase()}` : '';

    return (
      <Card
        key={item.id}
        accentColor={status.color}
        style={styles.quoteCard}
        onPress={() => {
          setSelectedQuote(item);
          setShowQuoteDetails(true);
        }}
      >
        <View style={styles.cardTopRow}>
          <StatusBadge label={status.label} color={status.color} soft={status.soft} />
          <Text style={styles.cardAmount} numberOfLines={1}>
            S/ {item.totalAmount?.toFixed(2) || '0.00'}
          </Text>
        </View>

        <Text style={styles.cardCustomer} numberOfLines={1}>
          {item.customer?.name || item.customerName || 'Cliente'}{orderRef}
        </Text>

        <View style={styles.cardBottomRow}>
          <View style={styles.cardBottomLeft}>
            <Text style={styles.cardCaption}>{itemCount} item{itemCount === 1 ? '' : 's'}</Text>
            {urgency && (
              <Text style={[styles.cardUrgency, { color: urgency.color }]}>· {urgency.text}</Text>
            )}
          </View>
          <Text style={styles.cardDate}>{formatShortDate(item.createdAt)}</Text>
        </View>
      </Card>
    );
  };

  const renderNewQuoteModal = () => (
    <Modal
      visible={showNewQuoteModal}
      animationType="slide"
      onRequestClose={() => setShowNewQuoteModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nuevo Presupuesto</Text>
          <TouchableOpacity
            onPress={() => setShowNewQuoteModal(false)}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* 01 · Cliente */}
          <View style={styles.formSection}>
            <SectionHeader title="01 · Cliente" />
            <SearchableSelector<Customer>
              label="Seleccionar Cliente"
              placeholder="Buscar cliente..."
              value={selectedCustomer}
              onSelect={(c) => {
                setSelectedCustomer(c);
                setFormErrors((prev) => ({ ...prev, customer: undefined }));
              }}
              searchFn={searchCustomers}
              renderItem={(c) => c.name}
              renderSubtitle={(c) => `Tel: ${c.phone}`}
              keyExtractor={(c) => c.id}
              required
            />
            {formErrors.customer && (
              <Text style={styles.inlineError}>{formErrors.customer}</Text>
            )}

            <View style={styles.selectorSpacer}>
              <SearchableSelector<RepairOrder>
                label="Orden de Reparación"
                placeholder="Buscar orden..."
                value={selectedRepairOrder}
                onSelect={(o) => {
                  setSelectedRepairOrder(o);
                  setFormErrors((prev) => ({ ...prev, order: undefined }));
                }}
                searchFn={searchRepairOrders}
                renderItem={(o) => `#${o.id.slice(0, 8)} - ${o.description?.slice(0, 25) || 'Sin descripción'}...`}
                renderSubtitle={(o) => o.customerName || o.customer?.name || 'Sin cliente'}
                keyExtractor={(o) => o.id}
                required
              />
            </View>
            {formErrors.order && <Text style={styles.inlineError}>{formErrors.order}</Text>}
          </View>

          {/* 02 · Items */}
          <View style={styles.formSection}>
            <SectionHeader title="02 · Items / Repuestos" />

            {quoteItems.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemCardInfo}>
                  <Text style={styles.itemCardTitle} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={styles.itemCardMeta}>
                    {item.quantity} x S/ {item.price.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemCardSubtotal}>
                  S/ {(item.quantity * item.price).toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.itemDelete}
                  onPress={() => removeItem(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addForm}>
              <Text style={styles.fieldLabel}>DESCRIPCIÓN</Text>
              <TextInput
                style={styles.input}
                placeholder="Descripción del item"
                placeholderTextColor={colors.textMuted}
                value={newItemDescription}
                onChangeText={(v) => {
                  setNewItemDescription(v);
                  setItemError(null);
                }}
              />
              <View style={styles.addRow}>
                <View style={styles.qtyField}>
                  <Text style={styles.fieldLabel}>CANT.</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor={colors.textMuted}
                    value={newItemQuantity}
                    onChangeText={setNewItemQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.priceField}>
                  <Text style={styles.fieldLabel}>PRECIO</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    value={newItemPrice}
                    onChangeText={(v) => {
                      setNewItemPrice(v);
                      setItemError(null);
                    }}
                    keyboardType="decimal-pad"
                  />
                </View>
                <TouchableOpacity style={styles.addIconButton} onPress={addItem} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
              {itemError && <Text style={styles.inlineError}>{itemError}</Text>}
            </View>
            {formErrors.items && <Text style={styles.inlineError}>{formErrors.items}</Text>}
          </View>

          {/* 03 · Resumen */}
          <View style={styles.formSection}>
            <SectionHeader title="03 · Resumen" />
            <Text style={styles.fieldLabel}>NOTAS</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Notas adicionales..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.breakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Subtotal</Text>
                <Text style={styles.breakdownValue}>S/ {calculateTotal().toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTotalLabel}>Total</Text>
                <Text style={styles.breakdownTotalValue}>S/ {calculateTotal().toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky footer: total en vivo + guardar */}
        <View style={styles.stickyFooter}>
          <View>
            <Text style={styles.footerTotalLabel}>TOTAL</Text>
            <Text style={styles.footerTotalValue}>S/ {calculateTotal().toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleCreateQuote}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderQuoteDetails = () => {
    if (!selectedQuote) return null;
    const status = QUOTE_STATUS[selectedQuote.status as keyof typeof QUOTE_STATUS] || QUOTE_STATUS.PENDING;
    const customerName = selectedQuote.customer?.name || selectedQuote.customerName || 'Cliente';

    return (
      <Modal
        visible={showQuoteDetails}
        animationType="slide"
        onRequestClose={() => setShowQuoteDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Presupuesto #{selectedQuote.id.slice(0, 8).toUpperCase()}
            </Text>
            <TouchableOpacity
              onPress={() => setShowQuoteDetails(false)}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Cabecera documento */}
            <Card style={styles.docHeader}>
              <View style={styles.docTopRow}>
                <StatusBadge label={status.label} color={status.color} soft={status.soft} />
                <Text style={styles.docDate}>
                  {new Date(selectedQuote.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={styles.docCustomer}>{customerName}</Text>
              {selectedQuote.repairOrderId && (
                <Text style={styles.docOrder}>
                  Orden #{selectedQuote.repairOrderId.slice(0, 8).toUpperCase()}
                </Text>
              )}
              <Text style={styles.docAmount}>
                S/ {selectedQuote.totalAmount?.toFixed(2) || '0.00'}
              </Text>
            </Card>

            {/* Tabla de items */}
            <Card style={styles.docSection}>
              <SectionHeader title="Items" />
              {selectedQuote.items && selectedQuote.items.length > 0 ? (
                selectedQuote.items.map((item: any, index: number) => {
                  const itemPrice = item.unitPrice ?? item.price ?? 0;
                  return (
                    <View key={index} style={styles.docItemRow}>
                      <View style={styles.docItemInfo}>
                        <Text style={styles.docItemName}>
                          {item.description || item.productName || 'Item'}
                        </Text>
                        <Text style={styles.docItemMeta}>
                          {item.quantity} x S/ {Number(itemPrice).toFixed(2)}
                        </Text>
                      </View>
                      <Text style={styles.docItemSubtotal}>
                        S/ {(item.quantity * itemPrice).toFixed(2)}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.docItemMeta}>Sin items registrados</Text>
              )}

              {selectedQuote.laborCost > 0 && (
                <View style={styles.docItemRow}>
                  <Text style={styles.docItemName}>Mano de obra</Text>
                  <Text style={styles.docItemSubtotal}>S/ {selectedQuote.laborCost.toFixed(2)}</Text>
                </View>
              )}
            </Card>

            {/* Total en banda */}
            <View style={styles.totalBand}>
              <Text style={styles.totalBandLabel}>Total</Text>
              <Text style={styles.totalBandValue}>
                S/ {selectedQuote.totalAmount?.toFixed(2) || '0.00'}
              </Text>
            </View>

            {/* Notas */}
            {selectedQuote.notes && (
              <Card style={styles.docSection}>
                <SectionHeader title="Notas" />
                <View style={styles.notesBlock}>
                  <Text style={styles.notesText}>{selectedQuote.notes}</Text>
                </View>
              </Card>
            )}
          </ScrollView>

          {/* Footer fijo: Aprobar / Rechazar */}
          <View style={styles.detailFooter}>
            {selectedQuote.status === 'PENDING' && (
              <>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectQuote(selectedQuote)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.danger} />
                  <Text style={styles.rejectButtonText}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApproveQuote(selectedQuote)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.white} />
                  <Text style={styles.approveButtonText}>Aprobar</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteQuote(selectedQuote)}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando presupuestos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuotes} activeOpacity={0.85}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filterLabel =
    statusFilter === 'PENDING'
      ? 'pendientes'
      : statusFilter === 'APPROVED'
      ? 'aprobados'
      : statusFilter === 'REJECTED'
      ? 'rechazados'
      : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Presupuestos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewQuoteModal(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <SegmentedControl<StatusFilter>
          options={[
            { value: 'PENDING', label: 'Pendientes' },
            { value: 'APPROVED', label: 'Aprobados' },
            { value: 'REJECTED', label: 'Rechazados' },
            { value: 'ALL', label: 'Todos' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </View>

      <FlatList
        data={filteredQuotes}
        renderItem={({ item }) => renderQuoteCard(item)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            {quotes.length === 0 ? (
              <EmptyState
                icon="file-document-outline"
                title="No hay presupuestos"
                description="Los presupuestos que crees para tus clientes aparecerán aquí."
                ctaLabel="Crear primer presupuesto"
                onCta={() => setShowNewQuoteModal(true)}
              />
            ) : (
              <EmptyState
                icon="file-document-outline"
                title={`Sin presupuestos ${filterLabel}`}
                description="No hay presupuestos con este estado."
                ctaLabel="Ver todos"
                onCta={() => setStatusFilter('ALL')}
              />
            )}
          </Card>
        }
      />

      {renderNewQuoteModal()}
      {renderQuoteDetails()}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.button,
    gap: spacing.xs,
    ...shadow,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },

  // Filtros
  filterContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Lista
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  quoteCard: {
    marginBottom: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardAmount: {
    ...typography.display,
    fontSize: 20,
    flexShrink: 0,
    textAlign: 'right',
  },
  cardCustomer: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardBottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  cardCaption: {
    ...typography.caption,
  },
  cardUrgency: {
    ...typography.caption,
    fontWeight: '600',
  },
  cardDate: {
    ...typography.caption,
    flexShrink: 0,
  },
  emptyCard: {
    marginTop: spacing.lg,
  },

  // Modal base
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
    flex: 1,
    marginRight: spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },

  // Formulario 3 pasos
  formSection: {
    marginBottom: spacing.xxl,
  },
  selectorSpacer: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    ...typography.micro,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inlineError: {
    marginTop: spacing.sm,
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  addForm: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radii.card,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  qtyField: {
    width: 64,
  },
  priceField: {
    width: 88,
  },
  addIconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  itemCardInfo: {
    flex: 1,
  },
  itemCardTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  itemCardMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  itemCardSubtotal: {
    ...typography.bodyStrong,
    color: colors.success,
    flexShrink: 0,
  },
  itemDelete: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
  },
  breakdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  breakdownLabel: {
    ...typography.body,
  },
  breakdownValue: {
    ...typography.bodyStrong,
  },
  breakdownTotalLabel: {
    ...typography.bodyStrong,
  },
  breakdownTotalValue: {
    ...typography.title,
    fontSize: 20,
    color: colors.success,
  },
  stickyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.lg,
    ...shadow,
  },
  footerTotalLabel: {
    ...typography.micro,
  },
  footerTotalValue: {
    ...typography.title,
    fontSize: 22,
    color: colors.success,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: 14,
    borderRadius: radii.button,
    gap: spacing.sm,
    minHeight: 48,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // Detalle documento
  docHeader: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  docTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  docDate: {
    ...typography.caption,
    flexShrink: 0,
  },
  docCustomer: {
    ...typography.title,
    marginBottom: 2,
  },
  docOrder: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  docAmount: {
    ...typography.display,
    fontSize: 32,
    color: colors.success,
  },
  docSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  docItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  docItemInfo: {
    flex: 1,
  },
  docItemName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  docItemMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  docItemSubtotal: {
    ...typography.bodyStrong,
    flexShrink: 0,
  },
  totalBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  totalBandLabel: {
    ...typography.bodyStrong,
    color: colors.success,
  },
  totalBandValue: {
    ...typography.title,
    fontSize: 22,
    color: colors.success,
  },
  notesBlock: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    padding: spacing.md,
  },
  notesText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Footer fijo detalle
  detailFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
    ...shadow,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  rejectButtonText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 15,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.success,
    gap: spacing.xs,
  },
  approveButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  deleteButton: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.dangerSoft,
  },
});

export default BudgetsScreen;
