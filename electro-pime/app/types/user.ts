export type UserRole = 'admin' | 'technician' | 'seller';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  avatar?: string;
}

export interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
  confirmPassword?: string;
}

export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'dashboard.view',
    'orders.manage',
    'inventory.manage',
    'users.manage',
    'sales.manage',
    'reports.view',
    'settings.manage'
  ],
  technician: [
    'dashboard.view',
    'orders.view',
    'orders.update',
    'inventory.view'
  ],
  seller: [
    'dashboard.view',
    'sales.manage',
    'customers.manage',
    'orders.create',
    'orders.view'
  ]
};