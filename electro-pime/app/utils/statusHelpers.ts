import { OrderStatus, StatusInfo } from '../types/budget';

export const getStatusInfo = (status: OrderStatus): StatusInfo => {
  const statusMap: Record<OrderStatus, StatusInfo> = {
    pending: {
      text: 'Pendiente',
      color: '#ffc107',
      icon: 'clock-outline'
    },
    in_progress: {
      text: 'En Proceso',
      color: '#0056b3',
      icon: 'progress-wrench'
    },
    completed: {
      text: 'Completado',
      color: '#28a745',
      icon: 'check-circle'
    },
    delivered: {
      text: 'Entregado',
      color: '#20c997',
      icon: 'package-variant-closed'
    },
    cancelled: {
      text: 'Cancelado',
      color: '#dc3545',
      icon: 'close-circle'
    }
  };

  return statusMap[status];
};