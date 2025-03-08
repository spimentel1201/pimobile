import { API_URL } from '../../app/config';
import { RepairOrder } from '../types/budget';

export const submitOrder = async (orderData: Partial<RepairOrder>): Promise<RepairOrder> => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting order:', error);
    throw error;
  }
};

export const fetchOrders = async (): Promise<RepairOrder[]> => {
  try {
    const response = await fetch(`${API_URL}/orders`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const updateOrder = async (orderId: string, orderData: Partial<RepairOrder>): Promise<RepairOrder> => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to update order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete order');
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<RepairOrder> => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};