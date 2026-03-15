export class CustomerCreatedEvent {
  customerId: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  createdBy: string;
  timestamp: Date;
}

export class CustomerUpdatedEvent {
  customerId: string;
  businessId: string;
  updatedFields: string[];
  updatedBy: string;
  timestamp: Date;
}

export class CustomerDeletedEvent {
  customerId: string;
  businessId: string;
  deletedBy: string;
  timestamp: Date;
}
