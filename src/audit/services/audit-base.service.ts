import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Audit } from '../entities/audit.entity';
import { AUDIT_REPOSITORY } from 'src/constants';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';
import { AuditJobPayload } from '../audit.processor';

@Injectable()
export class AuditBaseService {
  private readonly logger = new Logger(AuditBaseService.name);

  constructor(
    @InjectQueue('audit') private readonly auditQueue: Queue,
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: Repository<Audit>,
  ) {}

  /**
   * Add audit log to queue for async processing
   */
  async queueAuditLog(data: AuditJobPayload): Promise<void> {
    try {
      await this.auditQueue.add('audit-log', data, {
        removeOnComplete: true,
        removeOnFail: false,
      });
      this.logger.debug(
        `Queued audit log: ${data.action} on ${data.entity} (${data.entityId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue audit log: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Create audit log directly in database (synchronous)
   */
  async createAuditLog(
    action: AuditAction,
    entity: AuditEntity,
    entityId?: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<Audit> {
    const audit = this.auditRepository.create({
      action,
      entity,
      entityId,
      userId,
      metadata,
    });

    return this.auditRepository.save(audit);
  }

  /**
   * Find audit logs by entity
   */
  async findByEntity(entity: AuditEntity, entityId: string): Promise<Audit[]> {
    return this.auditRepository.find({
      where: { entity, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find audit logs by user
   */
  async findByUser(userId: string): Promise<Audit[]> {
    return this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find audit logs by action
   */
  async findByAction(action: AuditAction): Promise<Audit[]> {
    return this.auditRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
    });
  }
}
