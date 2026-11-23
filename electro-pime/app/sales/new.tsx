// ponytail: M3 POS (New Sale) screen with customer search, product catalog, cart and payment chips
import React, { useState, useCallback } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { Product, Customer, PaymentMethod, CreateSaleDto } from '../types/api';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Card from '../components/ui/Card';
import M3TextField from '../components/ui/M3TextField';
import {
  colors,
  typography,
  radii,
  spacing,
  tonalElevation,
  PAYMENT_METHOD,
} from '../theme';
import * as Haptics from 'expo-haptics';

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'CASH', label: 'Efectivo', icon: 'cash' },
  { value: 'YAPE', label: 'Yape', icon: 'cellphone' },
  { value: 'PLIN', label: 'Plin', icon: 'cellphone' },
  { value: 'CREDIT_CARD', label: 'Tarjeta Crédito', icon: 'credit-card' },
  { value: 'DEBIT_CARD', label: 'Tarjeta Débito', icon: 'credit-card-outline' },
  { value: 'TRANSFER', label: 'Transferencia', icon: 'bank-transfer' },
];

export default function NewSaleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerMatches, setCustomerMatches] = useState<Customer[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [showCustomerMatches, setShowCustomerMatches] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmSale, setConfirmSale] = useState<{ total: number; items: number } | null>(null);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);

  // Product search
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    if (query.trim().length === 0) {
      return api.getCustomers();
    }
    return api.searchCustomers(query.trim());
  };

  const runCustomerSearch = useCallback(async (query: string) => {
    setCustomerSearching(true);
    try {
      const results = await searchCustomers(query);
      setCustomerMatches(results);
    } catch {
      setCustomerMatches([]);
    } finally {
      setCustomerSearching(false);
    }
  }, []);

  const handleCustomerQueryChange = useCallback(
    (text: string) => {
      setCustomerQuery(text);
      setShowCustomerMatches(true);
      runCustomerSearch(text);
    },
    [runCustomerSearch]
  );

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery('');
    setCustomerMatches([]);
    setShowCustomerMatches(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery('');
    setCustomerMatches([]);
  };

  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await api.searchProducts(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const addToCart = (product: Product) => {
    Platform.OS !== 'web' && Haptics.selectionAsync();
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          price: product.price,
        },
      ]);
    }

    setShowProductSearch(false);
    setProductSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (index: number, quantity: number) => {
    Platform.OS !== 'web' && Haptics.selectionAsync();
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = quantity;
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      setErrorDialog('Agrega al menos un producto antes de registrar la venta.');
      return;
    }

    Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      const saleData: CreateSaleDto = {
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      await api.createSale(saleData);
      setSaving(false);
      setConfirmSale({ total: calculateTotal(), items: cart.length });
    } catch (err: any) {
      setErrorDialog(err.message || 'No se pudo registrar la venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          android_ripple={{ color: 'rgba(0, 82, 255, 0.15)', borderless: true, radius: 24 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Punto de Venta</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Section */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>

          {selectedCustomer ? (
            <View style={styles.selectedCustomerRow}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                <Text style={styles.customerSub}>
                  {selectedCustomer.documentType || 'Doc'}: {selectedCustomer.documentNumber || '—'} · {selectedCustomer.phone || 'Sin tel'}
                </Text>
              </View>
              <Pressable onPress={clearCustomer} style={styles.clearCustomerBtn}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : (
            <View>
              <View style={styles.customerSearchBox}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.customerSearchInput}
                  placeholder="Buscar cliente (o dejar en blanco para General)..."
                  placeholderTextColor={colors.textMuted}
                  value={customerQuery}
                  onChangeText={handleCustomerQueryChange}
                />
              </View>

              {showCustomerMatches && customerMatches.length > 0 && (
                <View style={styles.matchesList}>
                  {customerMatches.slice(0, 4).map((c) => (
                    <Pressable
                      key={c.id}
                      style={styles.matchItem}
                      onPress={() => handleSelectCustomer(c)}
                    >
                      <Text style={styles.matchName}>{c.name}</Text>
                      <Text style={styles.matchDoc}>{c.phone || c.documentNumber}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Add Product Button / Catalog */}
        <Pressable
          style={styles.addProductBtn}
          onPress={() => setShowProductSearch(true)}
          android_ripple={{ color: 'rgba(0, 82, 255, 0.15)' }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.addProductBtnText}>Buscar y Agregar Repuesto / Producto</Text>
        </Pressable>

        {/* Cart Items */}
        <Card style={styles.card}>
          <View style={styles.cartHeaderRow}>
            <Text style={styles.cardTitle}>Carrito ({cart.length})</Text>
            {cart.length > 0 && (
              <Pressable onPress={() => setCart([])}>
                <Text style={styles.clearCartText}>Vaciar</Text>
              </Pressable>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <MaterialCommunityIcons name="cart-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyCartText}>El carrito está vacío</Text>
            </View>
          ) : (
            cart.map((item, index) => (
              <View key={item.product.id} style={[styles.cartItemRow, index > 0 && styles.itemDivider]}>
                <View style={styles.cartItemTextCol}>
                  <Text style={styles.cartItemName}>{item.product.name}</Text>
                  <Text style={styles.cartItemUnitPrice}>S/ {item.price.toFixed(2)} c/u</Text>
                </View>

                {/* Quantity Stepper */}
                <View style={styles.stepperWrapper}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => updateQuantity(index, item.quantity - 1)}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color={colors.primary} />
                  </Pressable>
                  <Text style={styles.stepperQty}>{item.quantity}</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => updateQuantity(index, item.quantity + 1)}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                  </Pressable>
                </View>

                <Text style={styles.cartItemSubtotal}>
                  S/ {(item.quantity * item.price).toFixed(2)}
                </Text>

                <Pressable
                  style={styles.deleteItemBtn}
                  onPress={() => removeFromCart(index)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ))
          )}
        </Card>

        {/* Payment Methods */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Método de Pago</Text>
          <View style={styles.paymentMethodsGrid}>
            {PAYMENT_METHODS.map((pm) => {
              const isSelected = paymentMethod === pm.value;
              return (
                <Pressable
                  key={pm.value}
                  style={[styles.paymentChip, isSelected && styles.paymentChipSelected]}
                  onPress={() => setPaymentMethod(pm.value)}
                >
                  <MaterialCommunityIcons
                    name={pm.icon as any}
                    size={20}
                    color={isSelected ? colors.white : colors.textPrimary}
                  />
                  <Text style={[styles.paymentChipText, isSelected && styles.paymentChipTextSelected]}>
                    {pm.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.totalBlock}>
          <Text style={styles.bottomTotalLabel}>Total a Cobrar:</Text>
          <Text style={styles.bottomTotalAmount}>S/ {calculateTotal().toFixed(2)}</Text>
        </View>

        <Pressable
          style={[styles.confirmBtn, (cart.length === 0 || saving) && styles.confirmBtnDisabled]}
          onPress={handleCreateSale}
          disabled={cart.length === 0 || saving}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={22} color={colors.white} />
              <Text style={styles.confirmBtnText}>Confirmar Venta</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Product Search Modal */}
      <Modal
        visible={showProductSearch}
        animationType="slide"
        onRequestClose={() => setShowProductSearch(false)}
      >
        <SafeAreaView style={styles.searchModal}>
          <View style={styles.searchModalHeader}>
            <Text style={styles.searchModalTitle}>Catálogo de Repuestos</Text>
            <Pressable onPress={() => setShowProductSearch(false)} style={styles.closeSearchBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.productSearchField}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.productInput}
              placeholder="Buscar por repuesto, código, modelo..."
              placeholderTextColor={colors.textMuted}
              value={productSearchQuery}
              onChangeText={(text) => {
                setProductSearchQuery(text);
                searchProducts(text);
              }}
              autoFocus
            />
          </View>

          {searching ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.searchResultList}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.productItemCard}
                  onPress={() => addToCart(item)}
                  android_ripple={{ color: 'rgba(0, 82, 255, 0.12)' }}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.productItemName}>{item.name}</Text>
                    <Text style={styles.productItemCategory}>
                      {item.category} · Stock: {item.stock}
                    </Text>
                  </View>
                  <Text style={styles.productItemPrice}>S/ {item.price.toFixed(2)}</Text>
                  <MaterialCommunityIcons name="plus-circle" size={24} color={colors.primary} />
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Success Dialog */}
      {confirmSale && (
        <ConfirmDialog
          visible={Boolean(confirmSale)}
          title="¡Venta Registrada!"
          message={`Se registró la venta de ${confirmSale.items} producto(s) por un total de S/ ${confirmSale.total.toFixed(2)}.`}
          confirmLabel="Volver a Ventas"
          onConfirm={() => {
            setConfirmSale(null);
            router.replace('/sales');
          }}
          tone="success"
          icon="check-circle-outline"
        />
      )}

      {/* Error Dialog */}
      {errorDialog && (
        <ConfirmDialog
          visible={Boolean(errorDialog)}
          title="Atención"
          message={errorDialog}
          confirmLabel="Entendido"
          onConfirm={() => setErrorDialog(null)}
          tone="danger"
          icon="alert-circle-outline"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 199, 208, 0.3)',
  },
  backBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.full,
  },
  headerTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  cardTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  selectedCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    ...typography.titleSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  customerSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clearCustomerBtn: {
    padding: spacing.xs,
  },
  customerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    gap: spacing.xs,
  },
  customerSearchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  matchesList: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  matchItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 199, 208, 0.2)',
  },
  matchName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  matchDoc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  addProductBtnText: {
    ...typography.labelLarge,
    color: colors.primary,
    fontWeight: '700',
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearCartText: {
    ...typography.labelSmall,
    color: colors.danger,
    fontWeight: '600',
  },
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyCartText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.3)',
  },
  cartItemTextCol: {
    flex: 1,
  },
  cartItemName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cartItemUnitPrice: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQty: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    paddingHorizontal: 8,
    fontWeight: '700',
  },
  cartItemSubtotal: {
    ...typography.titleSmall,
    color: colors.primary,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
  },
  deleteItemBtn: {
    padding: spacing.xs,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(195, 199, 208, 0.3)',
  },
  paymentChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentChipText: {
    ...typography.labelSmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  paymentChipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.4)',
    elevation: 12,
  },
  totalBlock: {
    flex: 1,
  },
  bottomTotalLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  bottomTotalAmount: {
    ...typography.headlineSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    ...typography.labelLarge,
    color: colors.white,
    fontWeight: '700',
  },
  searchModal: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 199, 208, 0.3)',
  },
  searchModalTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  closeSearchBtn: {
    padding: spacing.xs,
  },
  productSearchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  productInput: {
    flex: 1,
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  searchResultList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  productItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(195, 199, 208, 0.3)',
    gap: spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productItemName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  productItemCategory: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productItemPrice: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
