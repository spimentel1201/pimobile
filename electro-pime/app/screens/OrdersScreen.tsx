import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useOrders } from '../hooks/useOrders';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { OrderCard } from '../components/orders/OrderCard';
import { SearchBar } from '../components/common/SearchBar';
import { HeaderWithActions } from '../components/common/HeaderWithActions';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ListEmptyState } from '../components/common/ListEmptyState';
import { NewOrderForm } from '../components/orders/NewOrderForm';
import { styles } from '../styles/screens/orders';
import { submitOrder } from '../services/orderService';
import { RepairOrder } from '../types/budget';

export const OrdersScreen = () => {
  const { orders, loading, error, fetchOrders } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewOrderVisible, setIsNewOrderVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const handleOrderSubmit = useCallback(async (formData: Partial<RepairOrder>) => {
      try {
        // Validate required fields
        if (!formData.customer?.name || !formData.customer?.phone) {
          throw new Error('Por favor complete la información del cliente');
        }
        if (!formData.device?.brand || !formData.device?.model || !formData.device?.issue) {
          throw new Error('Por favor complete la información del dispositivo');
        }
        const newOrder: Partial<RepairOrder> = {
          ...formData,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          id: Date.now().toString(), // Temporary ID until backend generates one
        };
        await submitOrder(newOrder);
        await fetchOrders();
        setIsNewOrderVisible(false);
      } catch (error) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'No se pudo crear la orden. Intente nuevamente.'
        );
      }
    }, [fetchOrders]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOrders} />;

  return (
    <ScreenContainer>
      <HeaderWithActions 
        title="Órdenes"
        onAddPress={() => setIsNewOrderVisible(true)}
      />
      <SearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar por cliente o dispositivo..."
      />
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => {/* Handle press */}} />
        )}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <ListEmptyState 
            message={searchQuery ? "Sin resultados" : "No hay órdenes"}
            icon="clipboard-text-outline"
          />
        }
      />

      <Modal
        visible={isNewOrderVisible}
        onRequestClose={() => setIsNewOrderVisible(false)}
      >
        <NewOrderForm
          onClose={() => setIsNewOrderVisible(false)}
          editingOrder={null}
          handleSubmit={handleOrderSubmit}
        />
      </Modal>
    </ScreenContainer>
  );
};

export default OrdersScreen;