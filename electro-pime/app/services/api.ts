import { Platform } from 'react-native';
import { AuthResponse, LoginCredentials, RegisterData, ServiceOrder, ServiceOrderInput, User, Device } from '../types/api';

const API_BASE_URL = 'https://repairserviceapi-a79i.onrender.com/api/v1';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      'User-Agent': `RepairServiceApp/${Platform.OS} v1.0.0`,
      ...options.headers,
    });

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Something went wrong');
      }

      // For DELETE requests that might not return content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Service Orders
  async getServiceOrders(params?: {
    status?: string;
    customerId?: string;
    technicianId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ServiceOrder[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.customerId) query.append('customerId', params.customerId);
    if (params?.technicianId) query.append('technicianId', params.technicianId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const queryString = query.toString();
    const url = `/service-orders${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ServiceOrder[]>(url);
  }

  async getServiceOrderById(id: string): Promise<ServiceOrder> {
    return this.request<ServiceOrder>(`/service-orders/${id}`);
  }

  async createServiceOrder(data: ServiceOrderInput): Promise<ServiceOrder> {
    return this.request<ServiceOrder>('/service-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateServiceOrder(id: string, data: Partial<ServiceOrderInput>): Promise<ServiceOrder> {
    return this.request<ServiceOrder>(`/service-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateServiceOrderStatus(id: string, status: string, notes?: string): Promise<ServiceOrder> {
    return this.request<ServiceOrder>(`/service-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async deleteServiceOrder(id: string): Promise<void> {
    return this.request<void>(`/service-orders/${id}`, {
      method: 'DELETE',
    });
  }

  async getServiceOrderHistory(orderId: string): Promise<Array<{
    id: string;
    serviceOrderId: string;
    status: string;
    notes?: string;
    changedById: string;
    changedBy: {
      id: string;
      name: string;
      email: string;
    };
    changedAt: string;
    previousData?: Partial<ServiceOrder>;
    newData?: Partial<ServiceOrder>;
  }>> {
    return this.request<Array<{
      id: string;
      serviceOrderId: string;
      status: string;
      notes?: string;
      changedById: string;
      changedBy: {
        id: string;
        name: string;
        email: string;
      };
      changedAt: string;
      previousData?: Partial<ServiceOrder>;
      newData?: Partial<ServiceOrder>;
    }>>(`/service-orders/${orderId}/history`);
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    return this.request<Device[]>('/devices');
  }

  async createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    return this.request<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  }

  // Users
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }
}

export const api = new ApiService();
