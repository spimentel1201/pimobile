import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCompleteSale = () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Por favor seleccione un cliente');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Error', 'El carrito está vacío');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePayment = (method: string) => {
    setPaymentMethod(method);
    // Here you would implement the actual payment processing
    Alert.alert(
      'Confirmar Venta',
      `¿Desea finalizar la venta por $${calculateTotal().toFixed(2)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            // TODO: Implement sale completion logic
            Alert.alert('Éxito', 'Venta realizada correctamente');
            onClose();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva Venta</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
        </TouchableOpacity>
      </View>

      <View style={styles.customerSection}>
        <TouchableOpacity
          style={styles.customerSelector}
          onPress={() => setShowCustomerModal(true)}
        >
          <MaterialCommunityIcons name="account" size={24} color="#0056b3" />
          <Text style={styles.customerText}>
            {selectedCustomer ? (selectedCustomer as { name: string }).name : 'Seleccionar Cliente'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={24} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.cartSection}>
        <Text style={styles.sectionTitle}>Carrito</Text>
        <FlatList
          data={cart}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <MaterialCommunityIcons name="minus" size={24} color="#0056b3" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <MaterialCommunityIcons name="plus" size={24} color="#0056b3" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cartItemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <MaterialCommunityIcons name="delete" size={24} color="#dc3545" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalText}>Total:</Text>
        <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={styles.completeButton}
        onPress={handleCompleteSale}
      >
        <Text style={styles.completeButtonText}>Completar Venta</Text>
      </TouchableOpacity>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.paymentModal}>
            <Text style={styles.modalTitle}>Método de Pago</Text>
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => handlePayment('cash')}
            >
              <MaterialCommunityIcons name="cash" size={24} color="#28a745" />
              <Text style={styles.paymentOptionText}>Efectivo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => handlePayment('card')}
            >
              <MaterialCommunityIcons name="credit-card" size={24} color="#0056b3" />
              <Text style={styles.paymentOptionText}>Tarjeta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => handlePayment('transfer')}
            >
              <MaterialCommunityIcons name="bank-transfer" size={24} color="#6c757d" />
              <Text style={styles.paymentOptionText}>Transferencia</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  customerSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  customerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#495057',
  },
  searchSection: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  cartSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cartItemName: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginRight: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  completeButton: {
    backgroundColor: '#28a745',
    padding: 16,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  paymentModal: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  paymentOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#212529',
  },
});

export default NewSaleScreen;