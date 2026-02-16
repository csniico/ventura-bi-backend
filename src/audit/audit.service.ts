import { Injectable } from '@nestjs/common';
import { AuditBaseService } from './services/audit-base.service';
import { AuditAction } from './enums/audit-action.enum';
import { AuditEntity } from './enums/audit-entity.enum';
import { Audit } from './entities/audit.entity';

/**
 * Main audit service - delegates to AuditBaseService
 * Use this for programmatic access to audit functionality
 */
@Injectable()
export class AuditService {
  constructor(private readonly auditBaseService: AuditBaseService) {}

  /**
   * Queue an audit log for async processing
   */
  async logAction(
    action: AuditAction,
    entity: AuditEntity,
    entityId?: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.auditBaseService.queueAuditLog({
      action,
      entity,
      entityId,
      userId,
      metadata,
    });
  }

  /**
   * Create audit log synchronously
   */
  async createLog(
    action: AuditAction,
    entity: AuditEntity,
    entityId?: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<Audit> {
    return this.auditBaseService.createAuditLog(
      action,
      entity,
      entityId,
      userId,
      metadata,
    );
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityLogs(entity: AuditEntity, entityId: string): Promise<Audit[]> {
    return this.auditBaseService.findByEntity(entity, entityId);
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserLogs(userId: string): Promise<Audit[]> {
    return this.auditBaseService.findByUser(userId);
  }

  /**
   * Get audit logs for a specific action
   */
  async getActionLogs(action: AuditAction): Promise<Audit[]> {
    return this.auditBaseService.findByAction(action);
  }
}
