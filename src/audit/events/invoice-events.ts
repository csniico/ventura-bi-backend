export class InvoiceCreatedEvent {
  invoiceId: string;
  orderId?: string;
  customerId: string;
  totalAmount: number;
  createdBy: string;
  timestamp: Date;
}

export class InvoiceUpdatedEvent {
  invoiceId: string;
  customerId: string;
  updatedFields: string[];
  updatedBy: string;
  timestamp: Date;
}

export class InvoicePaidEvent {
  invoiceId: string;
  customerId: string;
  amountPaid: number;
  paymentMethod?: string;
  paidBy: string;
  timestamp: Date;
}

export class InvoiceCancelledEvent {
  invoiceId: string;
  customerId: string;
  reason?: string;
  cancelledBy: string;
  timestamp: Date;
}

export class InvoiceSentEvent {
  invoiceId: string;
  customerId: string;
  recipientEmail: string;
  sentBy: string;
  timestamp: Date;
}
