import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditBaseService } from './audit-base.service';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';
import {
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  CustomerDeletedEvent,
} from '../events/customer-events';

@Injectable()
export class CustomerAuditService {
  private readonly logger = new Logger(CustomerAuditService.name);

  constructor(private readonly auditBaseService: AuditBaseService) {}

  @OnEvent('customer.created')
  async handleCustomerCreated(event: CustomerCreatedEvent): Promise<void> {
    this.logger.debug(`Auditing customer creation: ${event.customerId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.CUSTOMER,
      entityId: event.customerId,
      userId: event.createdBy,
      metadata: {
        businessId: event.businessId,
        name: event.name,
        email: event.email,
        phone: event.phone,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('customer.updated')
  async handleCustomerUpdated(event: CustomerUpdatedEvent): Promise<void> {
    this.logger.debug(`Auditing customer update: ${event.customerId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.CUSTOMER,
      entityId: event.customerId,
      userId: event.updatedBy,
      metadata: {
        businessId: event.businessId,
        updatedFields: event.updatedFields,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('customer.deleted')
  async handleCustomerDeleted(event: CustomerDeletedEvent): Promise<void> {
    this.logger.debug(`Auditing customer deletion: ${event.customerId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.CUSTOMER,
      entityId: event.customerId,
      userId: event.deletedBy,
      metadata: {
        businessId: event.businessId,
        timestamp: event.timestamp,
      },
    });
  }
}
