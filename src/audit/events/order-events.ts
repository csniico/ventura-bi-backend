export class OrderCreatedEvent {
  orderId: string;
  customerId: string;
  totalAmount: number;
  createdBy: string;
  timestamp: Date;
}

export class OrderUpdatedEvent {
  orderId: string;
  customerId: string;
  updatedFields: string[];
  updatedBy: string;
  timestamp: Date;
}

export class OrderCancelledEvent {
  orderId: string;
  customerId: string;
  reason?: string;
  cancelledBy: string;
  timestamp: Date;
}

export class OrderCompletedEvent {
  orderId: string;
  customerId: string;
  totalAmount: number;
  completedBy: string;
  timestamp: Date;
}

export class OrderStatusChangedEvent {
  orderId: string;
  customerId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  timestamp: Date;
}
