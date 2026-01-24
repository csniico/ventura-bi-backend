export interface ITopCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
}

export interface ICustomerAnalyticsParams {
  businessId: string;
  ownerId: string;
  limit?: number;
}
