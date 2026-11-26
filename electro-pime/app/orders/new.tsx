import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Alert, SafeAreaView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { api } from '../services/api';
import OrderForm from '../components/OrderForm';
import { CreateRepairOrderDto } from '../types/api';
import { colors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function NewOrderScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateRepairOrderDto) => {
    try {
      setLoading(true);
      await api.createRepairOrder(data);
      Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/orders');
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
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
