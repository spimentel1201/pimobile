import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useServiceOrders } from '../../../contexts/ServiceOrderContext';
import { useAuth } from '../../../contexts/AuthContext';
import OrderForm from '../../../components/OrderForm';
import { Device, User } from '../../../types/api';

export default function NewOrderScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createOrder } = useServiceOrders();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);

  // In a real app, you would fetch these from your API
  useEffect(() => {
    // Mock data - replace with actual API calls
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - replace with actual API calls
        setDevices([
          {
            id: '1',
            name: 'iPhone 13 Pro',
            brand: 'Apple',
            model: 'A2487',
            serialNumber: 'F2LXYZ123456',
            description: 'Pantalla rota',
            customerId: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          // Add more mock devices as needed
        ]);

        setCustomers([
          {
            id: '1',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            role: 'customer',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          // Add more mock customers as needed
        ]);

        setTechnicians([
          {
            id: '2',
            name: 'Carlos Técnico',
            email: 'tecnico@example.com',
            role: 'technician',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          // Add more mock technicians as needed
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      // Add default values and format data as needed
      const orderData = {
        ...data,
        status: 'pending', // Default status for new orders
        technicianId: data.technicianId || null,
      };
      
      await createOrder(orderData);
      
      // Show success message and navigate back
      Alert.alert(
        '¡Éxito!", "La orden ha sido creada correctamente.",
        [
          {
            text: 'Aceptar',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'No se pudo crear la orden. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && (devices.length === 0 || customers.length === 0)) {
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
          title: 'Nueva Orden de Servicio',
        }} 
      />
      
      <OrderForm
        onSubmit={handleSubmit}
        loading={loading}
        devices={devices}
        customers={customers}
        technicians={technicians}
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
