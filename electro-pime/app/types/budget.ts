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
  issue: string; // Added this field
}

export interface RepairOrder {
  id: string;
  customer: Customer;
  device: Device;
  issue: string; // This should be moved to Device interface
  notes?: string;
  status: OrderStatus;
  priority: PriorityLevel;
  technicianId: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletionDate: Date;
  completedAt: Date | null;
  budget: Budget;
  history: OrderHistory[];
  imageUrl?: string;
}

export interface BudgetPart {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderHistory {
  date: string;  // Changed from Date to string since we store dates as ISO strings in history
  action: string;
  user: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type DeviceType = 'smartphone' | 'tablet' | 'other';
export type NotificationMethod = 'sms' | 'email';

export interface FormData extends Omit<RepairOrder, 'id'> {
  id?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletionDate: Date;
  completedAt: Date | null;
}

export interface Budget {
  labor: number;
  parts: BudgetPart[];
  tax: number;
  total: number;
  approved?: boolean;
  notes?: string; // Added notes property
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