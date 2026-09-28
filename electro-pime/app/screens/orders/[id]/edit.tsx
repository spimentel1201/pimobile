import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { api } from '../../../services/api';
import OrderForm from '../../../components/OrderForm';
import { RepairOrder } from '../../../types/api';

export default function EditOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<RepairOrder | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const orderData = await api.getRepairOrderById(id);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        Alert.alert('Error', 'No se pudo cargar la orden');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (data: Parameters<typeof import('../../../services/api').api.createRepairOrder>[0]) => {
    if (!id) return;

    try {
      setLoading(true);
      await api.updateRepairOrder(id, data);

      Alert.alert(
        '¡Éxito!',
        'La orden ha sido actualizada correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'No se pudo actualizar la orden. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Editar Orden',
        }}
      />

      <OrderForm
        initialData={order}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
