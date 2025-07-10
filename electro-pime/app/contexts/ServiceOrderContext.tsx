import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServiceOrder, ServiceOrderInput, ServiceOrderStatus } from '../types/api';
import { api } from '../services/api';

interface ServiceOrderContextData {
  orders: ServiceOrder[];
  loading: boolean;
  error: string | null;
  fetchOrders: (params?: any) => Promise<void>;
  getOrderById: (id: string) => Promise<ServiceOrder>;
  createOrder: (order: ServiceOrderInput) => Promise<ServiceOrder>;
  updateOrder: (id: string, order: Partial<ServiceOrderInput>) => Promise<ServiceOrder>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: ServiceOrderStatus, notes?: string) => Promise<ServiceOrder>;
  getOrderHistory: (id: string) => Promise<any>;
  getOrdersByStatus: (status: ServiceOrderStatus) => ServiceOrder[];
  getOrdersByCustomer: (customerId: string) => ServiceOrder[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => ServiceOrder[];
}

const ServiceOrderContext = createContext<ServiceOrderContextData | undefined>(undefined);

export const ServiceOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getServiceOrders(params);
      setOrders(data);
    } catch (err) {
      setError('Error al cargar las órdenes');
      console.error('Error fetching orders:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOrderById = async (id: string): Promise<ServiceOrder> => {
    try {
      // First try to find in local state
      const localOrder = orders.find(order => order.id === id);
      if (localOrder) return localOrder;
      
      // If not found, fetch from API
      return await api.getServiceOrderById(id);
    } catch (err) {
      console.error('Error fetching order:', err);
      throw new Error('No se pudo cargar la orden');
    }
  };

  const createOrder = async (order: ServiceOrderInput): Promise<ServiceOrder> => {
    try {
      const newOrder = await api.createServiceOrder(order);
      setOrders(prev => [...prev, newOrder]);
      return newOrder;
    } catch (err) {
      console.error('Error creating order:', err);
      throw new Error('No se pudo crear la orden');
    }
  };

  const updateOrder = async (id: string, updates: Partial<ServiceOrderInput>): Promise<ServiceOrder> => {
    try {
      const updatedOrder = await api.updateServiceOrder(id, updates);
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, ...updatedOrder } : order
      ));
      return updatedOrder;
    } catch (err) {
      console.error('Error updating order:', err);
      throw new Error('No se pudo actualizar la orden');
    }
  };

  const deleteOrder = async (id: string): Promise<void> => {
    try {
      await api.deleteServiceOrder(id);
      setOrders(prev => prev.filter(order => order.id !== id));
    } catch (err) {
      console.error('Error deleting order:', err);
      throw new Error('No se pudo eliminar la orden');
    }
  };

  const updateOrderStatus = async (id: string, status: ServiceOrderStatus, notes?: string): Promise<ServiceOrder> => {
    try {
      const updatedOrder = await api.updateServiceOrderStatus(id, status, notes);
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status: updatedOrder.status } : order
      ));
      return updatedOrder;
    } catch (err) {
      console.error('Error updating order status:', err);
      throw new Error('No se pudo actualizar el estado de la orden');
    }
  };

  const getOrderHistory = async (id: string) => {
    try {
      return await api.getServiceOrderHistory(id);
    } catch (err) {
      console.error('Error fetching order history:', err);
      throw new Error('No se pudo cargar el historial de la orden');
    }
  };

  // Helper methods
  const getOrdersByStatus = (status: ServiceOrderStatus): ServiceOrder[] => {
    return orders.filter(order => order.status === status);
  };

  const getOrdersByCustomer = (customerId: string): ServiceOrder[] => {
    return orders.filter(order => order.customerId === customerId);
  };

  const getOrdersByDateRange = (startDate: Date, endDate: Date): ServiceOrder[] => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <ServiceOrderContext.Provider
      value={{
        orders,
        loading,
        error,
        fetchOrders,
        getOrderById,
        createOrder,
        updateOrder,
        deleteOrder,
        updateOrderStatus,
        getOrderHistory,
        getOrdersByStatus,
        getOrdersByCustomer,
        getOrdersByDateRange,
      }}
    >
      {children}
    </ServiceOrderContext.Provider>
  );
};

export const useServiceOrders = (): ServiceOrderContextData => {
  const context = useContext(ServiceOrderContext);
  if (context === undefined) {
    throw new Error('useServiceOrders must be used within a ServiceOrderProvider');
  }
  return context;
};
