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
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Quote, CreateQuoteDto, Customer, RepairOrder } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { colors, typography, spacing, radii, shadows } from '../../constants/theme';
import SearchableSelector from '../../components/SearchableSelector';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const QUOTE_STATUS = {
  PENDING: { label: 'Pendiente', color: colors.warning },
  APPROVED: { label: 'Aprobado', color: colors.success },
  REJECTED: { label: 'Rechazado', color: colors.error },
  EXPIRED: { label: 'Expirado', color: colors.gray[500] },
};

interface QuoteItem {
  description: string;
  quantity: number;
  price: number;
}

const BudgetsScreen = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for new quote
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState<RepairOrder | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState('');

  // New item state
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');

  // ConfirmDialog state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmVariant, setConfirmVariant] = useState<'danger' | 'warning' | 'info' | 'success'>('info');
  const [confirmLabel, setConfirmLabel] = useState('Confirmar');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const showConfirm = (
    title: string,
    message: string,
    variant: 'danger' | 'warning' | 'info' | 'success',
    action: () => void,
    label?: string,
  ) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmVariant(variant);
    setConfirmLabel(label || 'Confirmar');
    setConfirmAction(() => action);
    setConfirmVisible(true);
  };

  const fetchQuotes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await api.getQuotes();
      setQuotes(data);
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
      return orders.filter(o =>
        o.id.toLowerCase().includes(query.toLowerCase()) ||
        o.customer?.name?.toLowerCase().includes(query.toLowerCase()) ||
        o.description?.toLowerCase().includes(query.toLowerCase())
      );
    } catch {
      return [];
    }
  };

  const addItem = () => {
    if (!newItemDescription.trim() || !newItemPrice) {
      Alert.alert('Error', 'Complete la descripción y el precio');
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
  };

  const removeItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return quoteItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedRepairOrder(null);
    setQuoteItems([]);
    setNotes('');
    setNewItemDescription('');
    setNewItemQuantity('1');
    setNewItemPrice('');
  };

  const handleCreateQuote = async () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Seleccione un cliente');
      return;
    }

    if (!selectedRepairOrder) {
      Alert.alert('Error', 'Seleccione una orden de reparación');
      return;
    }

    if (quoteItems.length === 0) {
      Alert.alert('Error', 'Agregue al menos un item al presupuesto');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar al técnico');
      return;
    }

    setSaving(true);
    try {
      const totalAmount = calculateTotal();

      const quoteData: CreateQuoteDto = {
        repairOrderId: selectedRepairOrder.id,
        customerId: selectedCustomer.id,
        technicianId: user.id,
        totalAmount,
        notes: notes.trim() || undefined,
        items: quoteItems.map(item => ({
          quantity: item.quantity,
          price: item.price,
          description: item.description || undefined,
        })),
      };

      await api.createQuote(quoteData);
      showConfirm(
        'Presupuesto creado',
        'Presupuesto creado correctamente.',
        'success',
        () => {
          setConfirmVisible(false);
          setShowNewQuoteModal(false);
          resetForm();
          fetchQuotes();
        },
        'OK',
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el presupuesto');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveQuote = async (quote: Quote) => {
    try {
      await api.updateQuote(quote.id, { status: 'APPROVED' });
      showConfirm(
        'Presupuesto aprobado',
        'El presupuesto ha sido aprobado correctamente.',
        'success',
        () => {
          setConfirmVisible(false);
          fetchQuotes();
          setShowQuoteDetails(false);
        },
        'OK',
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo aprobar el presupuesto');
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    try {
      await api.updateQuote(quote.id, { status: 'REJECTED' });
      showConfirm(
        'Presupuesto rechazado',
        'El presupuesto ha sido rechazado.',
        'success',
        () => {
          setConfirmVisible(false);
          fetchQuotes();
          setShowQuoteDetails(false);
        },
        'OK',
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo rechazar el presupuesto');
    }
  };

  const handleDeleteQuote = (quote: Quote) => {
    showConfirm(
      'Eliminar Presupuesto',
      '¿Está seguro que desea eliminar este presupuesto? Esta acción no se puede deshacer.',
      'danger',
      async () => {
        try {
          await api.deleteQuote(quote.id);
          setConfirmVisible(false);
          showConfirm(
            'Presupuesto eliminado',
            'El presupuesto ha sido eliminado correctamente.',
            'success',
            () => {
              setConfirmVisible(false);
              fetchQuotes();
              setShowQuoteDetails(false);
            },
            'OK',
          );
        } catch (err: any) {
          setConfirmVisible(false);
          Alert.alert('Error', err.message || 'No se pudo eliminar');
        }
      },
      'Eliminar',
    );
  };

  const renderQuoteCard = ({ item }: { item: Quote }) => {
    const status = QUOTE_STATUS[item.status as keyof typeof QUOTE_STATUS] || QUOTE_STATUS.PENDING;

    return (
      <TouchableOpacity
        style={[styles.quoteCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => {
          setSelectedQuote(item);
          setShowQuoteDetails(true);
        }}
      >
        <View style={styles.quoteHeader}>
          <Text style={[styles.quoteId, { color: theme.primary }]}>#{item.id.slice(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>
        <Text style={[styles.customerName, { color: theme.text }]}>{item.customer?.name || item.customerName || 'Cliente'}</Text>
        <View style={styles.quoteInfo}>
          <Text style={[styles.quoteTotal, { color: theme.success }]}>S/ {item.totalAmount?.toFixed(2) || '0.00'}</Text>
          <Text style={[styles.quoteDate, { color: theme.textMuted }]}>
            {new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNewQuoteModal = () => (
    <Modal
      visible={showNewQuoteModal}
      animationType="slide"
      onRequestClose={() => setShowNewQuoteModal(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Nuevo Presupuesto</Text>
          <TouchableOpacity onPress={() => setShowNewQuoteModal(false)}>
            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Customer Selection */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cliente *</Text>
            <SearchableSelector<Customer>
              label="Seleccionar Cliente"
              placeholder="Buscar cliente..."
              value={selectedCustomer}
              onSelect={setSelectedCustomer}
              searchFn={searchCustomers}
              renderItem={(c) => c.name}
              renderSubtitle={(c) => `Tel: ${c.phone}`}
              keyExtractor={(c) => c.id}
              required
            />
          </View>

          {/* Repair Order Selection */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Orden de Reparación (Opcional)</Text>
            <SearchableSelector<RepairOrder>
              label="Vincular a Orden"
              placeholder="Buscar orden..."
              value={selectedRepairOrder}
              onSelect={setSelectedRepairOrder}
              searchFn={searchRepairOrders}
              renderItem={(o) => `#${o.id.slice(0, 8)} - ${o.description?.slice(0, 25) || 'Sin descripción'}...`}
              renderSubtitle={(o) => o.customer?.name || 'Sin cliente'}
              keyExtractor={(o) => o.id}
            />
          </View>

          {/* Items */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Items / Repuestos</Text>

            {quoteItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemDescription, { color: theme.text }]}>{item.description}</Text>
                  <Text style={[styles.itemPrice, { color: theme.textSecondary }]}>
                    {item.quantity} x S/ {item.price.toFixed(2)} = S/ {(item.quantity * item.price).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <MaterialCommunityIcons name="delete" size={24} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.addItemForm, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, styles.flexInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Descripción del item"
                placeholderTextColor={theme.textMuted}
                value={newItemDescription}
                onChangeText={setNewItemDescription}
              />
              <View style={styles.itemInputRow}>
                <TextInput
                  style={[styles.input, styles.smallInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="Cant."
                  placeholderTextColor={theme.textMuted}
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.smallInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="Precio"
                  placeholderTextColor={theme.textMuted}
                  value={newItemPrice}
                  onChangeText={setNewItemPrice}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={[styles.addItemButton, { backgroundColor: theme.primary }]} onPress={addItem}>
                  <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notas</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Notas adicionales..."
              placeholderTextColor={theme.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Total */}
          <View style={[styles.totalSection, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.totalLabel, { color: theme.primary }]}>TOTAL:</Text>
            <Text style={[styles.totalAmount, { color: theme.primary }]}>S/ {calculateTotal().toFixed(2)}</Text>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.footerButton, styles.cancelButton, { backgroundColor: theme.surfaceVariant }]}
            onPress={() => setShowNewQuoteModal(false)}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerButton, styles.saveButton, { backgroundColor: theme.primary }, saving && styles.buttonDisabled]}
            onPress={handleCreateQuote}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderQuoteDetails = () => {
    if (!selectedQuote) return null;
    const status = QUOTE_STATUS[selectedQuote.status as keyof typeof QUOTE_STATUS] || QUOTE_STATUS.PENDING;

    return (
      <Modal
        visible={showQuoteDetails}
        animationType="slide"
        onRequestClose={() => setShowQuoteDetails(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Presupuesto #{selectedQuote.id.slice(0, 8)}</Text>
            <TouchableOpacity onPress={() => setShowQuoteDetails(false)}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
              <View style={styles.detailHeader}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Estado:</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                  <Text style={styles.statusText}>{status.label}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Cliente:</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{selectedQuote.customer?.name || selectedQuote.customerName || 'N/A'}</Text>
            </View>

            <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Fecha:</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {new Date(selectedQuote.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>

            {selectedQuote.items && selectedQuote.items.length > 0 && (
              <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Items:</Text>
                {selectedQuote.items.map((item: any, index: number) => {
                  const itemPrice = item.unitPrice ?? item.price ?? 0;
                  return (
                    <View key={index} style={[styles.itemDetailRow, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.itemDetailText, { color: theme.textSecondary }]}>
                        {item.description || item.productName || 'Item'} x{item.quantity}
                      </Text>
                      <Text style={[styles.itemDetailPrice, { color: theme.text }]}>
                        S/ {(item.quantity * itemPrice).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {selectedQuote.laborCost > 0 && (
              <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Mano de Obra:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>S/ {selectedQuote.laborCost.toFixed(2)}</Text>
              </View>
            )}

            <View style={[styles.totalSection, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.totalLabel, { color: theme.primary }]}>TOTAL:</Text>
              <Text style={[styles.totalAmount, { color: theme.primary }]}>S/ {selectedQuote.totalAmount?.toFixed(2) || '0.00'}</Text>
            </View>

            {selectedQuote.notes && (
              <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Notas:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{selectedQuote.notes}</Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            {selectedQuote.status === 'PENDING' && (
              <>
                <TouchableOpacity
                  style={[styles.footerButton, styles.rejectButton, { backgroundColor: theme.errorLight }]}
                  onPress={() => handleRejectQuote(selectedQuote)}
                >
                  <Text style={[styles.rejectButtonText, { color: theme.error }]}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerButton, styles.approveButton, { backgroundColor: theme.success }]}
                  onPress={() => handleApproveQuote(selectedQuote)}
                >
                  <Text style={styles.approveButtonText}>Aprobar</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.footerButton, styles.deleteButton, { backgroundColor: theme.errorLight }]}
              onPress={() => handleDeleteQuote(selectedQuote)}
            >
              <MaterialCommunityIcons name="delete" size={20} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Cargando presupuestos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={fetchQuotes}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Presupuestos</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowNewQuoteModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={quotes}
        renderItem={renderQuoteCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No hay presupuestos</Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowNewQuoteModal(true)}
            >
              <Text style={styles.emptyButtonText}>Crear primer presupuesto</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {renderNewQuoteModal()}
      {renderQuoteDetails()}

      <ConfirmDialog
        visible={confirmVisible}
        title={confirmTitle}
        message={confirmMessage}
        variant={confirmVariant}
        confirmLabel={confirmLabel}
        onConfirm={() => confirmAction?.()}
        onCancel={() => setConfirmVisible(false)}
      />
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
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  quoteCard: {
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    ...shadows.sm,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteId: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  quoteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quoteDate: {
    fontSize: 12,
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
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
  },
  flexInput: {
    flex: 1,
    marginBottom: 8,
  },
  smallInput: {
    width: 80,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 12,
    marginTop: 2,
  },
  addItemForm: {
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  itemInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addItemButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: radii.lg,
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    padding: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    // backgroundColor set via theme
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  saveButton: {
    // backgroundColor set via theme
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  approveButton: {
    // backgroundColor set via theme
  },
  approveButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  rejectButton: {
    // backgroundColor set via theme
  },
  rejectButtonText: {
    fontWeight: '600',
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  itemDetailText: {
    fontSize: 14,
  },
  itemDetailPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BudgetsScreen;
