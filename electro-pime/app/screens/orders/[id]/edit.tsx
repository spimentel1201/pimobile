import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

// Import components and hooks with relative paths from the project root
import { useServiceOrders } from '../../../../../contexts/ServiceOrderContext';
import OrderForm from '../../../../../components/OrderForm';
import { Device, User, ServiceOrder } from '../../../../../types/api';

export default function EditOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOrderById, updateOrder, loading: contextLoading } = useServiceOrders();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch order data
        const orderData = await getOrderById(id);
        setOrder(orderData);
        
        // In a real app, you would also fetch related data (devices, customers, technicians)
        // For now, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - replace with actual API calls
        setDevices([
          {
            id: orderData.deviceId,
            name: orderData.device.name,
            brand: orderData.device.brand,
            model: orderData.device.model,
            serialNumber: orderData.device.serialNumber,
            description: orderData.device.description || '',
            customerId: orderData.customerId,
            createdAt: orderData.device.createdAt,
            updatedAt: orderData.device.updatedAt,
          },
          // Add more mock devices as needed
        ]);

        setCustomers([
          {
            id: orderData.customer.id,
            name: orderData.customer.name,
            email: orderData.customer.email,
            role: 'customer',
            isActive: true,
            createdAt: orderData.customer.createdAt,
            updatedAt: orderData.customer.updatedAt,
          },
          // Add more mock customers as needed
        ]);

        const techs: User[] = [];
        if (orderData.technician) {
          techs.push({
            id: orderData.technician.id,
            name: orderData.technician.name,
            email: orderData.technician.email,
            role: 'technician',
            isActive: true,
            createdAt: orderData.technician.createdAt,
            updatedAt: orderData.technician.updatedAt,
          });
        }
        
        // Add more mock technicians as needed
        techs.push({
          id: '2',
          name: 'Otro Técnico',
          email: 'otro@example.com',
          role: 'technician',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        setTechnicians(techs);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'No se pudo cargar la orden');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Format data as needed before sending to API
      const orderData = {
        ...data,
        // Ensure we don't send read-only fields
        device: undefined,
        customer: undefined,
        technician: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
      
      await updateOrder(id, orderData);
      
      // Show success message and navigate back
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
        loading={loading || contextLoading}
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
