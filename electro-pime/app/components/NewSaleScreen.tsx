import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock data for customers and products
const mockCustomers = [
  { id: '1', name: 'Juan Pérez', phone: '555-0101' },
  { id: '2', name: 'María García', phone: '555-0102' },
  { id: '3', name: 'Carlos López', phone: '555-0103' },
  { id: '4', name: 'Ana Martínez', phone: '555-0104' },
];

const mockProducts = [
  { id: '1', name: 'iPhone 13 Screen', price: 1500, stock: 10 },
  { id: '2', name: 'Screen Protector', price: 500, stock: 50 },
  { id: '3', name: 'Samsung Battery', price: 1200, stock: 15 },
  { id: '4', name: 'Charging Port', price: 800, stock: 20 },
  { id: '5', name: 'LCD Screen', price: 1800, stock: 8 },
];

const NewSaleScreen = ({ onClose }: { onClose: () => void }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  // Add this interface at the top of the file, after imports
  interface CartItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    quantity: number;
  }
  // Replace the cart state with proper typing
  const [cart, setCart] = useState<CartItem[]>([]);
  // Replace the addToCart function
  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
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
  // Add this function after addToCart
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
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
  // Add cart display section in the return statement, before renderCustomerModal()
  <View style={styles.cartContainer}>
    <Text style={styles.sectionTitle}>Carrito</Text>
    <FlatList
      data={cart}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.cartItem}>
          <View style={styles.cartItemInfo}>
            <Text style={styles.cartItemName}>{item.name}</Text>
            <Text style={styles.cartItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
          <View style={styles.cartItemActions}>
            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)}>
              <MaterialCommunityIcons name="minus-circle" size={24} color="#dc3545" />
            </TouchableOpacity>
            <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#28a745" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
              <MaterialCommunityIcons name="delete" size={24} color="#dc3545" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  </View>
  // Add these styles to the StyleSheet
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
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
      maxHeight: '80%',
      borderRadius: 12,
      padding: 16,
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
    searchInput: {
      backgroundColor: '#f1f3f5',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    customerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
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
  });
  const renderCustomerModal = () => (
    <Modal
      visible={showCustomerModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente..."
            value={customerSearch}
            onChangeText={setCustomerSearch}
          />

          <FlatList
            data={filteredCustomers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => {
                  setSelectedCustomer(item as any);
                  setShowCustomerModal(false);
                }}
              >
                <MaterialCommunityIcons name="account" size={24} color="#6c757d" />
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{item.name}</Text>
                  <Text style={styles.customerPhone}>{item.phone}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0056b3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Venta</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity
        style={styles.customerSelector}
        onPress={() => setShowCustomerModal(true)}
      >
        <MaterialCommunityIcons name="account" size={24} color="#0056b3" />
        <Text style={styles.customerSelectorText}>
          {selectedCustomer ? (selectedCustomer as { name: string }).name : 'Seleccionar Cliente'}
        </Text>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#6c757d" />
        <TextInput
          style={styles.productSearchInput}
          placeholder="Buscar productos..."
          value={productSearch}
          onChangeText={setProductSearch}
        />
      </View>

      <View style={styles.productsContainer}>
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
        />
      </View>

      {renderCustomerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    maxHeight: '80%',
    borderRadius: 12,
    padding: 16,
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
  searchInput: {
    backgroundColor: '#f1f3f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
});
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
});
export default NewSaleScreen;