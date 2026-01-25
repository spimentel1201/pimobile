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
import { api } from '../services/api';
import { Quote, CreateQuoteDto, Customer, RepairOrder } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import SearchableSelector from '../components/SearchableSelector';

const QUOTE_STATUS = {
  PENDING: { label: 'Pendiente', color: '#F59E0B' },
  APPROVED: { label: 'Aprobado', color: '#10B981' },
  REJECTED: { label: 'Rechazado', color: '#EF4444' },
  EXPIRED: { label: 'Expirado', color: '#6B7280' },
};

interface QuoteItem {
  description: string;
  quantity: number;
  price: number;
}

const BudgetsScreen = () => {
  const { user } = useAuth();
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
      Alert.alert('Éxito', 'Presupuesto creado correctamente');
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
      Alert.alert('Éxito', 'Presupuesto aprobado');
      fetchQuotes();
      setShowQuoteDetails(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo aprobar el presupuesto');
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    try {
      await api.updateQuote(quote.id, { status: 'REJECTED' });
      Alert.alert('Éxito', 'Presupuesto rechazado');
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
              Alert.alert('Éxito', 'Presupuesto eliminado');
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

  const renderQuoteCard = ({ item }: { item: Quote }) => {
    const status = QUOTE_STATUS[item.status as keyof typeof QUOTE_STATUS] || QUOTE_STATUS.PENDING;

    return (
      <TouchableOpacity
        style={styles.quoteCard}
        onPress={() => {
          setSelectedQuote(item);
          setShowQuoteDetails(true);
        }}
      >
        <View style={styles.quoteHeader}>
          <Text style={styles.quoteId}>#{item.id.slice(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.customerName}>{item.customer?.name || item.customerName || 'Cliente'}</Text>
        <View style={styles.quoteInfo}>
          <Text style={styles.quoteTotal}>S/ {item.totalAmount?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.quoteDate}>
            {new Date(item.createdAt).toLocaleDateString()}
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
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nuevo Presupuesto</Text>
          <TouchableOpacity onPress={() => setShowNewQuoteModal(false)}>
            <MaterialCommunityIcons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Customer Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cliente *</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orden de Reparación (Opcional)</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items / Repuestos</Text>

            {quoteItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemPrice}>
                    {item.quantity} x S/ {item.price.toFixed(2)} = S/ {(item.quantity * item.price).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <MaterialCommunityIcons name="delete" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addItemForm}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Descripción del item"
                value={newItemDescription}
                onChangeText={setNewItemDescription}
              />
              <View style={styles.itemInputRow}>
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Cant."
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Precio"
                  value={newItemPrice}
                  onChangeText={setNewItemPrice}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
                  <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notas adicionales..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalAmount}>S/ {calculateTotal().toFixed(2)}</Text>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.footerButton, styles.cancelButton]}
            onPress={() => setShowNewQuoteModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerButton, styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleCreateQuote}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Presupuesto #{selectedQuote.id.slice(0, 8)}</Text>
            <TouchableOpacity onPress={() => setShowQuoteDetails(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                  <Text style={styles.statusText}>{status.label}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Cliente:</Text>
              <Text style={styles.detailValue}>{selectedQuote.customer?.name || selectedQuote.customerName || 'N/A'}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Fecha:</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedQuote.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {selectedQuote.items && selectedQuote.items.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Items:</Text>
                {selectedQuote.items.map((item: any, index: number) => {
                  const itemPrice = item.unitPrice ?? item.price ?? 0;
                  return (
                    <View key={index} style={styles.itemDetailRow}>
                      <Text style={styles.itemDetailText}>
                        {item.description || item.productName || 'Item'} x{item.quantity}
                      </Text>
                      <Text style={styles.itemDetailPrice}>
                        S/ {(item.quantity * itemPrice).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {selectedQuote.laborCost > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Mano de Obra:</Text>
                <Text style={styles.detailValue}>S/ {selectedQuote.laborCost.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>TOTAL:</Text>
              <Text style={styles.totalAmount}>S/ {selectedQuote.totalAmount?.toFixed(2) || '0.00'}</Text>
            </View>

            {selectedQuote.notes && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Notas:</Text>
                <Text style={styles.detailValue}>{selectedQuote.notes}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            {selectedQuote.status === 'PENDING' && (
              <>
                <TouchableOpacity
                  style={[styles.footerButton, styles.rejectButton]}
                  onPress={() => handleRejectQuote(selectedQuote)}
                >
                  <Text style={styles.rejectButtonText}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerButton, styles.approveButton]}
                  onPress={() => handleApproveQuote(selectedQuote)}
                >
                  <Text style={styles.approveButtonText}>Aprobar</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.footerButton, styles.deleteButton]}
              onPress={() => handleDeleteQuote(selectedQuote)}
            >
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando presupuestos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuotes}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Presupuestos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewQuoteModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="white" />
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
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay presupuestos</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowNewQuoteModal(true)}
            >
              <Text style={styles.emptyButtonText}>Crear primer presupuesto</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  quoteCard: {
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
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
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
    color: '#10B981',
  },
  quoteDate: {
    fontSize: 12,
    color: '#6B7280',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
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
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  itemPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addItemForm: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  itemInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addItemButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  approveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectButtonText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
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
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemDetailText: {
    fontSize: 14,
    color: '#374151',
  },
  itemDetailPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});

export default BudgetsScreen;