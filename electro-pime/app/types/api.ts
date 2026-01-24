// ==================== Auth ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// ==================== User ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'CUSTOMER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== Customer ====================

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  address?: string;
}

// ==================== Product ====================

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  isActive?: boolean;
  imageUrl?: string;
}

// ==================== Repair Order ====================

export type RepairOrderStatus =
  | 'RECEIVED'
  | 'DIAGNOSED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface RepairOrderItem {
  id?: string;
  repairOrderId?: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber?: string;
  problemDescription: string;
  accessories?: string[];
  quantity: number;
  price?: number;
  productId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RepairOrder {
  id: string;
  customerId: string;
  customerName?: string;
  customer?: Customer;
  technicianId?: string;
  technicianName?: string;
  technician?: User;
  status: RepairOrderStatus;
  description: string;
  notes?: string;
  initialReviewCost?: number;
  totalCost?: number;
  createdAt: string;
  updatedAt: string;
  endDate?: string;
  items: RepairOrderItem[];
}

export interface CreateRepairOrderDto {
  customerId: string;
  technicianId?: string;
  status?: RepairOrderStatus;
  description: string;
  notes?: string;
  initialReviewCost?: number;
  items: Omit<RepairOrderItem, 'id' | 'repairOrderId' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateRepairOrderDto extends Partial<CreateRepairOrderDto> { }

// ==================== Quote ====================

export type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface QuoteItem {
  id?: string;
  quoteId?: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  description?: string;
  productId?: string;
  productName?: string;
}

export interface Quote {
  id: string;
  repairOrderId?: string;
  customerId: string;
  customer?: Customer;
  customerName?: string;
  technicianId?: string;
  technician?: User;
  status: QuoteStatus;
  totalAmount: number;
  laborCost: number;
  notes?: string;
  validDays?: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  items: QuoteItem[];
}

export interface CreateQuoteDto {
  repairOrderId?: string;
  customerId: string;
  technicianId?: string;
  status?: QuoteStatus;
  laborCost?: number;
  notes?: string;
  validDays?: number;
  items: { description: string; quantity: number; unitPrice: number }[];
}

// ==================== Sale ====================

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'YAPE' | 'PLIN';

export interface SaleItem {
  id?: string;
  saleId?: string;
  productId: string;
  productName?: string;
  productDescription?: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName?: string;
  customerFullName?: string;
  userId: string;
  userName: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
}

export interface CreateSaleDto {
  customerId?: string;
  customerName?: string;
  paymentMethod: PaymentMethod;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
}

// ==================== Legacy Types (for backward compatibility) ====================

// These will be removed once all screens are migrated
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

export type ServiceOrderStatus = 'pending' | 'in_progress' | 'waiting_approval' | 'completed' | 'cancelled';

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
