import { Platform } from 'react-native';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  Customer,
  CreateCustomerDto,
  Product,
  CreateProductDto,
  RepairOrder,
  CreateRepairOrderDto,
  UpdateRepairOrderDto,
  RepairOrderStatus,
  Quote,
  CreateQuoteDto,
  Sale,
  CreateSaleDto,
  // Legacy types
  ServiceOrder,
  ServiceOrderInput,
  Device,
} from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error('Missing EXPO_PUBLIC_API_URL environment variable');
}


class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      // For DELETE requests that might not return content
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // ==================== Auth ====================

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Store token after successful login
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    // Store token after successful registration
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
    });
  }

  // ==================== Users ====================

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(data: { email: string; password: string; firstName: string; lastName: string; phone?: string; role: 'ADMIN' | 'TECHNICIAN' }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Customers ====================

  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/customers');
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return this.request<Customer[]>(`/customers/search?query=${encodeURIComponent(query)}`);
  }

  async getCustomerById(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerDto>): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async getCustomerHistory(id: string): Promise<any> {
    return this.request<any>(`/customers/${id}/history`);
  }

  // ==================== Products ====================

  async getProducts(params?: { category?: string; active?: boolean }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.active !== undefined) query.append('active', String(params.active));
    const queryString = query.toString();
    return this.request<Product[]>(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.request<Product[]>(`/products/search?query=${encodeURIComponent(query)}`);
  }

  async getProductById(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async getProductCategories(): Promise<string[]> {
    return this.request<string[]>('/products/categories');
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: Partial<CreateProductDto>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateProductStock(id: string, quantity: number): Promise<Product> {
    return this.request<Product>(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Repair Orders ====================

  async getRepairOrders(): Promise<RepairOrder[]> {
    return this.request<RepairOrder[]>('/repair-orders');
  }

  async getRepairOrderById(id: string): Promise<RepairOrder> {
    return this.request<RepairOrder>(`/repair-orders/${id}`);
  }

  async getRepairOrdersByCustomer(customerId: string): Promise<RepairOrder[]> {
    return this.request<RepairOrder[]>(`/repair-orders/customer/${customerId}`);
  }

  async getRepairOrdersByTechnician(technicianId: string): Promise<RepairOrder[]> {
    return this.request<RepairOrder[]>(`/repair-orders/technician/${technicianId}`);
  }

  async createRepairOrder(data: CreateRepairOrderDto): Promise<RepairOrder> {
    return this.request<RepairOrder>('/repair-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRepairOrder(id: string, data: UpdateRepairOrderDto): Promise<RepairOrder> {
    return this.request<RepairOrder>(`/repair-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateRepairOrderStatus(id: string, status: RepairOrderStatus): Promise<RepairOrder> {
    return this.request<RepairOrder>(`/repair-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteRepairOrder(id: string): Promise<void> {
    return this.request<void>(`/repair-orders/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Quotes ====================

  async getQuotes(): Promise<Quote[]> {
    return this.request<Quote[]>('/quotes');
  }

  async getQuoteById(id: string): Promise<Quote> {
    return this.request<Quote>(`/quotes/${id}`);
  }

  async getQuotesByRepairOrder(repairOrderId: string): Promise<Quote[]> {
    return this.request<Quote[]>(`/quotes/repair-order/${repairOrderId}`);
  }

  async getQuotesByCustomer(customerId: string): Promise<Quote[]> {
    return this.request<Quote[]>(`/quotes/customer/${customerId}`);
  }

  async createQuote(data: CreateQuoteDto): Promise<Quote> {
    return this.request<Quote>('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuote(id: string, data: Partial<CreateQuoteDto>): Promise<Quote> {
    return this.request<Quote>(`/quotes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateQuoteStatus(id: string, status: string): Promise<Quote> {
    return this.request<Quote>(`/quotes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async sendQuoteEmail(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/quotes/${id}/send-email`, {
      method: 'POST',
    });
  }

  async deleteQuote(id: string): Promise<void> {
    return this.request<void>(`/quotes/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Sales ====================

  async getSales(params?: { startDate?: string; endDate?: string; customerId?: string }): Promise<Sale[]> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.customerId) query.append('customerId', params.customerId);
    const queryString = query.toString();
    return this.request<Sale[]>(`/sales${queryString ? `?${queryString}` : ''}`);
  }

  async getSaleById(id: string): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`);
  }

  async createSale(data: CreateSaleDto): Promise<Sale> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSale(id: string, data: Partial<CreateSaleDto>): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSale(id: string): Promise<void> {
    return this.request<void>(`/sales/${id}`, {
      method: 'DELETE',
    });
  }

  async getSaleInvoice(id: string): Promise<any> {
    return this.request<any>(`/sales/${id}/invoice`);
  }

  // ==================== Legacy Methods (for backward compatibility) ====================

  async getServiceOrders(params?: {
    status?: string;
    customerId?: string;
    technicianId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ServiceOrder[]> {
    // Map to new API
    const response = await this.getRepairOrders();
    // Transform response if needed
    return response as unknown as ServiceOrder[];
  }

  async getServiceOrderById(id: string): Promise<ServiceOrder> {
    const response = await this.getRepairOrderById(id);
    return response as unknown as ServiceOrder;
  }

  async createServiceOrder(data: ServiceOrderInput): Promise<ServiceOrder> {
    // Map old format to new format
    const newData: CreateRepairOrderDto = {
      customerId: data.customerId,
      technicianId: data.technicianId,
      description: data.description,
      items: [{
        deviceType: 'Dispositivo',
        brand: 'N/A',
        model: 'N/A',
        problemDescription: data.description,
        quantity: 1,
      }],
    };
    const response = await this.createRepairOrder(newData);
    return response as unknown as ServiceOrder;
  }

  async updateServiceOrder(id: string, data: Partial<ServiceOrderInput>): Promise<ServiceOrder> {
    const response = await this.updateRepairOrder(id, data as UpdateRepairOrderDto);
    return response as unknown as ServiceOrder;
  }

  async updateServiceOrderStatus(id: string, status: string, notes?: string): Promise<ServiceOrder> {
    const response = await this.updateRepairOrderStatus(id, status as RepairOrderStatus);
    return response as unknown as ServiceOrder;
  }

  async deleteServiceOrder(id: string): Promise<void> {
    return this.deleteRepairOrder(id);
  }

  async getServiceOrderHistory(orderId: string): Promise<any> {
    // API doesn't have this endpoint, return empty array
    return [];
  }

  async getDevices(): Promise<Device[]> {
    // API doesn't have devices endpoint, return empty array
    return [];
  }

  async createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    // API doesn't have devices endpoint
    throw new Error('Devices endpoint not available');
  }

  async getCurrentUser(): Promise<User> {
    return this.getProfile();
  }
}

export const api = new ApiService();
