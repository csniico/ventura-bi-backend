export class UserCreatedEvent {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdBy?: string;
  timestamp: Date;
}

export class UserUpdatedEvent {
  userId: string;
  email: string;
  updatedFields: string[];
  updatedBy: string;
  timestamp: Date;
}

export class UserDeletedEvent {
  userId: string;
  email: string;
  deletedBy: string;
  timestamp: Date;
}

export class UserRoleChangedEvent {
  userId: string;
  email: string;
  oldRole?: string;
  newRole: string;
  changedBy: string;
  timestamp: Date;
}
