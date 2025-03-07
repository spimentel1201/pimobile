import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';

// Mock data for customers and products
const mockCustomers = [
  { id: '1', name: 'Juan Pérez', phone: '555-0101' },
  { id: '2', name: 'María García', phone: '555-0102' },
  { id: '3', name: 'Carlos López', phone: '555-0103' },
  { id: '4', name: 'Ana Martínez', phone: '555-0104' },
  { id: '5', name: 'Roberto Sánchez', phone: '555-0105' },
  { id: '6', name: 'Laura Torres', phone: '555-0106' },
  { id: '7', name: 'Miguel Ramírez', phone: '555-0107' },
  { id: '8', name: 'Isabel Castro', phone: '555-0108' },
];

const mockProducts = [
  { id: '1', name: 'iPhone 13 Screen', price: 1500, stock: 10 },
  { id: '2', name: 'Screen Protector', price: 500, stock: 50 },
  { id: '3', name: 'Samsung Battery', price: 1200, stock: 15 },
  { id: '4', name: 'Charging Port', price: 800, stock: 20 },
  { id: '5', name: 'LCD Screen', price: 1800, stock: 8 },
];

// Interfaces
interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

const NewSaleScreen = ({ onClose }: { onClose: () => void }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Filter customers based on search
  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Filter products based on search
  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Calculate total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock < 1) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Remove product from cart
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Update product quantity in cart
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Render customer modal
  // Update the renderCustomerModal function
  const renderCustomerModal = () => (
    <Modal
      visible={showCustomerModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCustomerModal(false)}
      style={{ pointerEvents: 'auto' }}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
            <TouchableOpacity onPress={() => {
              setShowCustomerModal(false);
              setCustomerSearch('');
            }}>
              <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
            </TouchableOpacity>
          </View>
  
          <TextInput
            style={{ 
              backgroundColor: 'white',
              padding: 12,
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 8
            }}
            placeholder="Buscar cliente..."
            value={customerSearch}
            onChangeText={setCustomerSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
  
          <ScrollView style={{ flex: 1 }}>
            {filteredCustomers.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.customerItem,
                  selectedCustomer?.id === item.id && styles.selectedCustomerItem
                ]}
                onPress={() => {
                  setSelectedCustomer(item);
                  setShowCustomerModal(false);
                  setCustomerSearch('');
                }}
              >
                <MaterialCommunityIcons 
                  name={selectedCustomer?.id === item.id ? "account-check" : "account"} 
                  size={24} 
                  color={selectedCustomer?.id === item.id ? "#28a745" : "#6c757d"} 
                />
                <View style={styles.customerInfo}>
                  <Text style={[
                    styles.customerName,
                    selectedCustomer?.id === item.id && styles.selectedCustomerText
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={styles.customerPhone}>{item.phone}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {filteredCustomers.length === 0 && (
              <Text style={styles.emptyText}>
                No se encontraron clientes
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0056b3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Venta</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mainContent}>
        {/* Customer Selector */}
        <TouchableOpacity
          style={styles.customerSelector}
          onPress={() => setShowCustomerModal(true)}
        >
          <MaterialCommunityIcons name="account" size={24} color="#0056b3" />
          <Text style={styles.customerSelectorText}>
            {selectedCustomer ? selectedCustomer.name : 'Seleccionar Cliente'}
          </Text>
        </TouchableOpacity>

        {/* Product Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color="#6c757d" />
          <TextInput
            style={styles.productSearchInput}
            placeholder="Buscar productos..."
            value={productSearch}
            onChangeText={setProductSearch}
          />
        </View>

        {/* Products and Cart Sections */}
        <View style={styles.contentContainer}>
          {/* Products List */}
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <FlatList
              data={filteredProducts}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productItem}
                  onPress={() => addToCart(item)}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.productStock}>Stock: {item.stock}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No se encontraron productos</Text>
              }
            />
          </View>

          {/* Cart Section */}
          <View style={styles.cartSection}>
            <Text style={styles.sectionTitle}>Carrito</Text>
            <FlatList
              data={cart}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <TouchableOpacity 
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      style={styles.quantityButton}
                    >
                      <MaterialCommunityIcons name="minus-circle" size={24} color="#dc3545" />
                    </TouchableOpacity>
                    <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
                    <TouchableOpacity 
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      style={styles.quantityButton}
                    >
                      <MaterialCommunityIcons name="plus-circle" size={24} color="#28a745" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => removeFromCart(item.id)}
                      style={styles.deleteButton}
                    >
                      <MaterialCommunityIcons name="delete" size={24} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>El carrito está vacío</Text>
              }
            />
            {cart.length > 0 && (
              <View style={styles.cartFooter}>
                <View style={styles.cartTotal}>
                  <Text style={styles.cartTotalText}>Total:</Text>
                  <Text style={styles.cartTotalAmount}>${cartTotal.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutButton}>
                  <Text style={styles.checkoutButtonText}>Procesar Venta</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Customer Modal */}
      {renderCustomerModal()}
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  productsSection: {
    flex: 3,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  cartSection: {
    flex: 2,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  quantityButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  cartFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  checkoutButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  customerSelectorText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#495057',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  productSearchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  productsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  productItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  productStock: {
    fontSize: 14,
    color: '#6c757d',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: 'white',
  },
  customerInfo: {
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    color: '#212529',
  },
  customerPhone: {
    fontSize: 14,
    color: '#6c757d',
  },
  cartContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    color: '#212529',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemQuantity: {
    fontSize: 16,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cartTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  cartTotalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  selectedCustomerItem: {
    backgroundColor: '#e8f5e9',
  },
  selectedCustomerText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
});

export default NewSaleScreen;