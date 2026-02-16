import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditBaseService } from './audit-base.service';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  UserRoleChangedEvent,
} from '../events/user-events';

@Injectable()
export class UserAuditService {
  private readonly logger = new Logger(UserAuditService.name);

  constructor(private readonly auditBaseService: AuditBaseService) {}

  @OnEvent('user.created')
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.debug(`Auditing user creation: ${event.email}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      entityId: event.userId,
      userId: event.createdBy || event.userId,
      metadata: {
        email: event.email,
        firstName: event.firstName,
        lastName: event.lastName,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('user.updated')
  async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    this.logger.debug(`Auditing user update: ${event.email}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.USER,
      entityId: event.userId,
      userId: event.updatedBy,
      metadata: {
        email: event.email,
        updatedFields: event.updatedFields,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('user.deleted')
  async handleUserDeleted(event: UserDeletedEvent): Promise<void> {
    this.logger.debug(`Auditing user deletion: ${event.email}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.USER,
      entityId: event.userId,
      userId: event.deletedBy,
      metadata: {
        email: event.email,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('user.role.changed')
  async handleUserRoleChanged(event: UserRoleChangedEvent): Promise<void> {
    this.logger.debug(`Auditing role change for user: ${event.email}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.USER,
      entityId: event.userId,
      userId: event.changedBy,
      metadata: {
        email: event.email,
        oldRole: event.oldRole,
        newRole: event.newRole,
        timestamp: event.timestamp,
      },
    });
  }
}
