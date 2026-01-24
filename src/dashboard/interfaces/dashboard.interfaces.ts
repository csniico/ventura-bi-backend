export interface IDashboardSummaryParams {
  businessId: string;
  ownerId: string;
}

export interface ITrendIndicator {
  percentage: number;
  direction: 'up' | 'down';
}

export interface ITaxBreakdown {
  vat: {
    rate: number;
    amount: number;
  };
  nhil: {
    rate: number;
    amount: number;
  };
  getfund: {
    rate: number;
    amount: number;
  };
}

export interface IFinancialSummary {
  totalRevenue: {
    amount: number;
    trend: ITrendIndicator;
  };
  netRevenue: {
    amount: number;
    afterTaxes: boolean;
  };
  totalTax: {
    amount: number;
    breakdown: ITaxBreakdown;
  };
  unpaidInvoices: {
    amount: number;
    count: number;
  };
}

export interface IStats {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalInvoices: number;
}

export interface IPendingOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  createdAt: Date;
}

export interface IOutOfStockProduct {
  id: string;
  name: string;
  lastSoldDate: Date | null;
  demandScore: number;
}

export interface IOverdueInvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
}

export interface IAlerts {
  pendingOrders: {
    count: number;
    items: IPendingOrderItem[];
  };
  outOfStockProducts: {
    count: number;
    items: IOutOfStockProduct[];
  };
  overdueInvoices: {
    count: number;
    items: IOverdueInvoiceItem[];
  };
}

export interface ITopSellingProduct {
  id: string;
  name: string;
  primaryImage: string | null;
  totalRevenue: number;
  totalQuantitySold: number;
  totalOrders: number;
}

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

export interface ITopPerformers {
  topSellingProducts: ITopSellingProduct[];
  topCustomers: ITopCustomer[];
}

export type ActivityType =
  | 'order_completed'
  | 'order_cancelled'
  | 'invoice_paid'
  | 'invoice_created'
  | 'invoice_overdue'
  | 'invoice_cancelled'
  | 'product_out_of_stock'
  | 'product_low_stock'
  | 'new_customer'
  | 'new_order';

export interface IActivityMetadata {
  [key: string]: any;
}

export interface IRecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata: IActivityMetadata;
  timestamp: Date;
}

export interface ICancelledOrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ICancelledInvoiceMapping {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  orderId: string | null;
  orderNumber: string | null;
  products: ICancelledOrderProduct[];
  cancelledAt: Date;
  reason: string | null;
}

export interface ICancellations {
  cancelledOrders: {
    total: number;
    totalRevenueLost: number;
    byReason: Array<{
      reason: string;
      count: number;
      amount: number;
    }>;
  };
  cancelledInvoices: {
    total: number;
    totalRevenueLost: number;
    mappings: ICancelledInvoiceMapping[];
  };
}

export interface IDashboardSummaryResponse {
  financial: IFinancialSummary;
  stats: IStats;
  alerts: IAlerts;
  topPerformers: ITopPerformers;
  recentActivity: IRecentActivity[];
  cancellations: ICancellations;
}
