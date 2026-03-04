# Audit Module

Event-driven audit logging system with domain-specific services for tracking all system activities.

## Architecture

The audit module uses an event-driven architecture with domain-specific services:

- **Base Service** (`AuditBaseService`) - Handles queue management and database operations
- **Domain Services** - Listen to domain events and create audit logs:
  - `AuthAuditService` - Authentication events
  - `UserAuditService` - User management events
  - `OrderAuditService` - Order events
  - `InvoiceAuditService` - Invoice events

## Usage in Other Modules

### 1. Inject EventEmitter2

```typescript
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from 'src/audit/events';

@Injectable()
export class UserService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async createUser(data: CreateUserDto): Promise<User> {
    // Business logic
    const user = await this.userRepository.save(data);

    // Emit event for audit
    this.eventEmitter.emit('user.created', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdBy: currentUserId,
      timestamp: new Date(),
    } as UserCreatedEvent);

    return user;
  }
}
```

### 2. Available Events

#### Auth Events

- `auth.login` - User login
- `auth.logout` - User logout
- `auth.password.change` - Password changed
- `auth.password.reset` - Password reset
- `auth.token.refresh` - Token refreshed

#### User Events

- `user.created` - User created
- `user.updated` - User updated
- `user.deleted` - User deleted
- `user.role.changed` - User role changed

#### Order Events

- `order.created` - Order created
- `order.updated` - Order updated
- `order.cancelled` - Order cancelled
- `order.completed` - Order completed
- `order.status.changed` - Order status changed

#### Invoice Events

- `invoice.created` - Invoice created
- `invoice.updated` - Invoice updated
- `invoice.paid` - Invoice paid
- `invoice.cancelled` - Invoice cancelled
- `invoice.sent` - Invoice sent

### 3. Programmatic Access (Alternative)

You can also use `AuditService` directly without events:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction, AuditEntity } from 'src/audit/enums';

@Injectable()
export class SomeService {
  constructor(private readonly auditService: AuditService) {}

  async doSomething() {
    // Queue audit log (async)
    await this.auditService.logAction(
      AuditAction.CREATE,
      AuditEntity.ORDER,
      orderId,
      userId,
      { customField: 'value' },
    );

    // Or create immediately (sync)
    await this.auditService.createLog(
      AuditAction.UPDATE,
      AuditEntity.INVOICE,
      invoiceId,
      userId,
    );
  }

  // Get audit logs
  async getOrderAuditTrail(orderId: string) {
    return this.auditService.getEntityLogs(AuditEntity.ORDER, orderId);
  }
}
```

## Event Payload Guidelines

Each event should include:

- **Entity ID** - ID of the affected entity
- **User ID** - ID of the user performing the action
- **Timestamp** - When the action occurred
- **Context** - Relevant metadata (old/new values, reason, etc.)

## Adding New Domain Services

1. Create event classes in `events/your-domain-events.ts`
2. Create service in `services/your-domain-audit.service.ts`
3. Register in `audit.module.ts`
4. Export from `services/index.ts`

Example:

```typescript
// events/customer-events.ts
export class CustomerCreatedEvent {
  customerId: string;
  email: string;
  createdBy: string;
  timestamp: Date;
}

// services/customer-audit.service.ts
@Injectable()
export class CustomerAuditService {
  constructor(private readonly auditBaseService: AuditBaseService) {}

  @OnEvent('customer.created')
  async handleCustomerCreated(event: CustomerCreatedEvent): Promise<void> {
    await this.auditBaseService.queueAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.CUSTOMER,
      entityId: event.customerId,
      userId: event.createdBy,
      metadata: { email: event.email },
    });
  }
}
```

## Database Schema

The `audits` table tracks:

- `action` - ENUM: CREATE, UPDATE, DELETE, LOGIN, etc.
- `entity` - ENUM: USER, ORDER, INVOICE, etc.
- `entityId` - UUID of affected entity
- `userId` - UUID of user who performed action
- `metadata` - JSONB field for additional context
- `createdAt` - Timestamp

## Queue Processing

Audit logs are processed asynchronously via BullMQ:

- Queue name: `audit`
- Jobs are automatically removed after completion
- Failed jobs are retained for debugging
- Redis-backed for reliability
