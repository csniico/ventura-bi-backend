export interface IOrderStatsResult {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export interface IPendingOrderResult {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  createdAt: Date;
}

export interface ICancelledOrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ICancelledOrderResult {
  orderId: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  products: ICancelledOrderProduct[];
  totalAmount: number;
  cancelledAt: Date;
  reason: string | null;
}

export interface ICancelledOrdersAnalytics {
  total: number;
  totalRevenueLost: number;
  byReason: Array<{
    reason: string;
    count: number;
    amount: number;
  }>;
  details: ICancelledOrderResult[];
}

export interface IOrderAnalyticsParams {
  businessId: string;
  ownerId: string;
  limit?: number;
}
