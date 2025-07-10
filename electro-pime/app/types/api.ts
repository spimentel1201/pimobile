export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'technician' | 'customer';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  description?: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  deviceId: string;
  customerId: string;
  technicianId?: string;
  status: ServiceOrderStatus;
  description: string;
  diagnosis?: string;
  repairDetails?: string;
  cost?: number;
  estimatedCompletion?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  device: Device;
  customer: User;
  technician?: User;
}

export type ServiceOrderStatus = 'pending' | 'in_progress' | 'waiting_approval' | 'completed' | 'cancelled';

export interface ServiceOrderHistory {
  id: string;
  serviceOrderId: string;
  status: ServiceOrderStatus;
  notes?: string;
  changedById: string;
  changedBy: User;
  createdAt: string;
}

export interface ServiceOrderHistory {
  id: string;
  serviceOrderId: string;
  status: ServiceOrderStatus;
  notes?: string;
  changedById: string;
  changedBy: User;
  changedAt: string;
  previousData?: Partial<ServiceOrder>;
  newData?: Partial<ServiceOrder>;
}

export interface ServiceOrderInput {
  deviceId: string;
  customerId: string;
  technicianId?: string;
  description: string;
  status?: ServiceOrderStatus;
  diagnosis?: string;
  repairDetails?: string;
  cost?: number;
  estimatedCompletion?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role: 'admin' | 'technician' | 'customer';
}
