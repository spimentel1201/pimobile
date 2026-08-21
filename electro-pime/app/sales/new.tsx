import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { Product, Customer, PaymentMethod, CreateSaleDto } from '../../types/api';
import SearchableSelector from '../../components/SearchableSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing, typography, radii, shadows } from '../../constants/theme';

interface CartItem {
    product: Product;
    quantity: number;
    price: number;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'CASH', label: 'Efectivo', icon: 'cash' },
    { value: 'CREDIT_CARD', label: 'Tarjeta Crédito', icon: 'credit-card' },
    { value: 'DEBIT_CARD', label: 'Tarjeta Débito', icon: 'credit-card-outline' },
    { value: 'TRANSFER', label: 'Transferencia', icon: 'bank-transfer' },
    { value: 'YAPE', label: 'Yape', icon: 'cellphone' },
    { value: 'PLIN', label: 'Plin', icon: 'cellphone' },
];

export default function NewSaleScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [showPaymentPicker, setShowPaymentPicker] = useState(false);
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [saving, setSaving] = useState(false);

    // Product search
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [searching, setSearching] = useState(false);

    const searchCustomers = async (query: string): Promise<Customer[]> => {
        if (query.length < 2) {
            return api.getCustomers();
        }
        return api.searchCustomers(query);
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
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setSearching(false);
        }
    }, []);

    const addToCart = (product: Product) => {
        const existingIndex = cart.findIndex(item => item.product.id === product.id);

        if (existingIndex >= 0) {
            // Increment quantity
            const updatedCart = [...cart];
            updatedCart[existingIndex].quantity += 1;
            setCart(updatedCart);
        } else {
            // Add new item
            setCart([...cart, {
                product,
                quantity: 1,
                price: product.price,
            }]);
        }

        setShowProductSearch(false);
        setProductSearchQuery('');
        setSearchResults([]);
    };

    const updateQuantity = (index: number, quantity: number) => {
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
        return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const handleCreateSale = async () => {
        if (cart.length === 0) {
            Alert.alert('Error', 'Agregue al menos un producto');
            return;
        }

        setSaving(true);
        try {
            const saleData: CreateSaleDto = {
                customerId: selectedCustomer?.id,
                customerName: selectedCustomer?.name,
                paymentMethod,
                items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            await api.createSale(saleData);

            if (Platform.OS === 'web') {
                window.alert(`¡Venta Registrada!\nTotal: S/ ${calculateTotal().toFixed(2)}`);
                router.replace('/sales');
            } else {
                Alert.alert(
                    '¡Venta Registrada!',
                    `Total: S/ ${calculateTotal().toFixed(2)}`,
                    [
                        { text: 'OK', onPress: () => router.replace('/sales') }
                    ]
                );
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo registrar la venta');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setSelectedCustomer(null);
        setCart([]);
        setPaymentMethod('CASH');
    };

    const renderCartItem = (item: CartItem, index: number) => (
        <Animated.View key={index} entering={FadeInDown.delay(index * 60).springify()}>
            <Card variant="outlined" padding={spacing.md} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                    <Text style={[styles.cartItemName, { color: theme.text }]}>{item.product.name}</Text>
                    <Text style={[styles.cartItemPrice, { color: theme.textSecondary }]}>S/ {item.price.toFixed(2)} c/u</Text>
                </View>
                <View style={[styles.quantityControls, { backgroundColor: theme.surfaceVariant }]}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(index, item.quantity - 1)}
                    >
                        <MaterialCommunityIcons name="minus" size={18} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, { color: theme.text }]}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(index, item.quantity + 1)}
                    >
                        <MaterialCommunityIcons name="plus" size={18} color={theme.text} />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.cartItemTotal, { color: theme.success }]}>S/ {(item.quantity * item.price).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(index)}>
                    <MaterialCommunityIcons name="delete" size={22} color={theme.error} />
                </TouchableOpacity>
            </Card>
        </Animated.View>
    );

    const renderProductSearchModal = () => (
        <Modal
            visible={showProductSearch}
            animationType="slide"
            onRequestClose={() => setShowProductSearch(false)}
        >
            <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Buscar Producto</Text>
                    <TouchableOpacity onPress={() => setShowProductSearch(false)}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="magnify" size={20} color={theme.textMuted} />
                    <Input
                        placeholder="Buscar por nombre o código..."
                        value={productSearchQuery}
                        onChangeText={(text: string) => {
                            setProductSearchQuery(text);
                            searchProducts(text);
                        }}
                        autoFocus
                        containerStyle={styles.searchInputWrapper}
                    />
                </View>

                {searching ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={searchResults}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <Animated.View entering={FadeInDown.springify()}>
                                <TouchableOpacity
                                    style={[styles.productItem, { backgroundColor: theme.surface }]}
                                    onPress={() => addToCart(item)}
                                >
                                    <View style={styles.productInfo}>
                                        <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
                                        <Text style={[styles.productStock, { color: theme.textSecondary }]}>Stock: {item.stock}</Text>
                                    </View>
                                    <Text style={[styles.productPrice, { color: theme.success }]}>S/ {item.price.toFixed(2)}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            productSearchQuery.length >= 2 ? (
                                <View style={styles.emptySearch}>
                                    <Text style={[styles.emptySearchText, { color: theme.textSecondary }]}>No se encontraron productos</Text>
                                </View>
                            ) : (
                                <View style={styles.emptySearch}>
                                    <Text style={[styles.emptySearchText, { color: theme.textSecondary }]}>Escriba al menos 2 caracteres</Text>
                                </View>
                            )
                        }
                    />
                )}
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Customer Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Cliente (Opcional)</Text>
                    <SearchableSelector<Customer>
                        label=""
                        placeholder="Buscar cliente..."
                        value={selectedCustomer}
                        onSelect={setSelectedCustomer}
                        searchFn={searchCustomers}
                        renderItem={(c) => c.name}
                        renderSubtitle={(c) => `Tel: ${c.phone}`}
                        keyExtractor={(c) => c.id}
                    />
                </View>

                {/* Add Products */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Productos</Text>
                        <Button
                            title="Agregar"
                            variant="primary"
                            size="sm"
                            onPress={() => setShowProductSearch(true)}
                            icon={<MaterialCommunityIcons name="plus" size={18} color={colors.white} />}
                        />
                    </View>

                    {cart.length === 0 ? (
                        <EmptyState
                            icon="cart-outline"
                            title="No hay productos"
                            message="Agregue productos para comenzar la venta"
                        />
                    ) : (
                        <View style={styles.cartList}>
                            {cart.map((item, index) => renderCartItem(item, index))}
                        </View>
                    )}
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Método de Pago</Text>
                    <TouchableOpacity
                        style={[styles.paymentSelector, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
                        onPress={() => setShowPaymentPicker(!showPaymentPicker)}
                    >
                        <MaterialCommunityIcons
                            name={PAYMENT_METHODS.find(p => p.value === paymentMethod)?.icon as any || 'cash'}
                            size={24}
                            color={theme.primary}
                        />
                        <Text style={[styles.paymentText, { color: theme.text }]}>
                            {PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label || 'Efectivo'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {showPaymentPicker && (
                        <View style={[styles.paymentOptions, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                            {PAYMENT_METHODS.map((method) => (
                                <TouchableOpacity
                                    key={method.value}
                                    style={[
                                        styles.paymentOption,
                                        { borderBottomColor: theme.border },
                                        paymentMethod === method.value && { backgroundColor: theme.primaryLight }
                                    ]}
                                    onPress={() => {
                                        setPaymentMethod(method.value);
                                        setShowPaymentPicker(false);
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name={method.icon as any}
                                        size={20}
                                        color={paymentMethod === method.value ? theme.primary : theme.textSecondary}
                                    />
                                    <Text style={[
                                        styles.paymentOptionText,
                                        { color: theme.text },
                                        paymentMethod === method.value && { color: theme.primary, fontWeight: typography.weights.medium }
                                    ]}>
                                        {method.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Footer with Total and Submit */}
            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, marginBottom: 60 + insets.bottom }]}>
                <View style={styles.totalContainer}>
                    <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total:</Text>
                    <Text style={[styles.totalAmount, { color: theme.text }]}>S/ {calculateTotal().toFixed(2)}</Text>
                </View>
                <Button
                    title="Registrar Venta"
                    variant="success"
                    size="lg"
                    onPress={handleCreateSale}
                    loading={saving}
                    disabled={cart.length === 0}
                    icon={!saving ? <MaterialCommunityIcons name="check" size={20} color={colors.white} /> : undefined}
                />
            </View>

            {renderProductSearchModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: spacing.base,
        marginBottom: spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold,
    },
    emptyCart: {
        alignItems: 'center',
        padding: spacing['2xl'],
    },
    emptyCartText: {
        marginTop: spacing.md,
        fontSize: typography.sizes.sm,
    },
    emptyCartButton: {
        marginTop: spacing.md,
    },
    cartList: {
        gap: spacing.md,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
    },
    cartItemPrice: {
        fontSize: typography.sizes.xs,
        marginTop: spacing['2xs'],
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radii.md,
    },
    quantityButton: {
        padding: spacing.sm,
    },
    quantityText: {
        paddingHorizontal: spacing.md,
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
    },
    cartItemTotal: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
        minWidth: 70,
        textAlign: 'right',
    },
    paymentSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        gap: spacing.md,
    },
    paymentText: {
        flex: 1,
        fontSize: typography.sizes.base,
    },
    paymentOptions: {
        marginTop: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
        borderBottomWidth: 1,
    },
    paymentOptionText: {
        fontSize: typography.sizes.sm,
    },
    footer: {
        padding: spacing.base,
        paddingBottom: spacing.base + insets.bottom,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.base,
        ...shadows.md,
    },
    scrollContent: {
        paddingBottom: spacing['3xl'],
    },
    totalContainer: {
        flex: 1,
    },
    totalLabel: {
        fontSize: typography.sizes.sm,
    },
    totalAmount: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
    },
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.base,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
    },
    searchInputWrapper: {
        flex: 1,
        marginBottom: 0,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.base,
        marginHorizontal: spacing.base,
        marginBottom: spacing.sm,
        borderRadius: radii.md,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
    },
    productStock: {
        fontSize: typography.sizes.xs,
        marginTop: spacing['2xs'],
    },
    productPrice: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold,
    },
    emptySearch: {
        alignItems: 'center',
        padding: spacing['2xl'],
    },
    emptySearchText: {
        fontSize: typography.sizes.sm,
    },
});
