// ponytail: M3 BudgetsScreen with Quote-to-Cash transitions, M3 filter chips and conversion to sale
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, ApiError } from '../services/api';
import { Quote, QuoteStatus, CreateQuoteDto, Customer, RepairOrder } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import SearchableSelector from '../components/SearchableSelector';
import {
  colors,
  typography,
  spacing,
  radii,
  tonalElevation,
  quoteStatusStyle,
  PAYMENT_METHOD,
  type PaymentMethod,
  QUOTE_STATUS,
} from '../theme';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Toast from '../components/ui/Toast';
import BottomSheet from '../components/ui/BottomSheet';
import M3TextField from '../components/ui/M3TextField';
import M3Fab from '../components/ui/M3Fab';

type StatusFilter = QuoteStatus | 'ALL';

const LOCKED_STATUSES: QuoteStatus[] = ['PAID', 'INVOICED'];

const toUserMessage = (err: unknown, fallback: string): string => {
  if (err instanceof ApiError && err.status === 403) {
    return 'No tienes permisos: acción solo para administradores.';
  }
  return (err as Error)?.message || fallback;
};

interface FormQuoteItem {
  description: string;
  quantity: number;
  price: number;
}

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
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
  const [showBillModal, setShowBillModal] = useState(false);
  const [billQuote, setBillQuote] = useState<Quote | null>(null);
  const [billMethod, setBillMethod] = useState<PaymentMethod>('YAPE');
  const [billing, setBilling] = useState(false);

  const [confirm, setConfirm] = useState<{
    title: string;
    message?: string;
    tone?: 'success' | 'danger' | 'primary';
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New quote form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState<RepairOrder | null>(null);
  const [quoteItems, setQuoteItems] = useState<FormQuoteItem[]>([]);
  const [customerOrders, setCustomerOrders] = useState<RepairOrder[]>([]);

  // Item input in form
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const fetchQuotes = useCallback(async (): Promise<Quote[]> => {
    if (!user) {
      setLoading(false);
      return [];
    }

    try {
      setError(null);
      const data = await api.getQuotes();
      const sorted = data
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setQuotes(sorted);
      return sorted;
    } catch (err: any) {
      console.error('Error fetching quotes:', err);
      setError(err.message || 'Error al cargar los presupuestos');
      return [];
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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: quotes.length };
    quotes.forEach((q) => {
      counts[q.status] = (counts[q.status] || 0) + 1;
    });
    return counts;
  }, [quotes]);

  const handleSelectCustomer = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setSelectedRepairOrder(null);
    try {
      const orders = await api.getRepairOrdersByCustomer(cust.id);
      setCustomerOrders(orders);
      if (orders.length > 0) {
        setSelectedRepairOrder(orders[0]);
      }
    } catch {
      setCustomerOrders([]);
    }
  };

  const addItemToQuote = () => {
    if (!itemDesc.trim()) {
      showToast('Ingresa la descripción del repuesto o servicio', 'error');
      return;
    }
    const p = parseFloat(itemPrice);
    const q = parseInt(itemQty, 10);
    if (isNaN(p) || p <= 0) {
      showToast('Ingresa un precio válido', 'error');
      return;
    }

    setQuoteItems((prev) => [
      ...prev,
      {
        description: itemDesc.trim(),
        quantity: isNaN(q) || q < 1 ? 1 : q,
        price: p,
      },
    ]);

    setItemDesc('');
    setItemQty('1');
    setItemPrice('');
  };

  const removeQuoteItem = (idx: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const calculateFormTotal = () => {
    return quoteItems.reduce((sum, it) => sum + it.quantity * it.price, 0);
  };

  const handleCreateQuote = async () => {
    if (!selectedCustomer) {
      showToast('Selecciona un cliente', 'error');
      return;
    }
    if (!selectedRepairOrder) {
      showToast('Selecciona una orden de trabajo asociada', 'error');
      return;
    }
    if (quoteItems.length === 0) {
      showToast('Agrega al menos un ítem al presupuesto', 'error');
      return;
    }

    setSaving(true);
    try {
      const dto: CreateQuoteDto = {
        repairOrderId: selectedRepairOrder.id,
        customerId: selectedCustomer.id,
        technicianId: user!.id,
        totalAmount: calculateFormTotal(),
        items: quoteItems.map((it) => ({
          quantity: it.quantity,
          price: it.price,
          description: it.description,
        })),
      };

      await api.createQuote(dto);
      setShowNewQuoteModal(false);
      setSelectedCustomer(null);
      setSelectedRepairOrder(null);
      setQuoteItems([]);
      fetchQuotes();
      showToast('Presupuesto creado exitosamente');
    } catch (err) {
      showToast(toUserMessage(err, 'No se pudo crear el presupuesto'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (quote: Quote, next: QuoteStatus, successMsg: string) => {
    try {
      await api.updateQuoteStatus(quote.id, next);
      setShowQuoteDetails(false);
      await fetchQuotes();
      showToast(successMsg);
    } catch (err) {
      showToast(toUserMessage(err, 'No se pudo actualizar el estado'), 'error');
    }
  };

  const confirmConvertSale = async () => {
    if (!billQuote) return;
    setBilling(true);
    try {
      await api.convertQuoteToSale(billQuote.id, billMethod);
      setShowBillModal(false);
      setShowQuoteDetails(false);
      await fetchQuotes();
      showToast('¡Venta generada exitosamente!');
    } catch (err) {
      showToast(toUserMessage(err, 'No se pudo facturar el presupuesto'), 'error');
    } finally {
      setBilling(false);
    }
  };

  const renderFilterChips = () => {
    const list: StatusFilter[] = [
      'PENDING',
      'APPROVED',
      'PAID',
      'INVOICED',
      'REJECTED',
      'EXPIRED',
      'ALL',
    ];

    return (
      <View style={styles.filterScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {list.map((st) => {
            const isSelected = statusFilter === st;
            const info = st === 'ALL' ? null : QUOTE_STATUS[st];
            const count = statusCounts[st] || 0;

            return (
              <Pressable
                key={st}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setStatusFilter(st)}
              >
                {info && (
                  <MaterialCommunityIcons
                    name={(info.icon || 'circle') as any}
                    size={15}
                    color={isSelected ? colors.white : info.color}
                  />
                )}
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {st === 'ALL' ? 'Todos' : info?.label}
                </Text>
                <View style={[styles.countPill, isSelected && styles.countPillActive]}>
                  <Text style={[styles.countText, isSelected && styles.countTextActive]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: insets.top + spacing.xs }]}>
        <Text style={styles.screenTitle}>Cotizaciones y Presupuestos</Text>
      </View>

      {renderFilterChips()}

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.listContainer}>
        {filteredQuotes.length === 0 ? (
          <EmptyState
            icon="file-document-outline"
            title="Sin presupuestos aquí"
            description="No hay cotizaciones registradas bajo este estado."
            ctaLabel="Nuevo Presupuesto"
            onCta={() => setShowNewQuoteModal(true)}
          />
        ) : (
          <FlatList
            data={filteredQuotes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => {
              const qStyle = quoteStatusStyle(item.status);
              const customerName = item.customer?.name || item.customerName || 'Cliente General';
              const itemsCount = item.items?.length || 0;

              return (
                <Card
                  style={styles.quoteCard}
                  onPress={() => {
                    setSelectedQuote(item);
                    setShowQuoteDetails(true);
                  }}
                >
                  <View style={styles.quoteCardTop}>
                    <View style={styles.quoteCardRefCol}>
                      <Text style={styles.quoteRef}>COT-{item.id.slice(0, 8).toUpperCase()}</Text>
                      <Text style={styles.customerName} numberOfLines={1}>
                        {customerName}
                      </Text>
                    </View>
                    <StatusBadge
                      label={qStyle.label}
                      color={qStyle.color}
                      soft={qStyle.soft}
                      icon={qStyle.icon}
                      compact
                    />
                  </View>

                  <View style={styles.quoteCardMeta}>
                    <Text style={styles.orderRefText}>
                      {item.repairOrderId ? `Orden: ORD-${item.repairOrderId.slice(0, 8).toUpperCase()}` : 'Venta directa'}
                    </Text>
                    <Text style={styles.itemsCountText}>{itemsCount} ítem(s)</Text>
                  </View>

                  <View style={styles.quoteCardBottom}>
                    <Text style={styles.totalAmountText}>
                      S/ {item.totalAmount ? item.totalAmount.toFixed(2) : '0.00'}
                    </Text>

                    {/* Quick Action Pills based on status */}
                    <View style={styles.actionPillsRow}>
                      {item.status === 'PENDING' && (
                        <Pressable
                          style={styles.pillActionBtn}
                          onPress={() => handleUpdateStatus(item, 'APPROVED', 'Presupuesto Aprobado')}
                        >
                          <MaterialCommunityIcons name="thumb-up" size={16} color={colors.primary} />
                          <Text style={styles.pillActionText}>Aprobar</Text>
                        </Pressable>
                      )}

                      {item.status === 'APPROVED' && (
                        <Pressable
                          style={[styles.pillActionBtn, styles.pillActionSuccess]}
                          onPress={() => {
                            setBillQuote(item);
                            setShowBillModal(true);
                          }}
                        >
                          <MaterialCommunityIcons name="cash-register" size={16} color={colors.success} />
                          <Text style={[styles.pillActionText, { color: colors.success }]}>
                            Facturar
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Card>
              );
            }}
          />
        )}
      </View>

      {/* Extended FAB */}
      <View style={[styles.fabWrapper, { bottom: insets.bottom + 80 }]}>
        <M3Fab
          label="Nueva Cotización"
          icon="file-document-outline"
          onPress={() => setShowNewQuoteModal(true)}
        />
      </View>

      {/* Quote Details BottomSheet */}
      {selectedQuote && (
        <BottomSheet
          visible={showQuoteDetails}
          title={`Cotización COT-${selectedQuote.id.slice(0, 8).toUpperCase()}`}
          onClose={() => setShowQuoteDetails(false)}
          footer={
            <View style={styles.sheetFooterActions}>
              {selectedQuote.status === 'PENDING' && (
                <Pressable
                  style={styles.sheetPrimaryBtn}
                  onPress={() => handleUpdateStatus(selectedQuote, 'APPROVED', 'Presupuesto Aprobado')}
                >
                  <MaterialCommunityIcons name="thumb-up-outline" size={20} color={colors.white} />
                  <Text style={styles.sheetPrimaryBtnText}>Aprobar Presupuesto</Text>
                </Pressable>
              )}

              {selectedQuote.status === 'APPROVED' && (
                <Pressable
                  style={[styles.sheetPrimaryBtn, { backgroundColor: colors.success }]}
                  onPress={() => {
                    setBillQuote(selectedQuote);
                    setShowBillModal(true);
                  }}
                >
                  <MaterialCommunityIcons name="cash-register" size={20} color={colors.white} />
                  <Text style={styles.sheetPrimaryBtnText}>Convertir a Venta (Facturar)</Text>
                </Pressable>
              )}

              {!LOCKED_STATUSES.includes(selectedQuote.status) && (
                <Pressable
                  style={styles.sheetDangerBtn}
                  onPress={() => {
                    setConfirm({
                      title: 'Eliminar Presupuesto',
                      message: '¿Está seguro de eliminar esta cotización?',
                      tone: 'danger',
                      confirmLabel: 'Eliminar',
                      onConfirm: async () => {
                        await api.deleteQuote(selectedQuote.id);
                        setShowQuoteDetails(false);
                        fetchQuotes();
                        showToast('Presupuesto eliminado');
                      },
                    });
                  }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                  <Text style={styles.sheetDangerBtnText}>Eliminar</Text>
                </Pressable>
              )}
            </View>
          }
        >
          <ScrollView style={styles.sheetBodyScroll}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cliente:</Text>
              <Text style={styles.detailValue}>
                {selectedQuote.customer?.name || selectedQuote.customerName || 'General'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <StatusBadge
                label={quoteStatusStyle(selectedQuote.status).label}
                color={quoteStatusStyle(selectedQuote.status).color}
                soft={quoteStatusStyle(selectedQuote.status).soft}
                compact
              />
            </View>

            <Text style={styles.itemsTitle}>Detalle de Repuestos y Mano de Obra:</Text>
            {(selectedQuote.items || []).map((it, idx) => (
              <View key={idx} style={styles.itemDetailRow}>
                <View style={styles.itemDetailCol}>
                  <Text style={styles.itemDescText}>{it.description || it.productName || 'Ítem'}</Text>
                  <Text style={styles.itemQtyPriceText}>
                    {it.quantity} x S/ {(it.price || it.unitPrice || 0).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemSubtotalText}>
                  S/ {((it.quantity || 1) * (it.price || it.unitPrice || 0)).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.totalDivider} />
            <View style={styles.detailTotalRow}>
              <Text style={styles.totalBoldLabel}>TOTAL DEL PRESUPUESTO:</Text>
              <Text style={styles.totalBoldAmount}>S/ {selectedQuote.totalAmount.toFixed(2)}</Text>
            </View>
          </ScrollView>
        </BottomSheet>
      )}

      {/* Create New Quote BottomSheet */}
      {showNewQuoteModal && (
        <BottomSheet
          visible={showNewQuoteModal}
          title="Nueva Cotización"
          onClose={() => setShowNewQuoteModal(false)}
          footer={
            <Pressable
              style={[styles.saveQuoteBtn, saving && styles.saveQuoteBtnDisabled]}
              onPress={handleCreateQuote}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveQuoteBtnText}>Emitir Presupuesto</Text>
              )}
            </Pressable>
          }
        >
          <ScrollView style={styles.newQuoteScroll} keyboardShouldPersistTaps="handled">
            <SearchableSelector<Customer>
              label="Cliente titular *"
              placeholder="Buscar cliente..."
              value={selectedCustomer}
              searchFn={(q: string) => (q.length < 2 ? api.getCustomers() : api.searchCustomers(q))}
              onSelect={(cust) => {
                if (cust) handleSelectCustomer(cust);
              }}
              renderItem={(c) => c.name}
              keyExtractor={(c) => c.id}
            />

            {customerOrders.length > 0 && (
              <View style={styles.orderSelectWrapper}>
                <Text style={styles.fieldLabel}>Orden de trabajo asociada *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orderChipsRow}>
                  {customerOrders.map((o) => {
                    const isSelected = selectedRepairOrder?.id === o.id;
                    return (
                      <Pressable
                        key={o.id}
                        style={[styles.orderChip, isSelected && styles.orderChipSelected]}
                        onPress={() => setSelectedRepairOrder(o)}
                      >
                        <Text style={[styles.orderChipText, isSelected && styles.orderChipTextSelected]}>
                          ORD-{o.id.slice(0, 6).toUpperCase()} · {o.items?.[0]?.deviceType || 'Equipo'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Add items section */}
            <Card style={styles.addItemCard}>
              <Text style={styles.addItemTitle}>Agregar Ítem / Repuesto</Text>
              <M3TextField
                label="Descripción del repuesto o servicio"
                placeholder="Ej: Cambio de compresor 1/4 HP..."
                value={itemDesc}
                onChangeText={setItemDesc}
              />
              <View style={styles.itemInputsRow}>
                <M3TextField
                  containerStyle={styles.halfInput}
                  label="Cantidad"
                  placeholder="1"
                  value={itemQty}
                  onChangeText={setItemQty}
                  keyboardType="numeric"
                />
                <M3TextField
                  containerStyle={styles.halfInput}
                  label="Precio Unit. (S/)"
                  placeholder="0.00"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <Pressable style={styles.addItemBtn} onPress={addItemToQuote}>
                <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
                <Text style={styles.addItemBtnText}>Añadir al Presupuesto</Text>
              </Pressable>
            </Card>

            {/* List of items added */}
            {quoteItems.length > 0 && (
              <View style={styles.addedItemsList}>
                <Text style={styles.itemsTitle}>Ítems Añadidos ({quoteItems.length}):</Text>
                {quoteItems.map((it, idx) => (
                  <View key={idx} style={styles.addedItemRow}>
                    <View style={styles.addedItemInfo}>
                      <Text style={styles.itemDescText}>{it.description}</Text>
                      <Text style={styles.itemQtyPriceText}>
                        {it.quantity} x S/ {it.price.toFixed(2)} = S/ {(it.quantity * it.price).toFixed(2)}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeQuoteItem(idx)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
                <View style={styles.formTotalRow}>
                  <Text style={styles.formTotalLabel}>Total:</Text>
                  <Text style={styles.formTotalAmount}>S/ {calculateFormTotal().toFixed(2)}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </BottomSheet>
      )}

      {/* Bill Quote Modal (Convert to Sale) */}
      {showBillModal && billQuote && (
        <BottomSheet
          visible={showBillModal}
          title="Convertir Presupuesto a Venta"
          subtitle={`Total a cobrar: S/ ${billQuote.totalAmount.toFixed(2)}`}
          onClose={() => setShowBillModal(false)}
          footer={
            <Pressable
              style={styles.saveQuoteBtn}
              onPress={confirmConvertSale}
              disabled={billing}
            >
              {billing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveQuoteBtnText}>Confirmar y Generar Venta</Text>
              )}
            </Pressable>
          }
        >
          <View style={styles.billSheetBody}>
            <Text style={styles.fieldLabel}>Selecciona el medio de cobro:</Text>
            <View style={styles.payMethodsGrid}>
              {(['YAPE', 'PLIN', 'CASH', 'CREDIT_CARD', 'TRANSFER'] as PaymentMethod[]).map((pm) => {
                const isSelected = billMethod === pm;
                const info = PAYMENT_METHOD[pm];
                return (
                  <Pressable
                    key={pm}
                    style={[styles.payMethodChip, isSelected && styles.payMethodChipSelected]}
                    onPress={() => setBillMethod(pm)}
                  >
                    <MaterialCommunityIcons
                      name={(info.icon || 'cash') as any}
                      size={18}
                      color={isSelected ? colors.white : colors.textPrimary}
                    />
                    <Text style={[styles.payMethodText, isSelected && styles.payMethodTextSelected]}>
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </BottomSheet>
      )}

      {/* Generic Confirmation Dialog */}
      {confirm && (
        <ConfirmDialog
          visible={Boolean(confirm)}
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          tone={confirm.tone}
          busy={confirmBusy}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  topHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  screenTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  filterScroll: {
    marginVertical: spacing.xs,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(195, 199, 208, 0.4)',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  countPill: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  countPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    ...typography.labelSmall,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  countTextActive: {
    color: colors.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 110,
  },
  quoteCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quoteCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteCardRefCol: {
    flex: 1,
  },
  quoteRef: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  customerName: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  quoteCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  orderRefText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  itemsCountText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  quoteCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.3)',
  },
  totalAmountText: {
    ...typography.titleLarge,
    color: colors.primary,
    fontWeight: '700',
  },
  actionPillsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pillActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  pillActionSuccess: {
    backgroundColor: colors.successSoft,
  },
  pillActionText: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  fabWrapper: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 99,
  },
  sheetFooterActions: {
    gap: spacing.sm,
  },
  sheetPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  sheetPrimaryBtnText: {
    ...typography.labelLarge,
    color: colors.white,
    fontWeight: '700',
  },
  sheetDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.dangerSoft,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  sheetDangerBtnText: {
    ...typography.labelMedium,
    color: colors.danger,
    fontWeight: '700',
  },
  sheetBodyScroll: {
    maxHeight: 380,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  itemsTitle: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 199, 208, 0.2)',
  },
  itemDetailCol: {
    flex: 1,
  },
  itemDescText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  itemQtyPriceText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemSubtotalText: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  totalDivider: {
    height: 1,
    backgroundColor: 'rgba(195, 199, 208, 0.4)',
    marginVertical: spacing.md,
  },
  detailTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBoldLabel: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  totalBoldAmount: {
    ...typography.headlineSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  newQuoteScroll: {
    maxHeight: 460,
  },
  orderSelectWrapper: {
    marginTop: spacing.sm,
  },
  fieldLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  orderChipsRow: {
    paddingVertical: 4,
  },
  orderChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    marginRight: spacing.xs,
  },
  orderChipSelected: {
    backgroundColor: colors.primary,
  },
  orderChipText: {
    ...typography.labelSmall,
    color: colors.textPrimary,
  },
  orderChipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  addItemCard: {
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  addItemTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  itemInputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
    marginTop: spacing.xs,
  },
  addItemBtnText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  addedItemsList: {
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  addedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 199, 208, 0.2)',
  },
  addedItemInfo: {
    flex: 1,
  },
  formTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  formTotalLabel: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  formTotalAmount: {
    ...typography.headlineSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  saveQuoteBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveQuoteBtnDisabled: {
    opacity: 0.6,
  },
  saveQuoteBtnText: {
    ...typography.labelLarge,
    color: colors.white,
    fontWeight: '700',
  },
  billSheetBody: {
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  payMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  payMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  payMethodChipSelected: {
    backgroundColor: colors.primary,
  },
  payMethodText: {
    ...typography.labelSmall,
    color: colors.textPrimary,
  },
  payMethodTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.danger,
    flex: 1,
  },
});
