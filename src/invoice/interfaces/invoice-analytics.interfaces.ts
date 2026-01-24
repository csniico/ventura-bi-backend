export interface IUnpaidInvoicesResult {
  amount: number;
  count: number;
}

export interface IOverdueInvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
}

export interface ICancelledInvoiceProduct {
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
  products: ICancelledInvoiceProduct[];
  cancelledAt: Date;
  reason: string | null;
}

export interface ICancelledInvoicesAnalytics {
  total: number;
  totalRevenueLost: number;
  mappings: ICancelledInvoiceMapping[];
}

export interface IFinancialSummaryResult {
  totalRevenue: number;
  totalTax: number;
  vatAmount: number;
  nhilAmount: number;
  getfundAmount: number;
  netRevenue: number;
}

export interface IInvoiceAnalyticsParams {
  businessId: string;
  ownerId: string;
  limit?: number;
}
