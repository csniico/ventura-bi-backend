import { InvoiceStatus, PaymentMethod } from '../entities/invoice.entity';

export interface ICreateInvoice {
  businessId: string;
  customerId: string;
  orderIds: string[];
  dueDate: string;
  ownerId: string;
  notes?: string;
}

export interface IGetInvoicesParams {
  businessId: string;
  ownerId: string;
  status?: InvoiceStatus;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface IGetInvoiceByIdParams {
  invoiceId: string;
  businessId: string;
  ownerId: string;
}

export interface IUpdateInvoicePaymentParams {
  invoiceId: string;
  businessId: string;
  ownerId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
}

export interface IUpdateInvoiceStatusParams {
  invoiceId: string;
  businessId: string;
  ownerId: string;
  status: InvoiceStatus;
}

export interface IGetCustomerInvoicesParams {
  customerId: string;
  businessId: string;
  ownerId: string;
  page?: number;
  limit?: number;
}

export interface IOrderValidationError {
  orderId: string;
  orderNumber?: string;
  message: string;
}
