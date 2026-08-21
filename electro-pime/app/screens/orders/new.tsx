import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import OrderForm from '../../../components/OrderForm';
import { CreateRepairOrderDto } from '../../../types/api';
import { useTheme } from '../../../hooks/useTheme';

export default function NewOrderScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateRepairOrderDto) => {
    try {
      setLoading(true);
      await api.createRepairOrder(data);

      Alert.alert(
        '¡Éxito!',
        'La orden de reparación ha sido creada correctamente.',
        [
          {
            text: 'Ver Órdenes',
            onPress: () => router.replace('/orders'),
          },
          {
            text: 'Crear Otra',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating order:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo crear la orden. Por favor, intente de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Nueva Orden de Reparación',
          headerShown: true,
        }}
      />

      <OrderForm
        onSubmit={handleSubmit}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
