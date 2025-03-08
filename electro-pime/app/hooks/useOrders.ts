import { useState, useCallback } from 'react';
import { RepairOrder, OrderStatus } from '../types/budget';

export const useOrders = () => {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Asegúrate de que la respuesta de la API incluya el campo issue en el objeto device
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching orders');
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      // API call will go here
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating order');
      return false;
    }
  }, []);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus
  };
};