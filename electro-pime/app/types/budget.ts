export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Device {
  type: 'smartphone' | 'tablet' | 'other';
  brand: string;
  model: string;
  serialNumber: string;
  condition: string;
}

export interface BudgetPart {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Budget {
  labor: number;
  parts: BudgetPart[];
  tax: number;
  total: number;
  approved?: boolean;
}

export interface OrderHistory {
  action: string;
  user: string;
  date: string;
}

export interface RepairOrder {
  completedAt: null;
  updatedAt: string;
  id: string;
  customer: Customer;
  device: Device;
  issue: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  technicianId: string;
  estimatedCompletionDate: string;
  createdAt: string;
  budget: Budget;
  history: OrderHistory[];
  imageUrl?: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type DeviceType = 'smartphone' | 'tablet' | 'other';
export type NotificationMethod = 'sms' | 'email';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Device {
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  condition: string;
}

export interface BudgetPart {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Budget {
  labor: number;
  parts: BudgetPart[];
  tax: number;
  total: number;
  approved?: boolean;
}

export interface OrderHistory {
  date: string;
  action: string;
  user: string;
}

export interface RepairOrder {
  id: string;
  customer: Customer;
  device: Device;
  issue: string;
  notes?: string;
  status: OrderStatus;
  priority: PriorityLevel;
  technicianId: string;
  createdAt: string;
  updatedAt: string;
  estimatedCompletionDate: string;
  completedAt: null;
  budget: Budget;
  history: OrderHistory[];
  imageUrl?: string;
}

export interface StatusInfo {
  text: string;
  color: string;
  icon: string;
}

export interface NotificationData {
  method: NotificationMethod;
  message: string;
  orderId?: string;
}

export interface FormData extends Omit<RepairOrder, 'id'> {
  id?: string;
}