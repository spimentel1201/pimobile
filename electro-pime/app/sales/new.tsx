import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { Product, Customer, PaymentMethod, CreateSaleDto } from '../types/api';
import SearchableSelector from '../components/SearchableSelector';
import { useAuth } from '../contexts/AuthContext';

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
            Alert.alert(
                '¡Venta Registrada!',
                `Total: S/ ${calculateTotal().toFixed(2)}`,
                [
                    { text: 'Nueva Venta', onPress: () => resetForm() },
                    { text: 'Ver Ventas', onPress: () => router.replace('/sales') },
                ]
            );
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
        <View key={index} style={styles.cartItem}>
            <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.product.name}</Text>
                <Text style={styles.cartItemPrice}>S/ {item.price.toFixed(2)} c/u</Text>
            </View>
            <View style={styles.quantityControls}>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(index, item.quantity - 1)}
                >
                    <MaterialCommunityIcons name="minus" size={18} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(index, item.quantity + 1)}
                >
                    <MaterialCommunityIcons name="plus" size={18} color="#374151" />
                </TouchableOpacity>
            </View>
            <Text style={styles.cartItemTotal}>S/ {(item.quantity * item.price).toFixed(2)}</Text>
            <TouchableOpacity onPress={() => removeFromCart(index)}>
                <MaterialCommunityIcons name="delete" size={22} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

    const renderProductSearchModal = () => (
        <Modal
            visible={showProductSearch}
            animationType="slide"
            onRequestClose={() => setShowProductSearch(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Buscar Producto</Text>
                    <TouchableOpacity onPress={() => setShowProductSearch(false)}>
                        <MaterialCommunityIcons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por nombre o código..."
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
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                ) : (
                    <FlatList
                        data={searchResults}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.productItem}
                                onPress={() => addToCart(item)}
                            >
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{item.name}</Text>
                                    <Text style={styles.productStock}>Stock: {item.stock}</Text>
                                </View>
                                <Text style={styles.productPrice}>S/ {item.price.toFixed(2)}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            productSearchQuery.length >= 2 ? (
                                <View style={styles.emptySearch}>
                                    <Text style={styles.emptySearchText}>No se encontraron productos</Text>
                                </View>
                            ) : (
                                <View style={styles.emptySearch}>
                                    <Text style={styles.emptySearchText}>Escriba al menos 2 caracteres</Text>
                                </View>
                            )
                        }
                    />
                )}
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Customer Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cliente (Opcional)</Text>
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
                        <Text style={styles.sectionTitle}>Productos</Text>
                        <TouchableOpacity
                            style={styles.addProductButton}
                            onPress={() => setShowProductSearch(true)}
                        >
                            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                            <Text style={styles.addProductButtonText}>Agregar</Text>
                        </TouchableOpacity>
                    </View>

                    {cart.length === 0 ? (
                        <View style={styles.emptyCart}>
                            <MaterialCommunityIcons name="cart-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyCartText}>No hay productos</Text>
                            <TouchableOpacity
                                style={styles.emptyCartButton}
                                onPress={() => setShowProductSearch(true)}
                            >
                                <Text style={styles.emptyCartButtonText}>Agregar Producto</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.cartList}>
                            {cart.map((item, index) => renderCartItem(item, index))}
                        </View>
                    )}
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Método de Pago</Text>
                    <TouchableOpacity
                        style={styles.paymentSelector}
                        onPress={() => setShowPaymentPicker(!showPaymentPicker)}
                    >
                        <MaterialCommunityIcons
                            name={PAYMENT_METHODS.find(p => p.value === paymentMethod)?.icon as any || 'cash'}
                            size={24}
                            color="#3B82F6"
                        />
                        <Text style={styles.paymentText}>
                            {PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label || 'Efectivo'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={24} color="#6B7280" />
                    </TouchableOpacity>

                    {showPaymentPicker && (
                        <View style={styles.paymentOptions}>
                            {PAYMENT_METHODS.map((method) => (
                                <TouchableOpacity
                                    key={method.value}
                                    style={[
                                        styles.paymentOption,
                                        paymentMethod === method.value && styles.paymentOptionSelected
                                    ]}
                                    onPress={() => {
                                        setPaymentMethod(method.value);
                                        setShowPaymentPicker(false);
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name={method.icon as any}
                                        size={20}
                                        color={paymentMethod === method.value ? '#3B82F6' : '#6B7280'}
                                    />
                                    <Text style={[
                                        styles.paymentOptionText,
                                        paymentMethod === method.value && styles.paymentOptionTextSelected
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
            <View style={styles.footer}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>S/ {calculateTotal().toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.submitButton, (saving || cart.length === 0) && styles.buttonDisabled]}
                    onPress={handleCreateSale}
                    disabled={saving || cart.length === 0}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Registrar Venta</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {renderProductSearchModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    addProductButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addProductButtonText: {
        color: 'white',
        fontWeight: '500',
        marginLeft: 4,
    },
    emptyCart: {
        alignItems: 'center',
        padding: 32,
    },
    emptyCartText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    emptyCartButton: {
        marginTop: 12,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    emptyCartButtonText: {
        color: 'white',
        fontWeight: '500',
    },
    cartList: {
        gap: 12,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        gap: 12,
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    cartItemPrice: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
    },
    quantityButton: {
        padding: 8,
    },
    quantityText: {
        paddingHorizontal: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    cartItemTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
        minWidth: 70,
        textAlign: 'right',
    },
    paymentSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 12,
    },
    paymentText: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    paymentOptions: {
        marginTop: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    paymentOptionSelected: {
        backgroundColor: '#EFF6FF',
    },
    paymentOptionText: {
        fontSize: 14,
        color: '#374151',
    },
    paymentOptionTextSelected: {
        color: '#3B82F6',
        fontWeight: '500',
    },
    footer: {
        backgroundColor: 'white',
        padding: 16,
        paddingBottom: 80,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    totalContainer: {
        flex: 1,
    },
    totalLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 16,
        marginLeft: 8,
        color: '#111827',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    productStock: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
    },
    emptySearch: {
        alignItems: 'center',
        padding: 32,
    },
    emptySearchText: {
        fontSize: 14,
        color: '#6B7280',
    },
});
