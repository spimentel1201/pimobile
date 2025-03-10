export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photo: string;
  status: 'active' | 'inactive';
  lastOrder: string;
  totalOrders: number;
  totalSpent: number;
  documentType: 'dni' | 'ruc';
  documentNumber: string;
}

// Add your existing type definitions here

// Add this to prevent it from being treated as a route
export default null;